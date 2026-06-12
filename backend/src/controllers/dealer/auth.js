// src/controllers/dealer/auth.js
// Dealer authentication: OTP send/verify and JWT token management.
// Extracted from the monolithic dealerController.js.

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendWhatsAppTemplate } from '../../services/msg91.js';
import {
  upsertDealerOtp,
  verifyDealerOtp,
  findDealerByPhone,
} from '../../models/dealerModel.js';
import { normalizePhone10 } from '../../utils/helpers.js';

/* ------------------------------------------------------------------ */
/*  ENV                                                                  */
/* ------------------------------------------------------------------ */
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEALER_OTP_EXPIRY_SECONDS = Number(process.env.DEALER_OTP_EXPIRY_SECONDS || 300);
const DEALER_OTP_DEV_FALLBACK = String(process.env.DEALER_OTP_DEV_FALLBACK || '0') === '1';

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

export function signDealerJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/send-otp                                            */
/* ------------------------------------------------------------------ */

export async function sendOtp(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    if (phone10.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
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
      return res.json({ ok: true, message: 'OTP sent on WhatsApp' });
    } catch (vendorErr) {
      console.error('[dealer-otp-msg91]', vendorErr?.message || vendorErr);
      if (DEALER_OTP_DEV_FALLBACK) {
        return res.json({
          ok: true,
          message: 'OTP generated with dev fallback',
          dev_otp: otp,
          vendorStatus: vendorErr?.vendorStatus || null,
          vendorBody: vendorErr?.vendorBody || null,
        });
      }
      return res.status(500).json({
        message: vendorErr?.message || 'MSG91 WhatsApp OTP failed',
        vendorStatus: vendorErr?.vendorStatus || null,
        vendorBody: vendorErr?.vendorBody || null,
      });
    }
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/verify-otp                                          */
/* ------------------------------------------------------------------ */

export async function verifyOtp(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
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
      return res.status(httpCodes[result.reason] || 400).json({
        message: messages[result.reason] || 'OTP error',
      });
    }

    const dealer = await findDealerByPhone(phone10);
    if (!dealer) {
      const token = signDealerJwt({
        role: 'dealer',
        dealer_id: 0,
        phone: phone10,
        status: 'new',
      });
      return res.json({ ok: true, token, dealer: null, next: 'register' });
    }

    const token = signDealerJwt(dealerJwtPayload(dealer));
    if (dealer.status === 'approved')
      return res.json({ ok: true, token, dealer, next: 'dashboard' });
    if (dealer.status === 'pending')
      return res.json({ ok: true, token, dealer, next: 'pending' });

    return res.json({
      ok: true,
      token,
      dealer,
      next: 'register',
      message: dealer.rejection_reason
        ? `Previous request rejected: ${dealer.rejection_reason}`
        : 'Please re-submit dealer registration.',
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'OTP verification failed' });
  }
}
