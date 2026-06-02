// src/controllers/authController.js
// Business logic for authentication & farmer profile endpoints.

import { pool } from '../config/db.js';
import { sendFarmerOTP, verifyFarmerOTP } from '../utils/otp/otpFarmer.js';
import { normalizeMobile10 } from '../utils/msisdn.js';
import {
  checkUserExists,
  createUser,
  updateUser,
  getFullUserByMobile,
  findUserById,
  getFarmerProfile,
  upsertFarmerProfile,
  getFarmerProfileWithUser,
} from '../models/userModel.js';
import { requireUserId } from '../middlewares/auth.js';

/* ------------------------------------------------------------------ */
/*  GET /api/auth/exists/:mobile                                         */
/* ------------------------------------------------------------------ */
export async function checkExists(req, res) {
  try {
    const mobile = normalizeMobile10(req.params.mobile);
    const result = await checkUserExists(mobile);
    res.json(result);
  } catch (e) {
    res.status(400).json({ message: e.message || 'invalid mobile' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/send-otp                                              */
/* ------------------------------------------------------------------ */
export async function sendOtp(req, res) {
  try {
    console.log('checking request');
    
    const mobile = normalizeMobile10(req.body?.mobile);
    const r = await sendFarmerOTP(mobile);
    res.json({ ok: true, message: r.message || 'OTP sent' });
  } catch (e) {
    const vendorStatus = e.vendorStatus || e.response?.status;
    const vendorBody = e.vendorBody || e.response?.data;
    if (vendorStatus) {
      return res.status(502).json({
        ok: false,
        message: vendorBody?.message || vendorBody?.errors || vendorBody?.reason || e.message || 'OTP delivery failed (provider)',
        vendorStatus,
        details: vendorBody,
      });
    }
    return res.status(500).json({ ok: false, message: e.message || 'Failed to send OTP' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/verify-otp                                            */
/* ------------------------------------------------------------------ */
export async function verifyOtp(req, res) {
  try {
    const mobile = normalizeMobile10(req.body?.mobile);
    const code = String(req.body?.code || '').trim();
    const role = (req.body?.role || 'farmer').toLowerCase();
    const name = req.body?.name;
    const address = req.body?.address;

    if (!code) return res.status(400).json({ message: 'OTP code required' });

    const result = await verifyFarmerOTP(mobile, code);
    if (!result.ok) return res.status(400).json({ message: result.message || 'Invalid OTP' });

    const existingUser = await getFullUserByMobile(mobile);

    if (!existingUser) {
      await createUser(mobile, role, name, address);
    } else {
      if (existingUser.blocked) {
        return res.status(403).json({ message: 'You are blocked from messaging.' });
      }
      await updateUser(existingUser.id, name, address, role);
    }

    const user = await getFullUserByMobile(mobile);

    req.session.farmer = { id: user.id, mobile: user.mobile, role: user.role, name: user.name, address: user.address };
    req.session.mobile = user.mobile;
    req.session.user = { id: user.id, mobile: user.mobile, role: user.role };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: 'session error' });
      return res.json({ ok: true, user });
    });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'invalid input' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                                 */
/* ------------------------------------------------------------------ */
export async function login(req, res) {
  try {
    const mobile = normalizeMobile10(req.body?.mobile);
    const user = await getFullUserByMobile(mobile);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.blocked) return res.status(403).json({ message: 'You are blocked from messaging.' });
    if (!user.is_verified) return res.status(403).json({ message: 'OTP verification required' });

    req.session.farmer = { id: user.id, mobile: user.mobile, role: user.role, name: user.name, address: user.address };
    req.session.mobile = user.mobile;
    req.session.user = { id: user.id, mobile: user.mobile, role: user.role };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: 'session error' });
      res.json({ ok: true, user });
    });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'invalid input' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/auth/farmer-profile                                         */
/* ------------------------------------------------------------------ */
export async function getFarmerProfileSelf(req, res) {
  try {
    const userId = requireUserId(req);
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const p = await getFarmerProfile(userId);
    const profile = {
      full_name: p?.full_name || user.name || '',
      mobile: user.mobile,
      whatsapp: p?.whatsapp || user.mobile,
      village: p?.village || '',
      taluk: p?.taluk || '',
      district: p?.district || '',
      pincode: p?.pincode || '',
      land_size: p?.land_size || '',
      crops_text: p?.crops_text || '',
    };
    return res.json({ ok: true, profile });
  } catch (e) {
    if (e.message === 'NOT_AUTHENTICATED') return res.status(401).json({ ok: false, message: 'Login required' });
    console.error('GET /auth/farmer-profile error:', e);
    return res.status(500).json({ ok: false, message: 'Failed to load profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/farmer-profile                                        */
/* ------------------------------------------------------------------ */
export async function saveFarmerProfileSelf(req, res) {
  try {
    const userId = requireUserId(req);
    let { full_name, whatsapp, village, taluk, district, pincode, land_size, crops_text } = req.body || {};

    if (!full_name || !village || !taluk || !district || !pincode) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const wa = (whatsapp || '').trim();
    const whatsappFinal = wa || user.mobile;
    land_size = (land_size || '').trim() || null;
    crops_text = (crops_text || '').trim() || null;

    await upsertFarmerProfile(userId, user.mobile, { full_name, whatsapp: whatsappFinal, village, taluk, district, pincode, land_size, crops_text });
    return res.json({ ok: true, message: 'Profile saved' });
  } catch (e) {
    if (e.message === 'NOT_AUTHENTICATED') return res.status(401).json({ ok: false, message: 'Login required' });
    console.error('POST /auth/farmer-profile error:', e);
    return res.status(500).json({ ok: false, message: 'Failed to save profile' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me  &  POST /api/auth/logout                          */
/* ------------------------------------------------------------------ */
export function me(req, res) {
  res.json({
    ok: true,
    farmer: req.session?.farmer || null,
    user: req.session?.user || null,
    mobile: req.session?.mobile || null,
  });
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}
