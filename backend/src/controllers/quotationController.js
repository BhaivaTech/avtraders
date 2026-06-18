// src/controllers/quotationController.js
// Business logic for quotation endpoints.

import crypto from 'crypto';
import { pool } from '../config/db.js';
import { sendWA } from '../services/msg91.js';
import {
  getLatestPendingQuoteByMobile,
  listPendingQuotesByMobile,
  insertQuotation,
  markQuotationPaid,
  getQuotationChatId,
  deleteQuotation,
} from '../models/quotationModel.js';
import { insertAttachment } from '../models/chatModel.js';

let ioRef = null;
export function attachQuotesSocket(io) { ioRef = io; }

const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const fail = (res, code, message) => res.status(code).json({ ok: false, error: message });

function getSessionMobile(req) {
  const c = [
    req.session?.farmer?.mobile,
    req.session?.user?.mobile,
    req.session?.auth?.mobile,
    req.session?.otp?.mobile,
    req.session?.login?.mobile,
    req.session?.mobile,
  ].map(norm).filter(Boolean);
  return c[0] || '';
}

function canViewMobile(req, mobile) {
  return !!req.session?.admin || getSessionMobile(req) === norm(mobile);
}

/* ------------------------------------------------------------------ */
/*  GET /api/quotes/latest-by-mobile/:mobile                             */
/* ------------------------------------------------------------------ */
export async function getLatestByMobile(req, res) {
  try {
    const mobile = norm(req.params.mobile);
    if (mobile.length !== 10) return fail(res, 400, 'valid 10-digit mobile required');
    if (!canViewMobile(req, mobile)) return fail(res, 401, 'unauthorized');

    const result = await getLatestPendingQuoteByMobile(mobile);
    return ok(res, result);
  } catch (e) {
    console.error('quotes latest Error:', e?.message || e);
    return ok(res, { chat_id: null, quote: null });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/quotes/list-by-mobile/:mobile                               */
/* ------------------------------------------------------------------ */
export async function listByMobile(req, res) {
  try {
    const mobile = norm(req.params.mobile);
    if (mobile.length !== 10) return fail(res, 400, 'valid 10-digit mobile required');
    if (!canViewMobile(req, mobile)) return fail(res, 401, 'unauthorized');

    const rows = await listPendingQuotesByMobile(mobile);
    return res.json(rows);
  } catch (e) {
    console.error('quotes list Error:', e?.message || e);
    return res.json([]);
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/quotes/upload  (ADMIN)                                     */
/* ------------------------------------------------------------------ */
export async function uploadQuotation(req, res) {
  const conn = await pool.getConnection();
  try {
    const { chat_id } = req.body || {};
    const amountNum = Number(req.body?.amount || 0);
    if (!chat_id || !req.file) return fail(res, 400, 'chat_id and file required');

    const file_path = `/uploads/quotes/${req.file.filename}`;
    const mime_type = req.file.mimetype || 'application/octet-stream';
    const original_name =
      (req.body?.original_name && String(req.body.original_name).trim()) ||
      (req.file?.originalname && String(req.file.originalname).trim()) ||
      null;
    const kind = mime_type.startsWith('image/') ? 'image' : mime_type === 'application/pdf' ? 'pdf' : 'other';

    await conn.beginTransaction();

    const metaObj = { amount: amountNum };
    if (original_name) metaObj.original_name = original_name;

    const [insMsg] = await conn.query(
      'INSERT INTO messages (chat_id, sender_role, text, meta) VALUES (?,?,?,?)',
      [chat_id, 'admin', null, JSON.stringify(metaObj)]
    );
    const message_id = insMsg.insertId;

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

    await insertQuotation(conn, chat_id, message_id, file_path, amountNum);
    await conn.query("UPDATE chats SET status='READ' WHERE id=?", [chat_id]);
    await conn.commit();

    // Best-effort WA push
    try {
      const [[row]] = await pool.query(
        `SELECT u.mobile FROM chats c JOIN users u ON u.id = c.user_id WHERE c.id=? LIMIT 1`,
        [chat_id]
      );
      const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      const publicLink = publicBase ? `${publicBase}${file_path}` : '';
      if (publicLink) {
        await sendWA({ to: row.mobile, template: 'quotation_ready', params: [publicLink] });
      }
    } catch (e) {
      console.warn('[WA quotation] skipped/fail:', e?.message || e);
    }

    ioRef?.emit('chat:new_message', { chat_id: Number(chat_id), sender_role: 'admin' });
    ioRef?.emit('quotes:changed', { chat_id: Number(chat_id) });

    return ok(res, { message_id, file_path });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('quotes upload Error:', e?.message || e);
    return fail(res, 500, 'failed to upload quotation');
  } finally {
    conn.release();
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/quotes/mark-paid/:id  (webhook)                           */
/* ------------------------------------------------------------------ */
export async function markPaid(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return fail(res, 400, 'id required');

    const secret = req.get('X-Internal-Secret') || '';
    const expected = process.env.INTERNAL_WEBHOOK_SECRET || '';
    if (!expected) return fail(res, 401, 'unauthorized');
    // Constant-time comparison to prevent timing attacks
    const a = Buffer.from(secret);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return fail(res, 401, 'unauthorized');
    }

    const updated = await markQuotationPaid(id);
    if (updated) {
      const chat_id = await getQuotationChatId(id);
      ioRef?.emit('quotes:changed', { chat_id: Number(chat_id || 0) });
    }

    return ok(res, { updated });
  } catch (e) {
    console.error('quotes mark-paid Error:', e?.message || e);
    return fail(res, 500, 'failed to mark paid');
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/quotes/:id                                               */
/* ------------------------------------------------------------------ */
export async function removeQuotation(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return fail(res, 400, 'id required');

    const chat_id = await getQuotationChatId(id);
    await deleteQuotation(id);
    ioRef?.emit('quotes:changed', { chat_id: Number(chat_id || 0) });
    return ok(res);
  } catch (e) {
    console.error('quotes delete Error:', e?.message || e);
    return fail(res, 500, 'failed to delete quotation');
  }
}
