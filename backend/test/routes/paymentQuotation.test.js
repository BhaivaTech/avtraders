import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../../src/config/db.js';
import { phonepeApi } from '../../src/routes/phonepe-api.js';
import * as payments from '../../src/models/paymentModel.js';
import * as quotes from '../../src/models/quotationModel.js';
import { createPayment, phonePeReturn, getPaymentStatus, webhook } from '../../src/controllers/paymentController.js';

vi.mock('../../src/routes/phonepe-api.js', () => ({ phonepeApi: { createOrder: vi.fn(), getOrderStatus: vi.fn() } }));
vi.mock('../../src/models/paymentModel.js', () => ({ insertPayment: vi.fn(), updatePaymentMeta: vi.fn(), updatePaymentStatus: vi.fn(), getPaymentById: vi.fn(), getPaymentWithOwner: vi.fn(), getPaymentMetaById: vi.fn(), findPaymentByMerchantOrderId: vi.fn() }));
vi.mock('../../src/models/quotationModel.js', () => ({ syncQuotationPaymentState: vi.fn(), getQuotationById: vi.fn() }));
function response() { const res = {}; for (const key of ['status','json','redirect']) res[key] = vi.fn(() => res); return res; }
const req = () => ({ body: { chat_id: 2, amount: 500, quotation_id: 4 }, session: { farmer: { id: 3 } } });
beforeEach(() => {
  vi.clearAllMocks(); vi.spyOn(pool, 'query').mockResolvedValue([[{ owner_id: 3 }]]);
  quotes.getQuotationById.mockResolvedValue({ id: 4, chat_id: 2, status: 'PENDING', amount: 500 });
  payments.insertPayment.mockResolvedValue(9); phonepeApi.createOrder.mockResolvedValue({ redirectUrl: 'https://example.test/pay', state: 'PENDING' });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('payment creation links the exact quotation', () => {
  it('persists quotation ID and synchronizes pending status', async () => {
    const res = response(); await createPayment(req(), res);
    expect(payments.updatePaymentMeta).toHaveBeenCalledWith(9, 'pending', expect.objectContaining({ quotation_id: 4 }));
    expect(quotes.syncQuotationPaymentState).toHaveBeenCalledWith(9);
  });
  it.each([
    [{ id: 4, chat_id: 2, status: 'PAID', amount: 500 }, 409],
    [{ id: 4, chat_id: 8, status: 'PENDING', amount: 500 }, 400],
    [{ id: 4, chat_id: 2, status: 'PENDING', amount: 999 }, 400],
  ])('rejects already paid or mismatched quotation %j', async (quote, status) => {
    quotes.getQuotationById.mockResolvedValue(quote); const res = response(); await createPayment(req(), res);
    expect(res.status).toHaveBeenCalledWith(status); expect(phonepeApi.createOrder).not.toHaveBeenCalled();
  });
  it('rejects payments for another contact', async () => {
    pool.query.mockResolvedValueOnce([[{ owner_id: 99 }]]); const res = response(); await createPayment(req(), res);
    expect(res.status).toHaveBeenCalledWith(403); expect(phonepeApi.createOrder).not.toHaveBeenCalled();
  });
  it('requires an explicit quotation reference', async () => {
    const request = req(); delete request.body.quotation_id; const res = response(); await createPayment(request, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(phonepeApi.createOrder).not.toHaveBeenCalled();
  });
});
describe('payment result synchronization', () => {
  it.each(['COMPLETED','FAILED'])('synchronizes server-verified return state %s', async state => {
    payments.getPaymentMetaById.mockResolvedValue({ meta: { merchantOrderId: 'order-9', quotation_id: 4 } });
    phonepeApi.getOrderStatus.mockResolvedValue({ state }); const res = response();
    await phonePeReturn({ query: { pid: 9, mo: 'order-9' }, body: {} }, res);
    expect(quotes.syncQuotationPaymentState).toHaveBeenCalledWith(9);
  });
  it('does not apply another order’s result to this payment', async () => {
    payments.getPaymentMetaById.mockResolvedValue({ meta: { merchantOrderId: 'order-9' } }); const res = response();
    await phonePeReturn({ query: { pid: 9, mo: 'another-order' }, body: {} }, res);
    expect(phonepeApi.getOrderStatus).not.toHaveBeenCalled(); expect(payments.updatePaymentStatus).not.toHaveBeenCalled();
  });
  it('repairs chat status when a confirmed payment status is read again', async () => {
    payments.getPaymentWithOwner.mockResolvedValue({ id: 9, owner_id: 3, status: 'success', meta: { quotation_id: 4 } }); const res = response();
    await getPaymentStatus({ params: { paymentId: 9 }, session: { farmer: { id: 3 } } }, res);
    expect(quotes.syncQuotationPaymentState).toHaveBeenCalledWith(9); expect(phonepeApi.getOrderStatus).not.toHaveBeenCalled();
  });
  it('rejects an amount-mismatched callback', async () => {
    vi.stubEnv('PHONEPE_SALT_KEY', '');
    payments.findPaymentByMerchantOrderId.mockResolvedValue({ id: 9, amount: 500, meta: { quotation_id: 4 } }); const res = response();
    await webhook({ body: Buffer.from(JSON.stringify({ payload: { merchantOrderId: 'order-9', amount: 1, state: 'COMPLETED' } })), headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(quotes.syncQuotationPaymentState).not.toHaveBeenCalled();
  });
});
