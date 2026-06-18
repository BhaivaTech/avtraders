// src/models/dealerOrderModel.js
// All DB queries for dealer_orders and dealer_order_items tables.

import { pool } from '../config/db.js';

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/* ------------------------------------------------------------------ */
/*  Orders                                                               */
/* ------------------------------------------------------------------ */

export async function createDealerOrder(dealerId) {
  const [ins] = await pool.query(
    `INSERT INTO dealer_orders (dealer_id, status, total, created_at)
     VALUES (?, 'placed', 0, ?)`,
    [dealerId, nowSql()]
  );
  return ins.insertId;
}

export async function addOrderItem(orderId, productId, qty, price) {
  await pool.query(
    `INSERT INTO dealer_order_items (order_id, product_id, qty, price, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, productId, Number(qty), Number(price), nowSql()]
  );
}

export async function finalizeOrderTotal(orderId) {
  await pool.query(
    `UPDATE dealer_orders
     SET total = (
       SELECT COALESCE(SUM(qty * price), 0) FROM dealer_order_items WHERE order_id = ?
     )
     WHERE id = ?`,
    [orderId, orderId]
  );
}

export async function getOrdersByDealerId(dealerId) {
  const [orders] = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at
     FROM dealer_orders o
     WHERE o.dealer_id = ?
     ORDER BY o.id DESC`,
    [dealerId]
  );
  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const [items] = await pool.query(
    `SELECT oi.order_id, oi.product_id, p.name AS product_name, oi.qty, oi.price
     FROM dealer_order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (?)`,
    [orderIds]
  );

  return orders.map((o) => ({
    ...o,
    items: items.filter((i) => i.order_id === o.id),
  }));
}

export async function getAllOrders({ page = 1, limit = 50, status } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const conditions = status && status !== 'all' ? ['o.status = ?'] : [];
  const params = status && status !== 'all' ? [status] : [];
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [orders] = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at,
            d.name AS dealer_name, d.phone AS dealer_phone, d.firm_name
     FROM dealer_orders o
     LEFT JOIN dealers d ON d.id = o.dealer_id
     ${where}
     ORDER BY o.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM dealer_orders o ${where}`,
    params
  );

  if (!orders.length) return { orders: [], total: 0, page, limit };

  const orderIds = orders.map((o) => o.id);
  const [items] = await pool.query(
    `SELECT oi.order_id, oi.product_id, p.name AS product_name, oi.qty, oi.price
     FROM dealer_order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (?)`,
    [orderIds]
  );

  return {
    orders: orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.id),
    })),
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
  };
}

export async function updateOrderStatus(orderId, status) {
  const VALID = ['placed', 'paid', 'shipped', 'completed', 'cancelled'];
  if (!VALID.includes(status)) throw Object.assign(new Error('Invalid status'), { status: 400 });
  const [res] = await pool.query(
    'UPDATE dealer_orders SET status = ? WHERE id = ?',
    [status, orderId]
  );
  return res.affectedRows > 0;
}
