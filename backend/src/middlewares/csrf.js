// src/middlewares/csrf.js
// CSRF protection using the "Double-Submit Cookie" pattern.
//
// How it works:
//   1. On GET /api/csrf-token, the server sets an HttpOnly cookie `csrf_secret`
//      and returns a `csrf_token` in the JSON body.
//   2. The frontend includes the `csrf_token` in the X-CSRF-Token header on
//      every state-changing request (POST/PUT/PATCH/DELETE).
//   3. The middleware compares the header value against the cookie value.
//      If they match, the request is allowed.
//
// Why double-submit cookies?
//   - Stateless (no server-side session storage for tokens).
//   - Works with SPAs and mobile clients.
//   - An attacker on a different origin cannot read or set HttpOnly cookies,
//     so they cannot forge a matching header.

import crypto from 'crypto';
import logger from '../utils/logger.js';

const CSRF_SECRET_NAME = 'csrf_secret';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

// Paths that are exempt from CSRF checks (webhooks, health, etc.)
const EXEMPT_PATHS = [
  '/api/phonepe/callback',
  '/api/payment/webhook',
  '/api/health',
];

/**
 * Resolve the sameSite value for the CSRF cookie.
 * Default is 'lax' so that normal top-level navigations still send the cookie
 * and cross-origin iframe / external flows (e.g. payment callbacks, dealer
 * iframe) don't get blocked. Set CSRF_SAMESITE=strict in .env to opt into
 * the stricter (and more breakable) policy.
 */
function csrfSameSite() {
  const v = String(process.env.CSRF_SAMESITE || '').trim().toLowerCase();
  if (v === 'strict' || v === 'lax' || v === 'none') return v;
  return 'lax';
}

/**
 * Generate a CSRF token pair: { secret (cookie), token (header) }.
 * The token is an HMAC of the secret so it's verifiable without server state.
 */
function generateCsrfPair() {
  const secret = crypto.randomBytes(32).toString('hex');
  const token = crypto
    .createHmac('sha256', secret)
    .update('csrf-double-submit')
    .digest('hex');
  return { secret, token };
}

/**
 * Verify that the token in the header matches the secret in the cookie.
 */
function verifyCsrfToken(cookieSecret, headerToken) {
  if (!cookieSecret || !headerToken) return false;
  const expected = crypto
    .createHmac('sha256', cookieSecret)
    .update('csrf-double-submit')
    .digest('hex');
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== headerToken.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(headerToken, 'utf8')
  );
}

/**
 * Middleware: set the CSRF cookie (if missing) on every request.
 * This ensures the cookie is always available for the frontend to pair with.
 */
export function csrfCookieSetter(req, res, next) {
  const isProd = (process.env.NODE_ENV || '').trim() === 'production';
  if (!req.cookies?.[CSRF_SECRET_NAME]) {
    const { secret } = generateCsrfPair();
    if (!req.cookies) req.cookies = {};
    req.cookies[CSRF_SECRET_NAME] = secret;
    res.cookie(CSRF_SECRET_NAME, secret, {
      httpOnly: true,
      secure: isProd,
      sameSite: csrfSameSite(),
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });
  }
  next();
}

/**
 * Route handler: GET /api/csrf-token
 * Returns the CSRF token the frontend should send in X-CSRF-Token header.
 */
export function csrfTokenEndpoint(req, res) {
  const secret = req.cookies?.[CSRF_SECRET_NAME];
  const token = crypto
    .createHmac('sha256', secret)
    .update('csrf-double-submit')
    .digest('hex');
  return res.json({ ok: true, csrf_token: token });
}

/**
 * Middleware: enforce CSRF on state-changing requests.
 * Skips safe methods (GET, HEAD, OPTIONS) and exempt paths.
 */
export function csrfProtect(req, res, next) {
  // Skip safe methods
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // Skip exempt paths (webhooks, health)
  const path = req.path || req.url;
  if (EXEMPT_PATHS.some((p) => path.startsWith(p))) {
    return next();
  }

  // Skip if CSRF is globally disabled (e.g., in tests)
  if (process.env.CSRF_DISABLED === '1') {
    return next();
  }

  const cookieSecret = req.cookies?.[CSRF_SECRET_NAME];
  const headerToken = req.headers[CSRF_TOKEN_HEADER];

  if (!cookieSecret || !headerToken) {
    logger.warn({ path, method }, 'CSRF token missing');
    return res.status(403).json({
      ok: false,
      error: 'csrf_token_missing',
      message: 'CSRF token is missing. Include X-CSRF-Token header.',
    });
  }

  if (!verifyCsrfToken(cookieSecret, headerToken)) {
    logger.warn({ path, method, ip: req.ip }, 'CSRF token mismatch');
    return res.status(403).json({
      ok: false,
      error: 'csrf_token_invalid',
      message: 'CSRF token is invalid.',
    });
  }

  return next();
}
