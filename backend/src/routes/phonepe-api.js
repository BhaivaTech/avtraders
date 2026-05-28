// backend/src/routes/phonepe-api.js
import dotenv from "dotenv";
dotenv.config();

import {
  StandardCheckoutClient,
  Env,
  MetaInfo,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

/* ---------- ENV + CONFIG ---------- */

function env(name) {
  return (process.env[name] || "").trim();
}

const rawEnv = env("PHONEPE_ENV") || "uat";
const envLower = rawEnv.toLowerCase();

const isProd =
  envLower === "prod" ||
  envLower === "production" ||
  envLower === "live";

const CONF = {
  envRaw: rawEnv,
  env: isProd ? "PRODUCTION" : "SANDBOX",
  isProd,
  clientId: env("PHONEPE_CLIENT_ID"),
  clientSecret: env("PHONEPE_CLIENT_SECRET"),
  clientVersion: env("PHONEPE_CLIENT_VERSION"),
};

function ensureConfigured() {
  if (!CONF.clientId || !CONF.clientSecret || !CONF.clientVersion) {
    throw new Error(
      `phonepe_config_missing: clientId / clientSecret / clientVersion not set. ` +
        `clientId="${CONF.clientId}", clientSecret="${
          CONF.clientSecret ? "***" : ""
        }", clientVersion="${CONF.clientVersion}".`
    );
  }
}

/* ---------- SINGLETON CLIENT ---------- */

let clientInstance = null;

function getClient() {
  ensureConfigured();

  if (!clientInstance) {
    const envObj = CONF.isProd ? Env.PRODUCTION : Env.SANDBOX;

    console.log("[PhonePe] Initializing SDK client with config:", {
      env: CONF.env,
      clientId: CONF.clientId,
      clientVersion: CONF.clientVersion,
    });

    // NOTE: keep clientId as string – DO NOT Number() it
    clientInstance = StandardCheckoutClient.getInstance(
      CONF.clientId,
      CONF.clientSecret,
      CONF.clientVersion,
      envObj
    );
  }

  return clientInstance;
}

/* ---------- NORMALIZATION HELPERS ---------- */

function normalizePayResponse(resp) {
  // According to docs: state, redirectUrl, orderId, expireAt
  return {
    redirectUrl: resp?.redirectUrl || resp?.redirect_url || null,
    orderId: resp?.orderId || resp?.order_id || null,
    state: resp?.state || "PENDING",
    expireAt: resp?.expireAt || resp?.expire_at || null,
  };
}

/* ---------- PUBLIC API (used by payment.js) ---------- */

export const phonepeApi = {
  /** Create payment order (Standard Checkout) */
  async createOrder({ merchantOrderId, amountPaise, redirectUrl, metaInfo = {} }) {
    try {
      const client = getClient();

      // Build meta info (udf1 / udf2 etc.)
      let metaBuilder = MetaInfo.builder();
      if (metaInfo.udf1) metaBuilder = metaBuilder.udf1(String(metaInfo.udf1));
      if (metaInfo.udf2) metaBuilder = metaBuilder.udf2(String(metaInfo.udf2));
      const meta = metaBuilder.build();

      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(String(merchantOrderId))
        .amount(Number(amountPaise)) // amount in paise
        .redirectUrl(String(redirectUrl))
        .metaInfo(meta)
        .build();

      const resp = await client.pay(request);

      return normalizePayResponse(resp);
    } catch (e) {
      console.error("PhonePe SDK createOrder error:", {
        httpStatusCode: e?.httpStatusCode,
        code: e?.code,
        message: e?.message,
        data: e?.data,
      });

      const err = new Error("phonepe_http_error");
      err.status = e?.httpStatusCode || e?.statusCode || 500;
      err.data = {
        code: e?.code,
        message: e?.message,
        data: e?.data,
      };
      throw err;
    }
  },

  /** Get order status by merchantOrderId */
  async getOrderStatus(merchantOrderId) {
    try {
      const client = getClient();
      const resp = await client.getOrderStatus(String(merchantOrderId));

      // payment.js expects something like st.state, st.paymentDetails, etc.
      return resp;
    } catch (e) {
      console.error("PhonePe SDK getOrderStatus error:", {
        httpStatusCode: e?.httpStatusCode,
        code: e?.code,
        message: e?.message,
        data: e?.data,
      });

      const err = new Error("phonepe_http_error");
      err.status = e?.httpStatusCode || e?.statusCode || 500;
      err.data = {
        code: e?.code,
        message: e?.message,
        data: e?.data,
      };
      throw err;
    }
  },

  /** For /api/payment/debug/config */
  configPreview() {
    return {
      envRaw: CONF.envRaw,
      env: CONF.env,
      isProd: CONF.isProd,
      clientId: CONF.clientId,
      clientVersion: CONF.clientVersion,
    };
  },
};
