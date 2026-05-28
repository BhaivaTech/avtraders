import React, { useEffect } from "react";
import { api } from "../lib/api";

export default function PaymentIframe() {
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get("pid");
    if (!pid || !window.PhonePeCheckout) return;

    const tokenUrl = `/api/payment/iframe-token?pid=${pid}`;
    window.PhonePeCheckout.transact({
      tokenUrl,
      type: "IFRAME",
      callback: () => {
        // Go back to result screen; server verifies status there
        window.location.href = `/payment-result?pid=${pid}`;
      },
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow:
            "0 20px 40px rgba(2,6,23,.08), 0 2px 10px rgba(2,6,23,.04)",
          border: "1px solid #eef2f7",
        }}
      >
        Opening PhonePe PayPage…
      </div>
    </div>
  );
}
