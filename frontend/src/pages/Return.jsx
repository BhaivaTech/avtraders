import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Policy.css";
import { CONTACT_EMAIL, CONTACT_PHONE } from '../lib/config.js';

export default function ReturnPolicy() {
  const navigate = useNavigate();
  const handleBack = () => { sessionStorage.setItem("lastScroll", String(window.scrollY)); navigate(-1); };

  useEffect(() => {
    const last = sessionStorage.getItem("lastScroll");
    if (last) { window.scrollTo(0, parseInt(last, 10)); sessionStorage.removeItem("lastScroll"); }
  }, []);

  useEffect(() => {
    let sx = 0;
    const onStart = (e) => (sx = e.changedTouches[0].screenX);
    const onEnd = (e) => { const dx = e.changedTouches[0].screenX - sx; if (dx > 80) handleBack(); };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => { document.removeEventListener("touchstart", onStart); document.removeEventListener("touchend", onEnd); };
  }, []);

  return (
    <div className="policy-container">
      <header className="policy-header">
        <button className="back-icon" onClick={handleBack} aria-label="Go Back">⬅</button>
        <div>
          <h1>Return &amp; Replacement Policy</h1>
          <div className="policy-sub">AV Traders Agri Clinic</div>
        </div>
      </header>

      <main className="policy-content">
        <p className="muted">Effective date: {new Date().toLocaleDateString()}</p>

        <p>
          For safety and quality reasons, we currently <b>do not accept general returns</b> once agro-input packs
          (seeds, fertilizers, pesticides) are opened/used. However, we offer replacements in the following cases:
        </p>

        <h2>Eligible for Replacement</h2>
        <ul>
          <li><b>Damaged in transit</b> or <b>defective</b> items reported within <b>48 hours</b> of delivery with proof.</li>
          <li><b>Incorrect product</b> delivered (mismatch with order) reported within <b>48 hours</b>.</li>
        </ul>

        <h2>Not Eligible</h2>
        <ul>
          <li>Opened/used products; tampered packaging after delivery.</li>
          <li>Products damaged due to improper storage/usage conditions.</li>
          <li>Customized or bulk special-order items unless defective.</li>
        </ul>

        <h2>Process</h2>
        <p>
          Share <b>Order ID</b>, photos/videos, and issue details to our support within 48 hours. After verification,
          we will arrange a replacement or approve a refund as per the <a href="/refund-policy">Refund Policy</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Phone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE.replace('+91', '+91 ')}</a><br/>
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </main>
    </div>
  );
}
