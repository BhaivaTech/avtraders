// src/controllers/dealer/orders.js
// Business logic for dealer order endpoints.

import {
  createDealerOrder,
  addOrderItem,
  finalizeOrderTotal,
  getOrdersByDealerId,
  getAllOrders,
  updateOrderStatus,
} from '../../models/dealerOrderModel.js';
import { getActiveProducts } from '../../models/productModel.js';
import logger from '../../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  POST /api/dealer/orders  — dealer places a new order                */
/* ------------------------------------------------------------------ */
export async function placeOrder(req, res) {
  const dealer = req.dealer;
  if (!dealer?.id) return res.status(401).json({ ok: false, message: 'Not authenticated' });

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: 'items array is required' });
  }

  // Validate: each item must have productId and qty > 0
  for (const it of items) {
    if (!it.productId || Number(it.qty) <= 0) {
      return res.status(400).json({ ok: false, message: 'Each item needs productId and qty > 0' });
    }
  }

  try {
    // Fetch live prices from DB (never trust client-side prices)
    const activeProducts = await getActiveProducts();
    const priceMap = new Map(activeProducts.map((p) => [p.id, p.price]));

    // Verify all requested products exist and are active
    for (const it of items) {
      if (!priceMap.has(Number(it.productId))) {
        return res.status(400).json({ ok: false, message: `Product ${it.productId} not available` });
      }
    }

    const orderId = await createDealerOrder(dealer.id);
    for (const it of items) {
      const price = priceMap.get(Number(it.productId));
      await addOrderItem(orderId, Number(it.productId), Number(it.qty), price);
    }
    await finalizeOrderTotal(orderId);

    res.json({ ok: true, orderId });
  } catch (err) {
    logger.error({ err, dealerId: dealer.id }, '[dealer/orders] placeOrder failed');
    res.status(500).json({ ok: false, message: 'Failed to place order' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/dealer/orders  — dealer views own orders                   */
/* ------------------------------------------------------------------ */
export async function getMyOrders(req, res) {
  const dealer = req.dealer;
  if (!dealer?.id) return res.status(401).json({ ok: false, message: 'Not authenticated' });

  try {
    const orders = await getOrdersByDealerId(dealer.id);
    res.json({ ok: true, orders });
  } catch (err) {
    logger.error({ err, dealerId: dealer.id }, '[dealer/orders] getMyOrders failed');
    res.status(500).json({ ok: false, message: 'Failed to load orders' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/orders  — admin sees all orders                      */
/* ------------------------------------------------------------------ */
export async function adminGetAllOrders(req, res) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const result = await getAllOrders({
      page: Number(page),
      limit: Math.min(Number(limit), 200),
      status,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    logger.error({ err }, '[admin/orders] adminGetAllOrders failed');
    res.status(500).json({ ok: false, message: 'Failed to load orders' });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/orders/:id/status  — admin updates order status    */
/* ------------------------------------------------------------------ */
export async function adminUpdateOrderStatus(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, message: 'Invalid id' });

  const { status } = req.body || {};
  if (!status) return res.status(400).json({ ok: false, message: 'status is required' });

  try {
    await updateOrderStatus(id, status);
    res.json({ ok: true, id, status });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ ok: false, message: err.message });
    logger.error({ err, id }, '[admin/orders] adminUpdateOrderStatus failed');
    res.status(500).json({ ok: false, message: 'Failed to update order status' });
  }
}
