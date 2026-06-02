// src/middlewares/auth.js
// Centralised auth middleware shared across multiple route files.

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Admin session guard                                                  */
/* ------------------------------------------------------------------ */

/**
 * Require a valid admin session (cookie-based).
 * Refreshes cookie maxAge on every use.
 */
export function ensureAdminSession(req, res, next) {
  if (req.session?.admin) {
    req.session.cookie.maxAge = TEN_DAYS_MS;
    return next();
  }
  return res.status(401).json({ ok: false, message: 'admin-only' });
}

/**
 * Guard for routes that should only be accessible if the
 * request carries an admin role query/body param AND the caller
 * has an active admin session.
 */
export function requireAdminIfAdminRole(req, res, next) {
  const qRole = (req.query.role || '').toLowerCase();
  const bRole = (req.body?.role || req.body?.sender_role || '').toLowerCase();
  if (qRole === 'admin' || bRole === 'admin') {
    if (req.session && req.session.admin) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

/* ------------------------------------------------------------------ */
/*  Simple admin check (non-middleware helper used in controllers)       */
/* ------------------------------------------------------------------ */

/**
 * Middleware — requires admin session.
 * Same as ensureAdminSession but under a shorter alias used in chat/quotes.
 */
export function requireAdmin(req, _res, next) {
  if (req.session?.admin) return next();
  return next({ status: 401, message: 'admin-only' });
}

/* ------------------------------------------------------------------ */
/*  Farmer/user session helper                                           */
/* ------------------------------------------------------------------ */

/**
 * Throws if caller is not authenticated (farmer / dealer / admin).
 * Returns the user id on success.
 */
export function requireUserId(req) {
  const id = req.session?.farmer?.id || req.session?.user?.id;
  if (!id) {
    const err = new Error('NOT_AUTHENTICATED');
    throw err;
  }
  return id;
}

/* ------------------------------------------------------------------ */
/*  Dealer JWT guard                                                     */
/* ------------------------------------------------------------------ */

/**
 * Middleware — verifies Bearer JWT and populates req.dealerAuth.
 */
export function authDealer(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';

  if (!t) return res.status(401).json({ message: 'Missing token' });

  try {
    const p = jwt.verify(t, JWT_SECRET);
    if (p.role !== 'dealer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.dealerAuth = p;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
