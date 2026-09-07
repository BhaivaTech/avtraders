// src/routes/admin.js
import express from 'express';
import {
  loginStart, resendOtp, verifyOtp, ping, me, logout,
  blockFarmer, getAdminPayments, getAdminStats, getAdminInsights,
  listAdminUsers, createAdminUser, updateAdminUser, deactivateAdminUser, reactivateAdminUser,
  changeMyPassword,
} from '../controllers/adminController.js';
import { listAuthAudit, listDealerAudit } from '../controllers/auditController.js';
import { adminGetAllOrders, adminUpdateOrderStatus } from '../controllers/dealer/orders.js';
import { ensureAdminSession, requirePermission } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  adminLoginLimiter,
  otpVerifyLimiter,
  adminLoginByEmailLimiter,
} from '../middlewares/rateLimiter.js';
import { adminLoginStartSchema, adminVerifyOtpSchema, adminResendOtpSchema, changeMyPasswordSchema } from '../validations/schemas.js';

const router = express.Router();

// ── Authentication (no session required) ─────────────────────────────
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

// ── Farmer management ─────────────────────────────────────────────────
router.patch('/farmers/:id/block', ensureAdminSession, requirePermission('users'), blockFarmer);

// ── Payment history ───────────────────────────────────────────────────
router.get('/payments', ensureAdminSession, requirePermission('payments'), getAdminPayments);

// ── Admin dashboard stats ─────────────────────────────────────────────
router.get('/stats', ensureAdminSession, getAdminStats);
router.get('/insights', ensureAdminSession, getAdminInsights);

// ── Self-service password change (any admin role) ─────────────────────
router.patch('/my-password', ensureAdminSession, validateBody(changeMyPasswordSchema), changeMyPassword);

// ── Dealer orders management ──────────────────────────────────────────
router.get('/orders',              ensureAdminSession, requirePermission('dealers'), adminGetAllOrders);
router.patch('/orders/:id/status', ensureAdminSession, requirePermission('dealers'), adminUpdateOrderStatus);

// ── Audit logs ────────────────────────────────────────────────────────
router.get('/audit/auth',   ensureAdminSession, requirePermission('audit'), listAuthAudit);
router.get('/audit/dealer', ensureAdminSession, requirePermission('audit'), listDealerAudit);

// ── Admin user management (superadmin only) ───────────────────────────
router.get('/admin-users',               ensureAdminSession, requirePermission('admin_users'), listAdminUsers);
router.post('/admin-users',              ensureAdminSession, requirePermission('admin_users'), createAdminUser);
router.patch('/admin-users/:id',         ensureAdminSession, requirePermission('admin_users'), updateAdminUser);
router.patch('/admin-users/:id/deactivate', ensureAdminSession, requirePermission('admin_users'), deactivateAdminUser);
router.patch('/admin-users/:id/reactivate', ensureAdminSession, requirePermission('admin_users'), reactivateAdminUser);

export default router;

export { ensureAdminSession };
