// src/controllers/adminController.js
// Business logic for admin authentication endpoints.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendAdminOTP, verifyAdminOTP } from '../utils/otp/otpAdmin.js';
import { insertAuthAudit, requestAuditMeta } from '../models/authAuditModel.js';
import { pool } from '../config/db.js';
import { getIo } from '../utils/socketBus.js';
import { getAllPayments } from '../models/paymentModel.js';
import logger from '../utils/logger.js';
import { permissionsForRole } from '../config/rbac.js';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
// Fixed 12h admin session lifetime — starts at login, never renewed.
const ADMIN_SESSION_MS = Number(process.env.ADMIN_SESSION_MAX_AGE_MS || 12 * 60 * 60 * 1000);

let ADMIN_OTP_TTL = Number(
  String(process.env.ADMIN_OTP_EXPIRY_SECONDS || process.env.OTP_EXPIRY_SECONDS || '60').trim()
);
if (!Number.isFinite(ADMIN_OTP_TTL) || ADMIN_OTP_TTL <= 0) ADMIN_OTP_TTL = 60;

const _rawPass = String(process.env.ADMIN_PASSWORD || '').trim();
const adminPasswordHash = await bcrypt.hash(_rawPass, 12);

/* ---------- single-active-session bookkeeping ---------- */
// Tracks the latest logged-in session per admin email so a login from
// another browser/device can detect (and optionally clear) it.
let _sessionsTableReady = null;
function ensureSessionsTable() {
  if (!_sessionsTableReady) {
    _sessionsTableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS admin_active_sessions (
           email      VARCHAR(190) PRIMARY KEY,
           session_id VARCHAR(191) NOT NULL,
           login_at   BIGINT NOT NULL,
           ip         VARCHAR(64),
           user_agent VARCHAR(255)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      )
      .then(() => true)
      .catch((err) => {
        logger.error({ err }, '[admin] failed to create admin_active_sessions');
        return false;
      });
  }
  return _sessionsTableReady;
}

async function getActiveSession(email) {
  const ok = await ensureSessionsTable();
  if (!ok) return null;
  try {
    const [rows] = await pool.query(
      'SELECT session_id, login_at FROM admin_active_sessions WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows.length) return null;
    const loginAt = Number(rows[0].login_at || 0);
    // A row older than the session lifetime means the old session already expired.
    if (Date.now() - loginAt >= ADMIN_SESSION_MS) return null;
    return { sessionId: rows[0].session_id, loginAt };
  } catch {
    return null;
  }
}

async function clearActiveSessionBySid(sessionId) {
  // Destroy the old server-side session so its cookie becomes useless.
  try {
    await new Promise((resolve) => {
      req_sessionStoreDestroy(sessionId, resolve);
    });
  } catch { /* ignore */ }
}

/** Destroy a session by id via the app's session store. */
function req_sessionStoreDestroy(sessionId, done) {
  const store = _sessionStoreRef;
  if (store && typeof store.destroy === 'function') {
    store.destroy(sessionId, done);
  } else {
    done();
  }
}

// Set by attachAdminSessionStore(io-free) from server.js
let _sessionStoreRef = null;
export function attachAdminSessionStore(store) {
  _sessionStoreRef = store;
}

/** Remaining session lifetime in ms (fixed 12h from login). */
function remainingMs(session) {
  const loginAt = Number(session?.adminLoginAt || 0);
  if (!loginAt) return 0;
  return Math.max(0, ADMIN_SESSION_MS - (Date.now() - loginAt));
}

/** True while the fixed 12h window is still open. */
function isSessionValid(session) {
  return remainingMs(session) > 0;
}

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
  // Fixed expiry: set once here at login. No other code path renews it.
  req.session.adminLoginAt = Date.now();
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
    // Tell the client up-front whether another session is already active,
    // so it can ask "clear that session?" before the OTP is consumed.
    const active = await getActiveSession(email);
    const hasOtherSession = !!active && active.sessionId !== req.session.id;

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
      existing_session: hasOtherSession,
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
  const force = req.body?.force === true;

  if (!email || !req.session?.adminPreAuth) return res.status(401).json({ ok: false, error: 'no-preauth' });

  try {
    // Single-session check BEFORE consuming the OTP so a declined
    // prompt doesn't burn the code.
    const active = await getActiveSession(email);
    if (active && active.sessionId !== req.session.id && !force) {
      return res.status(200).json({
        ok: false,
        conflict: true,
        message: 'This account is already logged in on another browser or device.',
      });
    }

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

    // User confirmed takeover — kill the previous session.
    if (active && force) {
      await clearActiveSessionBySid(active.sessionId);
      await pool
        .query('DELETE FROM admin_active_sessions WHERE email = ?', [email])
        .catch(() => {});
    }

    req.session.regenerate(async (err) => {
      if (err) {
        logger.error({ err }, '[admin] session.regenerate failed');
        return res.status(500).json({ ok: false, error: 'session-failed' });
      }
      await setAdminSession(req, email);

      // Record this as the single active session for this admin email.
      try {
        await pool.query(
          `INSERT INTO admin_active_sessions (email, session_id, login_at, ip, user_agent)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), login_at = VALUES(login_at),
                                   ip = VALUES(ip), user_agent = VALUES(user_agent)`,
          [
            email,
            req.session.id,
            Date.now(),
            String(req.ip || '').slice(0, 64),
            String(req.headers['user-agent'] || '').slice(0, 255),
          ]
        );
      } catch (e) {
        logger.warn({ err: e }, '[admin] failed to record active session');
      }

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
  if (!req.session?.admin || !isSessionValid(req.session)) {
    return res.status(401).json({ ok: false });
  }
  return res.json({ ok: true, expires_in_ms: remainingMs(req.session) });
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/me                                                    */
/* ------------------------------------------------------------------ */
export function me(req, res) {
  if (!req.session?.admin || !isSessionValid(req.session)) {
    return res.status(401).json({ ok: false });
  }
  return res.json({
    ok: true,
    email:          req.session.adminEmail || ADMIN_EMAIL,
    name:           req.session.adminName  || 'Admin',
    role:           req.session.adminRole  || 'superadmin',
    permissions:    permissionsForRole(req.session.adminRole || 'superadmin'),
    expires_in_ms:  remainingMs(req.session),
    login_at:       Number(req.session.adminLoginAt || 0),
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
  // Remove this browser from the single-active-session registry so a
  // future login elsewhere isn't flagged as a conflict.
  const email = req.session.adminEmail;
  const sid = req.session.id;
  if (email && sid) {
    pool
      .query('DELETE FROM admin_active_sessions WHERE email = ? AND session_id = ?', [email, sid])
      .catch(() => {});
  }
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

    // Push the new block state to every connected admin client so the
    // Block/Unblock buttons never go stale.
    getIo()?.emit('user:blocked', { user_id: id, blocked });

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
/*  GET /api/admin/insights — richer analytics for the dashboard         */
/* ------------------------------------------------------------------ */
export async function getAdminInsights(_req, res) {
  try {
    const [
      farmersRows, chatStatusRows, msgTodayRows, msgSeriesRows,
      revTotalRows, revTodayRows, rev7Rows, rev30Rows, revAvgRows,
      topFarmersRows, quotesRows,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(blocked = 1), 0) AS blocked,
                COALESCE(SUM(created_at >= NOW() - INTERVAL 7 DAY), 0)  AS new_7d,
                COALESCE(SUM(created_at >= NOW() - INTERVAL 30 DAY), 0) AS new_30d
         FROM users WHERE role = 'farmer'`
      ),
      pool.query(`SELECT status, COUNT(*) AS c FROM chats GROUP BY status`),
      pool.query(
        `SELECT COUNT(*) AS c FROM messages WHERE DATE(created_at) = CURDATE()`
      ),
      pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS c
         FROM messages
         WHERE created_at >= CURDATE() - INTERVAL 13 DAY
         GROUP BY d ORDER BY d`
      ),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE status='success'`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE status='success' AND DATE(created_at)=CURDATE()`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE status='success' AND created_at >= NOW() - INTERVAL 7 DAY`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE status='success' AND created_at >= NOW() - INTERVAL 30 DAY`),
      pool.query(`SELECT COALESCE(AVG(amount),0) AS a, COUNT(*) AS n FROM payments WHERE status='success'`),
      pool.query(
        `SELECT u.name, u.mobile, COUNT(*) AS msgs
         FROM messages m
         JOIN chats ch ON ch.id = m.chat_id
         JOIN users u  ON u.id = ch.user_id
         WHERE m.sender_role = 'farmer'
           AND m.created_at >= NOW() - INTERVAL 7 DAY
         GROUP BY u.id, u.name, u.mobile
         ORDER BY msgs DESC LIMIT 5`
      ),
      pool.query(`SELECT COUNT(*) AS c FROM quotations`),
    ]);

    const statusCounts = { UNREAD: 0, READ: 0, SENT: 0 };
    for (const r of chatStatusRows[0]) {
      if (r.status in statusCounts) statusCounts[r.status] = Number(r.c);
    }

    // Fill gaps so the 14-day series always has every day.
    // Dates come from MySQL in DB-server timezone; derive the weekday
    // label from the date string itself (UTC) so labels always line up.
    const week = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', {
        weekday: 'short',
        timeZone: 'UTC',
      });
      const raw = msgSeriesRows[0].find((r) => r.d === key);
      week.push({ day: label, date: key.slice(5), count: raw ? Number(raw.c) : 0 });
    }

    return res.json({
      ok: true,
      insights: {
        farmers: {
          total: Number(farmersRows[0][0]?.total || 0),
          blocked: Number(farmersRows[0][0]?.blocked || 0),
          new_7d: Number(farmersRows[0][0]?.new_7d || 0),
          new_30d: Number(farmersRows[0][0]?.new_30d || 0),
        },
        chats: {
          ...statusCounts,
          messages_today: Number(msgTodayRows[0][0]?.c || 0),
        },
        activity_14d: week,
        revenue: {
          total: Number(revTotalRows[0][0]?.t || 0),
          today: Number(revTodayRows[0][0]?.t || 0),
          last7d: Number(rev7Rows[0][0]?.t || 0),
          last30d: Number(rev30Rows[0][0]?.t || 0),
          avg_order: Math.round(Number(revAvgRows[0][0]?.a || 0)),
          orders: Number(revAvgRows[0][0]?.n || 0),
        },
        top_farmers_7d: topFarmersRows[0].map((r) => ({
          name: r.name || 'Unknown',
          mobile: r.mobile,
          msgs: Number(r.msgs),
        })),
        quotations_total: Number(quotesRows[0][0]?.c || 0),
      },
    });
  } catch (err) {
    logger.error({ err }, '[admin] getAdminInsights failed');
    return res.status(500).json({ ok: false, message: 'Failed to load insights' });
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

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/my-password — self-service password change           */
/* (works for every admin role; verifies current password first)         */
/* ------------------------------------------------------------------ */
export async function changeMyPassword(req, res) {
  const adminId = Number(req.session?.adminId);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    return res.status(400).json({ ok: false, message: 'Session has no admin id — please log in again' });
  }

  const currentPassword = String(req.body?.current_password || '');
  const newPassword = String(req.body?.new_password || '');

  try {
    const [rows] = await pool.query(
      'SELECT id, email, password_hash FROM admin_users WHERE id = ? AND is_active = 1 LIMIT 1',
      [adminId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Admin account not found' });
    }

    let currentOk = false;
    if (rows[0].password_hash) {
      currentOk = await bcrypt.compare(currentPassword, rows[0].password_hash);
    } else if (rows[0].email === ADMIN_EMAIL) {
      // Legacy account without its own hash — fall back to ADMIN_PASSWORD
      currentOk = await bcrypt.compare(currentPassword, adminPasswordHash);
    }
    if (!currentOk) {
      await insertAuthAudit({
        actorType: 'admin',
        actorId: adminId,
        identifier: rows[0].email,
        action: 'password_change_failed',
        success: false,
        ...requestAuditMeta(req, { reason: 'bad_current_password' }),
      });
      return res.status(401).json({ ok: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword.trim(), 12);
    await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, adminId]);

    await insertAuthAudit({
      actorType: 'admin',
      actorId: adminId,
      identifier: rows[0].email,
      action: 'password_changed',
      success: true,
      ...requestAuditMeta(req),
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[admin] changeMyPassword failed');
    return res.status(500).json({ ok: false, message: 'Failed to change password' });
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
