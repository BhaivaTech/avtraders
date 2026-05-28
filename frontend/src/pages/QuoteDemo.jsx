import React, { useEffect, useState } from "react";

export default function QuoteDemo() {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");

  // read token from /demo/quote/:token
  const token = (location.pathname.split("/").pop() || "UAT400");

  useEffect(() => {
    fetch(`/api/payment/demo/quote/${token}`)
      .then(r => r.json()).then(j => {
        if (!j.ok) throw new Error(j.error || "failed");
        setQuote(j.quote); setLoading(false);
      }).catch(e => { setErr(e.message || "failed"); setLoading(false); });
  }, [token]);

  const payNow = async () => {
    const r = await fetch(`/api/payment/demo/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const j = await r.json();
    if (!j.ok || !j.checkoutUrl) { alert("Create order failed"); return; }
    window.location.href = j.checkoutUrl;   // go to PhonePe checkout
  };

  if (loading) return <div className="card">Loading…</div>;
  if (err) return <div className="card">Error: {err}</div>;

  return (
    <div className="card" style={{ maxWidth: 520, margin: "24px auto" }}>
      <h2>Quotation (UAT Demo)</h2>
      <div style={{ marginTop: 8 }}>
        <div><b>Item:</b> {quote.title}</div>
        <div><b>Amount:</b> ₹{quote.amount}</div>
        <div style={{ color: "#64748b", marginTop: 6 }}>{quote.note}</div>
      </div>
      <button className="btn primary" style={{ marginTop: 16 }} onClick={payNow}>
        Pay Now (UAT)
      </button>
      <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
        For PhonePe review only. Uses Standard Checkout UAT.
      </p>
    </div>
  );
}
