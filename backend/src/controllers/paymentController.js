// src/controllers/paymentController.js
// Business logic for payment (PhonePe) endpoints.

import crypto from 'crypto';
import { phonepeApi } from '../routes/phonepe-api.js';
import {
  insertPayment,
  updatePaymentMeta,
  updatePaymentStatus,
  getPaymentById,
  getPaymentMetaById,
  findPaymentByMerchantOrderId,
} from '../models/paymentModel.js';
import { markQuotationPaidFromPaymentId } from '../models/quotationModel.js';

const T = (v) => (typeof v === 'string' ? v.trim() : '');
const FRONT_BASE = T(process.env.PUBLIC_BASE_URL || 'http://localhost:5173');
const BACK_BASE = T(process.env.BACKEND_BASE_URL || 'http://localhost:5100');

const toPaise = (inr) => Math.round(Number(inr) * 100);
function makeMerchantOrderId(paymentId) { return `AV${Date.now()}_${paymentId}`.slice(0, 34); }
const parseMeta = (raw) => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };

function resolveState(state) {
  const s = (state || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'success';
  if (s === 'FAILED' || s === 'DECLINED' || s === 'CANCELLED') return 'failed';
  return 'pending';
}

/* ------------------------------------------------------------------ */
/*  PhonePe webhook signature verification                               */
/* ------------------------------------------------------------------ */
/**
 * Verifies the X-VERIFY header sent by PhonePe on webhook calls.
 * Format: SHA256(rawBody + saltKey) + "###" + saltIndex
 * Returns true if PHONEPE_SALT_KEY is not configured (skip in dev).
 */
function verifyPhonePeSignature(rawBody, xVerify) {
  const saltKey = (process.env.PHONEPE_SALT_KEY || '').trim();
  if (!saltKey) return true; // skip verification if not configured

  const parts = (xVerify || '').split('###');
  const receivedHash = parts[0] || '';
  const computedHash = crypto
    .createHash('sha256')
    .update(rawBody + saltKey)
    .digest('hex');
  return computedHash === receivedHash;
}

/* ------------------------------------------------------------------ */
/*  POST /api/payment/create                                             */
/* ------------------------------------------------------------------ */
export async function createPayment(req, res) {
  try {
    const { chat_id, amount, mode } = req.body || {};
    const quotationIdRaw = req.body?.quotation_id ?? req.body?.quote_id ?? null;
    const quotationId = quotationIdRaw ? Number(quotationIdRaw) : null;

    if (!chat_id || amount === undefined || amount === null) {
      return res.status(400).json({ ok: false, error: 'chat_id and amount required' });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'invalid_amount', detail: `Amount must be a positive number. Got: ${amount}` });
    }

    const amountPaise = toPaise(numAmount);
    const paymentId = await insertPayment(chat_id, numAmount);
    const merchantOrderId = makeMerchantOrderId(paymentId);
    const redirectUrl = `${BACK_BASE}/api/payment/phonepe/return?pid=${paymentId}&mo=${encodeURIComponent(merchantOrderId)}`;

    const pay = await phonepeApi.createOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo: { udf1: String(chat_id), quotation_id: quotationId ? String(quotationId) : undefined } });

    const ppRedirect = pay?.redirectUrl || null;
    const meta = { merchantOrderId, redirectUrl: ppRedirect, orderId: pay?.orderId || null, state: pay?.state || 'PENDING', expireAt: pay?.expireAt || null, quotation_id: quotationId || null };
    await updatePaymentMeta(paymentId, 'pending', meta);

    if ((mode || 'REDIRECT').toUpperCase() === 'IFRAME') {
      const tokenUrl = `${BACK_BASE}/api/payment/iframe-token?pid=${paymentId}`;
      return res.json({ ok: true, payment_id: paymentId, provider: 'phonepe', tokenUrl, merchantOrderId });
    }
    return res.json({ ok: true, payment_id: paymentId, provider: 'phonepe', redirectUrl: ppRedirect, checkoutUrl: ppRedirect, merchantOrderId });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const detail = err?.data || err?.response?.data || err?.message || null;
    console.error('PhonePe /create error:', { status, detail });
    return res.status(500).json({ ok: false, error: `phonepe_http_${status}`, detail });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/payment/iframe-token                                        */
/* ------------------------------------------------------------------ */
export async function iframeToken(req, res) {
  try {
    const pid = Number(req.query.pid);
    const row = await getPaymentMetaById(pid);
    const meta = parseMeta(row?.meta);
    if (!meta?.redirectUrl) return res.status(404).json({ ok: false });
    return res.json({ ok: true, redirectUrl: String(meta.redirectUrl) });
  } catch (e) {
    console.error('iframe-token error:', e?.message || e);
    return res.status(500).json({ ok: false });
  }
}

/* ------------------------------------------------------------------ */
/*  ALL /api/payment/phonepe/return                                      */
/* ------------------------------------------------------------------ */
export async function phonePeReturn(req, res) {
  try {
    const paymentId = Number(req.query.pid || req.body?.pid);
    const merchantOrderId = String(req.query.mo || req.body?.mo || '');
    if (!paymentId || !merchantOrderId) return res.redirect(`${FRONT_BASE}/payment-result?pid=0&status=error`);

    const st = await phonepeApi.getOrderStatus(merchantOrderId);
    const final = resolveState(st?.state);
    const txId = st?.paymentDetails?.[0]?.transactionId || st?.transactionId || null;

    const row = await getPaymentMetaById(paymentId);
    const oldMeta = parseMeta(row?.meta);
    const newMeta = { ...oldMeta, statusPayload: st };
    await updatePaymentStatus(paymentId, final, txId, newMeta);
    if (final === 'success') await markQuotationPaidFromPaymentId(paymentId);

    return res.redirect(`${FRONT_BASE}/payment-result?pid=${paymentId}&status=${final}`);
  } catch (err) {
    console.error('PhonePe return status error:', err?.response?.data || err?.message || err);
    return res.redirect(`${FRONT_BASE}/payment-result?pid=0&status=error`);
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/payment/webhook                                            */
/* ------------------------------------------------------------------ */
export async function webhook(req, res) {
  try {
    // Verify PhonePe signature before processing
    const xVerify = req.headers['x-verify'] || '';
    const rawBody = typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);
    if (!verifyPhonePeSignature(rawBody, xVerify)) {
      console.warn('[webhook] Invalid X-VERIFY signature — request rejected');
      return res.status(400).json({ ok: false, error: 'invalid_signature' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { event, payload } = body;
    const state = (payload?.state || '').toUpperCase();
    const merchantOrderId = payload?.merchantOrderId || payload?.orderId || null;
    if (!merchantOrderId) return res.status(200).json({ ok: true });

    const row = await findPaymentByMerchantOrderId(merchantOrderId);
    if (!row) return res.status(200).json({ ok: true });

    const final = resolveState(state);
    const txId = payload?.paymentDetails?.[0]?.transactionId || payload?.transactionId || null;
    const oldMeta = parseMeta(row.meta);
    const newMeta = { ...oldMeta, webhook: { event, payload } };

    await updatePaymentStatus(row.id, final, txId, newMeta);
    if (final === 'success') await markQuotationPaidFromPaymentId(row.id);

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error:', e?.message || e);
    res.status(200).json({ ok: true });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/payment/status/:paymentId                                   */
/* ------------------------------------------------------------------ */
export async function getPaymentStatus(req, res) {
  try {
    const id = Number(req.params.paymentId);
    const p = await getPaymentById(id);
    if (!p) return res.status(404).json({ ok: false });

    const meta = parseMeta(p.meta);
    const merchantOrderId = meta?.merchantOrderId;

    if (p.status === 'pending' && merchantOrderId) {
      const st = await phonepeApi.getOrderStatus(merchantOrderId);
      const final = resolveState(st?.state);
      if (final !== p.status) {
        const txId = st?.paymentDetails?.[0]?.transactionId || st?.transactionId || null;
        const newMeta = { ...meta, statusPayload: st };
        await updatePaymentStatus(id, final, txId, newMeta);
        p.status = final;
        p.txn_id = txId;
        p.meta = JSON.stringify(newMeta);
        if (final === 'success') await markQuotationPaidFromPaymentId(id);
      }
    }
    res.json({ ok: true, payment: p });
  } catch (e) {
    console.error('status error:', e?.message || e);
    res.status(500).json({ ok: false });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/payment/debug/config                                        */
/* ------------------------------------------------------------------ */
export function debugConfig(_req, res) {
  res.json({ ok: true, config: phonepeApi.configPreview() });
}
