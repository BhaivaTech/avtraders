import axios from 'axios';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

export async function sendDealerWhatsApp(phone, template, values, authentication = false) {
  const { META_PHONE_NUMBER_ID, META_ACCESS_TOKEN, META_GRAPH_API_VERSION } = process.env;
  if (!META_PHONE_NUMBER_ID || !META_ACCESS_TOKEN || !META_GRAPH_API_VERSION || !template) {
    throw new Error('WhatsApp Cloud API is not configured');
  }
  const components = [{ type: 'body', parameters: values.map(text => ({ type: 'text', text: String(text) })) }];
  if (authentication) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(values[0]) }] });
  await axios.post(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp', to: `91${phone}`, type: 'template',
    template: { name: template, language: { code: process.env.META_TEMPLATE_LANGUAGE || 'en_US' }, components },
  }, { headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` }, timeout: 15000 });
}

export async function notifyDealerDecision(dealer, status, reason) {
  const portal = `${(process.env.PUBLIC_SITE_URL || process.env.APP_ORIGIN || '').replace(/\/$/, '')}/dealers`;
  const text = status === 'approved'
    ? `Your AV Agro Distribution dealer account is approved. Log in to browse the product catalogue and current dealer prices: ${portal}`
    : `Your dealer application was rejected. Reason: ${reason}. Log in to submit corrected documents: ${portal}`;
  const results = await Promise.allSettled([
    sendDealerWhatsApp(dealer.phone, status === 'approved' ? process.env.META_DEALER_APPROVED_TEMPLATE : process.env.META_DEALER_REJECTED_TEMPLATE, status === 'approved' ? [dealer.name, portal] : [dealer.name, reason, portal]),
    dealer.email ? sendEmail({ to: dealer.email, subject: `Dealer application ${status}`, text }) : Promise.resolve(),
  ]);
  results.forEach(result => { if (result.status === 'rejected') logger.warn({ message: result.reason?.message }, 'Dealer notification failed'); });
  return results.some(result => result.status === 'rejected');
}
