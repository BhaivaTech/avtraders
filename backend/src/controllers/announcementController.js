// src/controllers/announcementController.js
// Business logic for announcement endpoints.

import { getLatestAnnouncements, createAnnouncement } from '../models/announcementModel.js';

/* ------------------------------------------------------------------ */
/*  GET /api/announcements                                               */
/* ------------------------------------------------------------------ */
export async function getAnnouncements(req, res) {
  try {
    const items = await getLatestAnnouncements(50);
    res.json({ ok: true, items });
  } catch (err) {
    console.error('GET /api/announcements error:', err);
    res.status(500).json({ ok: false, message: 'DB error' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/announcements                                              */
/* ------------------------------------------------------------------ */
export async function postAnnouncement(req, res) {
  try {
    const { type = 'UPDATE', title = null, body, link_url = null } = req.body;
    if (!body || !String(body).trim()) {
      return res.status(400).json({ ok: false, message: 'Message body is required.' });
    }
    const id = await createAnnouncement({ type, title, body, link_url });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('POST /api/announcements error:', err);
    res.status(500).json({ ok: false, message: 'Could not save announcement.' });
  }
}
