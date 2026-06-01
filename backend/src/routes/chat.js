// src/routes/chat.js
import express from 'express';
import { chatUpload } from '../middlewares/upload.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import {
  attachChatSocket,
  postMessage,
  getThread,
  deleteMessage,
  clearChat,
  deleteChat,
  getAllChats,
  setChatStatus,
  sendLR,
} from '../controllers/chatController.js';

const router = express.Router();

// Socket attachment export — consumed by server.js
export { attachChatSocket };

router.post('/message', chatUpload.single('file'), postMessage);
router.get('/thread/:chatId', getThread);
router.delete('/message/:id', deleteMessage);
router.post('/clear', clearChat);
router.post('/delete', deleteChat);
router.get('/all', ensureAdminSession, getAllChats);
router.post('/status', ensureAdminSession, setChatStatus);
router.post('/lr', ensureAdminSession, sendLR);

export default router;
