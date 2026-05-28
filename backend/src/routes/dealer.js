import express from "express";
import { pool } from "../config/db.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { sendWhatsAppTemplate } from "../services/msg91.js";

const router = express.Router();

/* ================== ENV ================== */
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const DEALER_OTP_EXPIRY_SECONDS = Number(process.env.DEALER_OTP_EXPIRY_SECONDS || 300);
const DEALER_OTP_DEV_FALLBACK = String(process.env.DEALER_OTP_DEV_FALLBACK || "0") === "1";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false") === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5173";

const PRIVATE_UPLOAD_ROOT =
  process.env.PRIVATE_UPLOAD_ROOT || path.join(process.cwd(), "uploads_private");

const DOCS_DIR = path.join(PRIVATE_UPLOAD_ROOT, "dealer_docs");

fs.mkdirSync(DOCS_DIR, { recursive: true });

/* ================== HELPERS ================== */
function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizePhone10(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length > 10) return d.slice(-10);
  return d;
}

function gstValidPattern(gst) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gst || "").toUpperCase()
  );
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function dealerJwtPayload(dealer) {
  return {
    role: "dealer",
    dealer_id: dealer?.id || 0,
    phone: dealer?.phone || "",
    status: dealer?.status || "new",
  };
}

function signDealerJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authDealer(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (!t) return res.status(401).json({ message: "Missing token" });

  try {
    const p = jwt.verify(t, JWT_SECRET);
    if (p.role !== "dealer") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.dealerAuth = p;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function mailer() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, text) {
  try {
    const tr = mailer();
    if (!tr || !to) return;
    await tr.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[dealer-email]", err?.message || err);
  }
}

async function sendOtpViaMsg91Dealer(phone10, otp) {
  const toMsisdn = `91${phone10}`;

  return sendWhatsAppTemplate({
    kind: "dealer",
    toMsisdn,
    bodyText: String(otp),
    buttonText: null,
  });
}

async function ensureDealerTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_otp_sessions (
      phone VARCHAR(15) PRIMARY KEY,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts INT DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      firm_name VARCHAR(180) NOT NULL,
      phone VARCHAR(15) NOT NULL UNIQUE,
      email VARCHAR(180) NULL,
      gst VARCHAR(20) NOT NULL,
      village_post VARCHAR(255) NOT NULL,
      taluk VARCHAR(120) NOT NULL,
      district VARCHAR(120) NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      approved_by VARCHAR(180) NULL,
      approved_at DATETIME NULL,
      rejection_reason TEXT NULL,
      created_at DATETIME,
      updated_at DATETIME
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dealer_id INT NOT NULL,
      type ENUM('gst','insecticide') NOT NULL,
      file_path TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_hash VARCHAR(128) NOT NULL,
      uploaded_at DATETIME,
      INDEX (dealer_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_lists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_path TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      uploaded_by VARCHAR(180) NULL,
      uploaded_at DATETIME,
      active TINYINT(1) DEFAULT 1
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_download_tokens (
      token VARCHAR(128) PRIMARY KEY,
      dealer_id INT NOT NULL,
      pricelist_id INT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME,
      INDEX (dealer_id),
      INDEX (pricelist_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_audit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dealer_id INT NOT NULL,
      action VARCHAR(80) NOT NULL,
      actor_role VARCHAR(40) NOT NULL,
      actor_id VARCHAR(180) NULL,
      note TEXT NULL,
      created_at DATETIME,
      INDEX (dealer_id)
    )
  `);
}

ensureDealerTables().catch((err) => {
  console.error("[dealer] table ensure failed:", err?.message || err);
});

/* ================== RATE LIMIT ================== */
const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many OTP requests. Try again after some time." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ================== MULTER ================== */
const allowedMime = new Set(["application/pdf", "image/jpeg", "image/png"]);

const docUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DOCS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `${Date.now()}_${crypto.randomBytes(10).toString("hex")}${ext}`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      return cb(new Error("Only PDF, JPG and PNG files are allowed"));
    }
    cb(null, true);
  },
});

/* =========================================================
   DEALER APIs mounted at /api/dealer
========================================================= */

router.post("/send-otp", sendOtpLimiter, async (req, res) => {
  try {
    const phone10 = normalizePhone10(req.body?.phone);

    if (phone10.length !== 10) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresSql = new Date(Date.now() + DEALER_OTP_EXPIRY_SECONDS * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await pool.query(
      `
      INSERT INTO dealer_otp_sessions
      (phone, otp_hash, expires_at, attempts, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
      ON DUPLICATE KEY UPDATE
      otp_hash = VALUES(otp_hash),
      expires_at = VALUES(expires_at),
      attempts = 0,
      updated_at = VALUES(updated_at)
      `,
      [phone10, otpHash, expiresSql, nowSql(), nowSql()]
    );

    try {
      await sendOtpViaMsg91Dealer(phone10, otp);

      return res.json({
        ok: true,
        message: "OTP sent on WhatsApp",
      });
    } catch (vendorErr) {
      console.error("[dealer-otp-msg91]", vendorErr?.message || vendorErr);

      if (DEALER_OTP_DEV_FALLBACK) {
        return res.json({
          ok: true,
          message: "OTP generated with dev fallback",
          dev_otp: otp,
          vendorStatus: vendorErr?.vendorStatus || null,
          vendorBody: vendorErr?.vendorBody || null,
        });
      }

      return res.status(500).json({
        message: vendorErr?.message || "MSG91 WhatsApp OTP failed",
        vendorStatus: vendorErr?.vendorStatus || null,
        vendorBody: vendorErr?.vendorBody || null,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err?.message || "Failed to send OTP",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    const otp = String(req.body?.otp || "").trim();

    if (phone10.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM dealer_otp_sessions WHERE phone = ?`,
      [phone10]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "OTP not found. Please resend OTP." });
    }

    const session = rows[0];

    if (session.attempts >= 5) {
      return res.status(429).json({ message: "Too many wrong attempts. Please resend OTP." });
    }

    if (Date.now() > new Date(session.expires_at).getTime()) {
      return res.status(400).json({ message: "OTP expired. Please resend OTP." });
    }

    const ok = await bcrypt.compare(otp, session.otp_hash);

    if (!ok) {
      await pool.query(
        `UPDATE dealer_otp_sessions SET attempts = attempts + 1, updated_at = ? WHERE phone = ?`,
        [nowSql(), phone10]
      );

      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(`DELETE FROM dealer_otp_sessions WHERE phone = ?`, [phone10]);

    const [dealerRows] = await pool.query(`SELECT * FROM dealers WHERE phone = ?`, [phone10]);

    if (!dealerRows.length) {
      const token = signDealerJwt({
        role: "dealer",
        dealer_id: 0,
        phone: phone10,
        status: "new",
      });

      return res.json({
        ok: true,
        token,
        dealer: null,
        next: "register",
      });
    }

    const dealer = dealerRows[0];
    const token = signDealerJwt(dealerJwtPayload(dealer));

    if (dealer.status === "approved") {
      return res.json({
        ok: true,
        token,
        dealer,
        next: "dashboard",
      });
    }

    if (dealer.status === "pending") {
      return res.json({
        ok: true,
        token,
        dealer,
        next: "pending",
      });
    }

    return res.json({
      ok: true,
      token,
      dealer,
      next: "register",
      message: dealer.rejection_reason
        ? `Previous request rejected: ${dealer.rejection_reason}`
        : "Please re-submit dealer registration.",
    });
  } catch (err) {
    return res.status(500).json({
      message: err?.message || "OTP verification failed",
    });
  }
});

router.post(
  "/register",
  authDealer,
  docUpload.fields([
    { name: "gst_certificate", maxCount: 1 },
    { name: "insecticide_licence", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const phone10 = normalizePhone10(req.body?.phone);

      if (phone10.length !== 10) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      if (req.dealerAuth.phone !== phone10) {
        return res.status(403).json({ message: "Phone mismatch. Please login again." });
      }

      const name = String(req.body?.dealer_name || "").trim();
      const firm = String(req.body?.firm_name || "").trim();
      const email = String(req.body?.email || "").trim() || null;
      const gst = String(req.body?.gst || "").trim().toUpperCase();
      const villagePost = String(req.body?.village_post || "").trim();
      const taluk = String(req.body?.taluk || "").trim();
      const district = String(req.body?.district || "").trim();
      const pincode = String(req.body?.pincode || "").trim();
      const confirm = String(req.body?.confirm_true || "") === "true";

      if (!name) return res.status(400).json({ message: "Dealer name is required" });
      if (!firm) return res.status(400).json({ message: "Firm / Company name is required" });
      if (!gstValidPattern(gst)) return res.status(400).json({ message: "Invalid GST number format" });
      if (!villagePost || !taluk || !district) {
        return res.status(400).json({ message: "Complete address is required" });
      }
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ message: "Invalid pincode" });
      }
      if (!confirm) {
        return res.status(400).json({ message: "Please confirm the information is true" });
      }

      const gstFile = req.files?.gst_certificate?.[0];
      const licenceFile = req.files?.insecticide_licence?.[0];

      if (!gstFile || !licenceFile) {
        return res.status(400).json({ message: "Both GST certificate and Insecticide licence are required" });
      }

      const [existing] = await pool.query(`SELECT id FROM dealers WHERE phone = ?`, [phone10]);

      let dealerId;

      if (!existing.length) {
        const [ins] = await pool.query(
          `
          INSERT INTO dealers
          (name, firm_name, phone, email, gst, village_post, taluk, district, pincode, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
          `,
          [
            name,
            firm,
            phone10,
            email,
            gst,
            villagePost,
            taluk,
            district,
            pincode,
            nowSql(),
            nowSql(),
          ]
        );

        dealerId = ins.insertId;
      } else {
        dealerId = existing[0].id;

        const [oldDocs] = await pool.query(
          `SELECT file_path FROM dealer_documents WHERE dealer_id = ?`,
          [dealerId]
        );

        for (const d of oldDocs) {
          try {
            if (d.file_path) fs.unlinkSync(d.file_path);
          } catch {}
        }

        await pool.query(`DELETE FROM dealer_documents WHERE dealer_id = ?`, [dealerId]);

        await pool.query(
          `
          UPDATE dealers
          SET name = ?, firm_name = ?, email = ?, gst = ?, village_post = ?, taluk = ?, district = ?,
              pincode = ?, status = 'pending', rejection_reason = NULL, updated_at = ?
          WHERE id = ?
          `,
          [
            name,
            firm,
            email,
            gst,
            villagePost,
            taluk,
            district,
            pincode,
            nowSql(),
            dealerId,
          ]
        );
      }

      const gstHash = sha256File(gstFile.path);
      const licenceHash = sha256File(licenceFile.path);

      await pool.query(
        `
        INSERT INTO dealer_documents
        (dealer_id, type, file_path, file_name, file_hash, uploaded_at)
        VALUES (?, 'gst', ?, ?, ?, ?), (?, 'insecticide', ?, ?, ?, ?)
        `,
        [
          dealerId,
          gstFile.path,
          gstFile.originalname,
          gstHash,
          nowSql(),
          dealerId,
          licenceFile.path,
          licenceFile.originalname,
          licenceHash,
          nowSql(),
        ]
      );

      await pool.query(
        `
        INSERT INTO dealer_audit
        (dealer_id, action, actor_role, actor_id, note, created_at)
        VALUES (?, 'REGISTER_SUBMIT', 'dealer', ?, 'Dealer submitted registration', ?)
        `,
        [dealerId, String(dealerId), nowSql()]
      );

      const adminBody = [
        "New Dealer Registration Pending Approval",
        "",
        `Dealer Name : ${name}`,
        `Firm Name   : ${firm}`,
        `Phone       : ${phone10}`,
        `Email       : ${email || "-"}`,
        `GST         : ${gst}`,
        `Address     : ${villagePost}, Taluk ${taluk}, District ${district} - ${pincode}`,
        "",
        "Please open Admin Portal and approve/reject this dealer.",
      ].join("\n");

      await sendEmail(ADMIN_NOTIFY_EMAIL, "Dealer Registration Pending Approval", adminBody);

      return res.json({
        ok: true,
        message: "Request received. Wait till admin verifies and approves.",
      });
    } catch (err) {
      console.error("[dealer-register]", err?.message || err);

      return res.status(500).json({
        message: err?.message || "Dealer registration failed",
      });
    }
  }
);

router.get("/pricelist", authDealer, async (req, res) => {
  try {
    if (req.dealerAuth.status !== "approved") {
      return res.status(403).json({
        message: "Price list is available only after admin approval",
      });
    }

    const [dealerRows] = await pool.query(
      `SELECT * FROM dealers WHERE id = ? AND phone = ? LIMIT 1`,
      [req.dealerAuth.dealer_id, req.dealerAuth.phone]
    );

    if (!dealerRows.length || dealerRows[0].status !== "approved") {
      return res.status(403).json({
        message: "Dealer is not approved",
      });
    }

    const [priceRows] = await pool.query(
      `SELECT * FROM price_lists WHERE active = 1 ORDER BY uploaded_at DESC, id DESC LIMIT 1`
    );

    if (!priceRows.length) {
      return res.status(404).json({
        message: "Price list is not uploaded yet",
      });
    }

    const price = priceRows[0];
    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await pool.query(
      `
      INSERT INTO dealer_download_tokens
      (token, dealer_id, pricelist_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [token, dealerRows[0].id, price.id, expiresAt, nowSql()]
    );

    return res.json({
      ok: true,
      file_name: price.file_name,
      uploaded_at: price.uploaded_at,
      download_url: `/api/dealer/pricelist/download?token=${token}`,
      expires_at: expiresAt,
    });
  } catch (err) {
    return res.status(500).json({
      message: err?.message || "Unable to get price list",
    });
  }
});

router.get("/pricelist/download", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return res.status(400).send("Missing download token");
    }

    const [rows] = await pool.query(
      `
      SELECT t.*, p.file_path, p.file_name, d.status
      FROM dealer_download_tokens t
      JOIN price_lists p ON p.id = t.pricelist_id
      JOIN dealers d ON d.id = t.dealer_id
      WHERE t.token = ?
      LIMIT 1
      `,
      [token]
    );

    if (!rows.length) {
      return res.status(404).send("Invalid download token");
    }

    const row = rows[0];

    if (row.status !== "approved") {
      return res.status(403).send("Dealer is not approved");
    }

    if (Date.now() > new Date(row.expires_at).getTime()) {
      return res.status(410).send("Download link expired");
    }

    if (!fs.existsSync(row.file_path)) {
      return res.status(404).send("Price list file not found");
    }

    return res.download(row.file_path, row.file_name);
  } catch (err) {
    return res.status(500).send(err?.message || "Download failed");
  }
});

export default router;