// src/models/auditModel.js
// Queries for reading auth_audit and dealer_audit tables.

import { pool } from '../config/db.js';

/**
 * Get paginated auth audit logs.
 * @param {{ page?: number, limit?: number, actorType?: string, success?: string }} opts
 */
export async function getAuthAuditLogs({ page = 1, limit = 50, actorType, success } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const conditions = [];
  const params = [];

  if (actorType && actorType !== 'all') {
    conditions.push('actor_type = ?');
    params.push(actorType);
  }
  if (success === 'true' || success === '1') {
    conditions.push('success = 1');
  } else if (success === 'false' || success === '0') {
    conditions.push('success = 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT id, actor_type, actor_id, identifier, action, success, ip, user_agent, meta, created_at
     FROM auth_audit
     ${where}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM auth_audit ${where}`,
    params
  );

  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

/**
 * Get paginated dealer audit logs.
 * @param {{ page?: number, limit?: number, dealerId?: number }} opts
 */
export async function getDealerAuditLogs({ page = 1, limit = 50, dealerId } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const conditions = [];
  const params = [];

  if (dealerId) {
    conditions.push('da.dealer_id = ?');
    params.push(dealerId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT da.id, da.dealer_id, d.name AS dealer_name, d.phone AS dealer_phone,
            da.action, da.actor_role, da.actor_id, da.note, da.created_at
     FROM dealer_audit da
     LEFT JOIN dealers d ON d.id = da.dealer_id
     ${where}
     ORDER BY da.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM dealer_audit da ${where}`,
    params
  );

  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}
