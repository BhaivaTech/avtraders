import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendWhatsAppTemplate } from '../../src/services/msg91.js';
import { findDealerByPhone, upsertDealerOtp } from '../../src/models/dealerModel.js';
import { sendOtp } from '../../src/controllers/dealer/auth.js';

vi.mock('../../src/services/msg91.js', () => ({ sendWhatsAppTemplate: vi.fn() }));
vi.mock('../../src/models/dealerModel.js', () => ({ findDealerByPhone: vi.fn(), upsertDealerOtp: vi.fn(), verifyDealerOtp: vi.fn() }));
vi.mock('../../src/models/authAuditModel.js', () => ({ insertAuthAudit: vi.fn(), requestAuditMeta: () => ({}) }));
vi.mock('../../src/utils/logger.js', () => ({ default: { error: vi.fn() } }));
function response() { const res = {}; res.status = vi.fn(() => res); res.json = vi.fn(() => res); return res; }
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('DEALER_WHATSAPP_PROVIDER', 'msg91'); vi.stubEnv('NODE_ENV', 'production'); findDealerByPhone.mockResolvedValue(null); });
afterEach(() => vi.unstubAllEnvs());
describe('dealer OTP delivery contract', () => {
  it('passes the generated OTP to both message body and copy-code button', async () => {
    sendWhatsAppTemplate.mockResolvedValue({ ok: true });
    const res = response(); await sendOtp({ body: { phone: '9999999999' }, headers: {} }, res);
    const args = sendWhatsAppTemplate.mock.calls[0][0];
    expect(args.bodyText).toMatch(/^\d{6}$/); expect(args.buttonText).toBe(args.bodyText);
    expect(upsertDealerOtp.mock.calls[0][1]).toBe(args.bodyText);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, delivery_status: 'submitted' }));
  });
  it('returns an error when the messaging provider rejects the OTP', async () => {
    sendWhatsAppTemplate.mockRejectedValue(Object.assign(new Error('Template rejected'), { vendorStatus: 400, vendorBody: { private: 'provider diagnostics' } }));
    const res = response(); await sendOtp({ body: { phone: '9999999999' }, headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('Unable to send') });
  });
});
