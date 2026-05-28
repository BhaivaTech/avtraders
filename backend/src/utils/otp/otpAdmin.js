//otpadmin.js
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import { pool } from "../../config/db.js";

const EXPIRY_S = parseInt(process.env.ADMIN_OTP_EXPIRY_SECONDS || "60", 10);
const PROVIDER = String(process.env.ADMIN_OTP_PROVIDER || "smtp").toLowerCase();

async function ensureOtpTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_otps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code   VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_created (email, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

let transporter = null;
if (PROVIDER === "smtp") {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendAdminOTP(email) {
  await ensureOtpTable();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = dayjs().add(EXPIRY_S, "second").format("YYYY-MM-DD HH:mm:ss");

  await pool.query(
    "INSERT INTO admin_otps (email, code, expires_at) VALUES (?,?,?)",
    [email, code, expiresAt]
  );

  if (PROVIDER === "dev") {
    console.warn(`[OTP][DEV][Admin] ${email}: ${code} (valid ${EXPIRY_S}s)`);
    return { ok: true, message: "Admin OTP generated (DEV)" };
  }

  if (PROVIDER === "smtp") {
    if (!transporter) throw new Error("SMTP not configured");
    await transporter.sendMail({
      from: `"AV Agri Clinic" <${process.env.SMTP_USER || email}>`,
      to: email,
      subject: `Your Admin OTP (valid ${EXPIRY_S} seconds)`,
      text: `Your one time otp for Av Traders Admin Login is: ${code}. It expires in ${EXPIRY_S} seconds.`,
    });
    return { ok: true, message: "Admin OTP sent to email" };
  }

  throw new Error("Unsupported admin OTP provider");
}

export async function verifyAdminOTP(email, rawCode) {
  await ensureOtpTable();
  const code = String(rawCode || "").trim();

  const [rows] = await pool.query(
    "SELECT * FROM admin_otps WHERE email=? AND code=? ORDER BY id DESC LIMIT 1",
    [email, code]
  );
  if (!rows.length) return { ok: false, message: "Invalid OTP" };

  const row = rows[0];
  if (dayjs(row.expires_at).isBefore(dayjs())) {
    return { ok: false, message: "OTP expired" };
  }

  await pool.query("UPDATE admin_otps SET verified=1 WHERE id=?", [row.id]);
  return { ok: true };
}
