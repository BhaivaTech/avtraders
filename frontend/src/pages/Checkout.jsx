// src/pages/Checkout.jsx
import React, { useMemo, useState } from "react";
import "../components/buynow.css";
import { UPI_ID, UPI_NAME } from '../lib/config.js';

function qp(name, price, sku) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? (name === "price" ? String(price ?? "") : sku ?? "");
}

export default function Checkout() {
  const name = useMemo(() => qp("name", null, null) || "Item", []);
  const price = useMemo(() => Number(qp("price", 0, null) || 0), []);
  const sku = useMemo(() => qp("sku", null, "GEN-001"), []);
  const [busy, setBusy] = useState(false);

  const vpa   = UPI_ID   || 'test@upi';
  const payee = UPI_NAME || 'AV%20Traders%20Agri%20Clinic';

  // Universal UPI deep link (works for PhonePe/GPay/Paytm apps)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${payee}&am=${price}&tn=${encodeURIComponent(
    `${name} (${sku})`
  )}&cu=INR`;

  const tryBackendPhonePe = async () => {
    // Optional: if you expose a backend create-order endpoint, use it here
    // Falls back to UPI link if fails.
    try {
      setBusy(true);
      const res = await fetch("/api/pay/phonepe/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price, name, sku }),
      });
      if (!res.ok) throw new Error("create order failed");
      const data = await res.json();
      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl; // e.g., PhonePe hosted checkout URL
      } else {
        // fallback
        window.location.href = upiUrl;
      }
    } catch (e) {
      window.location.href = upiUrl;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="card soft" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 className="mt-0" style={{ marginBottom: 6 }}>Checkout</h2>
        <p style={{ color: "#64748b", marginTop: 0 }}>Review item and proceed to payment.</p>

        <div className="bn-check-row">
          <div className="bn-check-main">
            <div className="bn-name">{name}</div>
            <div className="bn-sku">SKU: {sku}</div>
          </div>
          <div className="bn-price-big">₹{price}</div>
        </div>

        <div className="bn-paybox">
          <div className="bn-pay-title">Pay with UPI / PhonePe</div>
          <p className="bn-help">
            Clicking “Pay Now” will open your UPI app (PhonePe/GPay/Paytm).
          </p>

          <div className="bn-actions">
            <a className="bn-pay" href={upiUrl}>Pay Now</a>
           
          </div>

          <div className="bn-note">
            UPI ID: <b>{vpa}</b> &middot; Merchant: <b>{decodeURIComponent(payee)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
