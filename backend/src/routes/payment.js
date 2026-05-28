// backend/src/routes/payment.js
import express from "express";
import { pool } from "../config/db.js";
import { phonepeApi } from "./phonepe-api.js";

const router = express.Router();
const T = (v) => (typeof v === "string" ? v.trim() : "");

// Frontend and backend base URLs (set these in your .env)
const FRONT_BASE = T(process.env.PUBLIC_BASE_URL || "http://localhost:5173");
const BACK_BASE = T(process.env.BACKEND_BASE_URL || "http://localhost:5100");

const toPaise = (inr) => Math.round(Number(inr) * 100);

function makeMerchantOrderId(paymentId) {
  // <= 35 chars, alphanumeric + underscore is generally safe
  return `AV${Date.now()}_${paymentId}`.slice(0, 34);
}

/* ------------ helper: mark quotation as PAID when payment succeeds --------- */
async function markQuotationPaidFromPayment(paymentId) {
  try {
    const [[p]] = await pool.query(
      "SELECT meta FROM payments WHERE id = ?",
      [paymentId]
    );
    if (!p) return;

    const meta = (() => {
      try {
        return JSON.parse(p.meta || "{}");
      } catch {
        return {};
      }
    })();

    const quotationId = Number(meta?.quotation_id || 0);
    if (!quotationId) return;

    // Get message_id from quotations (for updating messages.meta)
    const [[q]] = await pool.query(
      "SELECT message_id, status, paid_at FROM quotations WHERE id = ?",
      [quotationId]
    );
    if (!q) return;

    // Update quotation row: status PAID, set paid_at if not already set
    await pool.query(
      `
      UPDATE quotations
      SET status = 'PAID',
          paid_at = CASE WHEN paid_at IS NULL THEN NOW() ELSE paid_at END
      WHERE id = ? AND status <> 'DELETED'
      `,
      [quotationId]
    );

    const messageId = q.message_id;
    if (messageId) {
      // Update messages.meta.payment_status = "PAID"
      await pool.query(
        `
        UPDATE messages
        SET meta = JSON_SET(COALESCE(meta, '{}'), '$.payment_status', 'PAID')
        WHERE id = ?
        `,
        [messageId]
      );
    }

    // If you already have socket.io wired, you can uncomment and adjust:
    // const io = req.app?.get('io');
    // if (io) io.emit('quotes:changed', { quote_id: quotationId });

  } catch (e) {
    console.error(
      "markQuotationPaidFromPayment error:",
      e?.message || e
    );
  }
}

/* --------- Create (start PhonePe payment) --------- */
router.post("/create", async (req, res) => {
  try {
    const { chat_id, amount, mode } = req.body || {};
    // quotation_id can come as quotation_id or quote_id from frontend
    const quotationIdRaw =
      req.body?.quotation_id ?? req.body?.quote_id ?? null;
    const quotationId = quotationIdRaw ? Number(quotationIdRaw) : null;

    if (!chat_id || amount === undefined || amount === null) {
      return res.status(400).json({
        ok: false,
        error: "chat_id and amount required",
      });
    }

    const numAmount = Number(amount);

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "invalid_amount",
        detail: `Amount must be a positive number. Got: ${amount}`,
      });
    }

    const amountPaise = toPaise(numAmount);

    // Create local payment row
    const [ins] = await pool.query(
      "INSERT INTO payments (chat_id, provider, status, amount, meta) VALUES (?, 'phonepe', 'pending', ?, JSON_OBJECT())",
      [chat_id, numAmount]
    );
    const paymentId = ins.insertId;
    const merchantOrderId = makeMerchantOrderId(paymentId);

    const redirectUrl = `${BACK_BASE}/api/payment/phonepe/return?pid=${paymentId}&mo=${encodeURIComponent(
      merchantOrderId
    )}`;

    const pay = await phonepeApi.createOrder({
      merchantOrderId,
      amountPaise,
      redirectUrl,
      metaInfo: {
        udf1: String(chat_id),
        quotation_id: quotationId ? String(quotationId) : undefined,
      },
    });

    const ppRedirect = pay?.redirectUrl || null;

    const meta = {
      merchantOrderId,
      redirectUrl: ppRedirect,
      orderId: pay?.orderId || null,
      state: pay?.state || "PENDING",
      expireAt: pay?.expireAt || null,
      quotation_id: quotationId || null,
    };

    await pool.query("UPDATE payments SET meta = ?, status = ? WHERE id = ?", [
      JSON.stringify(meta),
      "pending",
      paymentId,
    ]);

    // IFRAME mode support
    if ((mode || "REDIRECT").toUpperCase() === "IFRAME") {
      const tokenUrl = `${BACK_BASE}/api/payment/iframe-token?pid=${paymentId}`;
      return res.json({
        ok: true,
        payment_id: paymentId,
        provider: "phonepe",
        tokenUrl,
        merchantOrderId,
      });
    }

    // Default: redirect
    return res.json({
      ok: true,
      payment_id: paymentId,
      provider: "phonepe",
      redirectUrl: ppRedirect,
      checkoutUrl: ppRedirect,
      merchantOrderId,
    });
  } catch (err) {
    const status =
      err?.status ||
      err?.response?.status ||
      500;

    const detail =
      err?.data ||
      err?.response?.data ||
      err?.message ||
      null;

    console.error("PhonePe /create error:", {
      status,
      detail,
    });

    return res.status(500).json({
      ok: false,
      error: `phonepe_http_${status}`,
      detail,
    });
  }
});

/* --------- IFRAME token --------- */
router.get("/iframe-token", async (req, res) => {
  try {
    const pid = Number(req.query.pid);
    const [[row]] = await pool.query("SELECT meta FROM payments WHERE id = ?", [
      pid,
    ]);

    const meta = (() => {
      try {
        return JSON.parse(row?.meta || "{}");
      } catch {
        return {};
      }
    })();

    if (!meta?.redirectUrl) {
      return res.status(404).json({ ok: false });
    }

    return res.json({ ok: true, redirectUrl: String(meta.redirectUrl) });
  } catch (e) {
    console.error("iframe-token error:", e?.message || e);
    return res.status(500).json({ ok: false });
  }
});

/* --------- Return (verify & forward) --------- */
router.all("/phonepe/return", async (req, res) => {
  try {
    const paymentId = Number(req.query.pid || req.body?.pid);
    const merchantOrderId = String(req.query.mo || req.body?.mo || "");

    if (!paymentId || !merchantOrderId) {
      return res.redirect(`${FRONT_BASE}/payment-result?pid=0&status=error`);
    }

    const st = await phonepeApi.getOrderStatus(merchantOrderId);
    const state = (st?.state || "PENDING").toUpperCase();

    let final = "pending";
    if (state === "COMPLETED" || state === "SUCCESS") final = "success";
    else if (
      state === "FAILED" ||
      state === "DECLINED" ||
      state === "CANCELLED"
    )
      final = "failed";

    const txId =
      st?.paymentDetails?.[0]?.transactionId || st?.transactionId || null;

    const [[row]] = await pool.query(
      "SELECT meta FROM payments WHERE id = ?",
      [paymentId]
    );

    const oldMeta = (() => {
      try {
        return JSON.parse(row?.meta || "{}");
      } catch {
        return {};
      }
    })();

    const newMeta = { ...oldMeta, statusPayload: st };

    await pool.query(
      "UPDATE payments SET status = ?, txn_id = ?, meta = ? WHERE id = ?",
      [final, txId, JSON.stringify(newMeta), paymentId]
    );

    if (final === "success") {
      await markQuotationPaidFromPayment(paymentId);
    }

    return res.redirect(
      `${FRONT_BASE}/payment-result?pid=${paymentId}&status=${final}`
    );
  } catch (err) {
    console.error(
      "PhonePe return status error:",
      err?.response?.data || err?.message || err
    );
    return res.redirect(`${FRONT_BASE}/payment-result?pid=0&status=error`);
  }
});

/* --------- Webhook (optional) --------- */
router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const { event, payload } = req.body || {};
    const state = (payload?.state || "").toUpperCase();
    const merchantOrderId = payload?.merchantOrderId || payload?.orderId || null;

    if (!merchantOrderId) return res.status(200).json({ ok: true });

    const [rows] = await pool.query(
      `SELECT id, meta FROM payments WHERE JSON_EXTRACT(meta,'$.merchantOrderId') = ? LIMIT 1`,
      [merchantOrderId]
    );
    if (!rows?.length) return res.status(200).json({ ok: true });

    const paymentId = rows[0].id;
    const oldMeta = (() => {
      try {
        return JSON.parse(rows[0].meta || "{}");
      } catch {
        return {};
      }
    })();

    let final = "pending";
    if (state === "COMPLETED" || state === "SUCCESS") final = "success";
    else if (
      state === "FAILED" ||
      state === "DECLINED" ||
      state === "CANCELLED"
    )
      final = "failed";

    const txId =
      payload?.paymentDetails?.[0]?.transactionId ||
      payload?.transactionId ||
      null;
    const newMeta = { ...oldMeta, webhook: { event, payload } };

    await pool.query(
      "UPDATE payments SET status = ?, txn_id = ?, meta = ? WHERE id = ?",
      [final, txId, JSON.stringify(newMeta), paymentId]
    );

    if (final === "success") {
      await markQuotationPaidFromPayment(paymentId);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("webhook error:", e?.message || e);
    res.status(200).json({ ok: true });
  }
});

/* --------- Poll --------- */
router.get("/status/:paymentId", async (req, res) => {
  try {
    const id = Number(req.params.paymentId);
    const [[p]] = await pool.query(
      "SELECT id, status, meta, txn_id, amount FROM payments WHERE id = ?",
      [id]
    );
    if (!p) return res.status(404).json({ ok: false });

    const meta = (() => {
      try {
        return JSON.parse(p.meta || "{}");
      } catch {
        return {};
      }
    })();
    const merchantOrderId = meta?.merchantOrderId;

    if (p.status === "pending" && merchantOrderId) {
      const st = await phonepeApi.getOrderStatus(merchantOrderId);
      const state = (st?.state || "PENDING").toUpperCase();

      let final = p.status;
      if (state === "COMPLETED" || state === "SUCCESS") final = "success";
      else if (
        state === "FAILED" ||
        state === "DECLINED" ||
        state === "CANCELLED"
      )
        final = "failed";

      if (final !== p.status) {
        const txId =
          st?.paymentDetails?.[0]?.transactionId || st?.transactionId || null;
        const newMeta = { ...meta, statusPayload: st };
        await pool.query(
          "UPDATE payments SET status = ?, txn_id = ?, meta = ? WHERE id = ?",
          [final, txId, JSON.stringify(newMeta), id]
        );
        p.status = final;
        p.txn_id = txId;
        p.meta = JSON.stringify(newMeta);

        if (final === "success") {
          await markQuotationPaidFromPayment(id);
        }
      }
    }
    res.json({ ok: true, payment: p });
  } catch (e) {
    console.error("status error:", e?.message || e);
    res.status(500).json({ ok: false });
  }
});

/* --------- Debug --------- */
router.get("/debug/config", (_req, res) => {
  res.json({ ok: true, config: phonepeApi.configPreview() });
});

export default router;
