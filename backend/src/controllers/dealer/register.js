// src/controllers/dealer/register.js
// Dealer registration endpoint.
// Extracted from the monolithic dealerController.js.

import fs from 'fs';
import nodemailer from 'nodemailer';
import {
  findDealerByPhone,
  insertDealer,
  updateDealerForResubmission,
  getDealerDocsByDealerId,
  deleteDealerDocsByDealerId,
  insertDealerDocuments,
  insertDealerAudit,
} from '../../models/dealerModel.js';
import { normalizePhone10 } from '../../utils/helpers.js';

/* ------------------------------------------------------------------ */
/*  ENV                                                                  */
/* ------------------------------------------------------------------ */
const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

/* ------------------------------------------------------------------ */
/*  Mailer singleton                                                     */
/* ------------------------------------------------------------------ */

let _mailerInstance = null;
function mailer() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!_mailerInstance) {
    _mailerInstance = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return _mailerInstance;
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

/* ------------------------------------------------------------------ */
/*  GST validation                                                       */
/* ------------------------------------------------------------------ */

function gstValidPattern(gst) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gst || '').toUpperCase()
  );
}

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/register                                            */
/* ------------------------------------------------------------------ */

export async function register(req, res) {
  try {
    const phone10 = normalizePhone10(req.body?.phone);
    if (phone10.length !== 10)
      return res.status(400).json({ message: 'Invalid phone number' });
    if (req.dealerAuth.phone !== phone10)
      return res.status(403).json({ message: 'Phone mismatch. Please login again.' });

    const name = String(req.body?.dealer_name || '').trim();
    const firm = String(req.body?.firm_name || '').trim();
    const email = String(req.body?.email || '').trim() || null;
    const gst = String(req.body?.gst || '').trim().toUpperCase();
    const villagePost = String(req.body?.village_post || '').trim();
    const taluk = String(req.body?.taluk || '').trim();
    const district = String(req.body?.district || '').trim();
    const pincode = String(req.body?.pincode || '').trim();
    const confirm = String(req.body?.confirm_true || '') === 'true';

    if (!name)
      return res.status(400).json({ message: 'Dealer name is required' });
    if (!firm)
      return res.status(400).json({ message: 'Firm / Company name is required' });
    if (!gstValidPattern(gst))
      return res.status(400).json({ message: 'Invalid GST number format' });
    if (!villagePost || !taluk || !district)
      return res.status(400).json({ message: 'Complete address is required' });
    if (!/^\d{6}$/.test(pincode))
      return res.status(400).json({ message: 'Invalid pincode' });
    if (!confirm)
      return res
        .status(400)
        .json({ message: 'Please confirm the information is true' });

    const gstFile = req.files?.gst_certificate?.[0];
    const licenceFile = req.files?.insecticide_licence?.[0];
    if (!gstFile || !licenceFile)
      return res.status(400).json({
        message: 'Both GST certificate and Insecticide licence are required',
      });

    const existing = await findDealerByPhone(phone10);
    let dealerId;

    if (!existing) {
      dealerId = await insertDealer({
        name,
        firm,
        phone10,
        email,
        gst,
        villagePost,
        taluk,
        district,
        pincode,
      });
    } else {
      dealerId = existing.id;
      const oldDocs = await getDealerDocsByDealerId(dealerId);
      for (const d of oldDocs) {
        try {
          if (d.file_path) fs.unlinkSync(d.file_path);
        } catch {}
      }
      await deleteDealerDocsByDealerId(dealerId);
      await updateDealerForResubmission(dealerId, {
        name,
        firm,
        email,
        gst,
        villagePost,
        taluk,
        district,
        pincode,
      });
    }

    await insertDealerDocuments(dealerId, gstFile, licenceFile);
    await insertDealerAudit(
      dealerId,
      'REGISTER_SUBMIT',
      'dealer',
      dealerId,
      'Dealer submitted registration'
    );

    const adminBody = [
      'New Dealer Registration Pending Approval',
      '',
      `Dealer Name : ${name}`,
      `Firm Name   : ${firm}`,
      `Phone       : ${phone10}`,
      `Email       : ${email || '-'}`,
      `GST         : ${gst}`,
      `Address     : ${villagePost}, Taluk ${taluk}, District ${district} - ${pincode}`,
      '',
      'Please open Admin Portal and approve/reject this dealer.',
    ].join('\n');

    await sendEmail(
      ADMIN_NOTIFY_EMAIL,
      'Dealer Registration Pending Approval',
      adminBody
    );
    return res.json({
      ok: true,
      message: 'Request received. Wait till admin verifies and approves.',
    });
  } catch (err) {
    console.error('[dealer-register]', err?.message || err);
    return res
      .status(500)
      .json({ message: err?.message || 'Dealer registration failed' });
  }
}
