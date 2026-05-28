// src/routes/admin.js
import express from "express";
import crypto from "crypto";
import { sendAdminOTP, verifyAdminOTP } from "../utils/otp/otpAdmin.js";

const router = express.Router();

/** -------------------- CONFIG -------------------- */

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();

const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();

// OTP TTL (seconds) – used only for display on frontend
let ADMIN_OTP_TTL = Number(
  String(
    process.env.ADMIN_OTP_EXPIRY_SECONDS ||
      process.env.OTP_EXPIRY_SECONDS ||
      "60"
  ).trim()
);

// fallback if env is invalid / NaN
if (!Number.isFinite(ADMIN_OTP_TTL) || ADMIN_OTP_TTL <= 0) {
  ADMIN_OTP_TTL = 60;
}

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("[admin] Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
}

/** -------------------- MIDDLEWARE EXPORT -------------------- */
/**
 * Reusable guard for admin-only APIs in other route files.
 * Usage in e.g. chat.js:
 *   import router, { ensureAdminSession } from "./admin.js";
 *   router.get("/chat/all", ensureAdminSession, handler);
 */
export function ensureAdminSession(req, res, next) {
  if (req.session?.admin) {
    // refresh cookie lifetime on each use
    req.session.cookie.maxAge = TEN_DAYS_MS;
    return next();
  }
  return res.status(401).json({ ok: false, message: "admin-only" });
}

/** -------------------- ROUTES -------------------- */

/**
 * Step 1: email+password → validate, then send OTP
 * Frontend: POST /api/admin/login-start
 * Body: { email, password }
 */
router.post("/login-start", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "").trim();

  // basic credential check
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "bad-credentials" });
  }

  // at this point credentials are valid; start OTP flow
  try {
    await sendAdminOTP(ADMIN_EMAIL);

    // mark pre-auth flow started in session (used when verifying OTP)
    req.session.adminPreAuth = true;
    req.session.loginNonce = crypto.randomBytes(8).toString("hex");

    return res.json({
      ok: true,
      ttl: ADMIN_OTP_TTL,
      mode: process.env.ADMIN_OTP_PROVIDER || "smtp",
    });
  } catch (e) {
    console.error("[admin/login-start] send-otp failed:", e?.message || e);
    return res.status(500).json({ ok: false, error: "send-failed" });
  }
});

/**
 * Step 2: verify OTP and create the long-lived admin session
 * Frontend: POST /api/admin/verify-otp
 * Body: { email, code }
 */
router.post("/verify-otp", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ ok: false, error: "bad-email" });
  }

  // require that login-start was called previously in this session
  if (!req.session.adminPreAuth) {
    return res.status(401).json({ ok: false, error: "no-preauth" });
  }

  try {
    const result = await verifyAdminOTP(email, code);
    if (!result.ok) {
      return res
        .status(401)
        .json({ ok: false, error: result.message || "bad-code" });
    }

    // regenerate session to avoid fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("[admin] session.regenerate failed:", err);
        return res.status(500).json({ ok: false, error: "session-failed" });
      }

      // mark admin as logged in
      req.session.admin = true;
      req.session.adminEmail = ADMIN_EMAIL;

      // make sure cookie lives 10 days from *now*
      req.session.cookie.maxAge = TEN_DAYS_MS;

      // clear pre-auth flags
      delete req.session.adminPreAuth;
      delete req.session.loginNonce;

      return res.json({ ok: true });
    });
  } catch (e) {
    console.error("[admin/verify-otp] verify failed:", e?.message || e);
    return res
      .status(401)
      .json({ ok: false, error: e?.message || "verify-failed" });
  }
});

/**
 * Optional: small endpoint to check current admin session and
 * refresh cookie maxAge when active.
 * Frontend can call: GET /api/admin/ping
 */
router.get("/ping", (req, res) => {
  if (req.session?.admin) {
    // refresh cookie here as well
    req.session.cookie.maxAge = TEN_DAYS_MS;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false });
});

/**
 * Optional: who-am-I endpoint (not required by current frontend)
 * Frontend: GET /api/admin/me
 */
router.get("/me", (req, res) => {
  if (!req.session?.admin) {
    return res.status(401).json({ ok: false });
  }
  req.session.cookie.maxAge = TEN_DAYS_MS;
  return res.json({
    ok: true,
    email: req.session.adminEmail || ADMIN_EMAIL,
  });
});

/**
 * Logout: destroy admin session
 * Frontend: POST /api/admin/logout
 */
router.post("/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy((err) => {
    if (err) {
      console.error("[admin/logout] session.destroy failed:", err);
    }
    res.json({ ok: true });
  });
});

export default router;
