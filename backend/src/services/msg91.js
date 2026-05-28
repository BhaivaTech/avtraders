// backend/src/services/msg91.js
import axios from "axios";
import https from "https";

/**
 * MSG91 WhatsApp Template Sender (supports farmer + dealer configs)
 *
 * Supports both call styles:
 * 1) NEW: sendWhatsAppTemplate({ kind, toMsisdn, bodyText, buttonText })
 * 2) OLD: sendWhatsAppTemplate(toMsisdn, bodyText, buttonText)
 *
 * Also exports sendWA alias for old imports (chat.js etc.)
 */

// Prefer IPv4 (some networks/DNS issues)
const IPV4_AGENT = new https.Agent({ family: 4 });

// MSG91 hostnames (some accounts work on control.msg91.com)
const HOSTS = [
  "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
  "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
];

/* ---------------- Helpers ---------------- */

function pickEnv(kind, key) {
  // dealer-specific envs fallback to generic envs
  const map = {
    auth: kind === "dealer" ? "DEALER_MSG91_AUTH_KEY" : "MSG91_AUTH_KEY",
    name: kind === "dealer" ? "DEALER_MSG91_WA_TEMPLATE_NAME" : "MSG91_WA_TEMPLATE_NAME",
    ns: kind === "dealer" ? "DEALER_MSG91_WA_NAMESPACE" : "MSG91_WA_NAMESPACE",
    num: kind === "dealer" ? "DEALER_MSG91_WA_INTEGRATED_NUMBER" : "MSG91_WA_INTEGRATED_NUMBER",
    lang: kind === "dealer" ? "DEALER_MSG91_WA_LANG_CODE" : "MSG91_WA_LANG_CODE",
    btn: kind === "dealer" ? "DEALER_MSG91_WA_BUTTON_PREFIX" : "MSG91_WA_BUTTON_PREFIX",
  };

  const envKey = map[key];
  const v = (process.env[envKey] || "").trim();

  // fallback
  if (kind === "dealer") {
    if (key === "auth") return v || (process.env.MSG91_AUTH_KEY || "").trim();
    if (key === "name") return v || (process.env.MSG91_WA_TEMPLATE_NAME || "").trim();
    if (key === "ns") return v || (process.env.MSG91_WA_NAMESPACE || "").trim();
    if (key === "num") return v || (process.env.MSG91_WA_INTEGRATED_NUMBER || "").trim();
    if (key === "lang") return v || (process.env.MSG91_WA_LANG_CODE || "en").trim();
    if (key === "btn") return v || (process.env.MSG91_WA_BUTTON_PREFIX || "").trim();
  }

  if (key === "lang") return v || "en";
  if (key === "btn") return v || "";
  return v;
}

function normalizeMsisdn(toMsisdn) {
  // Ensure "91xxxxxxxxxx" format (no +)
  const d = String(toMsisdn || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 10) return `91${d}`;
  // last 10 digits fallback
  if (d.length > 12) return `91${d.slice(-10)}`;
  return d;
}

async function postToMsg91(host, authkey, payload) {
  const resp = await axios.post(host, payload, {
    headers: { authkey, "content-type": "application/json" },
    httpsAgent: IPV4_AGENT,
    timeout: 20000,
    validateStatus: () => true,
  });

  if (resp.status >= 200 && resp.status < 300) {
    return { ok: true, host, data: resp.data };
  }

  const err = new Error("MSG91 WhatsApp rejected");
  err.vendorStatus = resp.status;
  err.vendorBody = resp.data;
  err.host = host;
  throw err;
}

/* -----------------------------------------------------------
   MAIN SENDER
----------------------------------------------------------- */

/**
 * ✅ Send WhatsApp template
 *
 * New style:
 *   sendWhatsAppTemplate({ kind:"dealer"|"farmer", toMsisdn:"91xxxx", bodyText:"123456", buttonText:null })
 *
 * Old style:
 *   sendWhatsAppTemplate("91xxxx", "123456", null)
 */
export async function sendWhatsAppTemplate(arg1, arg2, arg3 = null) {
  // detect signature
  const isObjectCall = arg1 && typeof arg1 === "object" && !Array.isArray(arg1);

  const kind = isObjectCall ? (arg1.kind || "farmer") : "farmer";
  const toMsisdn = normalizeMsisdn(isObjectCall ? arg1.toMsisdn : arg1);
  const bodyText = String(isObjectCall ? arg1.bodyText : arg2);
  const buttonText = isObjectCall ? arg1.buttonText ?? null : arg3;

  const AUTH_KEY = pickEnv(kind, "auth");
  const TEMPLATE_NAME = pickEnv(kind, "name");
  const NAMESPACE = pickEnv(kind, "ns");
  const INTEGRATED_NO = pickEnv(kind, "num");
  const LANG_CODE = pickEnv(kind, "lang");
  const BUTTON_PREFIX = pickEnv(kind, "btn"); // optional

  if (!AUTH_KEY || !TEMPLATE_NAME || !NAMESPACE || !INTEGRATED_NO) {
    const e = new Error("MSG91 config missing");
    e.vendorStatus = 400;
    e.vendorBody = {
      reason: "Missing MSG91 envs",
      required: [
        kind === "dealer" ? "DEALER_MSG91_AUTH_KEY" : "MSG91_AUTH_KEY",
        kind === "dealer" ? "DEALER_MSG91_WA_TEMPLATE_NAME" : "MSG91_WA_TEMPLATE_NAME",
        kind === "dealer" ? "DEALER_MSG91_WA_NAMESPACE" : "MSG91_WA_NAMESPACE",
        kind === "dealer" ? "DEALER_MSG91_WA_INTEGRATED_NUMBER" : "MSG91_WA_INTEGRATED_NUMBER",
      ],
    };
    throw e;
  }

  // ✅ BUTTON handling (URL button params usually need short text)
  // If you use URL button in template and it needs suffix, pass buttonText.
  // Some templates want prefix+text; if your template expects only text, keep prefix empty.
  let btnParam = null;
  if (buttonText && String(buttonText).length <= 15) {
    btnParam = BUTTON_PREFIX ? `${BUTTON_PREFIX}${buttonText}` : String(buttonText);
  }

  /**
   * ✅ IMPORTANT:
   * Your error says: "to_and_components received is Invalid"
   * So we try "components[]" FIRST (Meta format) and only then try to_and_components.
   */

  // Variant B (components[]) — TRY FIRST
  const comps = [{ type: "body", parameters: [{ type: "text", text: bodyText }] }];

  if (btnParam) {
    comps.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: btnParam }],
    });
  }

  const payloadComponents = {
    integrated_number: INTEGRATED_NO,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: LANG_CODE, policy: "deterministic" },
        namespace: NAMESPACE,
        to: [toMsisdn],
        components: comps,
      },
    },
  };

  // Variant A (to_and_components) — fallback only
  const componentsA = { body_1: { type: "text", value: bodyText } };
  if (btnParam) {
    componentsA.button_1 = { subtype: "url", type: "text", value: btnParam };
  }

  const payloadToAnd = {
    integrated_number: INTEGRATED_NO,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: LANG_CODE, policy: "deterministic" },
        namespace: NAMESPACE,
        to_and_components: [{ to: [toMsisdn], components: componentsA }],
      },
    },
  };

  let lastErr;

  for (const host of HOSTS) {
    try {
      return await postToMsg91(host, AUTH_KEY, payloadComponents);
    } catch (e) {
      lastErr = e;
    }
    try {
      return await postToMsg91(host, AUTH_KEY, payloadToAnd);
    } catch (e) {
      lastErr = e;
    }
  }

  const out = new Error("MSG91 WhatsApp rejected");
  out.vendorStatus = lastErr?.vendorStatus || 502;
  out.vendorBody = lastErr?.vendorBody || { error: lastErr?.message || "unknown" };
  out.host = lastErr?.host;
  throw out;
}

/* ✅ Backward-compat alias so old imports keep working */
export const sendWA = sendWhatsAppTemplate;

/** Optional: quick check */
export function assertMsg91Env(kind = "farmer") {
  const AUTH_KEY = pickEnv(kind, "auth");
  const TEMPLATE_NAME = pickEnv(kind, "name");
  const NAMESPACE = pickEnv(kind, "ns");
  const INTEGRATED_NO = pickEnv(kind, "num");
  if (!AUTH_KEY || !TEMPLATE_NAME || !NAMESPACE || !INTEGRATED_NO) {
    throw new Error(`MSG91 envs missing for kind=${kind}`);
  }
}