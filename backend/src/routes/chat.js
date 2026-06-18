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
import { validateBody } from '../middlewares/validate.js';
import { postMessageSchema, clearChatSchema, chatStatusSchema, sendLRSchema } from '../validations/schemas.js';

const router = express.Router();

// Socket attachment export — consumed by server.js
export { attachChatSocket };

router.post('/message', chatUpload.single('file'), validateBody(postMessageSchema), postMessage);
router.get('/thread/:chatId', getThread);
router.delete('/message/:id', deleteMessage);
router.post('/clear', validateBody(clearChatSchema), clearChat);
router.post('/delete', deleteChat);
router.get('/all', ensureAdminSession, getAllChats);
router.post('/status', ensureAdminSession, validateBody(chatStatusSchema), setChatStatus);
router.post('/lr', ensureAdminSession, validateBody(sendLRSchema), sendLR);

export default router;
