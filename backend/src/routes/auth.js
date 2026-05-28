// backend/src/routes/auth.js
import express from "express";
import { pool } from "../config/db.js";
import { sendFarmerOTP, verifyFarmerOTP } from "../utils/otp/otpFarmer.js";
import { normalizeMobile10 } from "../utils/msisdn.js";

const router = express.Router();

/* helper: require logged-in farmer/dealer/admin */
function requireUserId(req) {
  const id = req.session?.farmer?.id || req.session?.user?.id;
  if (!id) {
    const err = new Error("NOT_AUTHENTICATED");
    throw err;
  }
  return id;
}

/* does user exist? */
router.get("/exists/:mobile", async (req, res) => {
  try {
    const mobile = normalizeMobile10(req.params.mobile);
    const [u] = await pool.query(
      "SELECT id, name, address, role, is_verified, blocked FROM users WHERE mobile=? LIMIT 1",
      [mobile]
    );
    res.json({ exists: u.length > 0, user: u[0] || null });
  } catch (e) {
    res.status(400).json({ message: e.message || "invalid mobile" });
  }
});

/* send OTP (farmer/dealer) */
router.post("/send-otp", async (req, res) => {
  try {
    const mobile = normalizeMobile10(req.body?.mobile);
    const r = await sendFarmerOTP(mobile);
    res.json({ ok: true, message: r.message || "OTP sent" });
  } catch (e) {
    const vendorStatus = e.vendorStatus || e.response?.status;
    const vendorBody   = e.vendorBody   || e.response?.data;
    if (vendorStatus) {
      return res.status(502).json({
        ok: false,
        message:
          vendorBody?.message ||
          vendorBody?.errors ||
          vendorBody?.reason ||
          e.message ||
          "OTP delivery failed (provider)",
        vendorStatus,
        details: vendorBody,
      });
    }
    return res
      .status(500)
      .json({ ok: false, message: e.message || "Failed to send OTP" });
  }
});

/* verify OTP & upsert farmer; set session (does not touch admin session) */
router.post("/verify-otp", async (req, res) => {
  try {
    const mobile = normalizeMobile10(req.body?.mobile);
    const code = String(req.body?.code || "").trim();
    const role = (req.body?.role || "farmer").toLowerCase();
    const name = req.body?.name;
    const address = req.body?.address;

    if (!code) return res.status(400).json({ message: "OTP code required" });

    const result = await verifyFarmerOTP(mobile, code);
    if (!result.ok)
      return res.status(400).json({ message: result.message || "Invalid OTP" });

    const [u] = await pool.query(
      "SELECT id, blocked FROM users WHERE mobile=? LIMIT 1",
      [mobile]
    );

    if (!u.length) {
      await pool.query(
        "INSERT INTO users (mobile, role, name, address, is_verified) VALUES (?,?,?,?,1)",
        [mobile, role, name || null, address || null]
      );
    } else {
      if (u[0].blocked)
        return res
          .status(403)
          .json({ message: "You are blocked from messaging." });
      await pool.query(
        "UPDATE users SET name=COALESCE(?, name), address=COALESCE(?, address), role=COALESCE(?, role), is_verified=1 WHERE id=?",
        [name || null, address || null, role || null, u[0].id]
      );
    }

    const [rows] = await pool.query(
      "SELECT id, role, name, address, mobile, is_verified FROM users WHERE mobile=? LIMIT 1",
      [mobile]
    );
    const user = rows[0];

    req.session.farmer = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
      address: user.address,
    };
    req.session.mobile = user.mobile;
    req.session.user = { id: user.id, mobile: user.mobile, role: user.role };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "session error" });
      return res.json({ ok: true, user });
    });
  } catch (e) {
    return res.status(400).json({ message: e.message || "invalid input" });
  }
});

/* login helper (already verified) */
router.post("/login", async (req, res) => {
  try {
    const mobile = normalizeMobile10(req.body?.mobile);
    const [u] = await pool.query(
      "SELECT id, role, name, address, mobile, is_verified, blocked FROM users WHERE mobile=? LIMIT 1",
      [mobile]
    );
    if (!u.length) return res.status(404).json({ message: "User not found" });
    if (u[0].blocked)
      return res
        .status(403)
        .json({ message: "You are blocked from messaging." });
    if (!u[0].is_verified)
      return res.status(403).json({ message: "OTP verification required" });

    const user = u[0];
    req.session.farmer = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
      address: user.address,
    };
    req.session.mobile = user.mobile;
    req.session.user = { id: user.id, mobile: user.mobile, role: user.role };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "session error" });
      res.json({ ok: true, user });
    });
  } catch (e) {
    return res.status(400).json({ message: e.message || "invalid input" });
  }
});

/* ---------- FARMER PROFILE ---------- */

/* GET current farmer profile */
router.get("/farmer-profile", async (req, res) => {
  try {
    const userId = requireUserId(req);

    // base user (for mobile + fallback name)
    const [[user]] = await pool.query(
      "SELECT id, name, mobile FROM users WHERE id=? LIMIT 1",
      [userId]
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "User not found" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM farmer_profiles WHERE user_id=? LIMIT 1",
      [userId]
    );
    const p = rows[0] || null;

    const profile = {
      full_name: p?.full_name || user.name || "",
      mobile: user.mobile,
      whatsapp: p?.whatsapp || user.mobile,
      village: p?.village || "",
      taluk: p?.taluk || "",
      district: p?.district || "",
      pincode: p?.pincode || "",
      land_size: p?.land_size || "",
      crops_text: p?.crops_text || "",
    };

    return res.json({ ok: true, profile });
  } catch (e) {
    if (e.message === "NOT_AUTHENTICATED") {
      return res
        .status(401)
        .json({ ok: false, message: "Login required" });
    }
    console.error("GET /auth/farmer-profile error:", e);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load profile" });
  }
});

/* POST farmer profile (create/update) */
router.post("/farmer-profile", async (req, res) => {
  try {
    const userId = requireUserId(req);

    let {
      full_name,
      whatsapp,
      village,
      taluk,
      district,
      pincode,
      land_size,
      crops_text,
    } = req.body || {};

    // required fields (WhatsApp optional)
    if (!full_name || !village || !taluk || !district || !pincode) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    // find user for mobile
    const [[user]] = await pool.query(
      "SELECT id, mobile FROM users WHERE id=? LIMIT 1",
      [userId]
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "User not found" });
    }

    const mobile = user.mobile;

    const wa = (whatsapp || "").trim();
    const whatsappFinal = wa || mobile;

    land_size = (land_size || "").trim() || null;
    crops_text = (crops_text || "").trim() || null;

    const [rows] = await pool.query(
      "SELECT id FROM farmer_profiles WHERE user_id=? LIMIT 1",
      [userId]
    );

    if (!rows.length) {
      // INSERT
      await pool.query(
        `INSERT INTO farmer_profiles
          (user_id, full_name, mobile, whatsapp, village, taluk, district, pincode, land_size, crops_text)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          userId,
          full_name,
          mobile,
          whatsappFinal,
          village,
          taluk,
          district,
          pincode,
          land_size,
          crops_text,
        ]
      );
    } else {
      // UPDATE
      await pool.query(
        `UPDATE farmer_profiles SET
           full_name=?,
           whatsapp=?,
           village=?,
           taluk=?,
           district=?,
           pincode=?,
           land_size=?,
           crops_text=?
         WHERE user_id=?`,
        [
          full_name,
          whatsappFinal,
          village,
          taluk,
          district,
          pincode,
          land_size,
          crops_text,
          userId,
        ]
      );
    }

    return res.json({ ok: true, message: "Profile saved" });
  } catch (e) {
    if (e.message === "NOT_AUTHENTICATED") {
      return res
        .status(401)
        .json({ ok: false, message: "Login required" });
    }
    console.error("POST /auth/farmer-profile error:", e);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to save profile" });
  }
});

/* me / logout */
router.get("/me", (req, res) => {
  res.json({
    ok: true,
    farmer: req.session?.farmer || null,
    user: req.session?.user || null,
    mobile: req.session?.mobile || null,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;
