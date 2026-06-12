// src/routes/admin.js
import express from 'express';
import { loginStart, verifyOtp, ping, me, logout } from '../controllers/adminController.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { adminLoginLimiter, otpVerifyLimiter } from '../middlewares/rateLimiter.js';
import { adminLoginStartSchema, adminVerifyOtpSchema } from '../validations/schemas.js';

const router = express.Router();

router.post('/login-start', adminLoginLimiter(), validateBody(adminLoginStartSchema), loginStart);
router.post('/verify-otp', otpVerifyLimiter(), validateBody(adminVerifyOtpSchema), verifyOtp);
router.get('/ping', ping);
router.get('/me', me);
router.post('/logout', logout);

export default router;

// Re-export ensureAdminSession so existing imports in chat.js, farmers.js etc. still work.
export { ensureAdminSession };
