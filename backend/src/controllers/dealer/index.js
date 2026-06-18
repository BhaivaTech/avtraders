// src/controllers/dealer/index.js
// Barrel file: re-exports from split modules for backward compatibility.

export { sendOtp, verifyOtp, simpleLogin, me, logout, signDealerJwt } from './auth.js';
export { register } from './register.js';
export { getPricelist, downloadPricelist } from './pricelist.js';

import rateLimit from 'express-rate-limit';
export const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many OTP requests. Try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});
