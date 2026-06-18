// src/routes/audit.js
import express from 'express';
import { ensureAdminSession } from '../middlewares/auth.js';
import { listAuthAudit, listDealerAudit } from '../controllers/auditController.js';

const router = express.Router();

// All audit routes require admin session
router.get('/auth',   ensureAdminSession, listAuthAudit);
router.get('/dealer', ensureAdminSession, listDealerAudit);

export default router;
