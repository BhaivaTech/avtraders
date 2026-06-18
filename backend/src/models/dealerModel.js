// src/models/dealerModel.js
// All DB queries for dealer-related tables.

import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/* ------------------------------------------------------------------ */
/*  OTP sessions                                                         */
/* ------------------------------------------------------------------ */

export async function upsertDealerOtp(phone10, otp, expirySeconds) {
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresSql = new Date(Date.now() + expirySeconds * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');

  await pool.query(
    `INSERT INTO dealer_otp_sessions
     (phone, otp_hash, expires_at, attempts, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?)
     ON DUPLICATE KEY UPDATE
       otp_hash = VALUES(otp_hash),
       expires_at = VALUES(expires_at),
       attempts = 0,
       updated_at = VALUES(updated_at)`,
    [phone10, otpHash, expiresSql, nowSql(), nowSql()]
  );
  return { otpHash, expiresSql };
}

export async function getDealerOtpSession(phone10) {
  const [rows] = await pool.query(
    'SELECT * FROM dealer_otp_sessions WHERE phone = ?',
    [phone10]
  );
  return rows[0] || null;
}

export async function incrementOtpAttempts(phone10) {
  await pool.query(
    'UPDATE dealer_otp_sessions SET attempts = attempts + 1, updated_at = ? WHERE phone = ?',
    [nowSql(), phone10]
  );
}

export async function deleteDealerOtpSession(phone10) {
  await pool.query('DELETE FROM dealer_otp_sessions WHERE phone = ?', [phone10]);
}

export async function verifyDealerOtp(phone10, otp) {
  const session = await getDealerOtpSession(phone10);
  if (!session) return { ok: false, reason: 'not_found' };
  if (session.attempts >= 5) return { ok: false, reason: 'too_many' };
  if (Date.now() > new Date(session.expires_at).getTime()) return { ok: false, reason: 'expired' };

  const match = await bcrypt.compare(otp, session.otp_hash);
  if (!match) {
    await incrementOtpAttempts(phone10);
    return { ok: false, reason: 'invalid' };
  }
  await deleteDealerOtpSession(phone10);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Dealers                                                              */
/* ------------------------------------------------------------------ */

export async function findDealerByPhone(phone10) {
  const [rows] = await pool.query('SELECT * FROM dealers WHERE phone = ?', [phone10]);
  return rows[0] || null;
}

export async function insertDealer(data) {
  const { name, firm, phone10, email, gst, villagePost, taluk, district, pincode } = data;
  const [ins] = await pool.query(
    `INSERT INTO dealers
     (name, firm_name, phone, email, gst, village_post, taluk, district, pincode, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [name, firm, phone10, email, gst, villagePost, taluk, district, pincode, nowSql(), nowSql()]
  );
  return ins.insertId;
}

export async function updateDealerForResubmission(dealerId, data) {
  const { name, firm, email, gst, villagePost, taluk, district, pincode } = data;
  await pool.query(
    `UPDATE dealers
     SET name = ?, firm_name = ?, email = ?, gst = ?, village_post = ?, taluk = ?, district = ?,
         pincode = ?, status = 'pending', rejection_reason = NULL, updated_at = ?
     WHERE id = ?`,
    [name, firm, email, gst, villagePost, taluk, district, pincode, nowSql(), dealerId]
  );
}

export async function getDealerDocsByDealerId(dealerId) {
  const [docs] = await pool.query(
    'SELECT file_path FROM dealer_documents WHERE dealer_id = ?',
    [dealerId]
  );
  return docs;
}

export async function deleteDealerDocsByDealerId(dealerId) {
  await pool.query('DELETE FROM dealer_documents WHERE dealer_id = ?', [dealerId]);
}

export async function insertDealerDocuments(dealerId, gstFile, licenceFile) {
  const gstHash = sha256File(gstFile.path);
  const licenceHash = sha256File(licenceFile.path);
  await pool.query(
    `INSERT INTO dealer_documents
     (dealer_id, type, file_path, file_name, file_hash, uploaded_at)
     VALUES (?, 'gst', ?, ?, ?, ?), (?, 'insecticide', ?, ?, ?, ?)`,
    [
      dealerId, gstFile.path, gstFile.originalname, gstHash, nowSql(),
      dealerId, licenceFile.path, licenceFile.originalname, licenceHash, nowSql(),
    ]
  );
}

export async function insertDealerAudit(dealerId, action, actorRole, actorId, note) {
  await pool.query(
    `INSERT INTO dealer_audit
     (dealer_id, action, actor_role, actor_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dealerId, action, actorRole, String(actorId), note, nowSql()]
  );
}

/* ------------------------------------------------------------------ */
/*  Price lists & download tokens                                        */
/* ------------------------------------------------------------------ */

export async function getActivePricelist() {
  const [rows] = await pool.query(
    'SELECT * FROM price_lists WHERE active = 1 ORDER BY uploaded_at DESC, id DESC LIMIT 1'
  );
  return rows[0] || null;
}

export async function insertDownloadToken(token, dealerId, pricelistId, expiresAt) {
  await pool.query(
    `INSERT INTO dealer_download_tokens
     (token, dealer_id, pricelist_id, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [token, dealerId, pricelistId, expiresAt, nowSql()]
  );
}

export async function getDownloadTokenRow(token) {
  const [rows] = await pool.query(
    `SELECT t.*, p.file_path, p.file_name, d.status
     FROM dealer_download_tokens t
     JOIN price_lists p ON p.id = t.pricelist_id
     JOIN dealers d ON d.id = t.dealer_id
     WHERE t.token = ?
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}
