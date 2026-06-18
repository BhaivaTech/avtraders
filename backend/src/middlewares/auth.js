// src/middlewares/auth.js
// Centralised auth middleware shared across multiple route files.

import jwt from 'jsonwebtoken';
import { findDealerByPhone } from '../models/dealerModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const ADMIN_SESSION_MS = Number(process.env.ADMIN_SESSION_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000);
const FARMER_SESSION_MS = Number(process.env.FARMER_SESSION_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000);

/* ------------------------------------------------------------------ */
/*  Admin session guard                                                  */
/* ------------------------------------------------------------------ */

export function ensureAdminSession(req, res, next) {
  if (req.session?.admin) {
    req.session.cookie.maxAge = ADMIN_SESSION_MS;
    return next();
  }
  return res.status(401).json({ ok: false, message: 'admin-only' });
}

export function requireAdminIfAdminRole(req, res, next) {
  const qRole = (req.query.role || '').toLowerCase();
  const bRole = (req.body?.role || req.body?.sender_role || '').toLowerCase();
  if (qRole === 'admin' || bRole === 'admin') {
    if (req.session && req.session.admin) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function requireAdmin(req, _res, next) {
  if (req.session?.admin) return next();
  return next({ status: 401, message: 'admin-only' });
}

/* ------------------------------------------------------------------ */
/*  Farmer/user session helper                                           */
/* ------------------------------------------------------------------ */

export function requireUserId(req) {
  const id = req.session?.farmer?.id || req.session?.user?.id;
  if (!id) {
    const err = new Error('NOT_AUTHENTICATED');
    throw err;
  }
  req.session.cookie.maxAge = FARMER_SESSION_MS;
  return id;
}

/* ------------------------------------------------------------------ */
/*  Dealer JWT guard                                                     */
/* ------------------------------------------------------------------ */

export async function authDealer(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';

  if (!t) return res.status(401).json({ message: 'Missing token' });

  try {
    const p = jwt.verify(t, JWT_SECRET);
    if (p.role !== 'dealer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (p.phone) {
      const dealer = await findDealerByPhone(p.phone);
      if (dealer?.blocked) {
        return res.status(403).json({ message: 'This dealer account is blocked. Please contact support.' });
      }
      if (dealer && p.dealer_id && Number(p.dealer_id) !== Number(dealer.id)) {
        return res.status(401).json({ message: 'Invalid token subject' });
      }
      req.dealer = dealer || null;
    }

    req.dealerAuth = p;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
