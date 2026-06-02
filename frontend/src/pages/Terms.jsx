import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Policy.css";
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_URL } from '../lib/config.js';

export default function Terms() {
  const navigate = useNavigate();

  const handleBack = () => {
    sessionStorage.setItem("lastScroll", window.scrollY.toString());
    navigate(-1);
  };

  useEffect(() => {
    const lastScroll = sessionStorage.getItem("lastScroll");
    if (lastScroll) {
      window.scrollTo(0, parseInt(lastScroll, 10));
      sessionStorage.removeItem("lastScroll");
    }
  }, []);

  const today = new Date().toLocaleDateString();

  return (
    <div className="policy-container">
      <header className="policy-header">
        <button className="back-icon" onClick={handleBack} aria-label="Go Back">⬅</button>
        <div>
          <h1>Terms &amp; Conditions</h1>
          <p style={{ marginTop: 4, opacity: 0.9 }}>Effective date: {today}</p>
        </div>
      </header>

      <main className="policy-content">
        <p>
          These Terms &amp; Conditions (“Terms”) govern your access to and use of
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
            {" "}{SITE_URL}
          </a>{" "}
          (the “Website/Platform”) operated by <b>AV Traders </b> (“we”, “us”, “our”).
          By using this Website or placing an order, you agree to these Terms and our
          <a href="/privacy-policy"> Privacy Policy</a>.
        </p>

        <h2>1. Eligibility & Account</h2>
        <ul>
          <li>You must be competent to contract under applicable law.</li>
          <li>You agree to provide accurate information and safeguard your credentials.</li>
          <li>You are responsible for all activity under your account.</li>
        </ul>

        <h2>2. Products, Services & Pricing (INR)</h2>
        <ul>
          <li>All prices are shown in <b>Indian Rupees (INR/₹)</b> and are subject to change without notice.</li>
          <li>Typographical/technical errors in price or availability may be corrected; we may cancel/refund orders affected by such errors.</li>
          <li>Pictures are illustrative; packaging/batch may vary.</li>
        </ul>

        <h2>3. Orders & Payments</h2>
        <ul>
          <li>Placing an order constitutes an offer to purchase; acceptance occurs when we dispatch the order or confirm service booking.</li>
          <li>We accept UPI, cards, NetBanking and other methods via trusted payment partners. We do not store UPI PINs or full card details.</li>
          <li>Orders may be cancelled/refunded per our <a href="/refund-policy">Refund &amp; Cancellation Policy</a>.</li>
        </ul>

        <h2>4. Shipping & Delivery</h2>
        <p>
          We ship across Karnataka and selected locations in India using <b>VRL Logistics</b>, <b>Navata</b> and other reputed carriers.
          Processing, timelines, charges, tracking and damage reporting are governed by our
          <a href="/shipping-policy"> Shipping &amp; Delivery Policy</a>.
        </p>

        <h2>5. Returns/Replacement & Refunds</h2>
        <p>
          For safety reasons, general returns may not be supported for opened/used agro-inputs. Cases eligible
          for replacement/refund and timelines are detailed in our
          <a href="/return-policy"> Return/Replacement Policy</a> and
          <a href="/refund-policy"> Refund &amp; Cancellation Policy</a>.
        </p>

        <h2>6. User Conduct</h2>
        <ul>
          <li>Do not misuse the Website, interfere with security, or violate applicable laws.</li>
          <li>Do not upload harmful content, spam, or infringe any third-party rights.</li>
        </ul>

        <h2>7. Intellectual Property</h2>
        <p>
          All content on the Website (text, graphics, logos, images, layout) is owned by or licensed to us.
          You may not copy, modify, distribute or create derivative works without prior written consent.
        </p>

        <h2>8. Disclaimer & Limitation of Liability</h2>
        <p>
          The Website and all content/services are provided on an “as is” and “as available” basis without warranties.
          To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential
          damages arising from your use of the Website or products/services.
        </p>

        <h2>9. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless AV Traders Agri Clinic and its officers, employees, and partners
          from any claims or liabilities arising from your breach of these Terms or violation of law/rights of others.
        </p>

        <h2>10. Force Majeure</h2>
        <p>
          We are not liable for delays or failures due to events beyond our reasonable control, including natural
          disasters, strikes, lockdowns, carrier issues, or network failures.
        </p>

        <h2>11. Governing Law & Jurisdiction</h2>
        <p>
          These Terms are governed by the laws of India. Courts in <b>Bengaluru, Karnataka</b> shall have exclusive jurisdiction.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms from time to time. Your continued use of the Website after changes constitutes acceptance.
        </p>

        <h2>13. Contact</h2>
        <p>
          <b>AV Traders Agri Clinic</b><br />
          Kurubarahally, Tumkur Road, Doddaballapura,<br />
          Bengaluru Rural, Karnataka – 561203<br />
          Phone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE.replace('+91', '+91 ')}</a><br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p className="muted" style={{ marginTop: 12 }}>
          Related policies: <a href="/privacy-policy">Privacy</a> ·{" "}
          <a href="/refund-policy">Refund &amp; Cancellation</a> ·{" "}
          <a href="/return-policy">Return/Replacement</a> ·{" "}
          <a href="/shipping-policy">Shipping &amp; Delivery</a>
        </p>
      </main>
    </div>
  );
}
