// src/models/quotationModel.js
// All DB queries for the 'quotations' table.
//
// Note: the canonical schema (quotations.message_id, quotations.status,
// quotations.paid_at, the FK to messages, and users.farmer_last_seen_at)
// is now owned by migrations/004_canonicalize_schema.sql — not by JS.

import { pool } from '../config/db.js';

/* ------------------------------------------------------------------ */
/*  Queries                                                              */
/* ------------------------------------------------------------------ */

export async function getLatestPendingQuoteByMobile(mobile) {
  const [[user]] = await pool.query('SELECT id FROM users WHERE mobile=? LIMIT 1', [mobile]);
  if (!user) return { chat_id: null, quote: null };

  const [[chat]] = await pool.query(
    'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 1',
    [user.id]
  );
  if (!chat) return { chat_id: null, quote: null };

  const [q] = await pool.query(
    `SELECT id, chat_id, amount, currency, file_path, status, created_at
       FROM quotations
      WHERE chat_id=? AND status='PENDING'
      ORDER BY id DESC LIMIT 1`,
    [chat.id]
  );
  return { chat_id: chat.id, quote: q[0] || null };
}

export async function listPendingQuotesByMobile(mobile) {
  const [[user]] = await pool.query('SELECT id FROM users WHERE mobile=? LIMIT 1', [mobile]);
  if (!user) return [];

  const [[chat]] = await pool.query(
    'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 1',
    [user.id]
  );
  if (!chat) return [];

  const [rows] = await pool.query(
    `SELECT id, chat_id, amount, currency, file_path, message_id, status, created_at
       FROM quotations
      WHERE chat_id=? AND status='PENDING'
      ORDER BY id ASC`,
    [chat.id]
  );
  return rows;
}

export async function insertQuotation(conn, chatId, messageId, filePath, amount) {
  await conn.query(
    'INSERT INTO quotations (chat_id, message_id, file_path, amount, currency, status) VALUES (?,?,?,?, "INR", "PENDING")',
    [chatId, messageId, filePath, amount]
  );
}

export async function markQuotationPaid(id) {
  const [r] = await pool.query(
    `UPDATE quotations SET status='PAID', paid_at=NOW() WHERE id=? AND status='PENDING'`,
    [id]
  );
  return r.affectedRows > 0;
}

export async function getQuotationChatId(id) {
  const [[row]] = await pool.query('SELECT chat_id FROM quotations WHERE id=?', [id]);
  return row?.chat_id || null;
}

export async function deleteQuotation(id) {
  await pool.query('DELETE FROM quotations WHERE id=?', [id]);
}

export async function getQuotationById(id) {
  const [[q]] = await pool.query('SELECT * FROM quotations WHERE id=? LIMIT 1', [id]);
  return q || null;
}

export async function markQuotationPaidFromPaymentId(paymentId) {
  try {
    const [[p]] = await pool.query('SELECT meta FROM payments WHERE id = ?', [paymentId]);
    if (!p) return;

    const meta = (() => { try { return JSON.parse(p.meta || '{}'); } catch { return {}; } })();
    const quotationId = Number(meta?.quotation_id || 0);
    if (!quotationId) return;

    const [[q]] = await pool.query(
      'SELECT message_id, status, paid_at FROM quotations WHERE id = ?',
      [quotationId]
    );
    if (!q) return;

    await pool.query(
      `UPDATE quotations
       SET status = 'PAID',
           paid_at = CASE WHEN paid_at IS NULL THEN NOW() ELSE paid_at END
       WHERE id = ? AND status <> 'DELETED'`,
      [quotationId]
    );

    if (q.message_id) {
      await pool.query(
        `UPDATE messages
         SET meta = JSON_SET(COALESCE(meta, '{}'), '$.payment_status', 'PAID')
         WHERE id = ?`,
        [q.message_id]
      );
    }
  } catch (e) {
    console.error('markQuotationPaidFromPaymentId error:', e?.message || e);
  }
}
