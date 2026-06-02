// src/controllers/farmerController.js
// Business logic for farmer profile endpoints.

import { pool } from '../config/db.js';
import {
  getFarmerProfileWithUser,
  getFarmerProfileByMobile,
  upsertFarmerProfile,
  updateUserNameWhatsapp,
} from '../models/userModel.js';

/* ------------------------------------------------------------------ */
/*  GET /api/farmers/profile/me                                          */
/* ------------------------------------------------------------------ */
export async function getProfileMe(req, res) {
  try {
    const farmer = req.session?.farmer;
    if (!farmer?.id) return res.status(401).json({ message: 'Not logged in' });

    const profile = await getFarmerProfileWithUser(farmer.id);
    return res.json({ ok: true, profile: profile || null });
  } catch (e) {
    console.error('profile/me error:', e);
    res.status(500).json({ message: 'Failed to load profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/farmers/profile/admin?mobile=...  (ADMIN)                  */
/* ------------------------------------------------------------------ */
export async function getProfileAdmin(req, res) {
  try {
    const rawMobile = String(req.query.mobile || '').trim();
    const mobile = rawMobile.replace(/\D/g, '').slice(-10);

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ ok: false, message: 'Valid 10-digit mobile required' });
    }

    const profile = await getFarmerProfileByMobile(mobile);
    return res.json({ ok: true, profile: profile || null });
  } catch (e) {
    console.error('profile/admin error:', e);
    res.status(500).json({ ok: false, message: 'Failed to load farmer profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/farmers/profile/save                                       */
/* ------------------------------------------------------------------ */
export async function saveProfile(req, res) {
  const conn = await pool.getConnection();
  try {
    const farmer = req.session?.farmer;
    if (!farmer?.id) {
      conn.release();
      return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = farmer.id;
    const { full_name, whatsapp, village, taluk, district, pincode, land_size, crops_text } = req.body || {};

    if (!full_name || !village || !taluk || !district || !pincode) {
      conn.release();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await conn.beginTransaction();
    await upsertFarmerProfile(userId, farmer.mobile, { full_name, whatsapp: whatsapp || null, village, taluk, district, pincode, land_size: land_size || null, crops_text: crops_text || null });
    await updateUserNameWhatsapp(userId, full_name, whatsapp || null);
    await conn.commit();

    req.session.farmer = { ...farmer, name: full_name, whatsapp: whatsapp || farmer.whatsapp || null };
    return res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('profile/save error:', e);
    res.status(500).json({ message: 'Failed to save profile' });
  } finally {
    conn.release();
  }
}
