// src/middlewares/rateLimiter.js
// Factory functions for common rate limiter configurations.
// Eliminates the duplicated rateLimit() blocks across auth.js, admin.js, dealer.js, etc.

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  Per-mobile (per-identifier) buckets                                */
/* ------------------------------------------------------------------ */

/**
 * Tiny in-memory counter store keyed by a string (e.g. a phone number).
 * Each key gets `max` attempts per `windowMs`; older attempts are evicted.
 *
 * Intended to live on top of the per-IP express-rate-limit so that a
 * single attacker rotating IPs cannot keep guessing OTPs for the same
 * phone number. The store is process-local — fine for a single Node
 * process; for multi-instance deployments, swap in Redis.
 */
function createIdentifierLimiter({
  bucket = 'default',
  windowMs,
  max,
  message = 'Too many attempts for this identifier. Please wait.',
  extractId = (req) => req.body?.mobile || req.body?.phone || req.body?.email,
}) {
  const counters = new Map(); // key -> { count, resetAt }

  // Periodic cleanup of expired entries to keep the Map bounded.
  const sweepMs = Math.max(60_000, windowMs);
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of counters) {
      if (v.resetAt <= now) counters.delete(k);
    }
  }, sweepMs);
  sweep.unref?.();

  return function identifierLimiter(req, res, next) {
    const id = extractId(req);
    if (!id) return next(); // no identifier => let the per-IP limiter handle it

    const key = `${bucket}:${id}`;
    const now = Date.now();
    const entry = counters.get(key);

    if (!entry || entry.resetAt <= now) {
      counters.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      logger.warn({ bucket, id, retryAfter }, '[rate-limit] identifier blocked');
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ ok: false, message });
    }

    entry.count += 1;
    return next();
  };
}

/**
 * Rate limiter for OTP send endpoints.
 * 3 requests per hour per IP.
 */
export function otpSendLimiter() {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { ok: false, message: 'Too many OTP requests. Try again after some time.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Rate limiter for OTP verify endpoints.
 * 5 attempts per 15 minutes per IP.
 */
export function otpVerifyLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { ok: false, message: 'Too many verification attempts. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Rate limiter for login endpoints.
 * 10 attempts per 15 minutes per IP.
 */
export function loginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { ok: false, message: 'Too many login attempts. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Stricter rate limiter for admin login.
 * 5 attempts per 15 minutes per IP.
 */
export function adminLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { ok: false, message: 'Too many login attempts. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 * Skips webhook/callback paths so external payment providers aren't rate-limited.
 */
export function apiLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => {
      const path = req.path || req.url || '';
      return path.startsWith('/api/payment/webhook') || path.startsWith('/api/phonepe/callback');
    },
    message: { ok: false, message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Strict rate limiter for sensitive operations (password reset, etc).
 * 3 attempts per 15 minutes per IP.
 */
export function strictLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { ok: false, message: 'Too many attempts. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Rate limiter for admin-only state-changing endpoints
 * (announcement create/update/delete, etc).
 * 20 requests per 5 minutes per IP.
 */
export function adminMutationLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: { ok: false, message: 'Too many admin actions. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/* ------------------------------------------------------------------ */
/*  Identifier-based limiters (in-memory, per-mobile / per-email)      */
/* ------------------------------------------------------------------ */

/**
 * Per-mobile counter for the farmer OTP send endpoint.
 * 5 sends per hour per phone number, on top of the IP-based limiter.
 */
export function farmerOtpSendByMobileLimiter() {
  return createIdentifierLimiter({
    bucket: 'farmer-otp-send',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many OTP requests for this number. Try again after an hour.',
    extractId: (req) => req.body?.mobile,
  });
}

/**
 * Per-mobile counter for farmer OTP verify.
 * 10 attempts per 15 minutes per phone number.
 */
export function farmerOtpVerifyByMobileLimiter() {
  return createIdentifierLimiter({
    bucket: 'farmer-otp-verify',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many verification attempts for this number. Please wait 15 minutes.',
    extractId: (req) => req.body?.mobile,
  });
}

/**
 * Per-phone counter for dealer OTP send.
 * 5 sends per hour per phone.
 */
export function dealerOtpSendByMobileLimiter() {
  return createIdentifierLimiter({
    bucket: 'dealer-otp-send',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many OTP requests for this number. Try again after an hour.',
    extractId: (req) => req.body?.phone,
  });
}

/**
 * Per-phone counter for dealer OTP verify.
 * 10 attempts per 15 minutes per phone.
 */
export function dealerOtpVerifyByMobileLimiter() {
  return createIdentifierLimiter({
    bucket: 'dealer-otp-verify',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many verification attempts for this number. Please wait 15 minutes.',
    extractId: (req) => req.body?.phone,
  });
}

/**
 * Per-email counter for admin login start.
 * 5 attempts per 15 minutes per email.
 */
export function adminLoginByEmailLimiter() {
  return createIdentifierLimiter({
    bucket: 'admin-login',
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many admin login attempts for this email. Please wait 15 minutes.',
    extractId: (req) => (req.body?.email || '').toLowerCase().trim(),
  });
}
