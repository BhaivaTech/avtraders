// src/models/authAuditModel.js
// Generic authentication audit logging for farmer, dealer and admin flows.

import { pool } from '../config/db.js';

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function safeJson(value) {
  if (!value || typeof value !== 'object') return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function insertAuthAudit({
  actorType,
  actorId = null,
  identifier = null,
  action,
  success = true,
  ip = null,
  userAgent = null,
  meta = null,
}) {
  try {
    await pool.query(
      `INSERT INTO auth_audit
       (actor_type, actor_id, identifier, action, success, ip, user_agent, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorType,
        actorId == null ? null : String(actorId),
        identifier == null ? null : String(identifier),
        action,
        success ? 1 : 0,
        ip || null,
        userAgent ? String(userAgent).slice(0, 500) : null,
        safeJson(meta),
        nowSql(),
      ]
    );
  } catch (err) {
    console.error('[auth-audit] write failed:', err?.message || err);
  }
}

export function requestAuditMeta(req, meta = {}) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || null,
    userAgent: req.get?.('user-agent') || req.headers['user-agent'] || null,
    meta,
  };
}
