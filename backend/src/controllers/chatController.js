// src/controllers/chatController.js
// Business logic for chat endpoints. ioRef is set via attachChatSocket().

import path from 'path';
import fsp from 'fs/promises';
import { sendWA } from '../services/msg91.js';
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
const diskPathFromUrl = (urlPath) => path.join(process.cwd(), stripLeadingSlash(urlPath));

/* ------------------------------------------------------------------ */
/*  POST /api/chat/message                                               */
/* ------------------------------------------------------------------ */
export async function postMessage(req, res) {
  try {
    const mobile = norm(req.body?.mobile);
    const sender_role = (req.body?.sender_role || 'farmer').toLowerCase();
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
    const rows = await getChatThread(chatId, role);
    res.json(rows);
  } catch (e) {
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
    const mode = (req.body?.mode || req.query?.mode || 'me').toLowerCase();

    const msg = await getMessageById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

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
          try { await fsp.unlink(diskPathFromUrl(a.file_path)); } catch {}
        }
      }
      await hardDeleteMessage(id);
      ioRef?.emit('chat:delete', { chat_id: msg.chat_id, id, mode: 'everyone' });
      return res.json({ ok: true });
    }

    res.status(400).json({ message: 'Invalid delete mode' });
  } catch (e) {
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
    if (scope !== 'me') return res.status(400).json({ message: 'Only scope=me is supported' });

    await softDeleteAllMessages(chat_id, role);
    ioRef?.emit('chat:cleared', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/clear error:', e);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
}

export async function deleteChat(req, res) {
  try {
    const { chat_id, role = 'admin' } = req.body || {};
    if (!chat_id) return res.status(400).json({ message: 'chat_id required' });

    await softDeleteAllMessages(chat_id, role);
    ioRef?.emit('chat:deleted', { chat_id, role });
    res.json({ ok: true });
  } catch (e) {
    console.error('chat/delete error:', e);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/chat/all  (ADMIN ONLY)                                      */
/* ------------------------------------------------------------------ */
export async function getAllChats(_req, res) {
  try {
    const rows = await getAllChatsForAdmin();
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
