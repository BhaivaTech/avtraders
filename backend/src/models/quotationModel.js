// src/models/quotationModel.js
// All DB queries for the 'quotations' table.

import { pool } from '../config/db.js';

/* ------------------------------------------------------------------ */
/*  Schema migration (idempotent)                                        */
/* ------------------------------------------------------------------ */

export async function ensureQuotationSchema() {
  const [[dbRow]] = await pool.query('SELECT DATABASE() AS db');
  const db = dbRow.db;

  async function ensureColumn(table, column, ddl) {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [db, table, column]
    );
    if (!r.n) await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  }
  async function ensureIndex(table, index, ddlSuffix) {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?`,
      [db, table, index]
    );
    if (!r.n) await pool.query(`ALTER TABLE \`${table}\` ADD INDEX \`${index}\` ${ddlSuffix}`);
  }
  async function ensureFK(table, fkName, ddl) {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA=? AND CONSTRAINT_NAME=?`,
      [db, fkName]
    );
    if (!r.n) await pool.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` ${ddl}`);
  }

  try { await ensureColumn('users', 'farmer_last_seen_at', 'DATETIME NULL'); } catch {}
  try { await ensureIndex('users', 'idx_users_farmer_seen', '(farmer_last_seen_at)'); } catch {}
  try { await ensureColumn('quotations', 'message_id', 'BIGINT NULL'); } catch {}
  try { await ensureColumn('quotations', 'status', 'ENUM("PENDING","PAID","DELETED") NOT NULL DEFAULT "PENDING"'); } catch {}
  try { await ensureColumn('quotations', 'paid_at', 'DATETIME NULL'); } catch {}
  try {
    await ensureFK(
      'quotations', 'fk_quotations_message',
      'FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE'
    );
  } catch {}
}

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
