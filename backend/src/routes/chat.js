// backend/src/routes/chat.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { pool } from '../config/db.js';
import { sendWA } from '../services/msg91.js';
import { ensureAdminSession } from './admin.js';

let ioRef = null;
export function attachChatSocket(io) {
  ioRef = io;
}

const router = express.Router();

/* Helpers */
const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const stripLeadingSlash = (p) => String(p || '').replace(/^[\\/]+/, '');
const diskPathFromUrl = (urlPath) =>
  path.join(process.cwd(), stripLeadingSlash(urlPath));

async function getUserByMobile(mobile) {
  const [u] = await pool.query(
    'SELECT * FROM users WHERE mobile=? LIMIT 1',
    [mobile]
  );
  return u[0] || null;
}

async function ensureChat(userMobile) {
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
  const [row] = await pool.query('SELECT * FROM chats WHERE id=?', [
    ins.insertId,
  ]);
  return row[0];
}

/* Uploads dir */
const mediaDir = path.join(process.cwd(), 'uploads', 'images');
fs.mkdirSync(mediaDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || '');
    cb(null, `${ts}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({ storage });

/* -------- POST /api/chat/message (text/file/audio/video + replies + original_name) -------- */
router.post('/message', upload.single('file'), async (req, res) => {
  try {
    const mobile = norm(req.body?.mobile);
    const sender_role = (req.body?.sender_role || 'farmer').toLowerCase();
    const text = (req.body?.text ?? '').trim() || null;

    const reply_to = Number(req.body?.reply_to) || null;
    const sDate = (req.body?.last_spray_date ?? '').trim() || null;
    const sChem = (req.body?.last_chemical ?? '').trim() || null;
    const sDose = (req.body?.last_dosage ?? '').trim() || null;

    // exact filename priority: explicit -> multer originalname -> null
    const original_name =
      (req.body?.original_name &&
        String(req.body.original_name).trim()) ||
      (req.file?.originalname &&
        String(req.file.originalname).trim()) ||
      null;

    if (!mobile || mobile.length !== 10) {
      return res
        .status(400)
        .json({ message: 'valid 10-digit mobile required' });
    }

    // NEW: admin messages must come from an authenticated admin session
    if (sender_role === 'admin' && !req.session?.admin) {
      return res
        .status(401)
        .json({ message: 'Admin authentication required' });
    }

    if (sender_role === 'farmer') {
      const user = await getUserByMobile(mobile);
      if (user?.blocked) {
        return res
          .status(403)
          .json({ message: 'You are blocked from messaging.' });
      }
    }

    const chat = await ensureChat(mobile);

    const metaObj = {};
    if (sDate || sChem || sDose) {
      metaObj.spray = { date: sDate, chemical: sChem, dosage: sDose };
    }
    if (reply_to) metaObj.reply_to = reply_to;
    if (original_name) metaObj.original_name = original_name;

    const [ins] = await pool.query(
      'INSERT INTO messages (chat_id, sender_role, text, meta) VALUES (?,?,?,?)',
      [
        chat.id,
        sender_role,
        text,
        Object.keys(metaObj).length ? JSON.stringify(metaObj) : null,
      ]
    );

    // attachment
    let file_path = null,
      mime_type = null,
      duration_seconds = null,
      kind = null;

    if (req.file) {
      file_path = `/uploads/images/${req.file.filename}`;
      mime_type = req.file.mimetype || null;

      if (mime_type?.startsWith('image/')) kind = 'image';
      else if (mime_type?.startsWith('video/')) kind = 'video';
      else if (mime_type === 'application/pdf') kind = 'pdf';
      else if (
        mime_type?.startsWith('audio/') ||
        mime_type?.includes('webm') ||
        mime_type?.includes('ogg')
      )
        kind = 'audio';
      else kind = 'other';

      const dur = Number(req.body?.audio_duration);
      if (!Number.isNaN(dur) && dur > 0) {
        duration_seconds = Math.round(dur);
      }

      try {
        await pool.query(
          'INSERT INTO attachments (message_id, file_path, mime_type, duration_seconds, kind, original_name) VALUES (?,?,?,?,?,?)',
          [
            ins.insertId,
            file_path,
            mime_type,
            duration_seconds,
            kind,
            original_name,
          ]
        );
      } catch {
        await pool.query(
          'INSERT INTO attachments (message_id, file_path, mime_type, duration_seconds, kind) VALUES (?,?,?,?,?)',
          [ins.insertId, file_path, mime_type, duration_seconds, kind]
        );
      }
    }

    // update chat status (UNREAD when farmer sends, READ when admin sends)
    if (sender_role === 'farmer') {
      await pool.query("UPDATE chats SET status='UNREAD' WHERE id=?", [
        chat.id,
      ]);
    } else {
      await pool.query("UPDATE chats SET status='READ' WHERE id=?", [
        chat.id,
      ]);
    }

    ioRef?.emit('chat:new_message', { chat_id: chat.id });

    res.json({
      ok: true,
      message: {
        id: ins.insertId,
        chat_id: chat.id,
        file_path,
        mime_type,
        duration_seconds,
        kind,
      },
    });
  } catch (e) {
    console.error('chat/message error:', e);
    res.status(500).json({ message: 'Failed to post message' });
  }
});

/* -------- GET /api/chat/thread/:chatId -------- */
router.get('/thread/:chatId', async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const role = (req.query.role || 'farmer').toLowerCase();
    const hideCol =
      role === 'admin' ? 'deleted_for_admin' : 'deleted_for_farmer';

    const baseSelect = `
      SELECT m.id, m.chat_id, m.sender_role, m.text, m.meta, m.created_at,
             a.file_path, a.mime_type, a.duration_seconds, a.kind
    `;
    const withOrig = `${baseSelect}, a.original_name`;

    const fromJoin = `
      FROM messages m
      LEFT JOIN attachments a ON a.message_id = m.id
      WHERE m.chat_id = ? AND m.${hideCol} = 0
      ORDER BY m.id ASC
    `;

    let rows;
    try {
      const [r] = await pool.query(withOrig + fromJoin, [chatId]);
      rows = r.map((rw) => {
        if (rw.original_name) {
          try {
            const meta = rw.meta ? JSON.parse(rw.meta) : {};
            if (!meta.original_name) meta.original_name = rw.original_name;
            rw.meta = JSON.stringify(meta);
          } catch {
            /* ignore JSON parse errors */
          }
        }
        return rw;
      });
    } catch {
      const [r] = await pool.query(baseSelect + fromJoin, [chatId]);
      rows = r;
    }

    res.json(rows);
  } catch (e) {
    console.error('chat/thread error:', e);
    res.status(500).json({ message: 'Failed to fetch thread' });
  }
});

/* -------- DELETE /api/chat/message/:id -------- */
router.delete('/message/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = (
      req.body?.role ||
      req.query?.role ||
      'farmer'
    ).toLowerCase();
    const mode = (
      req.body?.mode ||
      req.query?.mode ||
      'me'
    ).toLowerCase();

    const [mrows] = await pool.query(
      'SELECT * FROM messages WHERE id=? LIMIT 1',
      [id]
    );
    if (!mrows.length) {
      return res.status(404).json({ message: 'Message not found' });
    }
    const msg = mrows[0];

    if (mode === 'me') {
      const col =
        role === 'admin' ? 'deleted_for_admin' : 'deleted_for_farmer';
      await pool.query(`UPDATE messages SET ${col}=1 WHERE id=?`, [id]);
      ioRef?.emit('chat:delete', {
        chat_id: msg.chat_id,
        id,
        mode: 'me',
        role,
      });
      return res.json({ ok: true });
    }

    if (mode === 'everyone') {
      const allowed = role === 'admin' || msg.sender_role === role;
      if (!allowed) {
        return res.status(403).json({ message: 'Not allowed' });
      }

      const [att] = await pool.query(
        'SELECT * FROM attachments WHERE message_id=?',
        [id]
      );
      for (const a of att) {
        if (a.file_path) {
          const abs = diskPathFromUrl(a.file_path);
          try {
            await fsp.unlink(abs);
          } catch {
            /* ignore unlink errors */
          }
        }
      }
      await pool.query('DELETE FROM attachments WHERE message_id=?', [id]);
      await pool.query('DELETE FROM messages WHERE id=?', [id]);
      ioRef?.emit('chat:delete', {
        chat_id: msg.chat_id,
        id,
        mode: 'everyone',
      });
      return res.json({ ok: true });
    }

    res.status(400).json({ message: 'Invalid delete mode' });
  } catch (e) {
    console.error('delete message error:', e);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

/* -------- POST /api/chat/clear  (mark all messages deleted_for_<role>) -------- */
router.post('/clear', async (req, res) => {
  try {
    const { chat_id, role = 'admin', scope = 'me' } = req.body || {};
    if (!chat_id) {
      return res.status(400).json({ message: 'chat_id required' });
    }
    if (scope !== 'me') {
      return res
        .status(400)
        .json({ message: 'Only scope=me is supported' });
    }

    const col =
      role === 'admin' ? 'deleted_for_admin' : 'deleted_for_farmer';
    await pool.query(`UPDATE messages SET ${col}=1 WHERE chat_id=?`, [
      chat_id,
    ]);
    ioRef?.emit('chat:cleared', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/clear error:', e);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
});

/* -------- POST /api/chat/delete (same effect + stronger UI cue) -------- */
router.post('/delete', async (req, res) => {
  try {
    const { chat_id, role = 'admin', scope = 'me' } = req.body || {};
    if (!chat_id) {
      return res.status(400).json({ message: 'chat_id required' });
    }
    const col =
      role === 'admin' ? 'deleted_for_admin' : 'deleted_for_farmer';
    await pool.query(`UPDATE messages SET ${col}=1 WHERE chat_id=?`, [
      chat_id,
    ]);
    ioRef?.emit('chat:deleted', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/delete error:', e);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

/* -------- GET /api/chat/all (ADMIN ONLY) -------- */
router.get('/all', ensureAdminSession, async (_req, res) => {
  try {
    // Only consider messages visible to ADMIN in the snippets/unread counts
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
      WHERE EXISTS (
        SELECT 1
        FROM messages mx
        WHERE mx.chat_id = c.id
          AND mx.deleted_for_admin = 0
      )
      ORDER BY c.updated_at DESC, c.id DESC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (e) {
    console.error('chat/all error:', e);
    res.status(500).json({ message: 'Failed to list chats' });
  }
});

/* -------- POST /api/chat/status (ADMIN ONLY) -------- */
router.post('/status', ensureAdminSession, async (req, res) => {
  try {
    const { chat_id, status } = req.body || {};
    if (!chat_id || !status) {
      return res
        .status(400)
        .json({ message: 'chat_id and status required' });
    }
    if (status === 'READ') {
      await pool.query(
        'UPDATE chats SET status=?, last_read_admin_at=NOW() WHERE id=?',
        [status, chat_id]
      );
    } else {
      await pool.query('UPDATE chats SET status=? WHERE id=?', [
        status,
        chat_id,
      ]);
    }
    ioRef?.emit('chat:status', { chat_id, status });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/status error:', e);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

/* -------- POST /api/chat/lr (ADMIN ONLY) -------- */
router.post('/lr', ensureAdminSession, async (req, res) => {
  try {
    const { chat_id, lr_number, tracking_link } = req.body || {};
    if (!chat_id || !lr_number) {
      return res
        .status(400)
        .json({ message: 'chat_id and lr_number required' });
    }

    const text = `LR: ${lr_number}\nTrack: ${tracking_link || ''}`;
    const [ins] = await pool.query(
      'INSERT INTO messages (chat_id, sender_role, text) VALUES (?,?,?)',
      [chat_id, 'admin', text]
    );
    await pool.query("UPDATE chats SET status='SENT' WHERE id=?", [chat_id]);

    try {
      const [[row]] = await pool.query(
        `SELECT u.mobile
           FROM chats c
           JOIN users u ON u.id = c.user_id
          WHERE c.id=? LIMIT 1`,
        [chat_id]
      );
      await sendWA({
        to: row.mobile,
        template: 'lr_update',
        params: [lr_number, tracking_link || ''],
      });
    } catch (e) {
      console.warn('[WA lr] skipped/fail', e.message);
    }

    ioRef?.emit('chat:new_message', { chat_id });
    ioRef?.emit('chat:status', { chat_id, status: 'SENT' });
    res.json({ ok: true, message_id: ins.insertId });
  } catch (e) {
    console.error('chat/lr error:', e);
    res.status(500).json({ message: 'Failed to send LR' });
  }
});

export default router;
