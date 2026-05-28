import axios from "axios";
import https from "https";
import dayjs from "dayjs";
import { pool } from "../config/db.js";
import { normalizeMobile10, toMsisdn91 } from "./msisdn.js";

const PROVIDER = (process.env.OTP_PROVIDER || "dev").toLowerCase();
const EXPIRY_S = parseInt(process.env.OTP_EXPIRY_SECONDS || "300", 10);
const DEV_FALLBACK = String(process.env.OTP_DEV_FALLBACK || "0") === "1";

/* ensure OTP table exists */
async function ensureOtpTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      mobile VARCHAR(10) NOT NULL,
      code   VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_mobile_created (mobile, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export async function sendOTP(rawMobile) {
  await ensureOtpTable();

  const mobile = normalizeMobile10(rawMobile);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = dayjs().add(EXPIRY_S, "second").format("YYYY-MM-DD HH:mm:ss");

  await pool.query(
    "INSERT INTO otps (mobile, code, expires_at) VALUES (?,?,?)",
    [mobile, code, expiresAt]
  );

  // DEV shortcut
  if (PROVIDER === "dev") {
    console.log(`[OTP][DEV] ${mobile}: ${code} (expires in ${EXPIRY_S}s)`);
    return { ok: true, message: "OTP generated (DEV)" };
  }

  // WhatsApp via MSG91
  if (PROVIDER === "msg91_whatsapp") {
    const AUTH_KEY      = process.env.MSG91_AUTH_KEY;
    const TEMPLATE_NAME = process.env.MSG91_WA_TEMPLATE_NAME;
    const NAMESPACE     = process.env.MSG91_WA_NAMESPACE;
    const INTEGRATED_NO = process.env.MSG91_WA_INTEGRATED_NUMBER;
    const LANG_CODE     = process.env.MSG91_WA_LANG_CODE || "en";
    const BUTTON_PREFIX = process.env.MSG91_WA_BUTTON_PREFIX || "";

    if (!AUTH_KEY || !TEMPLATE_NAME || !NAMESPACE || !INTEGRATED_NO) {
      const e = new Error("MSG91 config missing");
      e.vendorStatus = 400;
      e.vendorBody = {
        reason:
          "Missing MSG91_AUTH_KEY / MSG91_WA_TEMPLATE_NAME / MSG91_WA_NAMESPACE / MSG91_WA_INTEGRATED_NUMBER",
      };
      throw e;
    }

    const to = toMsisdn91(mobile);
    const httpsAgent = new https.Agent({ family: 4 });
    const buttonVal = BUTTON_PREFIX ? BUTTON_PREFIX + code : code;

    // Variant A: to_and_components
    const componentsA = { body_1: { type: "text", value: code } };
    if (buttonVal.length <= 15) {
      componentsA.button_1 = { subtype: "url", type: "text", value: buttonVal };
    }
    const payloadA = {
      integrated_number: INTEGRATED_NO,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: LANG_CODE, policy: "deterministic" },
          namespace: NAMESPACE,
          to_and_components: [{ to: [to], components: componentsA }],
        },
      },
    };

    // Variant B: components array
    const compsB = [{ type: "body", parameters: [{ type: "text", text: code }] }];
    if (buttonVal.length <= 15) {
      compsB.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: buttonVal }],
      });
    }
    const payloadB = {
      integrated_number: INTEGRATED_NO,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: LANG_CODE, policy: "deterministic" },
          namespace: NAMESPACE,
          to: [to],
          components: compsB,
        },
      },
    };

    const HOSTS = [
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
    ];

    async function tryOnce(host, payload, variant) {
      const resp = await axios.post(host, payload, {
        headers: { authkey: AUTH_KEY, "content-type": "application/json" },
        httpsAgent,
        timeout: 20000,
        validateStatus: () => true
      });
      if (resp.status >= 200 && resp.status < 300) {
        console.log(`[msg91] OTP sent via variant ${variant} @ ${host}`);
        return { ok: true, message: "OTP sent via WhatsApp" };
      }
      const err = new Error("MSG91 rejected");
      err.vendorStatus = resp.status;
      err.vendorBody = resp.data;
      err.variant = variant;
      err.host = host;
      throw err;
    }

    let lastErr;
    for (const host of HOSTS) {
      try { return await tryOnce(host, payloadA, "A"); } catch (e) { lastErr = e; }
      try { return await tryOnce(host, payloadB, "B"); } catch (e) { lastErr = e; }
    }

    // If provider rejected AND fallback enabled → still succeed (DEV path)
    if (DEV_FALLBACK) {
      console.warn("[OTP][DEV_FALLBACK] MSG91 failed, returning DEV success. Code:", code, "mobile:", mobile);
      return { ok: true, message: "OTP generated (DEV fallback)" };
    }

    const out = new Error("MSG91 WhatsApp rejected");
    out.vendorStatus = lastErr?.vendorStatus || 502;
    out.vendorBody = lastErr?.vendorBody || { error: lastErr?.message || "unknown" };
    throw out;
  }

  return { ok: true, message: "OTP generated" };
}

export async function verifyOTP(rawMobile, rawCode) {
  await ensureOtpTable();
  const mobile = normalizeMobile10(rawMobile);
  const code = String(rawCode || "").trim();

  const [rows] = await pool.query(
    "SELECT * FROM otps WHERE mobile=? AND code=? ORDER BY id DESC LIMIT 1",
    [mobile, code]
  );
  if (!rows.length) return { ok: false, message: "Invalid OTP" };

  const row = rows[0];
  if (dayjs(row.expires_at).isBefore(dayjs())) {
    return { ok: false, message: "OTP expired" };
  }

  await pool.query("UPDATE otps SET verified=1 WHERE id=?", [row.id]);
  return { ok: true };
}
