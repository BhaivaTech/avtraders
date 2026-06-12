// src/middlewares/rateLimiter.js
// Factory functions for common rate limiter configurations.
// Eliminates the duplicated rateLimit() blocks across auth.js, admin.js, dealer.js, etc.

import rateLimit from 'express-rate-limit';

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
 */
export function apiLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
