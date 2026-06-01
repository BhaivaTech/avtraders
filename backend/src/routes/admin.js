// src/routes/admin.js
import express from 'express';
import { loginStart, verifyOtp, ping, me, logout } from '../controllers/adminController.js';
import { ensureAdminSession } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login-start', loginStart);
router.post('/verify-otp', verifyOtp);
router.get('/ping', ping);
router.get('/me', me);
router.post('/logout', logout);

export default router;

// Re-export ensureAdminSession so existing imports in chat.js, farmers.js etc. still work.
export { ensureAdminSession };
