// src/routes/farmers.js
import express from 'express';
import { ensureAdminSession } from '../middlewares/auth.js';
import { getProfileMe, getProfileAdmin, saveProfile } from '../controllers/farmerController.js';

const router = express.Router();

router.get('/profile/me', getProfileMe);
router.get('/profile/admin', ensureAdminSession, getProfileAdmin);
router.post('/profile/save', saveProfile);

export default router;
