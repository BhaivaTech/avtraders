// src/routes/announcements.js
import express from 'express';
import { getAnnouncements, postAnnouncement } from '../controllers/announcementController.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { postAnnouncementSchema } from '../validations/schemas.js';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', ensureAdminSession, validateBody(postAnnouncementSchema), postAnnouncement);

export default router;
