// src/models/productModel.js
// All DB queries for the 'products' table.

import { pool } from '../config/db.js';

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export async function getAllProducts() {
  const [rows] = await pool.query(
    'SELECT id, name, unit, price, is_active, created_at FROM products ORDER BY id ASC'
  );
  return rows;
}

export async function getActiveProducts() {
  const [rows] = await pool.query(
    'SELECT id, name, unit, price, created_at FROM products WHERE is_active = 1 ORDER BY id ASC'
  );
  return rows;
}

export async function createProduct({ name, unit, price }) {
  const [ins] = await pool.query(
    'INSERT INTO products (name, unit, price, is_active, created_at) VALUES (?, ?, ?, 1, ?)',
    [name, unit || 'pcs', Number(price) || 0, nowSql()]
  );
  return ins.insertId;
}

export async function updateProduct(id, { name, unit, price, is_active }) {
  const [res] = await pool.query(
    'UPDATE products SET name = ?, unit = ?, price = ?, is_active = ? WHERE id = ?',
    [name, unit || 'pcs', Number(price) || 0, is_active ? 1 : 0, id]
  );
  return res.affectedRows > 0;
}

export async function softDeleteProduct(id) {
  const [res] = await pool.query(
    'UPDATE products SET is_active = 0 WHERE id = ?',
    [id]
  );
  return res.affectedRows > 0;
}
