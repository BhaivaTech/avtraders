// src/controllers/chatController.js
// Business logic for chat endpoints. ioRef is set via attachChatSocket().

import path from 'path';
import fsp from 'fs/promises';
import { sendWA } from '../services/msg91.js';
import { pool } from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import {
  ensureChat,
  insertMessage,
  getChatThread,
  getMessageById,
  softDeleteMessage,
  softDeleteAllMessages,
  hardDeleteMessage,
  hardDeleteAttachmentsByMessage,
  updateChatStatus,
  getAllChatsForAdmin,
  insertAttachment,
  getChatMobileById,
} from '../models/chatModel.js';
import { findUserByMobile } from '../models/userModel.js';

let ioRef = null;
export function attachChatSocket(io) { ioRef = io; }

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */
const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const stripLeadingSlash = (p) => String(p || '').replace(/^[\/\\]+/, '');

/** Whitelist of allowed sender roles */
const ALLOWED_SENDER_ROLES = new Set(['farmer', 'admin', 'dealer', 'system']);

// Resolves a URL path to an absolute disk path, refusing to escape uploads/
const UPLOAD_BASE = path.resolve(process.cwd(), 'uploads');
function safeUploadPath(urlPath) {
  const resolved = path.resolve(UPLOAD_BASE, stripLeadingSlash(urlPath).replace(/^uploads[\/\\]/, ''));
  if (!resolved.startsWith(UPLOAD_BASE + path.sep) && resolved !== UPLOAD_BASE) {
    throw Object.assign(new Error('Path traversal attempt blocked'), { status: 400 });
  }
  return resolved;
}

/** Returns the authenticated farmer user id from session, or null. */
function sessionUserId(req) {
  return req.session?.farmer?.id || req.session?.user?.id || null;
}

/** Throws if a non-admin tries to act on a chat they don't own. */
async function assertOwnsChat(req, chatId) {
  if (req.session?.admin) return;
  const userId = sessionUserId(req);
  if (!userId) {
    const err = new Error('NOT_AUTHENTICATED');
    err.status = 401;
    throw err;
  }
  const [[chat]] = await pool.query('SELECT user_id FROM chats WHERE id = ? LIMIT 1', [chatId]);
  if (!chat || Number(chat.user_id) !== Number(userId)) {
    const err = new Error('NOT_AUTHORIZED');
    err.status = 403;
    throw err;
  }
}

/** Throws if a non-admin tries to act on a message whose chat they don't own. */
async function assertOwnsMessageChat(req, messageId) {
  if (req.session?.admin) return;
  const userId = sessionUserId(req);
  if (!userId) {
    const err = new Error('NOT_AUTHENTICATED');
    err.status = 401;
    throw err;
  }
  const [[row]] = await pool.query(
    `SELECT c.user_id FROM messages m JOIN chats c ON c.id = m.chat_id WHERE m.id = ? LIMIT 1`,
    [messageId]
  );
  if (!row || Number(row.user_id) !== Number(userId)) {
    const err = new Error('NOT_AUTHORIZED');
    err.status = 403;
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat/message                                               */
/* ------------------------------------------------------------------ */
export async function postMessage(req, res) {
  try {
    const mobile = norm(req.body?.mobile);
    const rawRole = (req.body?.sender_role || 'farmer').toLowerCase();
    if (!ALLOWED_SENDER_ROLES.has(rawRole)) {
      return res.status(400).json({ message: 'Invalid sender_role' });
    }
    const sender_role = rawRole;
    const text = (req.body?.text ?? '').trim() || null;
    const reply_to = Number(req.body?.reply_to) || null;
    const sDate = (req.body?.last_spray_date ?? '').trim() || null;
    const sChem = (req.body?.last_chemical ?? '').trim() || null;
    const sDose = (req.body?.last_dosage ?? '').trim() || null;
    const original_name =
      (req.body?.original_name && String(req.body.original_name).trim()) ||
      (req.file?.originalname && String(req.file.originalname).trim()) ||
      null;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: 'valid 10-digit mobile required' });
    }
    if (sender_role === 'admin' && !req.session?.admin) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    if (!req.session?.admin && sender_role !== 'admin') {
      const sessionMobile = norm(req.session?.farmer?.mobile || req.session?.user?.mobile);
      if (mobile !== sessionMobile) {
        return res.status(403).json({ message: 'You can only send messages from your own number' });
      }
    }
    if (sender_role === 'farmer') {
      const user = await findUserByMobile(mobile);
      if (user?.blocked) return res.status(403).json({ message: 'You are blocked from messaging.' });
    }

    const chat = await ensureChat(mobile);

    const metaObj = {};
    if (sDate || sChem || sDose) metaObj.spray = { date: sDate, chemical: sChem, dosage: sDose };
    if (reply_to) metaObj.reply_to = reply_to;
    if (original_name) metaObj.original_name = original_name;

    const messageId = await insertMessage(
      chat.id, sender_role, text,
      Object.keys(metaObj).length ? metaObj : null
    );

    let file_path = null, mime_type = null, duration_seconds = null, kind = null;
    if (req.file) {
      file_path = `/uploads/images/${req.file.filename}`;
      mime_type = req.file.mimetype || null;
      if (mime_type?.startsWith('image/')) kind = 'image';
      else if (mime_type?.startsWith('video/')) kind = 'video';
      else if (mime_type === 'application/pdf') kind = 'pdf';
      else if (mime_type?.startsWith('audio/') || mime_type?.includes('webm') || mime_type?.includes('ogg')) kind = 'audio';
      else kind = 'other';
      const dur = Number(req.body?.audio_duration);
      if (!Number.isNaN(dur) && dur > 0) duration_seconds = Math.round(dur);
      await insertAttachment(messageId, file_path, mime_type, duration_seconds, kind, original_name);
    }

    const newStatus = sender_role === 'farmer' ? 'UNREAD' : 'READ';
    await updateChatStatus(chat.id, newStatus);
    
    if (sender_role === 'farmer') {
      const [msgCountRow] = await pool.query('SELECT COUNT(*) as cnt FROM messages WHERE chat_id = ?', [chat.id]);
      if (msgCountRow[0].cnt === 1) {
        // First message of the thread -> Send email to Admin
        const adminEmail = String(process.env.ADMIN_EMAIL || '').trim();
        if (adminEmail) {
          sendEmail({
            to: adminEmail,
            subject: 'New Consultation Started!',
            text: `A new farmer (Mobile: ${mobile}) has started a consultation thread.\n\nLogin to the admin dashboard to reply.`
          }).catch(err => console.error('[Email] Failed to send new consultation alert:', err.message));
        }
      }
    }

    ioRef?.emit('chat:new_message', { chat_id: chat.id });
    res.json({ ok: true, message: { id: messageId, chat_id: chat.id, file_path, mime_type, duration_seconds, kind } });
  } catch (e) {
    console.error('chat/message error:', e);
    res.status(500).json({ message: 'Failed to post message' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/chat/thread/:chatId                                         */
/* ------------------------------------------------------------------ */
export async function getThread(req, res) {
  try {
    const chatId = Number(req.params.chatId);
    const role = (req.query.role || 'farmer').toLowerCase();
    if (!ALLOWED_SENDER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await assertOwnsChat(req, chatId);
    const rows = await getChatThread(chatId, role);
    res.json(rows);
  } catch (e) {
    if (e.status === 403) return res.status(403).json({ message: e.message });
    if (e.status === 401) return res.status(401).json({ message: e.message });
    console.error('chat/thread error:', e);
    res.status(500).json({ message: 'Failed to fetch thread' });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/chat/message/:id                                         */
/* ------------------------------------------------------------------ */
export async function deleteMessage(req, res) {
  try {
    const id = Number(req.params.id);
    const role = (req.body?.role || req.query?.role || 'farmer').toLowerCase();
    if (!ALLOWED_SENDER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const mode = (req.body?.mode || req.query?.mode || 'me').toLowerCase();
    if (mode !== 'me' && mode !== 'everyone') {
      return res.status(400).json({ message: 'Invalid delete mode' });
    }

    const msg = await getMessageById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    await assertOwnsMessageChat(req, id);

    if (mode === 'me') {
      await softDeleteMessage(id, role);
      ioRef?.emit('chat:delete', { chat_id: msg.chat_id, id, mode: 'me', role });
      return res.json({ ok: true });
    }

    if (mode === 'everyone') {
      const allowed = role === 'admin' || msg.sender_role === role;
      if (!allowed) return res.status(403).json({ message: 'Not allowed' });

      const attachments = await hardDeleteAttachmentsByMessage(id);
      for (const a of attachments) {
        if (a.file_path) {
          try { await fsp.unlink(safeUploadPath(a.file_path)); } catch {}
        }
      }
      await hardDeleteMessage(id);
      ioRef?.emit('chat:delete', { chat_id: msg.chat_id, id, mode: 'everyone' });
      return res.json({ ok: true });
    }

    res.status(400).json({ message: 'Invalid delete mode' });
  } catch (e) {
    if (e.status === 403) return res.status(403).json({ message: e.message });
    if (e.status === 401) return res.status(401).json({ message: e.message });
    console.error('delete message error:', e);
    res.status(500).json({ message: 'Failed to delete message' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat/clear  &  POST /api/chat/delete                      */
/* ------------------------------------------------------------------ */
export async function clearChat(req, res) {
  try {
    const { chat_id, role = 'admin', scope = 'me' } = req.body || {};
    if (!chat_id) return res.status(400).json({ message: 'chat_id required' });
    if (!ALLOWED_SENDER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (scope !== 'me') return res.status(400).json({ message: 'Only scope=me is supported' });
    await assertOwnsChat(req, chat_id);

    await softDeleteAllMessages(chat_id, role);
    ioRef?.emit('chat:cleared', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    if (e.status === 403) return res.status(403).json({ message: e.message });
    if (e.status === 401) return res.status(401).json({ message: e.message });
    console.error('chat/clear error:', e);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
}

export async function deleteChat(req, res) {
  try {
    const { chat_id, role = 'admin' } = req.body || {};
    if (!chat_id) return res.status(400).json({ message: 'chat_id required' });
    if (!ALLOWED_SENDER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await assertOwnsChat(req, chat_id);

    await softDeleteAllMessages(chat_id, role);
    ioRef?.emit('chat:deleted', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    if (e.status === 403) return res.status(403).json({ message: e.message });
    if (e.status === 401) return res.status(401).json({ message: e.message });
    console.error('chat/delete error:', e);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/chat/all  (ADMIN ONLY)                                      */
/* ------------------------------------------------------------------ */
export async function getAllChats(req, res) {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const rows = await getAllChatsForAdmin({
      search: search?.trim() || undefined,
      status: status || undefined,
      page: Number(page),
      limit: Math.min(Number(limit), 500),
    });
    res.json(rows);
  } catch (e) {
    console.error('chat/all error:', e);
    res.status(500).json({ message: 'Failed to list chats' });
  }
}


/* ------------------------------------------------------------------ */
/*  POST /api/chat/status  (ADMIN ONLY)                                  */
/* ------------------------------------------------------------------ */
export async function setChatStatus(req, res) {
  try {
    const { chat_id, status } = req.body || {};
    if (!chat_id || !status) return res.status(400).json({ message: 'chat_id and status required' });
    const ALLOWED_STATUSES = new Set(['UNREAD', 'READ', 'SENT']);
    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    await updateChatStatus(chat_id, status);
    ioRef?.emit('chat:status', { chat_id, status });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/status error:', e);
    res.status(500).json({ message: 'Failed to update status' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat/lr  (ADMIN ONLY)                                      */
/* ------------------------------------------------------------------ */
export async function sendLR(req, res) {
  try {
    const { chat_id, lr_number, tracking_link } = req.body || {};
    if (!chat_id || !lr_number) return res.status(400).json({ message: 'chat_id and lr_number required' });

    const text = `LR: ${lr_number}\nTrack: ${tracking_link || ''}`;
    const messageId = await insertMessage(chat_id, 'admin', text, null);
    await updateChatStatus(chat_id, 'SENT');

    try {
      const mobile = await getChatMobileById(chat_id);
      await sendWA({ to: mobile, template: 'lr_update', params: [lr_number, tracking_link || ''] });
    } catch (e) {
      console.warn('[WA lr] skipped/fail', e.message);
    }

    ioRef?.emit('chat:new_message', { chat_id });
    ioRef?.emit('chat:status', { chat_id, status: 'SENT' });
    res.json({ ok: true, message_id: messageId });
  } catch (e) {
    console.error('chat/lr error:', e);
    res.status(500).json({ message: 'Failed to send LR' });
  }
}
