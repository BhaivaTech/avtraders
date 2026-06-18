// src/controllers/dealer/auth.js
// Dealer authentication: OTP send/verify, compatibility login and JWT token management.

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendWhatsAppTemplate } from '../../services/msg91.js';
import {
  upsertDealerOtp,
  verifyDealerOtp,
  findDealerByPhone,
} from '../../models/dealerModel.js';
import { insertAuthAudit, requestAuditMeta } from '../../models/authAuditModel.js';
import { normalizePhone10 } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  ENV                                                                  */
/* ------------------------------------------------------------------ */
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEALER_OTP_EXPIRY_SECONDS = Number(process.env.DEALER_OTP_EXPIRY_SECONDS || 300);
const DEALER_OTP_DEV_FALLBACK = String(process.env.DEALER_OTP_DEV_FALLBACK || '0') === '1';
const DEALER_SIMPLE_LOGIN_ENABLED = String(process.env.DEALER_SIMPLE_LOGIN_ENABLED || '0') === '1';

/* ------------------------------------------------------------------ */
/*  JWT helpers                                                          */
/* ------------------------------------------------------------------ */

function dealerJwtPayload(dealer) {
  return {
    role: 'dealer',
    dealer_id: dealer?.id || 0,
    phone: dealer?.phone || '',
    status: dealer?.status || 'new',
  };
}

function dealerResponseFor(dealer, token) {
  if (!dealer) return { ok: true, token, dealer: null, next: 'register' };
  if (dealer.blocked) {
    return { ok: false, statusCode: 403, body: { message: 'This dealer account is blocked. Please contact support.' } };
  }
  if (dealer.status === 'approved') return { ok: true, token, dealer, next: 'dashboard' };
  if (dealer.status === 'pending') return { ok: true, token, dealer, next: 'pending' };
  return {
    ok: true,
    token,
    dealer,
    next: 'register',
    message: dealer.rejection_reason
      ? `Previous request rejected: ${dealer.rejection_reason}`
      : 'Please re-submit dealer registration.',
  };
}

export function signDealerJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/send-otp and /api/dealer/resend-otp                 */
/* ------------------------------------------------------------------ */

export async function sendOtp(req, res) {
  let phone10 = null;
  try {
    phone10 = normalizePhone10(req.body?.phone);
    if (phone10.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    }

    const dealer = await findDealerByPhone(phone10);
    if (dealer?.blocked) {
      await insertAuthAudit({
        actorType: 'dealer',
        actorId: dealer.id,
        identifier: phone10,
        action: 'otp_blocked',
        success: false,
        ...requestAuditMeta(req),
      });
      return res.status(403).json({ message: 'This dealer account is blocked. Please contact support.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await upsertDealerOtp(phone10, otp, DEALER_OTP_EXPIRY_SECONDS);

    try {
      await sendWhatsAppTemplate({
        kind: 'dealer',
        toMsisdn: `91${phone10}`,
        bodyText: String(otp),
        buttonText: null,
      });
      await insertAuthAudit({ actorType: 'dealer', actorId: dealer?.id || null, identifier: phone10, action: 'otp_sent', success: true, ...requestAuditMeta(req) });
      return res.json({ ok: true, message: 'OTP sent on WhatsApp', ttl: DEALER_OTP_EXPIRY_SECONDS });
    } catch (vendorErr) {
      logger.error({ err: vendorErr }, '[dealer-otp-msg91]');
      if (DEALER_OTP_DEV_FALLBACK) {
        await insertAuthAudit({ actorType: 'dealer', actorId: dealer?.id || null, identifier: phone10, action: 'otp_sent_dev_fallback', success: true, ...requestAuditMeta(req) });
        return res.json({
          ok: true,
          message: 'OTP generated with dev fallback',
          ttl: DEALER_OTP_EXPIRY_SECONDS,
          dev_otp: otp,
          vendorStatus: vendorErr?.vendorStatus || null,
          vendorBody: vendorErr?.vendorBody || null,
        });
      }
      await insertAuthAudit({ actorType: 'dealer', actorId: dealer?.id || null, identifier: phone10, action: 'otp_send_failed', success: false, ...requestAuditMeta(req, { error: vendorErr?.message || 'MSG91 WhatsApp OTP failed' }) });
      return res.status(500).json({
        message: vendorErr?.message || 'MSG91 WhatsApp OTP failed',
        vendorStatus: vendorErr?.vendorStatus || null,
        vendorBody: vendorErr?.vendorBody || null,
      });
    }
  } catch (err) {
    await insertAuthAudit({ actorType: 'dealer', identifier: phone10, action: 'otp_send_failed', success: false, ...requestAuditMeta(req, { error: err?.message || 'Failed to send OTP' }) });
    return res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/verify-otp                                          */
/* ------------------------------------------------------------------ */

export async function verifyOtp(req, res) {
  let phone10 = null;
  try {
    phone10 = normalizePhone10(req.body?.phone);
    const otp = String(req.body?.otp || '').trim();

    if (phone10.length !== 10) return res.status(400).json({ message: 'Invalid phone number' });
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const result = await verifyDealerOtp(phone10, otp);
    if (!result.ok) {
      const messages = {
        not_found: 'OTP not found. Please resend OTP.',
        too_many: 'Too many wrong attempts. Please resend OTP.',
        expired: 'OTP expired. Please resend OTP.',
        invalid: 'Invalid OTP',
      };
      const httpCodes = { too_many: 429 };
      await insertAuthAudit({ actorType: 'dealer', identifier: phone10, action: 'otp_verify_failed', success: false, ...requestAuditMeta(req, { reason: result.reason }) });
      return res.status(httpCodes[result.reason] || 400).json({
        message: messages[result.reason] || 'OTP error',
      });
    }

    const dealer = await findDealerByPhone(phone10);
    if (dealer?.blocked) {
      await insertAuthAudit({ actorType: 'dealer', actorId: dealer.id, identifier: phone10, action: 'login_blocked', success: false, ...requestAuditMeta(req) });
      return res.status(403).json({ message: 'This dealer account is blocked. Please contact support.' });
    }

    const token = signDealerJwt(dealer ? dealerJwtPayload(dealer) : { role: 'dealer', dealer_id: 0, phone: phone10, status: 'new' });
    await insertAuthAudit({ actorType: 'dealer', actorId: dealer?.id || null, identifier: phone10, action: 'login_success', success: true, ...requestAuditMeta(req, { status: dealer?.status || 'new' }) });
    return res.json({ ...dealerResponseFor(dealer, token), expires_in: JWT_EXPIRES_IN });
  } catch (err) {
    await insertAuthAudit({ actorType: 'dealer', identifier: phone10, action: 'login_failed', success: false, ...requestAuditMeta(req, { error: err?.message || 'OTP verification failed' }) });
    return res.status(500).json({ message: err?.message || 'OTP verification failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/simple-login                                        */
/*  Dev/compatibility flow used by the existing frontend. Disable with    */
/*  DEALER_SIMPLE_LOGIN_ENABLED=0 when OTP-only login is required.         */
/* ------------------------------------------------------------------ */
export async function simpleLogin(req, res) {
  const phone10 = normalizePhone10(req.body?.phone);
  if (!DEALER_SIMPLE_LOGIN_ENABLED) return res.status(404).json({ message: 'Simple login disabled' });
  if (phone10.length !== 10) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });

  const dealer = await findDealerByPhone(phone10);
  if (dealer?.blocked) {
    await insertAuthAudit({ actorType: 'dealer', actorId: dealer.id, identifier: phone10, action: 'simple_login_blocked', success: false, ...requestAuditMeta(req) });
    return res.status(403).json({ message: 'This dealer account is blocked. Please contact support.' });
  }

  const token = signDealerJwt(dealer ? dealerJwtPayload(dealer) : { role: 'dealer', dealer_id: 0, phone: phone10, status: 'new' });
  await insertAuthAudit({ actorType: 'dealer', actorId: dealer?.id || null, identifier: phone10, action: 'simple_login_success', success: true, ...requestAuditMeta(req, { status: dealer?.status || 'new' }) });
  return res.json({ ...dealerResponseFor(dealer, token), expires_in: JWT_EXPIRES_IN });
}

export async function me(req, res) {
  const phone10 = normalizePhone10(req.dealerAuth?.phone);
  const dealer = phone10 ? await findDealerByPhone(phone10) : null;
  if (dealer?.blocked) return res.status(403).json({ message: 'This dealer account is blocked. Please contact support.' });
  return res.json({ ok: true, auth: req.dealerAuth, dealer, expires_in: JWT_EXPIRES_IN });
}

export async function logout(req, res) {
  await insertAuthAudit({
    actorType: 'dealer',
    actorId: req.dealerAuth?.dealer_id || null,
    identifier: req.dealerAuth?.phone || null,
    action: 'logout',
    success: true,
    ...requestAuditMeta(req),
  });
  return res.json({ ok: true });
}
