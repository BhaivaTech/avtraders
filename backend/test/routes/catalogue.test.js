import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { pool } from '../../src/config/db.js';
import { catalogueRouter, productSchema } from '../../src/routes/catalogue.js';

const product = { category_id: 1, name: 'Neem Oil', details: 'Product description', brand: 'AV Agro', product_code: 'AV-01', pack_quantity: 500, unit: 'ml', price: 450, gst_included: true, status: 'published' };
function app({ admin = false, role = 'superadmin', dealer = { id: 1, status: 'approved', blocked: 0 } } = {}) {
  const server = express(); server.use(express.json());
  server.use((req, _res, next) => { req.adminRole = role; req.dealer = dealer; req.session = { adminEmail: 'super@example.test' }; next(); });
  server.use('/catalogue', catalogueRouter(admin));
  server.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return server;
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('catalogue access', () => {
  it.each(['manager', 'support', 'finance', undefined])('rejects non-superadmin role %s', async role => {
    const server = app({ admin: true, role: role || 'unknown' });
    expect((await request(server).get('/catalogue/products')).status).toBe(403);
    expect((await request(server).post('/catalogue/products').send(product)).status).toBe(403);
  });
  it.each([null, { status: 'pending' }, { status: 'rejected' }, { status: 'approved', blocked: 1 }])('rejects unapproved or blocked distributor %j', async dealer => {
    expect((await request(app({ dealer })).get('/catalogue/products')).status).toBe(403);
  });
  it('does not expose writes to approved distributors', async () => {
    const res = await request(app()).post('/catalogue/products').send(product);
    expect(res.status).toBe(404);
  });
  it('forces published-only results even if a distributor asks for hidden products', async () => {
    const spy = vi.spyOn(pool, 'query').mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[{ ...product, id: 1 }]]);
    const res = await request(app()).get('/catalogue/products?status=hidden&category=1&search=Neem&sort=price_desc');
    expect(res.status).toBe(200); expect(res.headers['cache-control']).toContain('no-store');
    expect(spy.mock.calls[0][0]).toContain("p.status='published'");
    expect(spy.mock.calls[1][0]).toContain('ORDER BY p.price DESC');
    expect(spy.mock.calls[1][1]).toEqual(['1', '%Neem%', '%Neem%', '%Neem%', '%Neem%', 0]);
  });
  it('does not return hidden product details', async () => {
    const spy = vi.spyOn(pool, 'query').mockResolvedValue([[]]);
    const res = await request(app()).get('/catalogue/products/2');
    expect(res.status).toBe(404); expect(spy.mock.calls[0][0]).toContain("AND p.status='published'");
  });
  it('uses an allowlist for sorting and binds search input', async () => {
    const spy = vi.spyOn(pool, 'query').mockResolvedValueOnce([[{ total: 0 }]]).mockResolvedValueOnce([[]]);
    await request(app()).get('/catalogue/products').query({ sort: 'DROP TABLE products', search: "' OR 1=1 --", page: '-1' });
    expect(spy.mock.calls[1][0]).toContain('ORDER BY p.name ASC');
    expect(spy.mock.calls[1][0]).not.toContain('DROP TABLE');
    expect(spy.mock.calls[1][1]).toContain("%' OR 1=1 --%");
  });
});

describe('catalogue validation', () => {
  it.each([
    { name: '' }, { details: '' }, { category_id: 0 }, { pack_quantity: 0 }, { pack_quantity: -5 },
    { unit: 'invalid' }, { price: -1 }, { price: 1.001 }, { price: '' }, { price: null }, { status: 'available' }, { gst_included: 'true' },
  ])('rejects invalid product fields %j', invalid => expect(productSchema.safeParse({ ...product, ...invalid }).success).toBe(false));
  it.each(['mg', 'gm', 'kg', 'ml', 'litre', 'pcs'])('accepts pack unit %s', unit => expect(productSchema.safeParse({ ...product, unit }).success).toBe(true));
});

describe('catalogue changes and history', () => {
  it('saves product and price history atomically', async () => {
    const connection = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValueOnce([{ insertId: 4 }]).mockResolvedValue([{}]), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    vi.spyOn(pool, 'getConnection').mockResolvedValue(connection);
    const res = await request(app({ admin: true })).post('/catalogue/products').send(product);
    expect(res.status).toBe(201); expect(res.body.id).toBe(4); expect(connection.commit).toHaveBeenCalled();
    expect(connection.query.mock.calls[1][1]).toEqual([4, null, 450, 'created', 'super@example.test']);
    expect(connection.release).toHaveBeenCalled();
  });
  it('archives a product while preserving its price and recording the actor', async () => {
    const connection = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValueOnce([[{ ...product, price: 400 }]]).mockResolvedValue([{}]), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    vi.spyOn(pool, 'getConnection').mockResolvedValue(connection);
    const res = await request(app({ admin: true })).put('/catalogue/products/4').send({ ...product, status: 'archived' });
    expect(res.status).toBe(200);
    expect(connection.query.mock.calls[2][1]).toEqual(['4', 400, 450, 'archived', 'super@example.test']);
  });
  it('rolls back product changes if history cannot be saved', async () => {
    const connection = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValueOnce([{ insertId: 4 }]).mockRejectedValueOnce(new Error('History unavailable')), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    vi.spyOn(pool, 'getConnection').mockResolvedValue(connection);
    expect((await request(app({ admin: true })).post('/catalogue/products').send(product)).status).toBe(500);
    expect(connection.rollback).toHaveBeenCalled(); expect(connection.commit).not.toHaveBeenCalled();
  });
  it('changes visibility without overwriting the current product price', async () => {
    const connection = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValueOnce([[{ id: 4, price: 999 }]]).mockResolvedValue([{}]), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    vi.spyOn(pool, 'getConnection').mockResolvedValue(connection);
    const res = await request(app({ admin: true })).patch('/catalogue/products/4/status').send({ status: 'hidden', price: 1 });
    expect(res.status).toBe(200);
    expect(connection.query.mock.calls[1][0]).toBe('UPDATE dealer_products SET status=? WHERE id=?');
    expect(connection.query.mock.calls[2][1]).toEqual([4, 999, 999, 'hidden', 'super@example.test']);
  });
  it('prevents deleting a category that still contains products', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(Object.assign(new Error('Referenced'), { code: 'ER_ROW_IS_REFERENCED_2' }));
    const res = await request(app({ admin: true })).delete('/catalogue/categories/1');
    expect(res.status).toBe(409); expect(res.body.message).toContain('Move all products');
  });
  it('reports duplicate categories without a server error', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' }));
    expect((await request(app({ admin: true })).post('/catalogue/categories').send({ name: 'Crop Care' })).status).toBe(409);
  });
});
