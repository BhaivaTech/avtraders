// src/controllers/announcementController.js
// Business logic for announcement endpoints.

import {
  listActive,
  listAll,
  findById,
  createAnnouncement,
  updateAnnouncement,
  setActive,
  setPinned,
  softDeleteAnnouncement,
} from '../models/announcementModel.js';
import { insertAuthAudit, requestAuditMeta } from '../models/authAuditModel.js';
import { normalizeAnnouncement } from '../validations/schemas.js';
import logger from '../utils/logger.js';

const adminActor = (req) =>
  req.session?.adminEmail || req.session?.admin || 'admin';

/* ------------------------------------------------------------------ */
/*  Public                                                              */
/* ------------------------------------------------------------------ */

export async function getAnnouncements(_req, res) {
  try {
    const items = await listActive();
    res.json({ ok: true, items });
  } catch (err) {
    logger.error({ err }, '[announcements] listActive failed');
    res.status(500).json({ ok: false, message: 'DB error' });
  }
}

/* ------------------------------------------------------------------ */
/*  Admin                                                               */
/* ------------------------------------------------------------------ */

export async function getAllAnnouncements(req, res) {
  try {
    const items = await listAll();
    res.json({ ok: true, items });
  } catch (err) {
    logger.error({ err }, '[announcements] listAll failed');
    res.status(500).json({ ok: false, message: 'DB error' });
  }
}

export async function getAnnouncementById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  try {
    const item = await findById(id);
    if (!item) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) {
    logger.error({ err, id }, '[announcements] findById failed');
    res.status(500).json({ ok: false, message: 'DB error' });
  }
}

export async function postAnnouncement(req, res) {
  try {
    const data = normalizeAnnouncement(req.body || {});
    // Image: prefer uploaded file, fall back to URL in body
    if (req.file) {
      data.image_url = `/uploads/announcements/${req.file.filename}`;
    }
    const id = await createAnnouncement(data, adminActor(req));
    await insertAuthAudit({
      actorType: 'admin',
      actorId:   adminActor(req),
      action:    'announcement_create',
      success:   true,
      ...requestAuditMeta(req, { announcement_id: id, type: data.type }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    logger.error({ err }, '[announcements] create failed');
    res.status(500).json({ ok: false, message: 'Could not save announcement.' });
  }
}

export async function putAnnouncement(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  try {
    const data = normalizeAnnouncement(req.body || {});
    // Image: prefer uploaded file, fall back to URL in body
    if (req.file) {
      data.image_url = `/uploads/announcements/${req.file.filename}`;
    }
    const updated = await updateAnnouncement(id, data);
    if (!updated) return res.status(404).json({ ok: false, message: 'Not found' });
    await insertAuthAudit({
      actorType: 'admin',
      actorId:   adminActor(req),
      action:    'announcement_update',
      success:   true,
      ...requestAuditMeta(req, { announcement_id: id, type: data.type }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    logger.error({ err, id }, '[announcements] update failed');
    res.status(500).json({ ok: false, message: 'Could not update announcement.' });
  }
}

export async function patchAnnouncementVisibility(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  const active = req.body?.active;
  if (typeof active !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'active must be boolean' });
  }
  try {
    const updated = await setActive(id, active);
    if (!updated) return res.status(404).json({ ok: false, message: 'Not found' });
    await insertAuthAudit({
      actorType: 'admin',
      actorId:   adminActor(req),
      action:    active ? 'announcement_show' : 'announcement_hide',
      success:   true,
      ...requestAuditMeta(req, { announcement_id: id }),
    });
    res.json({ ok: true, id, active });
  } catch (err) {
    logger.error({ err, id }, '[announcements] setActive failed');
    res.status(500).json({ ok: false, message: 'Could not change visibility.' });
  }
}

export async function patchAnnouncementPin(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  const pinned = req.body?.pinned;
  if (typeof pinned !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'pinned must be boolean' });
  }
  try {
    const updated = await setPinned(id, pinned);
    if (!updated) return res.status(404).json({ ok: false, message: 'Not found' });
    await insertAuthAudit({
      actorType: 'admin',
      actorId:   adminActor(req),
      action:    pinned ? 'announcement_pin' : 'announcement_unpin',
      success:   true,
      ...requestAuditMeta(req, { announcement_id: id }),
    });
    res.json({ ok: true, id, pinned });
  } catch (err) {
    logger.error({ err, id }, '[announcements] setPinned failed');
    res.status(500).json({ ok: false, message: 'Could not change pin.' });
  }
}

export async function deleteAnnouncement(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: 'Invalid id' });
  }
  try {
    const updated = await softDeleteAnnouncement(id);
    if (!updated) return res.status(404).json({ ok: false, message: 'Not found' });
    await insertAuthAudit({
      actorType: 'admin',
      actorId:   adminActor(req),
      action:    'announcement_delete',
      success:   true,
      ...requestAuditMeta(req, { announcement_id: id }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[announcements] delete failed');
    res.status(500).json({ ok: false, message: 'Could not delete announcement.' });
  }
}
