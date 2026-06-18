// src/routes/dealer.js
import express from 'express';
import { dealerDocUpload } from '../middlewares/upload.js';
import { authDealer } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  otpVerifyLimiter,
  dealerOtpSendByMobileLimiter,
  dealerOtpVerifyByMobileLimiter,
} from '../middlewares/rateLimiter.js';
import { dealerSendOtpSchema, dealerVerifyOtpSchema } from '../validations/schemas.js';

import { sendOtp, verifyOtp, simpleLogin, me, logout, sendOtpLimiter } from '../controllers/dealer/index.js';
import { register } from '../controllers/dealer/register.js';
import { getPricelist, downloadPricelist } from '../controllers/dealer/pricelist.js';
import { placeOrder, getMyOrders } from '../controllers/dealer/orders.js';

const router = express.Router();

router.post('/simple-login', validateBody(dealerSendOtpSchema), simpleLogin);
router.post(
  '/send-otp',
  sendOtpLimiter,
  dealerOtpSendByMobileLimiter(),
  validateBody(dealerSendOtpSchema),
  sendOtp
);
router.post(
  '/resend-otp',
  sendOtpLimiter,
  dealerOtpSendByMobileLimiter(),
  validateBody(dealerSendOtpSchema),
  sendOtp
);
router.post(
  '/verify-otp',
  otpVerifyLimiter(),
  dealerOtpVerifyByMobileLimiter(),
  validateBody(dealerVerifyOtpSchema),
  verifyOtp
);
router.get('/me', authDealer, me);
router.post('/logout', authDealer, logout);
router.post(
  '/register',
  authDealer,
  dealerDocUpload.fields([
    { name: 'gst_certificate', maxCount: 1 },
    { name: 'insecticide_licence', maxCount: 1 },
  ]),
  register
);
router.get('/pricelist', authDealer, getPricelist);
router.get('/pricelist/download', downloadPricelist);

// Dealer orders
router.get('/orders',  authDealer, getMyOrders);
router.post('/orders', authDealer, placeOrder);

export default router;
