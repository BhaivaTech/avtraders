// src/models/announcementModel.js
// All DB queries for the 'announcements' table.

import { pool } from '../config/db.js';

export async function getLatestAnnouncements(limit = 50) {
  const [rows] = await pool.query(
    `SELECT id, type, title, body, link_url, image_url, created_at
     FROM announcements
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function createAnnouncement({ type = 'UPDATE', title = null, body, link_url = null }) {
  const [result] = await pool.query(
    `INSERT INTO announcements (type, title, body, link_url) VALUES (?, ?, ?, ?)`,
    [type, title, body, link_url]
  );
  return result.insertId;
}
