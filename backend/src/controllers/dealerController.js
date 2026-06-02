// src/controllers/dealerController.js
// Business logic for dealer portal endpoints.

import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { sendWhatsAppTemplate } from '../services/msg91.js';
import {
  upsertDealerOtp,
  verifyDealerOtp,
  findDealerByPhone,
  insertDealer,
  updateDealerForResubmission,
  getDealerDocsByDealerId,
  deleteDealerDocsByDealerId,
  insertDealerDocuments,
  insertDealerAudit,
  getActivePricelist,
  insertDownloadToken,
  getDownloadTokenRow,
  ensureDealerTables,
} from '../models/dealerModel.js';

/* ------------------------------------------------------------------ */
/*  Singleton nodemailer transport                                        */
/* ------------------------------------------------------------------ */
let _mailerInstance = null;
function mailer() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!_mailerInstance) {
    _mailerInstance = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return _mailerInstance;
}

/* ------------------------------------------------------------------ */
/*  ENV                                                                  */
/* ------------------------------------------------------------------ */
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEALER_OTP_EXPIRY_SECONDS = Number(process.env.DEALER_OTP_EXPIRY_SECONDS || 300);
const DEALER_OTP_DEV_FALLBACK = String(process.env.DEALER_OTP_DEV_FALLBACK || '0') === '1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */
export function normalizePhone10(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length > 10) return d.slice(-10);
  return d;
}

function gstValidPattern(gst) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gst || '').toUpperCase()
  );
}

function dealerJwtPayload(dealer) {
  return { role: 'dealer', dealer_id: dealer?.id || 0, phone: dealer?.phone || '', status: dealer?.status || 'new' };
}

function signDealerJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function sendEmail(to, subject, text) {
  try {
    const tr = mailer();
    if (!tr || !to) return;
    await tr.sendMail({ from: SMTP_USER, to, subject, text });
  } catch (err) {
    console.error('[dealer-email]', err?.message || err);
  }
}

async function sendOtpViaMsg91Dealer(phone10, otp) {
  return sendWhatsAppTemplate({ kind: 'dealer', toMsisdn: `91${phone10}`, bodyText: String(otp), buttonText: null });
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (exported for use in router)                            */
/* ------------------------------------------------------------------ */
export const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many OTP requests. Try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/send-otp                                            */
/* ------------------------------------------------------------------ */
export async function sendOtp(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    if (phone10.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await upsertDealerOtp(phone10, otp, DEALER_OTP_EXPIRY_SECONDS);

    try {
      await sendOtpViaMsg91Dealer(phone10, otp);
      return res.json({ ok: true, message: 'OTP sent on WhatsApp' });
    } catch (vendorErr) {
      console.error('[dealer-otp-msg91]', vendorErr?.message || vendorErr);
      if (DEALER_OTP_DEV_FALLBACK) {
        return res.json({ ok: true, message: 'OTP generated with dev fallback', dev_otp: otp, vendorStatus: vendorErr?.vendorStatus || null, vendorBody: vendorErr?.vendorBody || null });
      }
      return res.status(500).json({ message: vendorErr?.message || 'MSG91 WhatsApp OTP failed', vendorStatus: vendorErr?.vendorStatus || null, vendorBody: vendorErr?.vendorBody || null });
    }
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/verify-otp                                          */
/* ------------------------------------------------------------------ */
export async function verifyOtp(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    const otp = String(req.body?.otp || '').trim();

    if (phone10.length !== 10) return res.status(400).json({ message: 'Invalid phone number' });
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const result = await verifyDealerOtp(phone10, otp);
    if (!result.ok) {
      const messages = { not_found: 'OTP not found. Please resend OTP.', too_many: 'Too many wrong attempts. Please resend OTP.', expired: 'OTP expired. Please resend OTP.', invalid: 'Invalid OTP' };
      const httpCodes = { too_many: 429 };
      return res.status(httpCodes[result.reason] || 400).json({ message: messages[result.reason] || 'OTP error' });
    }

    const dealer = await findDealerByPhone(phone10);
    if (!dealer) {
      const token = signDealerJwt({ role: 'dealer', dealer_id: 0, phone: phone10, status: 'new' });
      return res.json({ ok: true, token, dealer: null, next: 'register' });
    }

    const token = signDealerJwt(dealerJwtPayload(dealer));
    if (dealer.status === 'approved') return res.json({ ok: true, token, dealer, next: 'dashboard' });
    if (dealer.status === 'pending') return res.json({ ok: true, token, dealer, next: 'pending' });

    return res.json({ ok: true, token, dealer, next: 'register', message: dealer.rejection_reason ? `Previous request rejected: ${dealer.rejection_reason}` : 'Please re-submit dealer registration.' });
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'OTP verification failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/register                                            */
/* ------------------------------------------------------------------ */
export async function register(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    if (phone10.length !== 10) return res.status(400).json({ message: 'Invalid phone number' });
    if (req.dealerAuth.phone !== phone10) return res.status(403).json({ message: 'Phone mismatch. Please login again.' });

    const name = String(req.body?.dealer_name || '').trim();
    const firm = String(req.body?.firm_name || '').trim();
    const email = String(req.body?.email || '').trim() || null;
    const gst = String(req.body?.gst || '').trim().toUpperCase();
    const villagePost = String(req.body?.village_post || '').trim();
    const taluk = String(req.body?.taluk || '').trim();
    const district = String(req.body?.district || '').trim();
    const pincode = String(req.body?.pincode || '').trim();
    const confirm = String(req.body?.confirm_true || '') === 'true';

    if (!name) return res.status(400).json({ message: 'Dealer name is required' });
    if (!firm) return res.status(400).json({ message: 'Firm / Company name is required' });
    if (!gstValidPattern(gst)) return res.status(400).json({ message: 'Invalid GST number format' });
    if (!villagePost || !taluk || !district) return res.status(400).json({ message: 'Complete address is required' });
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ message: 'Invalid pincode' });
    if (!confirm) return res.status(400).json({ message: 'Please confirm the information is true' });

    const gstFile = req.files?.gst_certificate?.[0];
    const licenceFile = req.files?.insecticide_licence?.[0];
    if (!gstFile || !licenceFile) return res.status(400).json({ message: 'Both GST certificate and Insecticide licence are required' });

    const existing = await findDealerByPhone(phone10);
    let dealerId;

    if (!existing) {
      dealerId = await insertDealer({ name, firm, phone10, email, gst, villagePost, taluk, district, pincode });
    } else {
      dealerId = existing.id;
      const oldDocs = await getDealerDocsByDealerId(dealerId);
      for (const d of oldDocs) { try { if (d.file_path) fs.unlinkSync(d.file_path); } catch {} }
      await deleteDealerDocsByDealerId(dealerId);
      await updateDealerForResubmission(dealerId, { name, firm, email, gst, villagePost, taluk, district, pincode });
    }

    await insertDealerDocuments(dealerId, gstFile, licenceFile);
    await insertDealerAudit(dealerId, 'REGISTER_SUBMIT', 'dealer', dealerId, 'Dealer submitted registration');

    const adminBody = [
      'New Dealer Registration Pending Approval', '',
      `Dealer Name : ${name}`, `Firm Name   : ${firm}`, `Phone       : ${phone10}`,
      `Email       : ${email || '-'}`, `GST         : ${gst}`,
      `Address     : ${villagePost}, Taluk ${taluk}, District ${district} - ${pincode}`, '',
      'Please open Admin Portal and approve/reject this dealer.',
    ].join('\n');

    await sendEmail(ADMIN_NOTIFY_EMAIL, 'Dealer Registration Pending Approval', adminBody);
    return res.json({ ok: true, message: 'Request received. Wait till admin verifies and approves.' });
  } catch (err) {
    console.error('[dealer-register]', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Dealer registration failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/dealer/pricelist                                            */
/* ------------------------------------------------------------------ */
export async function getPricelist(req, res) {
  try {
    if (req.dealerAuth.status !== 'approved') {
      return res.status(403).json({ message: 'Price list is available only after admin approval' });
    }

    const dealer = await findDealerByPhone(req.dealerAuth.phone);
    if (!dealer || dealer.status !== 'approved') {
      return res.status(403).json({ message: 'Dealer is not approved' });
    }

    const price = await getActivePricelist();
    if (!price) return res.status(404).json({ message: 'Price list is not uploaded yet' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await insertDownloadToken(token, dealer.id, price.id, expiresAt);

    return res.json({ ok: true, file_name: price.file_name, uploaded_at: price.uploaded_at, download_url: `/api/dealer/pricelist/download?token=${token}`, expires_at: expiresAt });
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Unable to get price list' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/dealer/pricelist/download                                   */
/* ------------------------------------------------------------------ */
export async function downloadPricelist(req, res) {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).send('Missing download token');

    const row = await getDownloadTokenRow(token);
    if (!row) return res.status(404).send('Invalid download token');
    if (row.status !== 'approved') return res.status(403).send('Dealer is not approved');
    if (Date.now() > new Date(row.expires_at).getTime()) return res.status(410).send('Download link expired');
    try { await fs.promises.access(row.file_path); } catch {
      return res.status(404).send('Price list file not found');
    }

    return res.download(row.file_path, row.file_name);
  } catch (err) {
    return res.status(500).send(err?.message || 'Download failed');
  }
}
