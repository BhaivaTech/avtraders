// backend/src/routes/phonepe.js
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

/* ------------ ENV CONFIG ------------ */
const {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX = '1',
  PHONEPE_ENV = 'uat', // 'uat' or 'prod'
} = process.env;

if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY) {
  console.warn(
    '[PhonePe] Missing PHONEPE_MERCHANT_ID or PHONEPE_SALT_KEY in .env'
  );
}

/**
 * For Standard Checkout PG v1:
 * UAT  : https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
 * PROD : https://api.phonepe.com/apis/pg/pg/v1/pay
 */
const PHONEPE_BASE_URL =
  PHONEPE_ENV === 'prod'
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

const PAY_PATH = '/pg/v1/pay';
const STATUS_PATH = '/pg/v1/status';

/* ------------ helpers ------------ */
function buildPayChecksum(payloadBase64) {
  const raw = payloadBase64 + PAY_PATH + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');
  return `${sha256}###${PHONEPE_SALT_INDEX}`;
}

function buildStatusChecksum(merchantTxnId) {
  const raw = STATUS_PATH + '/' + PHONEPE_MERCHANT_ID + '/' + merchantTxnId + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');
  return `${sha256}###${PHONEPE_SALT_INDEX}`;
}

/* ------------ CREATE PAYMENT ------------ */
router.post('/create', async (req, res) => {
  try {
    const { amount, mobile, name, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        ok: false,
        error: 'missing_fields',
        message: 'amount and orderId are required',
      });
    }

    // amount in paise
    const finalAmount = Math.round(Number(amount) * 100);

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: mobile || 'guest',
      amount: finalAmount,
      redirectUrl:
        'https://www.avtradersagriclinic.com/phonepe/redirect', // front-end thank-you URL
      redirectMode: 'POST',
      callbackUrl:
        'https://www.avtradersagriclinic.com/api/phonepe/callback', // backend callback URL
      mobileNumber: mobile,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = buildPayChecksum(payloadBase64);

    const url = `${PHONEPE_BASE_URL}${PAY_PATH}`;

    const phonepeRes = await axios.post(
      url,
      { request: payloadBase64 },
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
        },
        timeout: 15000,
      }
    );

    const data = phonepeRes.data;

    if (
      data?.success === true &&
      data?.data?.instrumentResponse?.redirectInfo?.url
    ) {
      return res.json({
        ok: true,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      });
    }

    // Unexpected but not HTTP error
    return res.status(500).json({
      ok: false,
      error: 'phonepe_unexpected_response',
      detail: data,
    });
  } catch (err) {
    const status = err.response?.status;

    if (status === 404) {
      console.error('[PhonePe] 404 from PhonePe:', err.response?.data);
      return res.status(500).json({
        ok: false,
        error: 'phonepe_http_404',
        detail: err.response?.data,
      });
    }

    console.error('[PhonePe] create error:', status, err.response?.data || err);
    return res.status(500).json({
      ok: false,
      error: 'phonepe_http_error',
      status: status || 500,
      detail: err.response?.data || err.message,
    });
  }
});

/* ------------ STATUS (optional, if you need it) ------------ */
router.get('/status/:merchantTransactionId', async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const checksum = buildStatusChecksum(merchantTransactionId);

    const url = `${PHONEPE_BASE_URL}${STATUS_PATH}/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;

    const phonepeRes = await axios.get(url, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
      },
      timeout: 15000,
    });

    return res.json({ ok: true, data: phonepeRes.data });
  } catch (err) {
    console.error('[PhonePe] status error:', err.response?.status, err.response?.data || err);
    return res.status(500).json({
      ok: false,
      error: 'phonepe_status_error',
      detail: err.response?.data || err.message,
    });
  }
});

export default router;
