// src/routes/products.js
import express from 'express';
import { ensureAdminSession } from '../middlewares/auth.js';
import { adminMutationLimiter } from '../middlewares/rateLimiter.js';
import {
  listPublicProducts,
  listAdminProducts,
  addProduct,
  editProduct,
  removeProduct,
} from '../controllers/productController.js';

const router = express.Router();

// Public — active products only
router.get('/', listPublicProducts);

// Admin — all products including inactive
router.get('/admin', ensureAdminSession, listAdminProducts);
router.post('/admin', ensureAdminSession, adminMutationLimiter(), addProduct);
router.put('/admin/:id', ensureAdminSession, adminMutationLimiter(), editProduct);
router.delete('/admin/:id', ensureAdminSession, adminMutationLimiter(), removeProduct);

export default router;
