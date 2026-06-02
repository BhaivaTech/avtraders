// src/models/userModel.js
// All DB queries for 'users' and 'farmer_profiles' tables.

import { pool } from '../config/db.js';
import { normalizeMobile10 } from '../utils/msisdn.js';

/* ------------------------------------------------------------------ */
/*  Users                                                                */
/* ------------------------------------------------------------------ */

export async function findUserByMobile(mobile) {
  const [rows] = await pool.query(
    'SELECT id, name, address, role, is_verified, blocked, mobile, whatsapp FROM users WHERE mobile=? LIMIT 1',
    [mobile]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, mobile, whatsapp FROM users WHERE id=? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function checkUserExists(mobile) {
  const [rows] = await pool.query(
    'SELECT id, name, address, role, is_verified, blocked FROM users WHERE mobile=? LIMIT 1',
    [mobile]
  );
  return { exists: rows.length > 0, user: rows[0] || null };
}

export async function createUser(mobile, role, name, address) {
  await pool.query(
    'INSERT INTO users (mobile, role, name, address, is_verified) VALUES (?,?,?,?,1)',
    [mobile, role, name || null, address || null]
  );
}

export async function updateUser(id, name, address, role) {
  await pool.query(
    'UPDATE users SET name=COALESCE(?, name), address=COALESCE(?, address), role=COALESCE(?, role), is_verified=1 WHERE id=?',
    [name || null, address || null, role || null, id]
  );
}

export async function updateUserNameWhatsapp(id, name, whatsapp) {
  await pool.query(
    'UPDATE users SET name = ?, whatsapp = ? WHERE id = ?',
    [name, whatsapp || null, id]
  );
}

export async function getFullUserByMobile(mobile) {
  const [rows] = await pool.query(
    'SELECT id, role, name, address, mobile, is_verified, blocked FROM users WHERE mobile=? LIMIT 1',
    [mobile]
  );
  return rows[0] || null;
}

/* ------------------------------------------------------------------ */
/*  Farmer Profiles                                                      */
/* ------------------------------------------------------------------ */

export async function getFarmerProfile(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, full_name, mobile, whatsapp, village, taluk,
            district, pincode, land_size, crops_text, created_at, updated_at
     FROM farmer_profiles WHERE user_id=? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function upsertFarmerProfile(userId, mobile, data) {
  const { full_name, whatsapp, village, taluk, district, pincode, land_size, crops_text } = data;
  await pool.query(
    `INSERT INTO farmer_profiles
       (user_id, full_name, mobile, whatsapp, village, taluk, district, pincode, land_size, crops_text)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       full_name  = VALUES(full_name),
       whatsapp   = VALUES(whatsapp),
       village    = VALUES(village),
       taluk      = VALUES(taluk),
       district   = VALUES(district),
       pincode    = VALUES(pincode),
       land_size  = VALUES(land_size),
       crops_text = VALUES(crops_text)`,
    [userId, full_name, mobile, whatsapp || null, village, taluk, district, pincode, land_size || null, crops_text || null]
  );
}

export async function getFarmerProfileWithUser(userId) {
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
  return rows[0] || null;
}

export async function getFarmerProfileByMobile(mobile) {
  const [rows] = await pool.query(
    `SELECT 
       u.id AS user_id,
       COALESCE(fp.full_name, u.name)    AS full_name,
       u.name                            AS account_name,
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
     WHERE u.mobile = ?
     ORDER BY fp.id DESC
     LIMIT 1`,
    [mobile]
  );
  return rows[0] || null;
}
