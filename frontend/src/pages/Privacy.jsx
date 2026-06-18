import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Policy.css";
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_URL } from '../lib/config.js';

export default function Privacy() {
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

  const today = new Date().toLocaleDateString();

  return (
    <div className="policy-container">
      <header className="policy-header">
        <button className="back-icon" onClick={handleBack} aria-label="Go Back">⬅</button>
        <div>
          <h1>Privacy Policy</h1>
          <p style={{ marginTop: 4, opacity: 0.9 }}>Effective date: {today}</p>
        </div>
      </header>

      <main className="policy-content">
        <p className="muted">
          This Privacy Policy explains how <b>AV Traders Agri Clinic</b> (“Company”, “we”, “us”, “our”)
          collects, uses, discloses and safeguards your information when you use
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
            {" "}{SITE_URL}
          </a>. All prices shown on our website are in <b>INR (₹)</b>.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li><b>Identity & Contact:</b> name, mobile number, email, billing/shipping address.</li>
          <li><b>Order & Transaction:</b> items ordered, amounts, payment status, method (we never store full card numbers or UPI PINs).</li>
          <li><b>Device & Usage:</b> IP address, browser, pages visited, time spent, and interactions (via logs/cookies).</li>
          <li><b>Support:</b> photos/videos you share for damage/defect claims.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Process orders/payments, provide invoices and customer support.</li>
          <li>Arrange delivery and provide tracking updates.</li>
          <li>Prevent fraud, enforce terms, and comply with law.</li>
          <li>Improve our website, products, and communications (you can opt out of marketing at any time).</li>
        </ul>

        <h2>3. Sharing & Disclosures</h2>
        <p>We share data only as needed to provide our services or when required by law:</p>
        <ul>
          <li><b>Payment partners / gateways:</b> to process UPI/card/NetBanking payments.</li>
          <li><b>Logistics partners:</b> e.g., <b>VRL Logistics</b>, <b>Navata</b>, and other reputed carriers for pickup, shipping and delivery.</li>
          <li><b>Service providers:</b> IT/hosting, analytics, and customer communication tools under confidentiality obligations.</li>
          <li><b>Legal/government:</b> to comply with lawful requests or protect rights, property, and safety.</li>
        </ul>

        <h2>4. Payments & Security</h2>
        <p>
          Online payments are processed through secure payment partners. We do not store your UPI PIN,
          full card details, or NetBanking passwords. We follow reasonable security practices, but
          internet transmission carries inherent risks. Keep your account credentials confidential.
        </p>

        <h2>5. Cookies & Tracking</h2>
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences, and
          understand website usage. You can control cookies through your browser settings; some features
          may not work if cookies are disabled.
        </p>

        <h2>6. Data Retention & Deletion</h2>
        <p>
          We retain personal data only as long as necessary for the purposes described above or as
          required by law (e.g., tax, accounting). You can request deletion or correction by writing to
          us. We may retain limited information to comply with law or prevent fraud.
        </p>

        <h2>7. Your Rights</h2>
        <ul>
          <li>Access, update, or correct your information.</li>
          <li>Withdraw consent for optional processing (this does not affect prior lawful processing).</li>
          <li>Request deletion subject to legal/operational constraints.</li>
        </ul>

        <h2>8. Children</h2>
        <p>
          Our website is intended for adults. We do not knowingly collect personal data from children
          under applicable age limits. If you believe a child has provided us data, please contact us.
        </p>

        <h2>9. Third-Party Links</h2>
        <p>
          Our site may link to third-party websites. Their privacy practices are governed by their own
          policies. Please review those policies when visiting external sites.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. The “Effective date” above reflects the latest version.
        </p>

        <h2>11. Contact & Grievance Officer</h2>
        <p>
          <b>AV Traders Agri Clinic</b><br />
          Kurubarahally, Tumkur Road, Doddaballapura,<br />
          Bengaluru Rural, Karnataka – 561203<br />
          Phone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE.replace('+91', '+91 ')}</a><br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <div className="kv">
          <p><b>Grievance Officer:</b> Dr. A. Venugopal (Proprietor)</p>
          <p><b>Contact Window:</b> Mon–Fri, 9:00 AM – 6:00 PM IST</p>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          See also: <a href="/refund-policy">Refund &amp; Cancellation</a> ·{" "}
          <a href="/return-policy">Return/Replacement</a> ·{" "}
          <a href="/shipping-policy">Shipping &amp; Delivery</a>
        </p>
      </main>
    </div>
  );
}
