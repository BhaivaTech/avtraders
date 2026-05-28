// src/routes/announcements.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

/* ---------------- GET latest announcements ---------------- */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, title, body, link_url, image_url, created_at
       FROM announcements
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error('GET /api/announcements error:', err);
    res.status(500).json({ ok: false, message: 'DB error' });
  }
});

/* ---------------- POST new announcement ---------------- */
router.post('/', async (req, res) => {
  try {
    // 🔴 removed strict admin-session check here

    const { type = 'UPDATE', title = null, body, link_url = null } = req.body;

    if (!body || !String(body).trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'Message body is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO announcements (type, title, body, link_url)
       VALUES (?, ?, ?, ?)`,
      [type, title, body, link_url]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('POST /api/announcements error:', err);
    res
      .status(500)
      .json({ ok: false, message: 'Could not save announcement.' });
  }
});

export default router;
