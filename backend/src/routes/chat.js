// src/routes/chat.js
import express from 'express';
import { chatUpload } from '../middlewares/upload.js';
import { ensureAdminSession, requireFarmerOrAdminSession } from '../middlewares/auth.js';
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

router.post('/message', requireFarmerOrAdminSession, chatUpload.single('file'), validateBody(postMessageSchema), postMessage);
router.get('/thread/:chatId', requireFarmerOrAdminSession, getThread);
router.delete('/message/:id', requireFarmerOrAdminSession, deleteMessage);
router.post('/clear', requireFarmerOrAdminSession, validateBody(clearChatSchema), clearChat);
router.post('/delete', requireFarmerOrAdminSession, deleteChat);
router.get('/all', ensureAdminSession, getAllChats);
router.post('/status', ensureAdminSession, validateBody(chatStatusSchema), setChatStatus);
router.post('/lr', ensureAdminSession, validateBody(sendLRSchema), sendLR);

export default router;
