// src/routes/auth.js
import express from 'express';
import rateLimit from 'express-rate-limit';
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

const router = express.Router();

// Rate-limit OTP sends: 3 per hour per IP (same as dealer OTP)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { ok: false, message: 'Too many OTP requests. Try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/exists/:mobile', checkExists);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/farmer-profile', getFarmerProfileSelf);
router.post('/farmer-profile', saveFarmerProfileSelf);
router.get('/me', me);
router.post('/logout', logout);

export default router;
