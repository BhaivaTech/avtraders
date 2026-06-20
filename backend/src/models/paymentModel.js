// src/models/paymentModel.js
// All DB queries for the 'payments' table.

import { pool } from '../config/db.js';

export async function insertPayment(chatId, amount) {
  const [ins] = await pool.query(
    "INSERT INTO payments (chat_id, provider, status, amount, meta) VALUES (?, 'phonepe', 'pending', ?, JSON_OBJECT())",
    [chatId, amount]
  );
  return ins.insertId;
}

export async function updatePaymentMeta(paymentId, status, meta) {
  await pool.query(
    'UPDATE payments SET meta = ?, status = ? WHERE id = ?',
    [JSON.stringify(meta), status, paymentId]
  );
}

export async function updatePaymentStatus(paymentId, status, txnId, meta) {
  await pool.query(
    'UPDATE payments SET status = ?, txn_id = ?, meta = ? WHERE id = ?',
    [status, txnId, JSON.stringify(meta), paymentId]
  );
}

export async function getPaymentById(paymentId) {
  const [[p]] = await pool.query(
    'SELECT id, status, meta, txn_id, amount FROM payments WHERE id = ?',
    [paymentId]
  );
  return p || null;
}

export async function getPaymentMetaById(paymentId) {
  const [[row]] = await pool.query('SELECT meta FROM payments WHERE id = ?', [paymentId]);
  return row || null;
}

export async function findPaymentByMerchantOrderId(merchantOrderId) {
  const [rows] = await pool.query(
    `SELECT id, meta FROM payments WHERE JSON_EXTRACT(meta,'$.merchantOrderId') = ? LIMIT 1`,
    [merchantOrderId]
  );
  return rows[0] || null;
}

export async function getAllPayments({ page = 1, limit = 50, status } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    conditions.push('p.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT p.id, p.chat_id, p.provider, p.status, p.amount, p.txn_id, p.created_at,
            u.name AS farmer_name, u.mobile AS farmer_mobile
     FROM payments p
     LEFT JOIN chats c ON c.id = p.chat_id
     LEFT JOIN users u ON u.id = c.user_id
     ${where}
     ORDER BY p.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM payments p ${where}`,
    params
  );

  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

