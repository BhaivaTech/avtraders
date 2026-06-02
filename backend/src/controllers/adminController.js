// src/controllers/adminController.js
// Business logic for admin authentication endpoints.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendAdminOTP, verifyAdminOTP } from '../utils/otp/otpAdmin.js';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

let ADMIN_OTP_TTL = Number(
  String(process.env.ADMIN_OTP_EXPIRY_SECONDS || process.env.OTP_EXPIRY_SECONDS || '60').trim()
);
if (!Number.isFinite(ADMIN_OTP_TTL) || ADMIN_OTP_TTL <= 0) ADMIN_OTP_TTL = 60;

// Hash the admin password once at startup (env.js already guarantees it is set).
const _rawPass = String(process.env.ADMIN_PASSWORD || '').trim();
const adminPasswordHash = await bcrypt.hash(_rawPass, 12);

/* ------------------------------------------------------------------ */
/*  POST /api/admin/login-start                                          */
/* ------------------------------------------------------------------ */
export async function loginStart(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  const passwordOk = await bcrypt.compare(password, adminPasswordHash);
  if (email !== ADMIN_EMAIL || !passwordOk) {
    return res.status(401).json({ ok: false, error: 'bad-credentials' });
  }

  try {
    await sendAdminOTP(ADMIN_EMAIL);
    req.session.adminPreAuth = true;
    req.session.loginNonce = crypto.randomBytes(8).toString('hex');
    return res.json({
      ok: true,
      ttl: ADMIN_OTP_TTL,
      mode: process.env.ADMIN_OTP_PROVIDER || 'smtp',
    });
  } catch (e) {
    console.error('[admin/login-start] send-otp failed:', e?.message || e);
    return res.status(500).json({ ok: false, error: 'send-failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/verify-otp                                           */
/* ------------------------------------------------------------------ */
export async function verifyOtp(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (email !== ADMIN_EMAIL) return res.status(401).json({ ok: false, error: 'bad-email' });
  if (!req.session.adminPreAuth) return res.status(401).json({ ok: false, error: 'no-preauth' });

  try {
    const result = await verifyAdminOTP(email, code);
    if (!result.ok) return res.status(401).json({ ok: false, error: result.message || 'bad-code' });

    req.session.regenerate((err) => {
      if (err) {
        console.error('[admin] session.regenerate failed:', err);
        return res.status(500).json({ ok: false, error: 'session-failed' });
      }
      req.session.admin = true;
      req.session.adminEmail = ADMIN_EMAIL;
      req.session.cookie.maxAge = TEN_DAYS_MS;
      delete req.session.adminPreAuth;
      delete req.session.loginNonce;
      return res.json({ ok: true });
    });
  } catch (e) {
    console.error('[admin/verify-otp] verify failed:', e?.message || e);
    return res.status(401).json({ ok: false, error: e?.message || 'verify-failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/ping                                                  */
/* ------------------------------------------------------------------ */
export function ping(req, res) {
  if (req.session?.admin) {
    req.session.cookie.maxAge = TEN_DAYS_MS;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false });
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/me                                                    */
/* ------------------------------------------------------------------ */
export function me(req, res) {
  if (!req.session?.admin) return res.status(401).json({ ok: false });
  req.session.cookie.maxAge = TEN_DAYS_MS;
  return res.json({ ok: true, email: req.session.adminEmail || ADMIN_EMAIL });
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/logout                                               */
/* ------------------------------------------------------------------ */
export function logout(req, res) {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy((err) => {
    if (err) console.error('[admin/logout] session.destroy failed:', err);
    res.json({ ok: true });
  });
}
