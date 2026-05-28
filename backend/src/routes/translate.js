// server/routes/translate.js
import express from "express";

const router = express.Router();

/**
 * Requirements:
 *  - AZURE_TRANSLATOR_KEY=<your key>
 *  - AZURE_TRANSLATOR_REGION=<your region>   e.g., "centralindia" or "eastasia" etc.
 * Optional:
 *  - AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
 *
 * Notes:
 *  - Supports array input for q. We'll normalize to Translator's payload.
 *  - Supports 'source' = "auto" (omit &from to auto-detect), else pass &from=en.
 *  - 'target' must be 'kn' for Kannada or 'en' for English.
 */

const AZURE_KEY = (process.env.AZURE_TRANSLATOR_KEY || "").trim();
const AZURE_REGION = (process.env.AZURE_TRANSLATOR_REGION || "").trim();
const AZURE_ENDPOINT =
  (process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com").replace(/\/$/, "");

if (!AZURE_KEY || !AZURE_REGION) {
  console.warn(
    "[translate] Missing AZURE_TRANSLATOR_KEY or AZURE_TRANSLATOR_REGION in .env. Route will 500."
  );
}

// Utility
const toArray = (q) => (Array.isArray(q) ? q : [q]);

router.get("/languages", async (_req, res) => {
  // Minimal “OK” reply so your frontend health-checks pass.
  // (Azure has a languages endpoint, but we’ll keep this simple.)
  return res.json([{ code: "en", name: "English" }, { code: "kn", name: "Kannada" }]);
});

router.post("/", async (req, res) => {
  try {
    const { q, source = "auto", target = "kn", format = "text" } = req.body || {};
    const texts = toArray(q).filter(Boolean);

    if (!texts.length) {
      return res.status(400).json({ error: "q (string or array) required" });
    }
    if (!AZURE_KEY || !AZURE_REGION) {
      return res.status(500).json({ error: "translator_not_configured" });
    }

    // Build query: api-version + to + optional from
    const params = new URLSearchParams({ "api-version": "3.0", to: target });
    if (source && source !== "auto") params.set("from", source);

    // Azure payload: [{ Text: "..." }, ...]
    const payload = texts.map((t) => ({ Text: String(t) }));

    const r = await fetch(`${AZURE_ENDPOINT}/translate?${params.toString()}`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_REGION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.error("[/api/translate] Azure error", r.status, body.slice(0, 300));
      return res.status(502).json({ error: "translate_failed" });
    }

    const data = await r.json();
    // Normalize to array of strings to match your frontend’s expectations:
    // Azure returns [{ translations: [{text: "..."}] }, ...]
    const out = data.map((item) => item?.translations?.[0]?.text ?? "");

    // You previously handled both array + object shapes; keep it as array for simplicity.
    return res.json(out);
  } catch (e) {
    console.error("[/api/translate] error:", e);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
