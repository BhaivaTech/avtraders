import React from "react";
import { Link } from "react-router-dom";

const IconStore = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M4 4h16l1 4H3l1-4zm0 6h16v10H4V10zm3 2v6h10v-6H7z" />
  </svg>
);

const IconPrice = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M21 7.5 12.5 16a2 2 0 0 1-2.8 0L3 9.3V3h6.3l6.7 6.7L21 7.5zM7 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
    />
  </svg>
);

const IconCatalog = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M4 3h12a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V3zm3 6h8v2H7V9zm0 4h8v2H7v-2z" />
  </svg>
);

const IconCart = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 4h2l2 10h10l2-6H8" />
  </svg>
);

const IconCard = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M2 5h20v14H2zM2 9h20v2H2z" />
  </svg>
);

const IconTruck = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M3 6h11v7h2.5l2 2H21V9h-3l-2-3H14V4H3v2zm2 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);

const IconShield = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z" />
  </svg>
);

const IconLogin = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M10 17v-3H3v-4h7V7l5 5-5 5zm2-15h8v20h-8v-3h5V5h-5V2z" />
  </svg>
);

export default function Distribution() {
  return (
    <div className="distribution-page">
      <section className="distribution-hero">
        <div className="distribution-hero-inner">
          <div className="dist-badge">AV Traders / AV Agro Distribution</div>

          <h1>Dealer Portal & Distribution Network</h1>

          <p>
            A secure dealer-only portal for registration, document verification and protected
            access to the latest wholesale price list. Dealer ordering, quotations and dispatch
            tracking will be enabled in the next phase.
          </p>

          <div className="dist-actions">
            <Link className="dist-btn primary" to="/dealers">
              Open Dealer Portal
            </Link>
            <Link className="dist-btn secondary" to="/contact">
              Dealer Enquiry
            </Link>
          </div>

          <div className="dist-secure-line">
            <IconShield />
            <span>
              Protected access: registered and approved dealers only. WhatsApp OTP connection is
              kept ready for future activation.
            </span>
          </div>
        </div>
      </section>

      <section className="dist-stats">
        <div className="dist-stat">
          <div className="dist-stat-title">
            <IconLogin /> Mobile Login
          </div>
          <p>Simple mobile login enabled now. OTP-ready setup for future WhatsApp activation.</p>
        </div>

        <div className="dist-stat">
          <div className="dist-stat-title">
            <IconStore /> Dealer Verification
          </div>
          <p>GST certificate and Insecticide licence verification by admin.</p>
        </div>

        <div className="dist-stat">
          <div className="dist-stat-title">
            <IconCatalog /> Price List Excel
          </div>
          <p>Latest protected dealer price list available only after approval.</p>
        </div>

        <div className="dist-stat">
          <div className="dist-stat-title">
            <IconCard /> Orders Next
          </div>
          <p>Online orders, quotation and invoice workflow will be added later.</p>
        </div>
      </section>

      <section className="dist-card">
        <div className="dist-section-head">
          <h2>Designed for a standard dealer approval workflow</h2>
          <p>
            The portal is built to keep dealer onboarding clean, verified and secure before giving
            access to business price lists.
          </p>
        </div>

        <div className="dist-feature-grid">
          <div className="dist-feature">
            <div className="dist-feature-title">
              <IconLogin /> Step 1: Dealer Login
            </div>
            <p>
              Dealer enters mobile number and continues. Later, the same flow can be changed to
              WhatsApp OTP after MSG91/Meta is corrected.
            </p>
            <ul>
              <li>Mobile-based entry</li>
              <li>OTP-ready frontend structure</li>
              <li>JWT/session-ready backend connection</li>
            </ul>
          </div>

          <div className="dist-feature">
            <div className="dist-feature-title">
              <IconStore /> Step 2: Registration
            </div>
            <p>
              New dealers submit firm details and required documents for admin approval.
            </p>
            <ul>
              <li>Dealer name, firm name and GST</li>
              <li>Village/Post, Taluk, District and Pin Code</li>
              <li>GST certificate and Insecticide licence upload</li>
            </ul>
          </div>

          <div className="dist-feature">
            <div className="dist-feature-title">
              <IconPrice /> Step 3: Approved Access
            </div>
            <p>
              After admin approval, dealers can securely access and download the latest wholesale
              price list.
            </p>
            <ul>
              <li>Approved dealers only</li>
              <li>Protected download link</li>
              <li>Latest uploaded price list visible immediately</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="dist-card">
        <h2>How it works</h2>

        <ol className="dist-steps">
          <li>
            Dealer opens <b>Dealer Portal</b> and enters mobile number.
          </li>
          <li>
            If dealer is new, registration form opens with firm, GST, address and document upload.
          </li>
          <li>
            Dealer submits GST certificate and Insecticide licence.
          </li>
          <li>
            Admin reviews the registration and documents.
          </li>
          <li>
            Admin can <b>Approve</b> or <b>Reject</b> with reason.
          </li>
          <li>
            Approved dealer logs in and downloads the latest protected price list.
          </li>
        </ol>

        <div className="dist-actions left">
          <Link className="dist-btn primary" to="/dealers">
            Open Dealer Portal
          </Link>
          <Link className="dist-btn secondary-dark" to="/contact">
            Contact Support
          </Link>
        </div>
      </section>

      <section className="dist-card">
        <h2>
          <IconTruck /> Future Distribution Features
        </h2>

        <p>
          After dealer onboarding and price list access, the next phase can include full wholesale
          ordering and dispatch management.
        </p>

        <div className="dist-next-grid">
          <div>🛒 Dealer product catalog</div>
          <div>📦 Cart and order confirmation</div>
          <div>🧾 GST invoice generation</div>
          <div>🚚 Dispatch and LR tracking</div>
          <div>💬 Dealer support chat</div>
          <div>📣 Price list update notification</div>
        </div>
      </section>

      <section className="dist-final-cta">
        <div>
          <h2>Want access to the dealer price list?</h2>
          <p>
            Open the Dealer Portal, complete registration and upload your documents. Admin approval
            is required before price list access.
          </p>
        </div>

        <div className="dist-actions">
          <Link className="dist-btn primary" to="/dealers">
            Dealer Portal
          </Link>
          <Link className="dist-btn secondary" to="/contact">
            Become a Dealer
          </Link>
        </div>
      </section>

      <style>{`
        .distribution-page {
          display: grid;
          gap: 22px;
        }

        .distribution-hero {
          border-radius: 26px;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 15%, rgba(255,255,255,.25), transparent 24%),
            linear-gradient(135deg, #0f766e, #2563eb 48%, #1e3a8a);
          color: white;
          box-shadow: 0 20px 50px rgba(15, 23, 42, .2);
        }

        .distribution-hero-inner {
          padding: 42px 24px;
          text-align: center;
          display: grid;
          gap: 16px;
          justify-items: center;
        }

        .dist-badge {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          border: 1px solid rgba(255,255,255,.24);
          font-weight: 900;
          font-size: 13px;
          letter-spacing: .3px;
        }

        .distribution-hero h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 54px);
          line-height: 1.05;
          font-weight: 950;
          max-width: 980px;
        }

        .distribution-hero p {
          margin: 0;
          max-width: 920px;
          line-height: 1.75;
          opacity: .96;
        }

        .dist-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .dist-actions.left {
          justify-content: flex-start;
        }

        .dist-btn {
          min-height: 44px;
          padding: 11px 16px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 950;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .dist-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 22px rgba(15, 23, 42, .16);
        }

        .dist-btn.primary {
          background: #111827;
          color: white;
        }

        .dist-btn.secondary {
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.28);
          color: white;
        }

        .dist-btn.secondary-dark {
          background: #f8fafc;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .dist-secure-line {
          margin-top: 4px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          line-height: 1.5;
        }

        .dist-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .dist-stat,
        .dist-card,
        .dist-final-cta {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, .08);
        }

        .dist-stat {
          padding: 18px;
          display: grid;
          gap: 8px;
        }

        .dist-stat-title {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          font-weight: 950;
          color: #0f172a;
          text-align: center;
        }

        .dist-stat p {
          margin: 0;
          color: #64748b;
          text-align: center;
          line-height: 1.6;
          font-size: 14px;
        }

        .dist-card {
          padding: 22px;
        }

        .dist-card h2,
        .dist-final-cta h2 {
          margin: 0 0 10px;
          color: #0f172a;
          font-weight: 950;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dist-card p,
        .dist-final-cta p,
        .dist-section-head p,
        .dist-feature p {
          color: #64748b;
          line-height: 1.75;
          margin: 0 0 12px;
        }

        .dist-section-head {
          text-align: center;
          max-width: 900px;
          margin: 0 auto 18px;
        }

        .dist-section-head h2 {
          justify-content: center;
        }

        .dist-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .dist-feature {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 18px;
          background: #f8fafc;
        }

        .dist-feature-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #0f172a;
          font-weight: 950;
          margin-bottom: 10px;
        }

        .dist-feature ul,
        .dist-steps {
          margin: 0;
          padding-left: 20px;
          color: #334155;
          line-height: 1.85;
        }

        .dist-feature li {
          margin: 4px 0;
        }

        .dist-steps {
          margin-bottom: 16px;
        }

        .dist-next-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .dist-next-grid div {
          padding: 13px 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          font-weight: 850;
          color: #0f172a;
        }

        .dist-final-cta {
          padding: 22px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          background: linear-gradient(135deg, #ecfdf5, #eff6ff);
        }

        .dist-final-cta .dist-btn.secondary {
          background: white;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        @media (max-width: 1050px) {
          .dist-stats,
          .dist-feature-grid,
          .dist-next-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .distribution-hero-inner {
            padding: 30px 16px;
          }

          .dist-stats,
          .dist-feature-grid,
          .dist-next-grid {
            grid-template-columns: 1fr;
          }

          .dist-final-cta {
            flex-direction: column;
            align-items: flex-start;
          }

          .dist-actions,
          .dist-actions.left {
            width: 100%;
            justify-content: stretch;
          }

          .dist-btn {
            width: 100%;
          }

          .dist-secure-line {
            border-radius: 18px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}