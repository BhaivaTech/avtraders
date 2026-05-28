// backend/src/routes/quotes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db.js';
import { sendWA } from '../services/msg91.js';

let ioRef = null;
export function attachQuotesSocket(io) {
  ioRef = io;
}

const router = express.Router();

/* helpers */
const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const fail = (res, code, message) =>
  res.status(code).json({ ok: false, error: message });

function requireAdmin(req, _res, next) {
  if (req.session?.admin) return next();
  return next({ status: 401, message: 'admin-only' });
}
function getSessionMobile(req) {
  const c = [
    req.session?.farmer?.mobile,
    req.session?.user?.mobile,
    req.session?.auth?.mobile,
    req.session?.otp?.mobile,
    req.session?.login?.mobile,
    req.session?.mobile,
  ]
    .map(norm)
    .filter(Boolean);
  return c[0] || '';
}
function canViewMobile(req, mobile) {
  return !!req.session?.admin || getSessionMobile(req) === norm(mobile);
}

/* storage */
const qdir = path.join(process.cwd(), 'uploads', 'quotes');
fs.mkdirSync(qdir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, qdir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || '');
    cb(null, `${ts}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({ storage });

/* ---- schema ensure (idempotent; no IF NOT EXISTS in ALTER) ---- */
async function ensureSchema() {
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
    if (!r.n) {
      await pool.query(
        `ALTER TABLE \`${table}\` ADD INDEX \`${index}\` ${ddlSuffix}`
      );
    }
  }
  async function ensureFK(table, fkName, ddl) {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS n
         FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA=? AND CONSTRAINT_NAME=?`,
      [db, fkName]
    );
    if (!r.n) {
      await pool.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` ${ddl}`
      );
    }
  }

  // users
  try {
    await ensureColumn(
      'users',
      'farmer_last_seen_at',
      'DATETIME NULL'
    );
  } catch {}
  try {
    await ensureIndex(
      'users',
      'idx_users_farmer_seen',
      '(farmer_last_seen_at)'
    );
  } catch {}

  // quotations
  try {
    await ensureColumn('quotations', 'message_id', 'BIGINT NULL');
  } catch {}
  try {
    await ensureColumn(
      'quotations',
      'status',
      'ENUM("PENDING","PAID","DELETED") NOT NULL DEFAULT "PENDING"'
    );
  } catch {}
  try {
    await ensureColumn('quotations', 'paid_at', 'DATETIME NULL');
  } catch {}
  try {
    await ensureFK(
      'quotations',
      'fk_quotations_message',
      'FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE'
    );
  } catch {}
}
ensureSchema().catch((e) =>
  console.warn('[quotes.ensureSchema]', e?.message || e)
);

/* GET latest by mobile (only PENDING) */
router.get('/latest-by-mobile/:mobile', async (req, res) => {
  try {
    const mobile = norm(req.params.mobile);
    if (mobile.length !== 10) {
      return fail(res, 400, 'valid 10-digit mobile required');
    }
    if (!canViewMobile(req, mobile)) {
      return fail(res, 401, 'unauthorized');
    }

    const [[user]] = await pool.query(
      'SELECT id FROM users WHERE mobile=? LIMIT 1',
      [mobile]
    );
    if (!user) return ok(res, { chat_id: null, quote: null });

    const [[chat]] = await pool.query(
      'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    if (!chat) return ok(res, { chat_id: null, quote: null });

    const [q] = await pool.query(
      `SELECT id, chat_id, amount, currency, file_path, status, created_at
         FROM quotations
        WHERE chat_id=? AND status='PENDING'
        ORDER BY id DESC LIMIT 1`,
      [chat.id]
    );
    return ok(res, { chat_id: chat.id, quote: q[0] || null });
  } catch (e) {
    console.error('quotes latest Error:', e?.message || e);
    return ok(res, { chat_id: null, quote: null });
  }
});

/* list all PENDING by mobile (for farmer panel) */
router.get('/list-by-mobile/:mobile', async (req, res) => {
  try {
    const mobile = norm(req.params.mobile);
    if (mobile.length !== 10) {
      return fail(res, 400, 'valid 10-digit mobile required');
    }
    if (!canViewMobile(req, mobile)) {
      return fail(res, 401, 'unauthorized');
    }

    const [[user]] = await pool.query(
      'SELECT id FROM users WHERE mobile=? LIMIT 1',
      [mobile]
    );
    if (!user) return res.json([]);

    const [[chat]] = await pool.query(
      'SELECT id FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    if (!chat) return res.json([]);

    const [rows] = await pool.query(
      `SELECT id, chat_id, amount, currency, file_path, message_id, status, created_at
         FROM quotations
        WHERE chat_id=? AND status='PENDING'
        ORDER BY id ASC`,
      [chat.id]
    );
    return res.json(rows);
  } catch (e) {
    console.error('quotes list Error:', e?.message || e);
    return res.json([]);
  }
});

/* UPLOAD quotation (creates admin message + attachment + queue row) */
router.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      const { chat_id } = req.body || {};
      const amountNum = Number(req.body?.amount || 0);
      if (!chat_id || !req.file) {
        return fail(res, 400, 'chat_id and file required');
      }

      const file_path = `/uploads/quotes/${req.file.filename}`;
      const mime_type = req.file.mimetype || 'application/octet-stream';
      const original_name =
        (req.body?.original_name &&
          String(req.body.original_name).trim()) ||
        (req.file?.originalname &&
          String(req.file.originalname).trim()) ||
        null;
      const kind = mime_type.startsWith('image/')
        ? 'image'
        : mime_type === 'application/pdf'
        ? 'pdf'
        : 'other';

      await conn.beginTransaction();

      // 1) create message with meta (so delete-for-everyone cascades to queue via FK)
      const metaObj = { amount: amountNum };
      if (original_name) metaObj.original_name = original_name;

      const [insMsg] = await conn.query(
        'INSERT INTO messages (chat_id, sender_role, text, meta) VALUES (?,?,?,?)',
        [chat_id, 'admin', null, JSON.stringify(metaObj)]
      );
      const message_id = insMsg.insertId;

      // 2) attachment
      try {
        await conn.query(
          'INSERT INTO attachments (message_id, file_path, mime_type, kind, original_name) VALUES (?,?,?,?,?)',
          [message_id, file_path, mime_type, kind, original_name]
        );
      } catch {
        await conn.query(
          'INSERT INTO attachments (message_id, file_path, mime_type, kind) VALUES (?,?,?,?)',
          [message_id, file_path, mime_type, kind]
        );
      }

      // 3) quotation queue row
      await conn.query(
        'INSERT INTO quotations (chat_id, message_id, file_path, amount, currency, status) VALUES (?,?,?,?, "INR", "PENDING")',
        [chat_id, message_id, file_path, amountNum]
      );

      await conn.query("UPDATE chats SET status='READ' WHERE id=?", [
        chat_id,
      ]);
      await conn.commit();

      // best-effort WA push
      try {
        const [[row]] = await pool.query(
          `SELECT u.mobile
             FROM chats c
             JOIN users u ON u.id = c.user_id
            WHERE c.id=? LIMIT 1`,
          [chat_id]
        );
        const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(
          /\/+$/,
          ''
        );
        const publicLink = publicBase ? `${publicBase}${file_path}` : '';
        if (publicLink) {
          await sendWA({
            to: row.mobile,
            template: 'quotation_ready',
            params: [publicLink],
          });
        }
      } catch (e) {
        console.warn('[WA quotation] skipped/fail:', e?.message || e);
      }

      // 🔔 push to clients; include sender_role for header badge logic
      ioRef?.emit('chat:new_message', {
        chat_id: Number(chat_id),
        sender_role: 'admin',
      });
      ioRef?.emit('quotes:changed', { chat_id: Number(chat_id) });

      return ok(res, { message_id, file_path });
    } catch (e) {
      try {
        await conn.rollback();
      } catch {}
      console.error('quotes upload Error:', e?.message || e);
      return fail(res, 500, 'failed to upload quotation');
    } finally {
      conn.release();
    }
  }
);

/* Mark PAID (webhook) -> queue hides instantly */
router.post('/mark-paid/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return fail(res, 400, 'id required');

    const secret = req.get('X-Internal-Secret') || '';
    if (
      !process.env.INTERNAL_WEBHOOK_SECRET ||
      secret !== process.env.INTERNAL_WEBHOOK_SECRET
    ) {
      return fail(res, 401, 'unauthorized');
    }

    const [r] = await pool.query(
      `UPDATE quotations
          SET status='PAID', paid_at=NOW()
        WHERE id=? AND status='PENDING'`,
      [id]
    );

    if (r.affectedRows > 0) {
      const [[row]] = await pool.query(
        'SELECT chat_id FROM quotations WHERE id=?',
        [id]
      );
      ioRef?.emit('quotes:changed', { chat_id: Number(row?.chat_id || 0) });
    }

    return ok(res, { updated: r.affectedRows > 0 });
  } catch (e) {
    console.error('quotes mark-paid Error:', e?.message || e);
    return fail(res, 500, 'failed to mark paid');
  }
});

/* Farmer can hide a queue row manually (does NOT touch chat) */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return fail(res, 400, 'id required');

    const [[q]] = await pool.query(
      'SELECT chat_id FROM quotations WHERE id=? LIMIT 1',
      [id]
    );
    await pool.query('DELETE FROM quotations WHERE id=?', [id]);

    ioRef?.emit('quotes:changed', { chat_id: Number(q?.chat_id || 0) });
    return ok(res);
  } catch (e) {
    console.error('quotes delete Error:', e?.message || e);
    return fail(res, 500, 'failed to delete quotation');
  }
});

export default router;
