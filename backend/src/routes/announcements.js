// src/routes/announcements.js
import express from 'express';
import { getAnnouncements, postAnnouncement } from '../controllers/announcementController.js';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', postAnnouncement);

export default router;
