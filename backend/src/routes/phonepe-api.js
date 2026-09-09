// backend/src/routes/phonepe-api.js
// Pure-REST PhonePe integration (no pg-sdk-node dependency).
//
// Why no SDK? The `pg-sdk-node` tarball URL in package.json
// (phonepe.mycloudrepo.io) serves an empty file, so the installed package
// contains no code and `import("pg-sdk-node")` always throws — which made
// every payment fail with "phonepe_sdk_unavailable". Direct REST calls to
// PhonePe's documented endpoints are equivalent and have zero install risk.
//
// Two credential sets are supported (auto-selected):
//   v2 (Standard Checkout, preferred): PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET
//       / PHONEPE_CLIENT_VERSION  -> OAuth token + /checkout/v2/pay
//   v1 (legacy PG, fallback): PHONEPE_MERCHANT_ID / PHONEPE_SALT_KEY
//       (/ PHONEPE_SALT_INDEX)    -> base64 payload + X-VERIFY + /pg/v1/pay
//
// Both paths expose the same normalized shape so callers don't care:
//   createOrder -> { redirectUrl, orderId, state, expireAt }
//   getOrderStatus -> { orderId, state, amount, expireAt, paymentDetails,
//                      transactionId }

import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

/* ---------- ENV + CONFIG ---------- */

function env(name) {
  return (process.env[name] || "").trim();
}

const rawEnv = env("PHONEPE_ENV") || "sandbox";
const envLower = rawEnv.toLowerCase();

const isProd =
  envLower === "prod" ||
  envLower === "production" ||
  envLower === "live";

const CONF = {
  envRaw: rawEnv,
  env: isProd ? "PRODUCTION" : "SANDBOX",
  isProd,
  // v2 creds
  clientId: env("PHONEPE_CLIENT_ID"),
  clientSecret: env("PHONEPE_CLIENT_SECRET"),
  clientVersion: env("PHONEPE_CLIENT_VERSION"),
  // v1 creds
  merchantId: env("PHONEPE_MERCHANT_ID"),
  saltKey: env("PHONEPE_SALT_KEY"),
  saltIndex: env("PHONEPE_SALT_INDEX") || "1",
};

const hasV2 =
  !!CONF.clientId && !!CONF.clientSecret && !!CONF.clientVersion;
const hasV1 = !!CONF.merchantId && !!CONF.saltKey;
const mode = hasV2 ? "v2" : hasV1 ? "v1" : "unconfigured";

function ensureConfigured() {
  if (mode !== "unconfigured") return;
  throw Object.assign(
    new Error(
      "phonepe_config_missing: set Standard Checkout v2 creds " +
        "(PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET / PHONEPE_CLIENT_VERSION) " +
        "or legacy v1 creds (PHONEPE_MERCHANT_ID / PHONEPE_SALT_KEY). " +
        `Got clientId="${CONF.clientId}", clientVersion="${CONF.clientVersion}", ` +
        `merchantId="${CONF.merchantId}".`
    ),
    { status: 503 }
  );
}

/* ---------- BASE URLs ---------- */

const SANDBOX_BASE = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const PROD_PG_BASE = "https://api.phonepe.com/apis/pg";
const PROD_AUTH_BASE = "https://api.phonepe.com/apis/identity-manager";

const pgBase = isProd ? PROD_PG_BASE : SANDBOX_BASE;
const authBase = isProd ? PROD_AUTH_BASE : SANDBOX_BASE;

const http = axios.create({ timeout: 15000 });

function toHttpError(prefix, e) {
  const status =
    e?.response?.status || e?.status || e?.httpStatusCode || 500;
  const err = new Error(prefix);
  err.status = status;
  err.data = {
    code: e?.code,
    message: e?.message,
    data: e?.response?.data ?? e?.data ?? null,
  };
  return err;
}

/* ---------- v2: OAuth token (cached) ---------- */

let tokenCache = { token: null, expiresAtMs: 0 };

async function getV2Token() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAtMs - 60_000) {
    return tokenCache.token;
  }
  try {
    const res = await http.post(
      `${authBase}/v1/oauth/token`,
      new URLSearchParams({
        client_id: CONF.clientId,
        client_version: CONF.clientVersion,
        client_secret: CONF.clientSecret,
        grant_type: "client_credentials",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const d = res.data || {};
    const token = d.access_token || d.encrypted_access_token;
    if (!token) throw new Error("oauth_empty_token_response");
    // expires_at is epoch seconds; fall back to 10 min if absent
    const expiresAtSec = Number(d.expires_at) || Math.floor(now / 1000) + 600;
    tokenCache = { token, expiresAtMs: expiresAtSec * 1000 };
    return token;
  } catch (e) {
    tokenCache = { token: null, expiresAtMs: 0 };
    throw toHttpError("phonepe_oauth_error", e);
  }
}

const v2Headers = (token) => ({
  "Content-Type": "application/json",
  Authorization: `O-Bearer ${token}`,
});

/* ---------- metaInfo sanitizer ---------- */
// PhonePe only accepts udf1..udf15. The caller passes
// { udf1, quotation_id } — map quotation_id -> udf2, drop the rest.
function buildMetaInfo(metaInfo = {}) {
  const out = {};
  if (metaInfo.udf1 != null) out.udf1 = String(metaInfo.udf1).slice(0, 256);
  const qid = metaInfo.quotation_id ?? metaInfo.udf2;
  if (qid != null && String(qid) !== "undefined")
    out.udf2 = String(qid).slice(0, 256);
  for (let i = 3; i <= 15; i++) {
    const k = `udf${i}`;
    if (metaInfo[k] != null) out[k] = String(metaInfo[k]).slice(0, 256);
  }
  return out;
}

/* ---------- v2 operations ---------- */

async function v2CreateOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo }) {
  const token = await getV2Token();
  const body = {
    merchantOrderId: String(merchantOrderId),
    amount: Number(amountPaise),
    expireAfter: 1200,
    metaInfo: buildMetaInfo(metaInfo),
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: { redirectUrl: String(redirectUrl) },
    },
  };
  try {
    const res = await http.post(`${pgBase}/checkout/v2/pay`, body, {
      headers: v2Headers(token),
    });
    const d = res.data || {};
    return {
      redirectUrl: d.redirectUrl || d.redirect_url || null,
      orderId: d.orderId || d.order_id || null,
      state: d.state || "PENDING",
      expireAt: d.expireAt || d.expire_at || null,
    };
  } catch (e) {
    throw toHttpError("phonepe_http_error", e);
  }
}

async function v2GetOrderStatus(merchantOrderId) {
  const token = await getV2Token();
  try {
    const res = await http.get(
      `${pgBase}/checkout/v2/order/${encodeURIComponent(
        String(merchantOrderId)
      )}/status?details=false&errorContext=true`,
      { headers: v2Headers(token) }
    );
    const d = res.data || {};
    const details = Array.isArray(d.paymentDetails) ? d.paymentDetails : [];
    return {
      ...d,
      orderId: d.orderId || d.order_id || null,
      state: d.state || "PENDING",
      transactionId: details[0]?.transactionId || d.transactionId || null,
    };
  } catch (e) {
    throw toHttpError("phonepe_http_error", e);
  }
}

/* ---------- v1 operations (legacy PG) ---------- */

const V1_PAY_PATH = "/pg/v1/pay";
const V1_STATUS_PATH = "/pg/v1/status";

function v1Checksum(payloadBase64) {
  const raw = payloadBase64 + V1_PAY_PATH + CONF.saltKey;
  return `${crypto.createHash("sha256").update(raw).digest("hex")}###${CONF.saltIndex}`;
}

function v1StatusChecksum(merchantTxnId) {
  const raw =
    `${V1_STATUS_PATH}/${CONF.merchantId}/${merchantTxnId}` + CONF.saltKey;
  return `${crypto.createHash("sha256").update(raw).digest("hex")}###${CONF.saltIndex}`;
}

async function v1CreateOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo }) {
  const payload = {
    merchantId: CONF.merchantId,
    merchantTransactionId: String(merchantOrderId),
    merchantUserId: String(metaInfo?.udf1 || "guest").slice(0, 256),
    amount: Number(amountPaise),
    redirectUrl: String(redirectUrl),
    redirectMode: "REDIRECT",
    callbackUrl: String(redirectUrl),
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  try {
    const res = await http.post(
      `${pgBase}${V1_PAY_PATH}`,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": v1Checksum(payloadBase64),
          "X-MERCHANT-ID": CONF.merchantId,
        },
      }
    );
    const d = res.data || {};
    if (d.success !== true) {
      throw Object.assign(new Error("phonepe_unexpected_response"), {
        response: { status: 502, data: d },
      });
    }
    const redirect =
      d?.data?.instrumentResponse?.redirectInfo?.url || null;
    return {
      redirectUrl: redirect,
      orderId: d?.data?.merchantTransactionId || String(merchantOrderId),
      state: "PENDING",
      expireAt: null,
    };
  } catch (e) {
    throw toHttpError("phonepe_http_error", e);
  }
}

async function v1GetOrderStatus(merchantOrderId) {
  const txnId = String(merchantOrderId);
  try {
    const res = await http.get(
      `${pgBase}${V1_STATUS_PATH}/${CONF.merchantId}/${encodeURIComponent(txnId)}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": v1StatusChecksum(txnId),
          "X-MERCHANT-ID": CONF.merchantId,
        },
      }
    );
    const d = res.data || {};
    const inner = d.data || {};
    // v1 state examples: COMPLETED / FAILED / PENDING
    const state = (inner.state || (d.success ? "COMPLETED" : "PENDING") || "PENDING").toUpperCase();
    const txId = inner.transactionId || null;
    return {
      ...inner,
      orderId: inner.merchantTransactionId || txnId,
      state,
      transactionId: txId,
      paymentDetails: txId
        ? [{ transactionId: txId, state, amount: inner.amount ?? null }]
        : [],
    };
  } catch (e) {
    throw toHttpError("phonepe_http_error", e);
  }
}

/* ---------- PUBLIC API (used by paymentController) ---------- */

export const phonepeApi = {
  /** Create payment order (v2 preferred, v1 fallback) */
  async createOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo = {} }) {
    ensureConfigured();
    try {
      const out =
        mode === "v2"
          ? await v2CreateOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo })
          : await v1CreateOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo });
      if (!out.redirectUrl) {
        throw Object.assign(new Error("phonepe_no_redirect_url"), { status: 502 });
      }
      return out;
    } catch (e) {
      console.error(`PhonePe [${mode}] createOrder error:`, {
        status: e?.status,
        message: e?.message,
        data: e?.data,
      });
      throw e;
    }
  },

  /** Get order status by merchantOrderId */
  async getOrderStatus(merchantOrderId) {
    ensureConfigured();
    try {
      return mode === "v2"
        ? await v2GetOrderStatus(merchantOrderId)
        : await v1GetOrderStatus(merchantOrderId);
    } catch (e) {
      console.error(`PhonePe [${mode}] getOrderStatus error:`, {
        status: e?.status,
        message: e?.message,
        data: e?.data,
      });
      throw e;
    }
  },

  /** For /api/payment/debug/config */
  configPreview() {
    const missing = [];
    if (mode === "unconfigured") {
      if (!CONF.clientId) missing.push("PHONEPE_CLIENT_ID");
      if (!CONF.clientSecret) missing.push("PHONEPE_CLIENT_SECRET");
      if (!CONF.clientVersion) missing.push("PHONEPE_CLIENT_VERSION");
      if (!CONF.merchantId) missing.push("PHONEPE_MERCHANT_ID");
      if (!CONF.saltKey) missing.push("PHONEPE_SALT_KEY");
    }
    return {
      sdkRequired: false,
      mode,
      envRaw: CONF.envRaw,
      env: CONF.env,
      isProd: CONF.isProd,
      clientId: CONF.clientId || undefined,
      clientVersion: CONF.clientVersion || undefined,
      merchantId: CONF.merchantId || undefined,
      ...(missing.length ? { missing } : {}),
    };
  },
};
