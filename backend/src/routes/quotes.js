// src/routes/quotes.js
import express from 'express';
import { quotesUpload } from '../middlewares/upload.js';
import { ensureAdminSession } from '../middlewares/auth.js';
import {
  attachQuotesSocket,
  getLatestByMobile,
  listByMobile,
  uploadQuotation,
  markPaid,
  removeQuotation,
} from '../controllers/quotationController.js';
import { validateBody } from '../middlewares/validate.js';
import { uploadQuotationSchema } from '../validations/schemas.js';

const router = express.Router();

// Socket attachment export (used by server.js if needed)
export { attachQuotesSocket };

router.get('/latest-by-mobile/:mobile', getLatestByMobile);
router.get('/list-by-mobile/:mobile', listByMobile);
router.post('/upload', ensureAdminSession, quotesUpload.single('file'), validateBody(uploadQuotationSchema), uploadQuotation);
router.post('/mark-paid/:id', markPaid);
router.delete('/:id', ensureAdminSession, removeQuotation);

export default router;
