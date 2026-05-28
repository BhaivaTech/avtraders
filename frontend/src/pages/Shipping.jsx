import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Policy.css";

export default function ShippingPolicy() {
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
          <h1>Shipping &amp; Delivery Policy</h1>
          <div className="policy-sub">AV Traders Agri Clinic</div>
        </div>
      </header>

      <main className="policy-content">
        <p className="muted">Effective date: {new Date().toLocaleDateString()}</p>

        <h2>Serviceability &amp; Carriers</h2>
        <p>
          We ship across Karnataka and selected locations in India using trusted carriers such as
          <b> VRL Logistics</b> and <b>Navata</b> (and other reputed partners where required).
        </p>

        <h2>Order Processing &amp; Timelines</h2>
        <ul>
          <li>Orders placed before 3:00 PM IST are typically processed within <b>1 business day</b>.</li>
          <li>Estimated delivery: <b>2–7 business days</b> depending on pin code and carrier transit time.</li>
          <li>Rural/remote locations may take additional time.</li>
        </ul>

        <h2>Shipping Charges</h2>
        <p>
          Shipping charges (if any) are shown at checkout or communicated for bulk/VRL consignments.
          COD availability may vary by pin code and order value.
        </p>

        <h2>Tracking &amp; Delivery</h2>
        <ul>
          <li>Tracking link/consignment number is shared via SMS/WhatsApp/email after dispatch.</li>
          <li>If the package is <b>damaged or tampered</b>, please <b>refuse delivery</b> and notify us within <b>48 hours</b> with photos.</li>
          <li>Incorrect/incomplete addresses, unreachable phone numbers, or customer unavailability may lead to delays or RTO (return to origin). Re-shipping charges may apply.</li>
        </ul>

        <h2>Loss/Damage Responsibility</h2>
        <p>
          Risk passes on delivery. For in-transit loss/damage confirmed by the carrier and reported within 48 hours,
          we will coordinate a replacement or refund in line with our <a href="/refund-policy">Refund Policy</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Phone: <a href="tel:+919886371630">+91 9886371630</a><br/>
          Email: <a href="mailto:info.avtradersagriclinic@gmail.com">info.avtradersagriclinic@gmail.com</a>
        </p>
      </main>
    </div>
  );
}
