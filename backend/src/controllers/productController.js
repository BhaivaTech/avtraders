// src/controllers/productController.js
// Business logic for product endpoints.

import {
  getAllProducts,
  getActiveProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
} from '../models/productModel.js';
import { insertAuthAudit, requestAuditMeta } from '../models/authAuditModel.js';
import logger from '../utils/logger.js';

const adminActor = (req) => req.session?.adminEmail || 'admin';

/* ------------------------------------------------------------------ */
/*  GET /api/products  — public, active only                            */
/* ------------------------------------------------------------------ */
export async function listPublicProducts(_req, res) {
  try {
    const products = await getActiveProducts();
    res.json({ ok: true, products });
  } catch (err) {
    logger.error({ err }, '[products] listPublicProducts failed');
    res.status(500).json({ ok: false, message: 'Failed to load products' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/products  — admin, all including inactive            */
/* ------------------------------------------------------------------ */
export async function listAdminProducts(_req, res) {
  try {
    const products = await getAllProducts();
    res.json({ ok: true, products });
  } catch (err) {
    logger.error({ err }, '[products] listAdminProducts failed');
    res.status(500).json({ ok: false, message: 'Failed to load products' });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/products                                             */
/* ------------------------------------------------------------------ */
export async function addProduct(req, res) {
  const { name, unit, price } = req.body || {};
  if (!name || price === undefined) {
    return res.status(400).json({ ok: false, message: 'name and price are required' });
  }
  try {
    const id = await createProduct({ name: String(name).trim(), unit, price });
    await insertAuthAudit({
      actorType: 'admin', actorId: adminActor(req),
      action: 'product_create', success: true,
      ...requestAuditMeta(req, { product_id: id }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err }, '[products] addProduct failed');
    res.status(500).json({ ok: false, message: 'Failed to create product' });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/products/:id                                          */
/* ------------------------------------------------------------------ */
export async function editProduct(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, message: 'Invalid id' });

  const { name, unit, price, is_active } = req.body || {};
  if (!name || price === undefined) {
    return res.status(400).json({ ok: false, message: 'name and price are required' });
  }
  try {
    const updated = await updateProduct(id, { name: String(name).trim(), unit, price, is_active });
    if (!updated) return res.status(404).json({ ok: false, message: 'Product not found' });
    await insertAuthAudit({
      actorType: 'admin', actorId: adminActor(req),
      action: 'product_update', success: true,
      ...requestAuditMeta(req, { product_id: id }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[products] editProduct failed');
    res.status(500).json({ ok: false, message: 'Failed to update product' });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/products/:id  — soft delete (is_active = 0)       */
/* ------------------------------------------------------------------ */
export async function removeProduct(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, message: 'Invalid id' });

  try {
    const deleted = await softDeleteProduct(id);
    if (!deleted) return res.status(404).json({ ok: false, message: 'Product not found' });
    await insertAuthAudit({
      actorType: 'admin', actorId: adminActor(req),
      action: 'product_delete', success: true,
      ...requestAuditMeta(req, { product_id: id }),
    });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, '[products] removeProduct failed');
    res.status(500).json({ ok: false, message: 'Failed to delete product' });
  }
}
