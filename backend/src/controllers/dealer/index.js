// src/controllers/dealer/index.js
// Barrel file: re-exports from split modules for backward compatibility.
// Existing imports from '../controllers/dealerController.js' will still work
// if they switch to '../controllers/dealer/index.js' or '../controllers/dealer.js'.

export { sendOtp, verifyOtp, signDealerJwt } from './auth.js';
export { register } from './register.js';
export { getPricelist, downloadPricelist } from './pricelist.js';

// Re-export the rate limiter that was previously in dealerController.js
import rateLimit from 'express-rate-limit';
export const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many OTP requests. Try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});
