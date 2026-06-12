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
import { validateBody } from '../middlewares/validate.js';
import { otpSendLimiter, otpVerifyLimiter, loginLimiter } from '../middlewares/rateLimiter.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  saveFarmerProfileSchema,
} from '../validations/schemas.js';

const router = express.Router();

router.get('/exists/:mobile', checkExists);
router.post('/send-otp', otpSendLimiter(), validateBody(sendOtpSchema), sendOtp);
router.post('/verify-otp', otpVerifyLimiter(), validateBody(verifyOtpSchema), verifyOtp);
router.post('/login', loginLimiter(), validateBody(loginSchema), login);
router.get('/farmer-profile', getFarmerProfileSelf);
router.post('/farmer-profile', validateBody(saveFarmerProfileSchema), saveFarmerProfileSelf);
router.get('/me', me);
router.post('/logout', logout);

export default router;
