// src/pages/Refund.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Policy.css";
import { CONTACT_EMAIL, CONTACT_PHONE } from '../lib/config.js';

export default function Refund() {
  const navigate = useNavigate();

  const handleBack = () => {
    sessionStorage.setItem("lastScroll", String(window.scrollY));
    navigate(-1);
  };

  useEffect(() => {
    const last = sessionStorage.getItem("lastScroll");
    if (last) {
      window.scrollTo(0, parseInt(last, 10));
      sessionStorage.removeItem("lastScroll");
    }
  }, []);

  useEffect(() => {
    let startX = 0;
    const onStart = (e) => (startX = e.changedTouches[0].screenX);
    const onEnd = (e) => {
      const dx = e.changedTouches[0].screenX - startX;
      if (dx > 80) handleBack();
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <div className="policy-container">
      <header className="policy-header">
        <button className="back-icon" onClick={handleBack} aria-label="Go Back">⬅</button>
        <div>
          <h1>Refund &amp; Cancellation Policy</h1>
          <div className="policy-sub">AV Traders Agri Clinic</div>
        </div>
      </header>

      <main className="policy-content">
        <p className="muted">
          Effective date: {new Date().toLocaleDateString()} &middot; All amounts are in <b>INR (₹)</b>.
        </p>

        <p>
          This policy explains how you can cancel an order or request a refund for purchases made
          from <b>AV Traders Agri Clinic</b> (products and agri-services).
        </p>

        <h2>1) Order Cancellation</h2>
        <ul>
          <li>
            <b>Before dispatch:</b> You may cancel prepaid or COD orders any time <b>before dispatch</b>.
            Approved cancellations will be fully refunded for prepaid orders.
          </li>
          <li>
            <b>After dispatch / Out for delivery:</b> Cancellation is not guaranteed. You may refuse the
            shipment at delivery; once the package returns to us in original condition, we will process
            an eligible refund (shipping charges may be deducted where applicable).
          </li>
          <li>
            <b>Service bookings:</b> On-site consultation cancellations are allowed up to <b>24 hours</b> prior
            to the scheduled visit. Late cancellations/no-shows are non-refundable.
          </li>
        </ul>

        <h2>2) Damaged, Defective or Incorrect Item</h2>
        <p>
          If you receive a damaged/defective or incorrect product, please contact us within
          <b> 48 hours</b> of delivery with clear photos/videos and the <b>Order ID</b>.
          After verification, we will arrange a replacement or refund as applicable.
        </p>

        <h2>3) Items Not Eligible for Refund</h2>
        <ul>
          <li>Opened/used agro-chemicals, pesticides, or seed packs.</li>
          <li>Products damaged due to improper storage or usage after delivery.</li>
          <li>Customized/bulk orders made on request.</li>
        </ul>

        <h2>4) Refund Method &amp; Timeline</h2>
        <p>
          Approved refund will be processed within <b>1–3 days</b>, and it will be credited to the original
          payment method within <b>7 days</b>.<br/>
          For <b>COD payments</b>, refund will be credited within <b>5 days</b> to the bank account provided
          while cancellation is requested.
        </p>

        <h2>5) How to Raise a Request</h2>
        <p>Share the below via email/WhatsApp/phone:</p>
        <ul>
          <li>Order ID, Full Name, Mobile Number</li>
          <li>Issue summary (cancellation, damage, defect, wrong item, etc.)</li>
          <li>Photos/videos (for damage/defect) within 48 hours of delivery</li>
        </ul>

        <h2>6) Contact</h2>
        <p>
          <b>AV Traders Agri Clinic</b><br/>
          Kurubarahally, Tumkur Road, Doddaballapura,<br/>
          Bengaluru Rural, Karnataka, 561203<br/>
          Phone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE.replace('+91', '+91 ')}</a><br/>
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </main>
    </div>
  );
}
