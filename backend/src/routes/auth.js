// src/routes/auth.js
import express from 'express';
import {
  checkExists,
  sendOtp,
  verifyOtp,
  login,
  getFarmerProfileSelf,
  saveFarmerProfileSelf,
  me,
  logout,
} from '../controllers/authController.js';
import { requireFarmerSession } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
  farmerOtpSendByMobileLimiter,
  farmerOtpVerifyByMobileLimiter,
} from '../middlewares/rateLimiter.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  saveFarmerProfileSchema,
} from '../validations/schemas.js';

const router = express.Router();

router.get('/exists/:mobile', checkExists);
// IP-based limiter (outer) + per-mobile counter (inner) — defence in depth.
router.post(
  '/send-otp',
  otpSendLimiter(),
  farmerOtpSendByMobileLimiter(),
  validateBody(sendOtpSchema),
  sendOtp
);
router.post(
  '/resend-otp',
  otpSendLimiter(),
  farmerOtpSendByMobileLimiter(),
  validateBody(sendOtpSchema),
  sendOtp
);
router.post(
  '/verify-otp',
  otpVerifyLimiter(),
  farmerOtpVerifyByMobileLimiter(),
  validateBody(verifyOtpSchema),
  verifyOtp
);
router.post('/login', loginLimiter(), validateBody(loginSchema), login);
router.get('/farmer-profile', requireFarmerSession, getFarmerProfileSelf);
router.post('/farmer-profile', requireFarmerSession, validateBody(saveFarmerProfileSchema), saveFarmerProfileSelf);
router.get('/me', me);
router.post('/logout', requireFarmerSession, logout);

export default router;
