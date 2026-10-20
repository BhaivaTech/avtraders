// src/routes/dealer.js
import express from 'express';
import { catalogueRouter } from './catalogue.js';
import fs from 'fs';
import { dealerDocUpload } from '../middlewares/upload.js';
import { authDealer } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  otpVerifyLimiter,
  dealerOtpSendByMobileLimiter,
  dealerOtpVerifyByMobileLimiter,
} from '../middlewares/rateLimiter.js';
import { dealerSendOtpSchema, dealerVerifyOtpSchema, dealerRegisterSchema, placeOrderSchema } from '../validations/schemas.js';

import { sendOtp, verifyOtp, simpleLogin, me, logout, sendOtpLimiter } from '../controllers/dealer/index.js';
import { register } from '../controllers/dealer/register.js';
import { placeOrder, getMyOrders } from '../controllers/dealer/orders.js';

const router = express.Router();
router.use('/catalogue', authDealer, catalogueRouter(false));

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
  (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        for (const files of Object.values(req.files || {})) {
          for (const file of files) fs.promises.unlink(file.path).catch(() => {});
        }
      }
    });
    next();
  },
  validateBody(dealerRegisterSchema),
  register
);

// Dealer orders
router.get('/orders',  authDealer, getMyOrders);
router.post('/orders', authDealer, validateBody(placeOrderSchema), placeOrder);

export default router;
