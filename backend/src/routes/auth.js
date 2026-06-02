// src/routes/auth.js
import express from 'express';
import {
  checkExists,
  sendOtp,
  verifyOtp,
  login,
  getFarmerProfileSelf,
  saveFarmerProfileSelf,
  me,
  logout,
} from '../controllers/authController.js';

const router = express.Router();

router.get('/exists/:mobile', checkExists);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/farmer-profile', getFarmerProfileSelf);
router.post('/farmer-profile', saveFarmerProfileSelf);
router.get('/me', me);
router.post('/logout', logout);

export default router;
