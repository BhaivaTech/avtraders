// src/controllers/adminController.js
// Business logic for admin authentication endpoints.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendAdminOTP, verifyAdminOTP } from '../utils/otp/otpAdmin.js';
import { insertAuthAudit, requestAuditMeta } from '../models/authAuditModel.js';
import { pool } from '../config/db.js';
import { getAllPayments } from '../models/paymentModel.js';
import logger from '../utils/logger.js';
import { permissionsForRole } from '../config/rbac.js';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_SESSION_MS = Number(process.env.ADMIN_SESSION_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000);

let ADMIN_OTP_TTL = Number(
  String(process.env.ADMIN_OTP_EXPIRY_SECONDS || process.env.OTP_EXPIRY_SECONDS || '60').trim()
);
if (!Number.isFinite(ADMIN_OTP_TTL) || ADMIN_OTP_TTL <= 0) ADMIN_OTP_TTL = 60;

const _rawPass = String(process.env.ADMIN_PASSWORD || '').trim();
const adminPasswordHash = await bcrypt.hash(_rawPass, 12);

function setAdminPreAuth(req, email) {
  req.session.adminPreAuth = true;
  req.session.adminPreAuthEmail = email || ADMIN_EMAIL;
  req.session.loginNonce = crypto.randomBytes(8).toString('hex');
  req.session.cookie.maxAge = 15 * 60 * 1000;
}

async function setAdminSession(req, targetEmail) {
  const email = targetEmail || req.session?.adminPreAuthEmail || ADMIN_EMAIL;
  req.session.admin = true;
  req.session.adminEmail = email;
  req.session.cookie.maxAge = ADMIN_SESSION_MS;
  delete req.session.adminPreAuth;
  delete req.session.adminPreAuthEmail;
  delete req.session.loginNonce;

  // Look up admin_users record to attach role and id.
  // If no record exists yet (first boot before migration), default to superadmin.
  try {
    const [rows] = await pool.query(
      'SELECT id, name, role FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    if (rows.length > 0) {
      req.session.adminId   = rows[0].id;
      req.session.adminRole = rows[0].role;
      req.session.adminName = rows[0].name;
    } else if (email === ADMIN_EMAIL) {
      // Fallback: seed this admin on the fly so future lookups work
      try {
        const [ins] = await pool.query(
          "INSERT IGNORE INTO admin_users (email, name, role) VALUES (?, 'Site Admin', 'superadmin')",
          [ADMIN_EMAIL]
        );
        req.session.adminId   = ins.insertId || null;
      } catch { /* table may not exist yet — ignore */ }
      req.session.adminRole = 'superadmin';
      req.session.adminName = 'Site Admin';
    } else {
      req.session.adminRole = 'support';
      req.session.adminName = 'Admin User';
    }
  } catch {
    // Migration not yet applied — degrade gracefully
    req.session.adminRole = 'superadmin';
    req.session.adminName = 'Admin';
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/login-start                                          */
/* ------------------------------------------------------------------ */
export async function loginStart(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  if (!email || !password) {
    return res.status(401).json({ ok: false, error: 'bad-credentials' });
  }

  let passwordOk = false;
  let allowed = false;

  try {
    const [rows] = await pool.query(
      'SELECT id, password_hash, is_active FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    if (rows.length > 0) {
      allowed = true;
      const adminUser = rows[0];
      if (adminUser.password_hash) {
        passwordOk = await bcrypt.compare(password, adminUser.password_hash);
      } else {
        // Fallback for primary ADMIN_EMAIL or accounts without custom password
        passwordOk = await bcrypt.compare(password, adminPasswordHash);
      }
    } else if (email === ADMIN_EMAIL) {
      allowed = true;
      passwordOk = await bcrypt.compare(password, adminPasswordHash);
    }
  } catch {
    if (email === ADMIN_EMAIL) {
      allowed = true;
      passwordOk = await bcrypt.compare(password, adminPasswordHash);
    }
  }

  if (!allowed || !passwordOk) {
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'login_start_failed',
      success: false,
      ...requestAuditMeta(req, { reason: 'bad_credentials' }),
    });
    return res.status(401).json({ ok: false, error: 'bad-credentials' });
  }

  try {
    await sendAdminOTP(email);
    setAdminPreAuth(req, email);
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'otp_sent',
      success: true,
      ...requestAuditMeta(req),
    });
    return res.json({
      ok: true,
      ttl: ADMIN_OTP_TTL,
      mode: process.env.ADMIN_OTP_PROVIDER || 'smtp',
    });
  } catch (e) {
    logger.error({ err: e }, '[admin/login-start] send-otp failed');
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'otp_send_failed',
      success: false,
      ...requestAuditMeta(req, { error: e?.message || 'send-failed' }),
    });
    return res.status(500).json({ ok: false, error: 'send-failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/resend-otp                                           */
/* ------------------------------------------------------------------ */
export async function resendOtp(req, res) {
  const email = String(req.body?.email || req.session?.adminPreAuthEmail || '').trim().toLowerCase();

  if (!email || !req.session?.adminPreAuth) {
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'otp_resend_denied',
      success: false,
      ...requestAuditMeta(req),
    });
    return res.status(401).json({ ok: false, error: 'no-preauth' });
  }

  try {
    await sendAdminOTP(email);
    setAdminPreAuth(req, email);
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'otp_resent',
      success: true,
      ...requestAuditMeta(req),
    });
    return res.json({ ok: true, ttl: ADMIN_OTP_TTL });
  } catch (e) {
    logger.error({ err: e }, '[admin/resend-otp] send failed');
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'otp_resend_failed',
      success: false,
      ...requestAuditMeta(req, { error: e?.message || 'send-failed' }),
    });
    return res.status(500).json({ ok: false, error: 'send-failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/verify-otp                                           */
/* ------------------------------------------------------------------ */
export async function verifyOtp(req, res) {
  const email = String(req.body?.email || req.session?.adminPreAuthEmail || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !req.session?.adminPreAuth) return res.status(401).json({ ok: false, error: 'no-preauth' });

  try {
    const result = await verifyAdminOTP(email, code);
    if (!result.ok) {
      await insertAuthAudit({
        actorType: 'admin',
        identifier: email,
        action: 'otp_verify_failed',
        success: false,
        ...requestAuditMeta(req, { reason: result.message || 'bad-code' }),
      });
      return res.status(401).json({ ok: false, error: result.message || 'bad-code' });
    }

    req.session.regenerate(async (err) => {
      if (err) {
        logger.error({ err }, '[admin] session.regenerate failed');
        return res.status(500).json({ ok: false, error: 'session-failed' });
      }
      await setAdminSession(req, email);
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ saveErr }, '[admin] session.save failed');
          return res.status(500).json({ ok: false, error: 'session-save-failed' });
        }
        insertAuthAudit({
          actorType: 'admin',
          identifier: email,
          action: 'login_success',
          success: true,
          ...requestAuditMeta(req),
        });
        return res.json({ ok: true, expires_in_ms: ADMIN_SESSION_MS });
      });
    });
  } catch (e) {
    logger.error({ err: e }, '[admin/verify-otp] verify failed');
    await insertAuthAudit({
      actorType: 'admin',
      identifier: email,
      action: 'login_failed',
      success: false,
      ...requestAuditMeta(req, { error: e?.message || 'verify-failed' }),
    });
    return res.status(401).json({ ok: false, error: e?.message || 'verify-failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/ping                                                  */
/* ------------------------------------------------------------------ */
export function ping(req, res) {
  if (req.session?.admin) {
    req.session.cookie.maxAge = ADMIN_SESSION_MS;
    return res.json({ ok: true, expires_in_ms: ADMIN_SESSION_MS });
  }
  return res.status(401).json({ ok: false });
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/me                                                    */
/* ------------------------------------------------------------------ */
export function me(req, res) {
  if (!req.session?.admin) return res.status(401).json({ ok: false });
  req.session.cookie.maxAge = ADMIN_SESSION_MS;
  return res.json({
    ok: true,
    email:          req.session.adminEmail || ADMIN_EMAIL,
    name:           req.session.adminName  || 'Admin',
    role:           req.session.adminRole  || 'superadmin',
    permissions:    permissionsForRole(req.session.adminRole || 'superadmin'),
    expires_in_ms:  ADMIN_SESSION_MS,
  });
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/logout                                               */
/* ------------------------------------------------------------------ */
export function logout(req, res) {
  if (!req.session) return res.json({ ok: true });
  insertAuthAudit({
    actorType: 'admin',
    identifier: req.session.adminEmail || ADMIN_EMAIL,
    action: 'logout',
    success: true,
    ...requestAuditMeta(req),
  });
  req.session.destroy((err) => {
    if (err) logger.error({ err }, '[admin/logout] session.destroy failed');
    res.json({ ok: true });
  });
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/farmers/:id/block                                   */
/* ------------------------------------------------------------------ */
export async function blockFarmer(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, message: 'Invalid id' });

  const blocked = req.body?.blocked;
  if (typeof blocked !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'blocked must be boolean' });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET blocked = ? WHERE id = ? AND role = 'farmer'",
      [blocked ? 1 : 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: 'Farmer not found' });

    await insertAuthAudit({
      actorType: 'admin',
      actorId: req.session?.adminEmail || 'admin',
      action: blocked ? 'farmer_blocked' : 'farmer_unblocked',
      success: true,
      ...requestAuditMeta(req, { farmer_id: id }),
    });
    return res.json({ ok: true, id, blocked });
  } catch (err) {
    logger.error({ err, id }, '[admin] blockFarmer failed');
    return res.status(500).json({ ok: false, message: 'Failed to update farmer' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/payments                                              */
/* ------------------------------------------------------------------ */
export async function getAdminPayments(req, res) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const result = await getAllPayments({
      page: Number(page),
      limit: Math.min(Number(limit), 200),
      status,
    });
    return res.json({ ok: true, ...result });
  } catch (err) {
    logger.error({ err }, '[admin] getAdminPayments failed');
    return res.status(500).json({ ok: false, message: 'Failed to load payments' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/stats                                                 */
/* ------------------------------------------------------------------ */
export async function getAdminStats(req, res) {
  try {
    const [farmers] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [chatsToday] = await pool.query('SELECT COUNT(*) as count FROM chats WHERE DATE(created_at) = CURDATE()');
    const [revenue] = await pool.query('SELECT SUM(amount) as total FROM payments WHERE status = "success"');

    return res.json({
      ok: true,
      stats: {
        totalFarmers: farmers[0]?.count || 0,
        chatsToday: chatsToday[0]?.count || 0,
        totalRevenue: revenue[0]?.total || 0,
      }
    });
  } catch (err) {
    logger.error({ err }, '[admin] getAdminStats failed');
    return res.status(500).json({ ok: false, message: 'Failed to load stats' });
  }
}

/* ------------------------------------------------------------------ */
/*  Admin user management (superadmin only)                              */
/* ------------------------------------------------------------------ */

export async function listAdminUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users ORDER BY id ASC'
    );
    return res.json({ ok: true, admins: rows });
  } catch (err) {
    logger.error({ err }, '[admin] listAdminUsers failed');
    return res.status(500).json({ ok: false, message: 'Failed to load admin users' });
  }
}

export async function createAdminUser(req, res) {
  const { email, name, role, password } = req.body || {};
  const VALID_ROLES = ['superadmin', 'manager', 'support', 'finance'];

  if (!email || !name || !role || !password) {
    return res.status(400).json({ ok: false, message: 'email, name, role, and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters long' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ ok: false, message: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  try {
    const passwordHash = await bcrypt.hash(String(password).trim(), 12);
    const [result] = await pool.query(
      'INSERT INTO admin_users (email, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [email.trim().toLowerCase(), name.trim(), role, passwordHash]
    );
    await insertAuthAudit({
      actorType: 'admin',
      actorId: req.session?.adminEmail || 'superadmin',
      action: 'admin_user_created',
      success: true,
      ...requestAuditMeta(req, { new_admin_email: email, role }),
    });
    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, message: 'An admin with that email already exists' });
    }
    logger.error({ err }, '[admin] createAdminUser failed');
    return res.status(500).json({ ok: false, message: 'Failed to create admin user' });
  }
}

export async function updateAdminUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }

  const { name, role, password } = req.body || {};
  const VALID_ROLES = ['superadmin', 'manager', 'support', 'finance'];

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ ok: false, message: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const updates = [];
  const values = [];
  if (name)  { updates.push('name = ?');  values.push(name.trim()); }
  if (role)  { updates.push('role = ?');  values.push(role); }
  if (password && String(password).trim().length > 0) {
    if (String(password).length < 6) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters long' });
    }
    const passwordHash = await bcrypt.hash(String(password).trim(), 12);
    updates.push('password_hash = ?');
    values.push(passwordHash);
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, message: 'Nothing to update' });
  }
  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Admin user not found' });
    }
    await insertAuthAudit({
      actorType: 'admin',
      actorId: req.session?.adminEmail || 'superadmin',
      action: 'admin_user_updated',
      success: true,
      ...requestAuditMeta(req, { target_admin_id: id, updates: { name, role } }),
    });
    return res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[admin] updateAdminUser failed');
    return res.status(500).json({ ok: false, message: 'Failed to update admin user' });
  }
}

export async function deactivateAdminUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }

  // Prevent deactivating yourself
  if (id === req.session?.adminId) {
    return res.status(400).json({ ok: false, message: 'You cannot deactivate your own account' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE admin_users SET is_active = 0 WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Admin user not found' });
    }
    await insertAuthAudit({
      actorType: 'admin',
      actorId: req.session?.adminEmail || 'superadmin',
      action: 'admin_user_deactivated',
      success: true,
      ...requestAuditMeta(req, { target_admin_id: id }),
    });
    return res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[admin] deactivateAdminUser failed');
    return res.status(500).json({ ok: false, message: 'Failed to deactivate admin user' });
  }
}

export async function reactivateAdminUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE admin_users SET is_active = 1 WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Admin user not found' });
    }
    return res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[admin] reactivateAdminUser failed');
    return res.status(500).json({ ok: false, message: 'Failed to reactivate admin user' });
  }
}
