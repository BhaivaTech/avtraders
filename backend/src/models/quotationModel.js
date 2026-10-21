// src/models/quotationModel.js
// All DB queries for the 'quotations' table.
//
// Note: the canonical schema (quotations.message_id, quotations.status,
// quotations.paid_at, the FK to messages, and users.farmer_last_seen_at)
// is now owned by migrations/004_canonicalize_schema.sql — not by JS.

import { pool } from '../config/db.js';
import { getIo } from '../utils/socketBus.js';

/* ------------------------------------------------------------------ */
/*  Queries                                                              */
/* ------------------------------------------------------------------ */

export async function getLatestPendingQuoteByMobile(mobile) {
  const [[user]] = await pool.query('SELECT id FROM users WHERE mobile=? LIMIT 1', [mobile]);
  if (!user) return { chat_id: null, quote: null };

  const [chats] = await pool.query(
    'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC',
    [user.id]
  );
  if (!chats.length) return { chat_id: null, quote: null };

  const chatIds = chats.map(c => c.id);
  const placeholders = chatIds.map(() => '?').join(',');

  const [q] = await pool.query(
    `SELECT id, chat_id, amount, currency, file_path, status, created_at
       FROM quotations
      WHERE chat_id IN (${placeholders}) AND status='PENDING'
      ORDER BY created_at DESC LIMIT 1`,
    chatIds
  );
  if (q[0]) return { chat_id: q[0].chat_id, quote: q[0] };
  return { chat_id: chatIds[0], quote: null };
}

export async function listPendingQuotesByMobile(mobile) {
  const [[user]] = await pool.query('SELECT id FROM users WHERE mobile=? LIMIT 1', [mobile]);
  if (!user) return [];

  const [chats] = await pool.query(
    'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC',
    [user.id]
  );
  if (!chats.length) return [];

  const chatIds = chats.map(c => c.id);
  const placeholders = chatIds.map(() => '?').join(',');

  const [rows] = await pool.query(
    `SELECT id, chat_id, amount, currency, file_path, message_id, status, created_at
       FROM quotations
      WHERE chat_id IN (${placeholders}) AND status='PENDING'
      ORDER BY created_at DESC`,
    chatIds
  );
  return rows;
}

export async function insertQuotation(conn, chatId, messageId, filePath, amount) {
  const [result] = await conn.query(
    'INSERT INTO quotations (chat_id, message_id, file_path, amount, currency, status) VALUES (?,?,?,?, "INR", "PENDING")',
    [chatId, messageId, filePath, amount]
  );
  return result.insertId;
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

// Synchronize only payments explicitly linked to this quotation. Never infer
// that a payment belongs to a quote just because their amounts match.
export async function syncQuotationPaymentState(paymentId) {
  const conn = await pool.getConnection();
  let event;
  try {
    await conn.beginTransaction();
    const [[payment]] = await conn.query('SELECT id, chat_id, status, amount, meta FROM payments WHERE id=?', [paymentId]);
    let meta;
    try { meta = typeof payment?.meta === 'object' ? payment.meta : JSON.parse(payment?.meta || '{}'); } catch { meta = {}; }
    const quotationId = Number(meta?.quotation_id || 0);
    if (!payment || !quotationId) { await conn.rollback(); return; }
    const [[quote]] = await conn.query('SELECT id, chat_id, message_id, status, amount FROM quotations WHERE id=? FOR UPDATE', [quotationId]);
    if (!quote || Number(quote.chat_id) !== Number(payment.chat_id) || Math.round(Number(quote.amount)*100) !== Math.round(Number(payment.amount)*100)) { await conn.rollback(); return; }
    const [[latest]] = await conn.query("SELECT id, status FROM payments WHERE chat_id=? AND JSON_UNQUOTE(JSON_EXTRACT(meta, '$.quotation_id'))=? ORDER BY (status='success') DESC, id DESC LIMIT 1", [quote.chat_id, String(quotationId)]);
    const state = quote.status === 'PAID' || latest?.status === 'success' ? 'PAID' : String(latest?.status || payment.status).toUpperCase();
    if (state === 'PAID') await conn.query("UPDATE quotations SET status='PAID', paid_at=COALESCE(paid_at,NOW()) WHERE id=?", [quotationId]);
    if (quote.message_id) await conn.query("UPDATE messages SET meta=JSON_SET(COALESCE(meta, '{}'), '$.quotation_id', ?, '$.payment_status', ?, '$.payment_id', ?) WHERE id=?", [quotationId, state, latest?.id || payment.id, quote.message_id]);
    await conn.commit();
    event = { chat_id: Number(quote.chat_id), quotation_id: quotationId, payment_status: state };
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
  if (event) {
    getIo()?.emit('quotes:changed', event);
    getIo()?.emit('chat:payment', event);
  }
}

export const markQuotationPaidFromPaymentId = syncQuotationPaymentState;
