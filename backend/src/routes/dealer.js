// src/routes/dealer.js
import express from 'express';
import { dealerDocUpload } from '../middlewares/upload.js';
import { authDealer } from '../middlewares/auth.js';
import {
  sendOtpLimiter,
  sendOtp,
  verifyOtp,
  register,
  getPricelist,
  downloadPricelist,
} from '../controllers/dealerController.js';

const router = express.Router();

router.post('/send-otp', sendOtpLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post(
  '/register',
  authDealer,
  dealerDocUpload.fields([
    { name: 'gst_certificate', maxCount: 1 },
    { name: 'insecticide_licence', maxCount: 1 },
  ]),
  register
);
router.get('/pricelist', authDealer, getPricelist);
router.get('/pricelist/download', downloadPricelist);

export default router;