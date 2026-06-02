// backend/src/routes/internal.js
import express from "express";
import axios from "axios";
import https from "https";

const router = express.Router();

function ok(v) { return v !== undefined && v !== null && v !== ""; }

// Restrict to localhost only — this route must never be reachable from the internet.
function requireLocalhost(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || '';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    console.warn(`[internal] Blocked non-localhost access from ${ip}`);
    return res.status(403).json({ error: 'forbidden' });
  }
  return next();
}

router.post("/msg91-proxy", requireLocalhost, async (req, res) => {
  try {
    const token = req.headers["x-proxy-token"] || req.query.token;
    if (!token || token !== (process.env.MSG91_PROXY_TOKEN || "")) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const AUTHKEY    = process.env.MSG91_AUTH_KEY || "";
    const INTEGRATED = process.env.MSG91_WA_INTEGRATED_NUMBER || "";
    const TEMPLATE   = process.env.MSG91_WA_TEMPLATE_NAME || "";
    const NAMESPACE  = process.env.MSG91_WA_NAMESPACE || "";
    const LANG       = process.env.MSG91_WA_LANG_CODE || "en";

    if (!ok(AUTHKEY) || !ok(INTEGRATED) || !ok(TEMPLATE) || !ok(NAMESPACE)) {
      return res.status(500).json({ error: "proxy misconfigured" });
    }

    const httpsAgent = new https.Agent({ family: 4 });
    const body = req.body || {};

    // Support BOTH payload shapes:
    // A) New bulk API (to_and_components under payload.template)
    const bulk = body?.payload?.template?.to_and_components;
    // B) Legacy /send API (top-level to + template.params)
    const to    = body?.to;
    const tpl   = body?.template;

    let url, outBody;

    if (Array.isArray(bulk)) {
      // Lock the sensitive values from env
      outBody = {
        integrated_number: INTEGRATED,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: TEMPLATE,
            language: { code: LANG, policy: "deterministic" },
            namespace: NAMESPACE,
            to_and_components: bulk,
          },
        },
      };
      url = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";
    } else if (ok(to) && tpl && Array.isArray(tpl.params)) {
      // Legacy style - lock values from env
      outBody = {
        integrated_number: INTEGRATED,
        to,
        type: "template",
        template: {
          name: TEMPLATE,
          language: { code: LANG },
          params: tpl.params, // [{type:'text', text:'123456'}]
        },
      };
      url = "https://api.msg91.com/api/v5/whatsapp/send";
    } else {
      return res.status(400).json({ error: "bad payload" });
    }

    const r = await axios.post(url, outBody, {
      headers: { authkey: AUTHKEY, "content-type": "application/json" },
      httpsAgent,
      timeout: 20000,
      validateStatus: () => true,
    });

    // Bubble vendor response exactly
    return res.status(r.status).json(r.data);
  } catch (e) {
    return res.status(502).json({ error: e.message || "proxy error" });
  }
});

export default router;
