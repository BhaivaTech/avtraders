import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../../src/config/db.js';
import { syncQuotationPaymentState, insertQuotation } from '../../src/models/quotationModel.js';
import { getChatThread } from '../../src/models/chatModel.js';
import { updatePaymentStatus } from '../../src/models/paymentModel.js';
import { getIo } from '../../src/utils/socketBus.js';
import { quotationPaymentState } from '../../../frontend/src/lib/quotationPayment.js';

vi.mock('../../src/utils/socketBus.js', () => ({ getIo: vi.fn() }));
let connection;
const payment = { id: 9, chat_id: 2, status: 'failed', amount: 500, meta: JSON.stringify({ quotation_id: 4 }) };
const quote = { id: 4, chat_id: 2, message_id: 30, status: 'PENDING', amount: 500 };
function setup(p = payment, q = quote, latest = { id: 9, status: p.status }) {
  connection.query.mockResolvedValueOnce([[p]]).mockResolvedValueOnce([[q]]).mockResolvedValueOnce([[latest]]).mockResolvedValue([{}]);
}
beforeEach(() => {
  vi.clearAllMocks();
  connection = { query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
  vi.spyOn(pool, 'getConnection').mockResolvedValue(connection);
  getIo.mockReturnValue({ emit: vi.fn() });
});
afterEach(() => vi.restoreAllMocks());

describe('quotation payment synchronization', () => {
  it('returns the real quotation ID when uploading a quotation', async () => {
    connection.query.mockResolvedValue([{ insertId: 4 }]);
    expect(await insertQuotation(connection, 2, 30, 'quote.pdf', 500)).toBe(4);
  });
  it('marks successful payment on the exact quotation and chat message', async () => {
    setup({ ...payment, status: 'success' });
    await syncQuotationPaymentState(9);
    expect(connection.query.mock.calls[3][0]).toContain("SET status='PAID'");
    expect(connection.query.mock.calls[4][1]).toEqual([4, 'PAID', 9, 30]);
    expect(connection.commit).toHaveBeenCalled();
    expect(getIo().emit).toHaveBeenCalledWith('chat:payment', { chat_id: 2, quotation_id: 4, payment_status: 'PAID' });
  });
  it('records failure on the message while keeping the quotation retryable', async () => {
    setup(); await syncQuotationPaymentState(9);
    expect(connection.query.mock.calls[3][1]).toEqual([4, 'FAILED', 9, 30]);
    expect(connection.query.mock.calls.filter(([sql]) => sql.startsWith('UPDATE quotations'))).toHaveLength(0);
  });
  it('keeps a quotation paid when a delayed failed attempt arrives', async () => {
    setup(payment, { ...quote, status: 'PAID' }); await syncQuotationPaymentState(9);
    expect(connection.query.mock.calls[4][1][1]).toBe('PAID');
  });
  it('uses the newer pending retry instead of an old failed attempt', async () => {
    setup(payment, quote, { id: 10, status: 'pending' }); await syncQuotationPaymentState(9);
    expect(connection.query.mock.calls[3][1]).toEqual([4, 'PENDING', 10, 30]);
  });
  it('accepts JSON objects returned by the database driver', async () => {
    setup({ ...payment, meta: { quotation_id: 4 } }); await syncQuotationPaymentState(9);
    expect(connection.commit).toHaveBeenCalled();
  });
  it('does not guess a quotation for old unlinked payment records', async () => {
    connection.query.mockResolvedValueOnce([[{ ...payment, meta: '{}' }]]);
    await syncQuotationPaymentState(9);
    expect(connection.rollback).toHaveBeenCalled(); expect(connection.query).toHaveBeenCalledTimes(1);
    expect(getIo().emit).not.toHaveBeenCalled();
  });
  it.each([{ ...quote, chat_id: 8 }, { ...quote, amount: 200 }])('does not apply payment to a mismatched quotation %j', async q => {
    setup(payment, q); await syncQuotationPaymentState(9);
    expect(connection.rollback).toHaveBeenCalled(); expect(connection.commit).not.toHaveBeenCalled();
  });
  it('rolls back when persisting chat status fails', async () => {
    setup(); connection.query.mockReset().mockResolvedValueOnce([[payment]]).mockResolvedValueOnce([[quote]]).mockResolvedValueOnce([[{ id: 9, status: 'failed' }]]).mockRejectedValueOnce(new Error('write failed'));
    await expect(syncQuotationPaymentState(9)).rejects.toThrow('write failed');
    expect(connection.rollback).toHaveBeenCalled(); expect(getIo().emit).not.toHaveBeenCalled();
  });
  it('prevents a stored successful payment from being downgraded', async () => {
    const spy = vi.spyOn(pool, 'query').mockResolvedValue([{}]);
    await updatePaymentStatus(9, 'failed', null, {});
    expect(spy.mock.calls[0][0]).toContain("status <> 'success' OR ? = 'success'");
  });
});

describe('quotation data in existing chat messages', () => {
  it('adds missing quotation IDs and uses paid database state over stale failure metadata', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue([[{ id: 30, meta: '{"amount":500,"payment_status":"FAILED"}', quotation_id: 4, quotation_status: 'PAID', quotation_payment_status: 'failed', quotation_payment_id: 9 }]]);
    const [message] = await getChatThread(2, 'farmer');
    expect(JSON.parse(message.meta)).toMatchObject({ quotation_id: 4, payment_status: 'PAID', payment_id: 9 });
  });
  it('returns failed status and the exact ID for retry', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue([[{ id: 30, meta: { amount: 500 }, quotation_id: 4, quotation_status: 'PENDING', quotation_payment_status: 'failed', quotation_payment_id: 9 }]]);
    const [message] = await getChatThread(2, 'admin');
    expect(JSON.parse(message.meta)).toMatchObject({ quotation_id: 4, payment_status: 'FAILED', payment_id: 9 });
  });
});

describe('quotation button states', () => {
  it.each(['PAID', 'COMPLETED', 'SUCCESS'])('recognizes success state %s', state => expect(quotationPaymentState({ payment_status: state })).toBe('success'));
  it.each(['FAILED', 'CANCELLED', 'DECLINED', 'EXPIRED'])('recognizes retryable state %s', state => expect(quotationPaymentState({ payment_status: state })).toBe('failed'));
  it('does not treat pending payment as a failure', () => expect(quotationPaymentState({ payment_status: 'PENDING' })).toBe('pending'));
  it('shows Pay before any attempt', () => expect(quotationPaymentState({ amount: 500 })).toBe('unpaid'));
});
