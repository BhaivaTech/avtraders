import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { pool } from '../../src/config/db.js';
import { getPricelist, downloadPricelist } from '../../src/controllers/dealer/pricelist.js';
import { decideDealer, uploadPriceList } from '../../src/controllers/dealer/admin.js';
import * as model from '../../src/models/dealerModel.js';
import { notifyDealerDecision } from '../../src/services/dealerNotifications.js';

vi.mock('../../src/models/dealerModel.js', () => ({ findDealerByPhone: vi.fn(), getActivePricelist: vi.fn(), insertDownloadToken: vi.fn(), getDownloadTokenRow: vi.fn() }));
vi.mock('../../src/services/dealerNotifications.js', () => ({ notifyDealerDecision: vi.fn() }));
function response() {
  const res = {};
  for (const method of ['status', 'json', 'send', 'download', 'set']) res[method] = vi.fn(() => res);
  return res;
}
beforeEach(() => vi.clearAllMocks());

describe('dealer price-list authorization', () => {
  const token = { dealer_id: 7, status: 'approved', active: 1, expires_at: new Date(Date.now() + 100000), file_path: 'private.xlsx', file_name: 'prices.xlsx' };
  it('rejects another dealer using a shared token', async () => {
    model.getDownloadTokenRow.mockResolvedValue(token);
    const res = response();
    await downloadPricelist({ query: { token: 'shared' }, dealer: { id: 8 } }, res);
    expect(res.status).toHaveBeenCalledWith(403); expect(res.download).not.toHaveBeenCalled();
  });
  it.each([
    ['rejected dealer', { status: 'rejected' }, 403],
    ['archived workbook', { active: 0 }, 410],
    ['expired token', { expires_at: new Date(0) }, 410],
  ])('rejects %s', async (_name, changes, code) => {
    model.getDownloadTokenRow.mockResolvedValue({ ...token, ...changes });
    const res = response(); await downloadPricelist({ query: { token: 'token' }, dealer: { id: 7 } }, res);
    expect(res.status).toHaveBeenCalledWith(code); expect(res.download).not.toHaveBeenCalled();
  });
  it('downloads only for the approved owner', async () => {
    model.getDownloadTokenRow.mockResolvedValue(token);
    const access = vi.spyOn(fs.promises, 'access').mockResolvedValue();
    const res = response(); await downloadPricelist({ query: { token: 'token' }, dealer: { id: 7 } }, res);
    expect(res.download).toHaveBeenCalledWith('private.xlsx', 'prices.xlsx'); access.mockRestore();
  });
  it('uses current database approval even when the login JWT says pending', async () => {
    model.findDealerByPhone.mockResolvedValue({ id: 7, status: 'approved' });
    model.getActivePricelist.mockResolvedValue({ id: 1, file_name: 'prices.xlsx' });
    const res = response();
    await getPricelist({ dealer: { status: 'approved' }, dealerAuth: { status: 'pending', phone: '9999999999' } }, res);
    expect(model.insertDownloadToken).toHaveBeenCalled(); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });
});

describe('dealer admin review', () => {
  it('requires a reason to reject', async () => {
    const res = response(); await decideDealer({ path: '/1/reject', body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('does not change applications already reviewed', async () => {
    const conn = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValue([[{ id: 1, status: 'approved' }]]), rollback: vi.fn(), release: vi.fn() };
    const spy = vi.spyOn(pool, 'getConnection').mockResolvedValue(conn);
    const res = response(); await decideDealer({ path: '/1/approve', params: { id: 1 }, body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409); expect(conn.rollback).toHaveBeenCalled(); expect(notifyDealerDecision).not.toHaveBeenCalled(); spy.mockRestore();
  });
  it('commits decision and audit before notifying', async () => {
    const conn = { beginTransaction: vi.fn(), query: vi.fn().mockResolvedValueOnce([[{ id: 1, status: 'pending' }]]).mockResolvedValue([{}]), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    const spy = vi.spyOn(pool, 'getConnection').mockResolvedValue(conn);
    notifyDealerDecision.mockImplementation(async () => { expect(conn.commit).toHaveBeenCalled(); return true; });
    const res = response(); await decideDealer({ path: '/1/approve', params: { id: 1 }, body: {}, adminId: 2, session: {} }, res, vi.fn());
    expect(conn.query).toHaveBeenCalledTimes(3); expect(res.json).toHaveBeenCalledWith({ ok: true, notification_warning: true }); spy.mockRestore();
  });
  it('rejects fake Excel files before changing the active workbook', async () => {
    const read = vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('not an Excel workbook'));
    const unlink = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
    const res = response(); await uploadPriceList({ file: { path: 'fake.xlsx' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400); expect(unlink).toHaveBeenCalledWith('fake.xlsx'); read.mockRestore(); unlink.mockRestore();
  });
});
