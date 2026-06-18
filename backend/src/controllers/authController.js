// src/controllers/authController.js
// Business logic for authentication & farmer profile endpoints.

import { sendFarmerOTP, verifyFarmerOTP } from '../utils/otp/otpFarmer.js';
import { normalizeMobile10 } from '../utils/msisdn.js';
import {
  checkUserExists,
  createUser,
  updateUser,
  getFullUserByMobile,
  findUserById,
  getFarmerProfile,
  upsertFarmerProfile,
} from '../models/userModel.js';
import { requireUserId } from '../middlewares/auth.js';
import { insertAuthAudit, requestAuditMeta } from '../models/authAuditModel.js';
import logger from '../utils/logger.js';

const FARMER_SESSION_MS = Number(process.env.FARMER_SESSION_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000);

function setFarmerSession(req, user) {
  req.session.farmer = { id: user.id, mobile: user.mobile, role: user.role, name: user.name, address: user.address };
  req.session.mobile = user.mobile;
  req.session.user = { id: user.id, mobile: user.mobile, role: user.role };
  req.session.cookie.maxAge = FARMER_SESSION_MS;
}

/* ------------------------------------------------------------------ */
/*  GET /api/auth/exists/:mobile                                         */
/* ------------------------------------------------------------------ */
export async function checkExists(req, res) {
  try {
    const mobile = normalizeMobile10(req.params.mobile);
    const result = await checkUserExists(mobile);
    res.json(result);
  } catch (e) {
    res.status(400).json({ message: e.message || 'invalid mobile' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/send-otp and /api/auth/resend-otp                     */
/* ------------------------------------------------------------------ */
export async function sendOtp(req, res) {
  let mobile = null;
  try {
    mobile = normalizeMobile10(req.body?.mobile);
    const existingUser = await getFullUserByMobile(mobile);
    if (existingUser?.blocked) {
      await insertAuthAudit({
        actorType: 'farmer',
        actorId: existingUser.id,
        identifier: mobile,
        action: 'otp_blocked',
        success: false,
        ...requestAuditMeta(req),
      });
      return res.status(403).json({ ok: false, message: 'This account is blocked. Please contact support.' });
    }

    const r = await sendFarmerOTP(mobile);
    await insertAuthAudit({
      actorType: 'farmer',
      actorId: existingUser?.id || null,
      identifier: mobile,
      action: 'otp_sent',
      success: true,
      ...requestAuditMeta(req),
    });
    res.json({ ok: true, message: r.message || 'OTP sent' });
  } catch (e) {
    await insertAuthAudit({
      actorType: 'farmer',
      identifier: mobile,
      action: 'otp_send_failed',
      success: false,
      ...requestAuditMeta(req, { error: e.message || 'Failed to send OTP' }),
    });
    const vendorStatus = e.vendorStatus || e.response?.status;
    const vendorBody = e.vendorBody || e.response?.data;
    if (vendorStatus) {
      return res.status(502).json({
        ok: false,
        message: vendorBody?.message || vendorBody?.errors || vendorBody?.reason || e.message || 'OTP delivery failed (provider)',
        vendorStatus,
        details: vendorBody,
      });
    }
    return res.status(500).json({ ok: false, message: e.message || 'Failed to send OTP' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/verify-otp                                            */
/* ------------------------------------------------------------------ */
export async function verifyOtp(req, res) {
  let mobile = null;
  try {
    mobile = normalizeMobile10(req.body?.mobile);
    const code = String(req.body?.code || '').trim();
    const role = 'farmer';
    const name = req.body?.name;
    const address = req.body?.address;

    if (!code) return res.status(400).json({ message: 'OTP code required' });

    const result = await verifyFarmerOTP(mobile, code);
    if (!result.ok) {
      await insertAuthAudit({
        actorType: 'farmer',
        identifier: mobile,
        action: 'otp_verify_failed',
        success: false,
        ...requestAuditMeta(req, { reason: result.message || 'Invalid OTP' }),
      });
      return res.status(400).json({ message: result.message || 'Invalid OTP' });
    }

    const existingUser = await getFullUserByMobile(mobile);

    if (!existingUser) {
      await createUser(mobile, role, name, address);
    } else {
      if (existingUser.blocked) {
        await insertAuthAudit({
          actorType: 'farmer',
          actorId: existingUser.id,
          identifier: mobile,
          action: 'login_blocked',
          success: false,
          ...requestAuditMeta(req),
        });
        return res.status(403).json({ message: 'You are blocked from messaging.' });
      }
      await updateUser(existingUser.id, name, address, role);
    }

    const user = await getFullUserByMobile(mobile);
    setFarmerSession(req, user);

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: 'session error' });
      insertAuthAudit({
        actorType: 'farmer',
        actorId: user.id,
        identifier: mobile,
        action: 'login_success',
        success: true,
        ...requestAuditMeta(req),
      });
      return res.json({ ok: true, user, expires_in_ms: FARMER_SESSION_MS });
    });
  } catch (e) {
    await insertAuthAudit({
      actorType: 'farmer',
      identifier: mobile,
      action: 'login_failed',
      success: false,
      ...requestAuditMeta(req, { error: e.message || 'invalid input' }),
    });
    return res.status(400).json({ message: e.message || 'invalid input' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                                 */
/* ------------------------------------------------------------------ */
export async function login(req, res) {
  let mobile = null;
  try {
    mobile = normalizeMobile10(req.body?.mobile);
    const user = await getFullUserByMobile(mobile);

    if (!user) {
      await insertAuthAudit({ actorType: 'farmer', identifier: mobile, action: 'session_login_failed', success: false, ...requestAuditMeta(req, { reason: 'not_found' }) });
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.blocked) {
      await insertAuthAudit({ actorType: 'farmer', actorId: user.id, identifier: mobile, action: 'session_login_blocked', success: false, ...requestAuditMeta(req) });
      return res.status(403).json({ message: 'You are blocked from messaging.' });
    }
    if (!user.is_verified) {
      await insertAuthAudit({ actorType: 'farmer', actorId: user.id, identifier: mobile, action: 'session_login_failed', success: false, ...requestAuditMeta(req, { reason: 'not_verified' }) });
      return res.status(403).json({ message: 'OTP verification required' });
    }

    setFarmerSession(req, user);

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: 'session error' });
      insertAuthAudit({ actorType: 'farmer', actorId: user.id, identifier: mobile, action: 'session_login_success', success: true, ...requestAuditMeta(req) });
      res.json({ ok: true, user, expires_in_ms: FARMER_SESSION_MS });
    });
  } catch (e) {
    await insertAuthAudit({ actorType: 'farmer', identifier: mobile, action: 'session_login_failed', success: false, ...requestAuditMeta(req, { error: e.message || 'invalid input' }) });
    return res.status(400).json({ message: e.message || 'invalid input' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/auth/farmer-profile                                         */
/* ------------------------------------------------------------------ */
export async function getFarmerProfileSelf(req, res) {
  try {
    const userId = requireUserId(req);
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const p = await getFarmerProfile(userId);
    const profile = {
      full_name: p?.full_name || user.name || '',
      mobile: user.mobile,
      whatsapp: p?.whatsapp || user.mobile,
      village: p?.village || '',
      taluk: p?.taluk || '',
      district: p?.district || '',
      pincode: p?.pincode || '',
      land_size: p?.land_size || '',
      crops_text: p?.crops_text || '',
    };
    return res.json({ ok: true, profile });
  } catch (e) {
    if (e.message === 'NOT_AUTHENTICATED') return res.status(401).json({ ok: false, message: 'Login required' });
    logger.error({ err: e }, 'GET /auth/farmer-profile error');
    return res.status(500).json({ ok: false, message: 'Failed to load profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/farmer-profile                                        */
/* ------------------------------------------------------------------ */
export async function saveFarmerProfileSelf(req, res) {
  try {
    const userId = requireUserId(req);
    let { full_name, whatsapp, village, taluk, district, pincode, land_size, crops_text } = req.body || {};

    if (!full_name || !village || !taluk || !district || !pincode) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const wa = (whatsapp || '').trim();
    const whatsappFinal = wa || user.mobile;
    land_size = (land_size || '').trim() || null;
    crops_text = (crops_text || '').trim() || null;

    await upsertFarmerProfile(userId, user.mobile, { full_name, whatsapp: whatsappFinal, village, taluk, district, pincode, land_size, crops_text });
    return res.json({ ok: true, message: 'Profile saved' });
  } catch (e) {
    if (e.message === 'NOT_AUTHENTICATED') return res.status(401).json({ ok: false, message: 'Login required' });
    logger.error({ err: e }, 'POST /auth/farmer-profile error');
    return res.status(500).json({ ok: false, message: 'Failed to save profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me  &  POST /api/auth/logout                          */
/* ------------------------------------------------------------------ */
export function me(req, res) {
  if (req.session?.farmer || req.session?.user) {
    req.session.cookie.maxAge = FARMER_SESSION_MS;
  }
  res.json({
    ok: true,
    farmer: req.session?.farmer || null,
    user: req.session?.user || null,
    mobile: req.session?.mobile || null,
    expires_in_ms: req.session?.farmer || req.session?.user ? FARMER_SESSION_MS : null,
  });
}

export function logout(req, res) {
  const user = req.session?.farmer || req.session?.user || null;
  insertAuthAudit({
    actorType: 'farmer',
    actorId: user?.id || null,
    identifier: user?.mobile || req.session?.mobile || null,
    action: 'logout',
    success: true,
    ...requestAuditMeta(req),
  });
  req.session.destroy(() => res.json({ ok: true }));
}
