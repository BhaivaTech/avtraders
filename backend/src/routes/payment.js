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

const router = express.Router();

router.post('/create', createPayment);
router.get('/iframe-token', iframeToken);
router.all('/phonepe/return', phonePeReturn);
router.post('/webhook', express.json({ type: '*/*' }), webhook);
router.get('/status/:paymentId', getPaymentStatus);
router.get('/debug/config', debugConfig);

export default router;
