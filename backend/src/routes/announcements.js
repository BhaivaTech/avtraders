// src/routes/announcements.js
import express from 'express';
import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  postAnnouncement,
  putAnnouncement,
  patchAnnouncementVisibility,
  patchAnnouncementPin,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { adminMutationLimiter } from '../middlewares/rateLimiter.js';
import { announcementUpload } from '../middlewares/upload.js';
import {
  postAnnouncementSchema,
  putAnnouncementSchema,
} from '../validations/schemas.js';

const router = express.Router();

// Public ticker
router.get('/', getAnnouncements);

// Admin CRUD
router.get('/all',    ensureAdminSession, getAllAnnouncements);
router.get('/:id',    ensureAdminSession, getAnnouncementById);
router.post('/',
  ensureAdminSession,
  adminMutationLimiter(),
  announcementUpload.single('image'),
  validateBody(postAnnouncementSchema),
  postAnnouncement
);
router.put('/:id',
  ensureAdminSession,
  adminMutationLimiter(),
  announcementUpload.single('image'),
  validateBody(putAnnouncementSchema),
  putAnnouncement
);
router.patch('/:id/visibility', ensureAdminSession, adminMutationLimiter(), patchAnnouncementVisibility);
router.patch('/:id/pin',        ensureAdminSession, adminMutationLimiter(), patchAnnouncementPin);
router.delete('/:id',           ensureAdminSession, adminMutationLimiter(), deleteAnnouncement);

export default router;
