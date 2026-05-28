// backend/src/routes/farmers.js
import express from "express";
import { pool } from "../config/db.js";
import { ensureAdminSession } from "./admin.js";

const router = express.Router();

/* --------------------- GET PROFILE (Farmer self) --------------------- */
router.get("/profile/me", async (req, res) => {
  try {
    const farmer = req.session?.farmer;
    if (!farmer?.id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const userId = farmer.id;

    const [rows] = await pool.query(
      `SELECT 
         u.id AS user_id,
         COALESCE(fp.full_name, u.name) AS full_name,
         u.mobile,
         COALESCE(fp.whatsapp, u.whatsapp) AS whatsapp,
         fp.village,
         fp.taluk,
         fp.district,
         fp.pincode,
         fp.land_size,
         fp.crops_text
       FROM users u
       LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
       WHERE u.id = ?
       ORDER BY fp.id DESC
       LIMIT 1`,
      [userId]
    );

    return res.json({ ok: true, profile: rows[0] || null });
  } catch (e) {
    console.error("profile/me error:", e);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/* --------------------- GET PROFILE (Admin view by mobile) --------------------- */
/**
 * Admin overlay: GET /farmers/profile/admin?mobile=XXXXXXXXXX
 * Requires valid admin session (ensureAdminSession).
 * Returns combined data from users + farmer_profiles.
 */
router.get("/profile/admin", ensureAdminSession, async (req, res) => {
  try {
    const rawMobile = String(req.query.mobile || "").trim();
    const mobile = rawMobile.replace(/\D/g, "").slice(-10);

    if (!mobile || mobile.length !== 10) {
      return res
        .status(400)
        .json({ ok: false, message: "Valid 10-digit mobile required" });
    }

    const [rows] = await pool.query(
      `SELECT 
         u.id AS user_id,
         COALESCE(fp.full_name, u.name)       AS full_name,
         u.name                               AS account_name,
         u.mobile,
         COALESCE(fp.whatsapp, u.whatsapp)    AS whatsapp,
         fp.village,
         fp.taluk,
         fp.district,
         fp.pincode,
         fp.land_size,
         fp.crops_text
       FROM users u
       LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
       WHERE u.mobile = ?
       ORDER BY fp.id DESC
       LIMIT 1`,
      [mobile]
    );

    // If no user row, we still return ok:false/profile:null so frontend can show fallback
    if (!rows.length) {
      return res.json({ ok: true, profile: null });
    }

    return res.json({ ok: true, profile: rows[0] });
  } catch (e) {
    console.error("profile/admin error:", e);
    res.status(500).json({ ok: false, message: "Failed to load farmer profile" });
  }
});

/* --------------------- SAVE PROFILE (Farmer self) --------------------- */
router.post("/profile/save", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const farmer = req.session?.farmer;
    if (!farmer?.id) {
      conn.release();
      return res.status(401).json({ message: "Not logged in" });
    }

    const userId = farmer.id;

    const {
      full_name,
      whatsapp,
      village,
      taluk,
      district,
      pincode,
      land_size,
      crops_text,
    } = req.body || {};

    if (!full_name || !village || !taluk || !district || !pincode) {
      conn.release();
      return res.status(400).json({ message: "Missing required fields" });
    }

    await conn.beginTransaction();

    // IMPORTANT: this relies on user_id being UNIQUE in farmer_profiles
    await conn.query(
      `INSERT INTO farmer_profiles
         (user_id, full_name, mobile, whatsapp, village, taluk, district, pincode, land_size, crops_text)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         whatsapp  = VALUES(whatsapp),
         village   = VALUES(village),
         taluk     = VALUES(taluk),
         district  = VALUES(district),
         pincode   = VALUES(pincode),
         land_size = VALUES(land_size),
         crops_text= VALUES(crops_text)`,
      [
        userId,
        full_name,
        farmer.mobile,
        whatsapp || null,
        village,
        taluk,
        district,
        pincode,
        land_size || null,
        crops_text || null,
      ]
    );

    // Also update users table so chat headers & lists show correct name/whatsapp
    await conn.query(
      "UPDATE users SET name = ?, whatsapp = ? WHERE id = ?",
      [full_name, whatsapp || null, userId]
    );

    await conn.commit();

    // Refresh session name so frontend can use it immediately
    req.session.farmer = {
      ...farmer,
      name: full_name,
      whatsapp: whatsapp || farmer.whatsapp || null,
    };

    return res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch (_) {}
    console.error("profile/save error:", e);
    res.status(500).json({ message: "Failed to save profile" });
  } finally {
    conn.release();
  }
});

export default router;
