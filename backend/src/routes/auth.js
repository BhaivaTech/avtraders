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
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  saveFarmerProfileSchema,
} from '../validations/schemas.js';

const router = express.Router();

router.get('/exists/:mobile', checkExists);
router.post(
  '/send-otp',
  validateBody(sendOtpSchema),
  sendOtp
);
router.post(
  '/resend-otp',
  validateBody(sendOtpSchema),
  sendOtp
);
router.post(
  '/verify-otp',
  validateBody(verifyOtpSchema),
  verifyOtp
);
router.post('/login', validateBody(loginSchema), login);
router.get('/farmer-profile', requireFarmerSession, getFarmerProfileSelf);
router.post('/farmer-profile', requireFarmerSession, validateBody(saveFarmerProfileSchema), saveFarmerProfileSelf);
router.get('/me', me);
router.post('/logout', requireFarmerSession, logout);

export default router;
