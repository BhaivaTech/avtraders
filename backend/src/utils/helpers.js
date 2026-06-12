// src/utils/helpers.js
// Shared utility functions extracted from duplicated code across controllers.
//
// Eliminates repeated patterns in:
//   - dealerController.js (normalizePhone10)
//   - quotationController.js (getSessionMobile, canViewMobile)
//   - chatController.js (norm)
//   - authController.js (session population)
//   - paymentController.js (resolveState, parseMeta, toPaise)

import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/*  Mobile / phone helpers                                               */
/* ------------------------------------------------------------------ */

/**
 * Normalize any phone input to a 10-digit Indian mobile number.
 * Handles: +91xxxxxxxxxx, 91xxxxxxxxxx, 0xxxxxxxxxx, xxxxxxxxxx
 * Throws if result is not exactly 10 digits.
 */
export function normalizePhone10(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length > 10) return d.slice(-10);
  if (d.length !== 10) throw new Error('valid 10-digit mobile required');
  return d;
}

/**
 * Safe variant: returns empty string instead of throwing.
 */
export function normalizePhone10Safe(raw) {
  try {
    return normalizePhone10(raw);
  } catch {
    return '';
  }
}

/**
 * Build E.164 MSISDN without '+' (e.g., "919876543210")
 */
export function toMsisdn91(mobile10) {
  return '91' + normalizePhone10(mobile10);
}

/* ------------------------------------------------------------------ */
/*  Session helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Extract the logged-in user's ID from an Express session.
 * Checks farmer, user, and admin session shapes.
 * Returns null if not authenticated.
 */
export function getSessionUserId(req) {
  return req.session?.farmer?.id || req.session?.user?.id || null;
}

/**
 * Extract the logged-in user's mobile from an Express session.
 * Tries multiple session shapes for backward compatibility.
 * Returns the normalised 10-digit mobile or empty string.
 */
export function getSessionMobile(req) {
  const sources = [
    req.session?.farmer?.mobile,
    req.session?.user?.mobile,
    req.session?.auth?.mobile,
    req.session?.otp?.mobile,
    req.session?.login?.mobile,
    req.session?.mobile,
  ];
  for (const raw of sources) {
    const m = normalizePhone10Safe(raw);
    if (m) return m;
  }
  return '';
}

/**
 * Check whether the current session is allowed to view data for a given mobile.
 * Admin can view anyone; regular users can only view their own.
 */
export function canViewMobile(req, mobile) {
  return !!req.session?.admin || getSessionMobile(req) === normalizePhone10Safe(mobile);
}

/**
 * Populate session fields after successful authentication.
 * Ensures all session shapes (farmer, user, mobile) are set consistently.
 */
export function populateFarmerSession(req, user) {
  const sessionData = {
    id: user.id,
    mobile: user.mobile,
    role: user.role,
    name: user.name,
    address: user.address,
  };
  req.session.farmer = sessionData;
  req.session.mobile = user.mobile;
  req.session.user = { id: user.id, mobile: user.mobile, role: user.role };
}

/* ------------------------------------------------------------------ */
/*  Payment helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Convert INR (rupees) to paise (smallest unit).
 */
export function toPaise(inr) {
  return Math.round(Number(inr) * 100);
}

/**
 * Generate a unique merchant order ID for payment providers.
 */
export function makeMerchantOrderId(paymentId) {
  return `AV${Date.now()}_${paymentId}`.slice(0, 34);
}

/**
 * Safely parse a JSON string. Returns fallback on failure.
 */
export function parseMeta(raw, fallback = {}) {
  try {
    return typeof raw === 'object' && raw !== null ? raw : JSON.parse(raw || '{}');
  } catch {
    return fallback;
  }
}

/**
 * Resolve a PhonePe state string to a canonical payment status.
 */
export function resolveState(state) {
  const s = String(state || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'success';
  if (s === 'FAILED' || s === 'DECLINED' || s === 'CANCELLED') return 'failed';
  return 'pending';
}

/* ------------------------------------------------------------------ */
/*  String helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Strip leading slashes (for safe path construction).
 */
export function stripLeadingSlash(p) {
  return String(p || '').replace(/^[\/\\]+/, '');
}

/**
 * Trim and return null for empty strings.
 */
export function trimOrNull(v) {
  const s = String(v || '').trim();
  return s || null;
}

/**
 * Trim and return undefined for empty strings (useful for optional fields).
 */
export function trimOrUndefined(v) {
  const s = String(v || '').trim();
  return s || undefined;
}

/* ------------------------------------------------------------------ */
/*  Common response helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Standard success response.
 */
export function okResponse(res, data = {}, status = 200) {
  return res.status(status).json({ ok: true, ...data });
}

/**
 * Standard error response.
 */
export function errorResponse(res, status, message, extra = {}) {
  return res.status(status).json({ ok: false, message, ...extra });
}

/* ------------------------------------------------------------------ */
/*  Crypto helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Generate a cryptographically secure random hex string.
 */
export function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a cryptographically secure random integer in [min, max).
 */
export function randomInt(min, max) {
  return crypto.randomInt(min, max);
}

/**
 * Compute SHA-256 hash of a string or buffer.
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                         */
/* ------------------------------------------------------------------ */

/**
 * Format a Date as 'YYYY-MM-DD HH:mm:ss' for MySQL DATETIME columns.
 */
export function toSqlDatetime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Check if a date string has expired.
 */
export function isExpired(dateStr) {
  return Date.now() > new Date(dateStr).getTime();
}
