// src/routes/payment.js
import express from 'express';
import {
  createPayment,
  iframeToken,
  phonePeReturn,
  webhook,
  getPaymentStatus,
  debugConfig,
} from '../controllers/paymentController.js';
import { ensureAdminSession } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', createPayment);
router.get('/iframe-token', iframeToken);
router.all('/phonepe/return', phonePeReturn);
// Use express.text() so the raw body string is available for X-VERIFY signature check
router.post('/webhook', express.text({ type: '*/*' }), webhook);
router.get('/status/:paymentId', getPaymentStatus);
// Protected: admin session required to view payment config
router.get('/debug/config', ensureAdminSession, debugConfig);

export default router;
