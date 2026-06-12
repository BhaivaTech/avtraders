// src/routes/dealer.js
import express from 'express';
import { dealerDocUpload } from '../middlewares/upload.js';
import { authDealer } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { otpVerifyLimiter } from '../middlewares/rateLimiter.js';
import { dealerSendOtpSchema, dealerVerifyOtpSchema, dealerRegisterSchema } from '../validations/schemas.js';

// Import from split dealer controller modules
import { sendOtp, verifyOtp, sendOtpLimiter } from '../controllers/dealer/index.js';
import { register } from '../controllers/dealer/register.js';
import { getPricelist, downloadPricelist } from '../controllers/dealer/pricelist.js';

const router = express.Router();

router.post('/send-otp', sendOtpLimiter, validateBody(dealerSendOtpSchema), sendOtp);
router.post('/verify-otp', otpVerifyLimiter(), validateBody(dealerVerifyOtpSchema), verifyOtp);
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
