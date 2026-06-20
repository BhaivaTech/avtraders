// src/models/chatModel.js
// All DB queries for 'chats', 'messages', and 'attachments' tables.

import { pool } from '../config/db.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                            */
/* ------------------------------------------------------------------ */

/** Whitelist of roles allowed for SQL column interpolation. */
const VALID_SOFT_DELETE_COLUMNS = {
  admin: 'deleted_for_admin',
  farmer: 'deleted_for_farmer',
};

/**
 * Resolve a role string to a safe column name.
 * Returns null if the role is not whitelisted.
 */
function safeSoftDeleteCol(role) {
  return VALID_SOFT_DELETE_COLUMNS[role] || null;
}

/* ------------------------------------------------------------------ */
/*  Chats                                                                */
/* ------------------------------------------------------------------ */

export async function ensureChat(userMobile) {
  const [u] = await pool.query(
    'SELECT id, name FROM users WHERE mobile=? LIMIT 1',
    [userMobile]
  );
  if (!u.length) throw new Error('user not found');
  const userId = u[0].id;

  const [c] = await pool.query(
    'SELECT * FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 1',
    [userId]
  );
  if (c.length) return c[0];

  const [ins] = await pool.query(
    "INSERT INTO chats (user_id, status) VALUES (?, 'UNREAD')",
    [userId]
  );
  const [row] = await pool.query('SELECT * FROM chats WHERE id=?', [ins.insertId]);
  return row[0];
}

export async function updateChatStatus(chatId, status) {
  if (status === 'READ') {
    await pool.query(
      'UPDATE chats SET status=?, last_read_admin_at=NOW() WHERE id=?',
      [status, chatId]
    );
  } else {
    await pool.query('UPDATE chats SET status=? WHERE id=?', [status, chatId]);
  }
}

export async function getAllChatsForAdmin({ search, status, page = 1, limit = 100 } = {}) {
  const offset = (Math.max(1, page) - 1) * Number(limit);
  const conditions = [`EXISTS (
      SELECT 1 FROM messages mx WHERE mx.chat_id = c.id AND mx.deleted_for_admin = 0
    )`];
  const params = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.mobile LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (status && status !== 'all') {
    conditions.push('c.status = ?');
    params.push(status.toUpperCase());
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT
      c.id,
      c.status,
      u.name,
      u.mobile,
      (
        SELECT COALESCE(
          CASE
            WHEN JSON_EXTRACT(m2.meta, '$.amount') IS NOT NULL
              THEN CONCAT('Quotation ₹', JSON_UNQUOTE(JSON_EXTRACT(m2.meta, '$.amount')))
            WHEN a2.file_path IS NOT NULL
                 AND (
                   a2.kind = 'audio'
                   OR a2.mime_type LIKE 'audio/%'
                   OR a2.mime_type LIKE '%webm%'
                   OR a2.mime_type LIKE '%ogg%'
                 )
              THEN '🎤 Voice note'
            WHEN a2.file_path IS NOT NULL
              THEN '📎 Attachment'
            ELSE m2.text
          END,
          m2.text
        )
        FROM messages m2
        LEFT JOIN attachments a2 ON a2.message_id = m2.id
        WHERE m2.chat_id = c.id
          AND m2.deleted_for_admin = 0
        ORDER BY m2.id DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT COUNT(*)
        FROM messages mu
        WHERE mu.chat_id = c.id
          AND mu.sender_role = 'farmer'
          AND mu.deleted_for_admin = 0
          AND (
            c.last_read_admin_at IS NULL
            OR mu.created_at > c.last_read_admin_at
          )
      ) AS unread_count
    FROM chats c
    JOIN users u ON u.id = c.user_id
    ${where}
    ORDER BY c.updated_at DESC, c.id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, [...params, Number(limit), offset]);
  return rows;
}


/* ------------------------------------------------------------------ */
/*  Messages                                                             */
/* ------------------------------------------------------------------ */

export async function insertMessage(chatId, senderRole, text, meta) {
  const [ins] = await pool.query(
    'INSERT INTO messages (chat_id, sender_role, text, meta) VALUES (?,?,?,?)',
    [chatId, senderRole, text, meta ? JSON.stringify(meta) : null]
  );
  return ins.insertId;
}

export async function getChatThread(chatId, role) {
  const hideCol = safeSoftDeleteCol(role);
  if (!hideCol) throw Object.assign(new Error('Invalid role'), { status: 400 });

  const baseSelect = `
    SELECT m.id, m.chat_id, m.sender_role, m.text, m.meta, m.created_at,
           a.file_path, a.mime_type, a.duration_seconds, a.kind,
           (c.last_read_admin_at IS NOT NULL AND m.created_at <= c.last_read_admin_at) AS is_read
  `;
  const withOrig = `${baseSelect}, a.original_name`;
  const fromJoin = `
    FROM messages m
    LEFT JOIN attachments a ON a.message_id = m.id
    JOIN chats c ON c.id = m.chat_id
    WHERE m.chat_id = ? AND m.${hideCol} = 0
    ORDER BY m.id ASC
  `;

  try {
    const [rows] = await pool.query(withOrig + fromJoin, [chatId]);
    return rows.map((rw) => {
      if (rw.original_name) {
        try {
          const meta = rw.meta ? JSON.parse(rw.meta) : {};
          if (!meta.original_name) meta.original_name = rw.original_name;
          rw.meta = JSON.stringify(meta);
        } catch { /* ignore */ }
      }
      return rw;
    });
  } catch {
    const [rows] = await pool.query(baseSelect + fromJoin, [chatId]);
    return rows;
  }
}

export async function getMessageById(id) {
  const [rows] = await pool.query('SELECT * FROM messages WHERE id=? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function softDeleteMessage(id, role) {
  const col = safeSoftDeleteCol(role);
  if (!col) throw Object.assign(new Error('Invalid role'), { status: 400 });
  await pool.query(`UPDATE messages SET ${col}=1 WHERE id=?`, [id]);
}

export async function softDeleteAllMessages(chatId, role) {
  const col = safeSoftDeleteCol(role);
  if (!col) throw Object.assign(new Error('Invalid role'), { status: 400 });
  await pool.query(`UPDATE messages SET ${col}=1 WHERE chat_id=?`, [chatId]);
}

export async function hardDeleteMessage(id) {
  await pool.query('DELETE FROM messages WHERE id=?', [id]);
}

export async function hardDeleteAttachmentsByMessage(messageId) {
  const [att] = await pool.query('SELECT * FROM attachments WHERE message_id=?', [messageId]);
  await pool.query('DELETE FROM attachments WHERE message_id=?', [messageId]);
  return att; // return for file cleanup
}

export async function setMessageMetaPaymentStatus(messageId, status) {
  await pool.query(
    `UPDATE messages
     SET meta = JSON_SET(COALESCE(meta, '{}'), '$.payment_status', ?)
     WHERE id = ?`,
    [status, messageId]
  );
}

/* ------------------------------------------------------------------ */
/*  Attachments                                                          */
/* ------------------------------------------------------------------ */

export async function insertAttachment(messageId, filePath, mimeType, durationSeconds, kind, originalName) {
  try {
    await pool.query(
      'INSERT INTO attachments (message_id, file_path, mime_type, duration_seconds, kind, original_name) VALUES (?,?,?,?,?,?)',
      [messageId, filePath, mimeType, durationSeconds, kind, originalName]
    );
  } catch {
    await pool.query(
      'INSERT INTO attachments (message_id, file_path, mime_type, duration_seconds, kind) VALUES (?,?,?,?,?)',
      [messageId, filePath, mimeType, durationSeconds, kind]
    );
  }
}

export async function getChatMobileById(chatId) {
  const [[row]] = await pool.query(
    `SELECT u.mobile FROM chats c JOIN users u ON u.id = c.user_id WHERE c.id=? LIMIT 1`,
    [chatId]
  );
  return row?.mobile || null;
}
