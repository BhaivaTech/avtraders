import express from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { validateBody } from '../middlewares/validate.js';
import { adminMutationLimiter } from '../middlewares/rateLimiter.js';

const requiredNumber = schema => z.preprocess(value => value === null || (typeof value === 'string' && !value.trim()) ? undefined : value, schema);
export const productSchema = z.object({
  category_id: requiredNumber(z.coerce.number().int().positive()),
  name: z.string().trim().min(1).max(180),
  details: z.string().trim().min(1).max(10000),
  brand: z.string().trim().max(120).default(''),
  product_code: z.string().trim().max(80).default(''),
  pack_quantity: requiredNumber(z.coerce.number().positive().max(999999999).refine(n => Math.abs(n * 1000 - Math.round(n * 1000)) < 0.0001, 'Use up to 3 decimal places')),
  unit: z.enum(['mg', 'gm', 'kg', 'ml', 'litre', 'pcs']),
  price: requiredNumber(z.coerce.number().nonnegative().max(9999999999.99).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001, 'Use up to 2 decimal places')),
  gst_included: z.boolean(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']),
});
const categorySchema = z.object({ name: z.string().trim().min(1).max(120) });
const safe = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(err => {
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A category with this name already exists' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Choose an existing category' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Move all products to another category before deleting this category' });
  next(err);
});

export function requireSuperAdmin(req, res, next) {
  if (req.adminRole !== 'superadmin') return res.status(403).json({ message: 'Only the super admin can manage the product catalogue' });
  next();
}
export function requireApprovedDealer(req, res, next) {
  if (!req.dealer || req.dealer.status !== 'approved' || req.dealer.blocked) return res.status(403).json({ message: 'Catalogue access requires an approved distributor account' });
  next();
}

export function catalogueRouter(admin = false) {
  const router = express.Router();
  router.use(admin ? requireSuperAdmin : requireApprovedDealer);
  router.param('id', (req, res, next, id) => /^\d+$/.test(id) && Number(id) > 0 ? next() : res.status(400).json({ message: 'Invalid ID' }));
  router.use((_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  router.get('/categories', safe(async (_req, res) => {
    const [categories] = await pool.query(`SELECT c.id, c.name, COUNT(p.id) AS product_count FROM dealer_categories c LEFT JOIN dealer_products p ON p.category_id=c.id ${admin ? '' : "AND p.status='published'"} GROUP BY c.id, c.name ORDER BY c.name`);
    res.json({ categories });
  }));
  router.get('/products', safe(async (req, res) => {
    const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
    const params = []; const where = [];
    if (!admin) where.push("p.status='published'");
    else if (req.query.status && req.query.status !== 'all') {
      if (!['draft','published','hidden','archived'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid product status' });
      where.push('p.status=?'); params.push(req.query.status);
    } else if (req.query.status !== 'all') where.push("p.status!='archived'");
    if (req.query.category) {
      if (!/^\d+$/.test(req.query.category)) return res.status(400).json({ message: 'Invalid category' });
      where.push('p.category_id=?'); params.push(req.query.category);
    }
    const search = String(req.query.search || '').trim().slice(0, 180);
    if (search) { where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.product_code LIKE ? OR p.details LIKE ?)'); params.push(...Array(4).fill(`%${search}%`)); }
    const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sorts = { name: 'p.name ASC, p.id ASC', name_desc: 'p.name DESC, p.id DESC', price: 'p.price ASC, p.id ASC', price_desc: 'p.price DESC, p.id DESC', newest: 'p.created_at DESC, p.id DESC', updated: 'p.updated_at DESC, p.id DESC' };
    const sort = Object.hasOwn(sorts, req.query.sort) ? sorts[req.query.sort] : sorts.name;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM dealer_products p ${filter}`, params);
    const [products] = await pool.query(`SELECT p.*, c.name AS category_name FROM dealer_products p JOIN dealer_categories c ON c.id=p.category_id ${filter} ORDER BY ${sort} LIMIT 20 OFFSET ?`, [...params, (page - 1) * 20]);
    res.json({ products, total, page, page_size: 20 });
  }));
  router.get('/products/:id', safe(async (req, res) => {
    const [[product]] = await pool.query(`SELECT p.*, c.name AS category_name FROM dealer_products p JOIN dealer_categories c ON c.id=p.category_id WHERE p.id=? ${admin ? '' : "AND p.status='published'"}`, [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    let history = [];
    if (admin) [history] = await pool.query('SELECT * FROM dealer_product_history WHERE product_id=? ORDER BY id DESC LIMIT 100', [product.id]);
    res.json({ product, history });
  }));
  if (!admin) return router;
  router.use(adminMutationLimiter());
  router.post('/categories', validateBody(categorySchema), safe(async (req, res) => {
    const [result] = await pool.query('INSERT INTO dealer_categories (name) VALUES (?)', [req.body.name]);
    res.status(201).json({ id: result.insertId });
  }));
  router.put('/categories/:id', validateBody(categorySchema), safe(async (req, res) => {
    const [result] = await pool.query('UPDATE dealer_categories SET name=? WHERE id=?', [req.body.name, req.params.id]);
    res.status(result.affectedRows ? 200 : 404).json({ ok: !!result.affectedRows });
  }));
  router.delete('/categories/:id', safe(async (req, res) => {
    const [result] = await pool.query('DELETE FROM dealer_categories WHERE id=?', [req.params.id]);
    res.status(result.affectedRows ? 200 : 404).json({ ok: !!result.affectedRows });
  }));
  const save = safe(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const data = req.body;
      let id = req.params.id; let previous;
      if (id) {
        [[previous]] = await connection.query('SELECT * FROM dealer_products WHERE id=? FOR UPDATE', [id]);
        if (!previous) { await connection.rollback(); return res.status(404).json({ message: 'Product not found' }); }
      }
      const values = [data.category_id, data.name, data.details, data.brand, data.product_code, data.pack_quantity, data.unit, data.price, data.gst_included ? 1 : 0, data.status];
      if (id) await connection.query('UPDATE dealer_products SET category_id=?, name=?, details=?, brand=?, product_code=?, pack_quantity=?, unit=?, price=?, gst_included=?, status=? WHERE id=?', [...values, id]);
      else {
        const [result] = await connection.query('INSERT INTO dealer_products (category_id,name,details,brand,product_code,pack_quantity,unit,price,gst_included,status) VALUES (?,?,?,?,?,?,?,?,?,?)', values);
        id = result.insertId;
      }
      await connection.query('INSERT INTO dealer_product_history (product_id,old_price,new_price,action,actor) VALUES (?,?,?,?,?)', [id, previous?.price ?? null, data.price, !previous ? 'created' : previous.status !== data.status ? data.status : 'updated', String(req.session.adminEmail || req.adminId || 'superadmin')]);
      await connection.commit();
      res.status(previous ? 200 : 201).json({ ok: true, id });
    } catch (err) { await connection.rollback(); throw err; }
    finally { connection.release(); }
  });
  router.post('/products', validateBody(productSchema), save);
  router.put('/products/:id', validateBody(productSchema), save);
  router.patch('/products/:id/status', validateBody(z.object({ status: z.enum(['draft','published','hidden','archived']) })), safe(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[product]] = await connection.query('SELECT * FROM dealer_products WHERE id=? FOR UPDATE', [req.params.id]);
      if (!product) { await connection.rollback(); return res.status(404).json({ message: 'Product not found' }); }
      await connection.query('UPDATE dealer_products SET status=? WHERE id=?', [req.body.status, product.id]);
      await connection.query('INSERT INTO dealer_product_history (product_id,old_price,new_price,action,actor) VALUES (?,?,?,?,?)', [product.id, product.price, product.price, req.body.status, String(req.session.adminEmail || req.adminId || 'superadmin')]);
      await connection.commit(); res.json({ ok: true });
    } catch (err) { await connection.rollback(); throw err; }
    finally { connection.release(); }
  }));
  return router;
}
