// src/models/announcementModel.js
// All DB queries for the 'announcements' table.

import { pool } from '../config/db.js';

const COLUMNS = `
  id, type, title, body, message, link_url, image_url,
  active, starts_at, ends_at, pinned, created_by, created_at, updated_at
`;

/* ------------------------------------------------------------------ */
/*  Public read paths                                                   */
/* ------------------------------------------------------------------ */

/**
 * Active items that are also inside their schedule window. The
 * ticker on the public site calls this.
 */
export async function listActive() {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}
       FROM announcements
      WHERE active = 1
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at   IS NULL OR ends_at   >= NOW())
      ORDER BY pinned DESC, created_at DESC
      LIMIT 200`
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/*  Admin read paths                                                    */
/* ------------------------------------------------------------------ */

/**
 * Every row, newest first. Admin list view.
 */
export async function listAll() {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}
       FROM announcements
      ORDER BY created_at DESC
      LIMIT 500`
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}
       FROM announcements
      WHERE id = ?
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/* ------------------------------------------------------------------ */
/*  Write paths                                                         */
/* ------------------------------------------------------------------ */

export async function createAnnouncement(data, createdBy = null) {
  const [result] = await pool.query(
    `INSERT INTO announcements
       (type, title, body, message, link_url, image_url,
        active, starts_at, ends_at, pinned, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.type,
      data.title,
      data.body,
      data.body, // keep message in sync
      data.link_url,
      data.image_url,
      data.active,
      data.starts_at,
      data.ends_at,
      data.pinned,
      createdBy,
    ]
  );
  return result.insertId;
}

export async function updateAnnouncement(id, data) {
  const [result] = await pool.query(
    `UPDATE announcements
        SET type      = ?,
            title     = ?,
            body      = ?,
            message   = ?,
            link_url  = ?,
            image_url = ?,
            active    = ?,
            starts_at = ?,
            ends_at   = ?,
            pinned    = ?
      WHERE id = ?`,
    [
      data.type,
      data.title,
      data.body,
      data.body,
      data.link_url,
      data.image_url,
      data.active,
      data.starts_at,
      data.ends_at,
      data.pinned,
      id,
    ]
  );
  return result.affectedRows > 0;
}

export async function setActive(id, active) {
  const [result] = await pool.query(
    `UPDATE announcements SET active = ? WHERE id = ?`,
    [active ? 1 : 0, id]
  );
  return result.affectedRows > 0;
}

export async function setPinned(id, pinned) {
  const [result] = await pool.query(
    `UPDATE announcements SET pinned = ? WHERE id = ?`,
    [pinned ? 1 : 0, id]
  );
  return result.affectedRows > 0;
}

/**
 * Soft-delete: set active=0 and close the schedule window so it
 * stops showing on the public list immediately.
 */
export async function softDeleteAnnouncement(id) {
  const [result] = await pool.query(
    `UPDATE announcements
        SET active = 0,
            ends_at = COALESCE(ends_at, NOW())
      WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}
