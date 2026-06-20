// src/routes/admin.js
import express from 'express';
import { loginStart, resendOtp, verifyOtp, ping, me, logout, blockFarmer, getAdminPayments, getAdminStats } from '../controllers/adminController.js';
import { listAuthAudit, listDealerAudit } from '../controllers/auditController.js';
import { adminGetAllOrders, adminUpdateOrderStatus } from '../controllers/dealer/orders.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  adminLoginLimiter,
  otpVerifyLimiter,
  adminLoginByEmailLimiter,
} from '../middlewares/rateLimiter.js';
import { adminLoginStartSchema, adminVerifyOtpSchema, adminResendOtpSchema } from '../validations/schemas.js';

const router = express.Router();

// Per-IP + per-email defence in depth.
router.post(
  '/login-start',
  adminLoginLimiter(),
  adminLoginByEmailLimiter(),
  validateBody(adminLoginStartSchema),
  loginStart
);
router.post(
  '/resend-otp',
  adminLoginLimiter(),
  adminLoginByEmailLimiter(),
  validateBody(adminResendOtpSchema),
  resendOtp
);
router.post('/verify-otp', otpVerifyLimiter(), validateBody(adminVerifyOtpSchema), verifyOtp);
router.get('/ping', ping);
router.get('/me', me);
router.post('/logout', logout);

// Farmer block/unblock
router.patch('/farmers/:id/block', ensureAdminSession, blockFarmer);

// Payment history
router.get('/payments', ensureAdminSession, getAdminPayments);

// Admin dashboard stats
router.get('/stats', ensureAdminSession, getAdminStats);

// Dealer orders management
router.get('/orders',              ensureAdminSession, adminGetAllOrders);
router.patch('/orders/:id/status', ensureAdminSession, adminUpdateOrderStatus);

// Audit logs
router.get('/audit/auth',   ensureAdminSession, listAuthAudit);
router.get('/audit/dealer', ensureAdminSession, listDealerAudit);

export default router;

export { ensureAdminSession };
