// src/controllers/dealerController.js
// ⚠️  DEPRECATED: This file is kept for backward compatibility.
// All dealer controller logic has been split into:
//   - src/controllers/dealer/auth.js      (OTP send/verify, JWT)
//   - src/controllers/dealer/register.js  (registration)
//   - src/controllers/dealer/pricelist.js (price list & downloads)
//
// New code should import from src/controllers/dealer/index.js directly.

export {
  sendOtp,
  verifyOtp,
  sendOtpLimiter,
  signDealerJwt,
} from './dealer/index.js';

export { register } from './dealer/register.js';
export { getPricelist, downloadPricelist } from './dealer/pricelist.js';

// Re-export the helper that was previously here
export { normalizePhone10 } from '../utils/helpers.js';
