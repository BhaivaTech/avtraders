// src/routes/farmers.js
import express from 'express';
import { ensureAdminSession } from '../middlewares/auth.js';
import { getProfileMe, getProfileAdmin, saveProfile } from '../controllers/farmerController.js';
import { validateBody } from '../middlewares/validate.js';
import { saveFarmerProfileSchema } from '../validations/schemas.js';

const router = express.Router();

router.get('/profile/me', getProfileMe);
router.get('/profile/admin', ensureAdminSession, getProfileAdmin);
router.post('/profile/save', validateBody(saveFarmerProfileSchema), saveProfile);

export default router;
