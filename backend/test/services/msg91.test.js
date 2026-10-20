import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { sendWhatsAppTemplate } from '../../src/services/msg91.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
const otpRequest = { kind: 'dealer', toMsisdn: '9999999999', bodyText: '123456', buttonText: '123456' };
beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries({ DEALER_MSG91_AUTH_KEY: 'test-key', DEALER_MSG91_WA_TEMPLATE_NAME: 'otp_login_1', DEALER_MSG91_WA_NAMESPACE: 'test-namespace', DEALER_MSG91_WA_INTEGRATED_NUMBER: '919000000000', DEALER_MSG91_WA_LANG_CODE: 'en', DEALER_MSG91_WA_BUTTON_PREFIX: '', MSG91_WA_BUTTON_PREFIX: '' })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

describe('dealer WhatsApp OTP payload', () => {
  it('sends matching OTP body and copy-code button with the documented MSG91 format', async () => {
    axios.post.mockResolvedValueOnce({ status: 200, data: { status: 'success', hasError: false } });
    const result = await sendWhatsAppTemplate(otpRequest);
    const template = axios.post.mock.calls[0][1].payload.template;
    expect(template.to_and_components).toEqual([{ to: ['919999999999'], components: { body_1: { type: 'text', value: '123456' }, button_1: { subtype: 'url', type: 'text', value: '123456' } } }]);
    expect(result.ok).toBe(true); expect(axios.post).toHaveBeenCalledTimes(1);
  });
  it.each([{ status: 'fail', hasError: true }, { success: false }, { type: 'error' }])('does not mistake HTTP 200 with %j for a successful send', async data => {
    axios.post.mockResolvedValue({ status: 200, data });
    await expect(sendWhatsAppTemplate(otpRequest)).rejects.toThrow('MSG91 WhatsApp rejected');
  });
  it('falls back to Meta-style components only after an explicit rejection', async () => {
    axios.post.mockResolvedValueOnce({ status: 400, data: { message: 'Unsupported shape' } }).mockResolvedValueOnce({ status: 200, data: { status: 'success' } });
    await sendWhatsAppTemplate(otpRequest);
    expect(axios.post.mock.calls[1][1].payload.template.components).toContainEqual({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: '123456' }] });
  });
  it.each([401, 403, 429, 503])('does not repeat OTP sends for HTTP %s', async status => {
    axios.post.mockResolvedValue({ status, data: { status: 'fail' } });
    await expect(sendWhatsAppTemplate(otpRequest)).rejects.toThrow();
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
  it('does not resend automatically after an indeterminate network timeout', async () => {
    axios.post.mockRejectedValueOnce(new Error('timeout'));
    await expect(sendWhatsAppTemplate(otpRequest)).rejects.toThrow('timeout');
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
