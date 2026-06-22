// src/routes/farmers.js
import express from 'express';
import { ensureAdminSession, requireFarmerSession } from '../middlewares/auth.js';
import { getProfileMe, getProfileAdmin, saveProfile } from '../controllers/farmerController.js';
import { validateBody } from '../middlewares/validate.js';
import { saveFarmerProfileSchema } from '../validations/schemas.js';

const router = express.Router();

router.get('/profile/me', requireFarmerSession, getProfileMe);
router.get('/profile/admin', ensureAdminSession, getProfileAdmin);
router.post('/profile/save', requireFarmerSession, validateBody(saveFarmerProfileSchema), saveProfile);

export default router;
