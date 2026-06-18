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
import { validateBody } from '../middlewares/validate.js';
import { createPaymentSchema } from '../validations/schemas.js';

const router = express.Router();

router.post('/create', validateBody(createPaymentSchema), createPayment);
router.get('/iframe-token', iframeToken);
router.all('/phonepe/return', phonePeReturn);
// Use express.raw() to capture the exact bytes PhonePe sent, then derive
// the string body inside the controller. This prevents express.text() from
// normalising whitespace / BOM and breaking the SHA-256 X-VERIFY check.
router.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), webhook);
router.get('/status/:paymentId', getPaymentStatus);
// Protected: admin session required to view payment config
router.get('/debug/config', ensureAdminSession, debugConfig);

export default router;
