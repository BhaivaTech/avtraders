import React from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
const IconStore = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 4h16l1 4H3l1-4zm0 6h16v10H4V10zm3 2v6h10v-6H7z" />
  </svg>
);

const IconPrice = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 7.5 12.5 16a2 2 0 0 1-2.8 0L3 9.3V3h6.3l6.7 6.7L21 7.5zM7 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  </svg>
);

const IconCatalog = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 3h12a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V3zm3 6h8v2H7V9zm0 4h8v2H7v-2z" />
  </svg>
);

const IconTruck = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 4v4h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconShield = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconLogin = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M10 17v-3H3v-4h7V7l5 5-5 5zm2-15h8v20h-8v-3h5V5h-5V2z" />
  </svg>
);

const IconCard = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function TrustCard({ icon, title, description }) {
  return (
    <div className="cl-trust-card">
      <div className="cl-trust-icon">{icon}</div>
      <div className="cl-trust-title">{title}</div>
      <div className="cl-trust-desc">{description}</div>
    </div>
  );
}

function StepCard({ number, label, detail, accent }) {
  return (
    <div className="cl-step-card">
      <div className="cl-step-number" style={{ color: `var(${accent})` }}>{number}</div>
      <div className="cl-step-label">{label}</div>
      <div className="cl-step-detail">{detail}</div>
    </div>
  );
}

function ServiceCard({ icon, accentVar, tag, title, subtitle, items }) {
  return (
    <div className="cl-svc-card" style={{ "--svc-accent": `var(${accentVar})` }}>
      <div className="cl-svc-tag">{tag}</div>
      <div className="cl-svc-icon-wrap">{icon}</div>
      <div className="cl-svc-title">{title}</div>
      <div className="cl-svc-subtitle">{subtitle}</div>
      <ul className="cl-svc-list">
        {items.map((item, i) => (
          <li key={i}>
            <span className="cl-svc-check"><IconCheck /></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function Distribution() {
  return (
    <div className="cl-root">

      {/* ── HERO ── */}
      <section className="cl-hero" aria-labelledby="dist-hero-heading">
        <div className="cl-hero-left">
          <div className="cl-hero-eyebrow">
            <span className="cl-hero-pulse" aria-hidden="true" />
            AV Traders · Distribution
          </div>

          <h1 id="dist-hero-heading" className="cl-hero-title">
            Dealer Portal &amp;<br />
            <em>Distribution Network</em>
          </h1>

          <p className="cl-hero-sub">
            A secure dealer-only portal for registration, document verification and protected
            access to the latest wholesale price list. Dealer ordering, quotations and dispatch
            tracking will be enabled in the next phase.
          </p>

          <div className="cl-cta-row">
            <Link className="cl-btn-primary" to="/dealers">Open Dealer Portal</Link>
            <Link className="cl-btn-ghost" to="/contact">Dealer Enquiry</Link>
          </div>

          <div className="cl-hero-proof">
            <div className="cl-hero-proof-tag">Secure Access</div>
            <div className="cl-hero-proof-divider" aria-hidden="true" />
            <div className="cl-hero-proof-text">JWT-secured &amp; Document-verified</div>
          </div>
        </div>

        {/* Portal status widget — mirrors the chat widget from homepage */}
        <div className="cl-hero-panel" aria-hidden="true">
          <div className="cl-panel-bar">
            <div className="cl-panel-avatar">DP</div>
            <div>
              <div className="cl-panel-name">Dealer Portal</div>
              <div className="cl-panel-status">
                <span className="cl-panel-status-dot" /> Secure Connect
              </div>
            </div>
          </div>
          <div className="cl-panel-body">
            <div className="cl-bubble">
              <b>1. Mobile Login</b><br />
              Enter mobile number to continue.
            </div>
            <div className="cl-bubble cl-bubble-user">
              <b>2. Document Upload</b><br />
              GST certificate + Insecticide licence.
            </div>
            <div className="cl-typing">
              <span className="cl-typing-dot" />
              <span className="cl-typing-dot" />
              <span className="cl-typing-dot" />
            </div>
            <div className="cl-rx-card">
              <div className="cl-rx-icon">✓</div>
              <div>
                <div className="cl-rx-label">Verification in Progress</div>
                <div className="cl-rx-sub">Admin review pending.</div>
              </div>
            </div>
          </div>
          <div className="cl-panel-metrics">
            <div className="cl-panel-metric">
              <div className="cl-panel-metric-val">1</div>
              <div className="cl-panel-metric-label">Login</div>
            </div>
            <div className="cl-panel-metric">
              <div className="cl-panel-metric-val">2</div>
              <div className="cl-panel-metric-label">Verify</div>
            </div>
            <div className="cl-panel-metric">
              <div className="cl-panel-metric-val">3</div>
              <div className="cl-panel-metric-label">Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT STRIP / TRUST CARDS ── */}
      <section className="cl-section" aria-label="Portal features at a glance">
        <div className="cl-trust-grid">
          <TrustCard
            icon={<IconLogin />}
            title="Mobile Login"
            description="Simple mobile entry. OTP-ready for future WhatsApp activation."
          />
          <TrustCard
            icon={<IconStore />}
            title="Dealer Verification"
            description="GST certificate and Insecticide licence verified by admin."
          />
          <TrustCard
            icon={<IconCatalog />}
            title="Protected Price List"
            description="Latest wholesale rates available only after approval."
          />
          <TrustCard
            icon={<IconCard />}
            title="Orders — Next Phase"
            description="Online orders, quotation and invoice workflow coming soon."
          />
        </div>
      </section>

      {/* ── APPROVAL WORKFLOW ── */}
      <section className="cl-section" aria-labelledby="dist-workflow-heading">
        <div className="cl-eyebrow">Dealer Workflow</div>
        <h2 id="dist-workflow-heading" className="cl-h2">
          Designed for a standard <em>dealer approval workflow</em>
        </h2>
        <p className="cl-lead">
          The portal is built to keep dealer onboarding clean, verified and secure before giving
          access to business price lists.
        </p>

        <div className="cl-svc-grid">
          <ServiceCard
            icon={<IconLogin />}
            accentVar="--g500"
            tag="Step 01"
            title="Dealer Login"
            subtitle="Mobile-based entry"
            items={[
               "Dealer enters mobile number and continues",
               "OTP-ready frontend structure",
               "JWT/session-ready backend connection"
            ]}
          />
          <ServiceCard
            icon={<IconStore />}
            accentVar="--a400"
            tag="Step 02"
            title="Registration"
            subtitle="New dealers submit firm details"
            items={[
               "Dealer name, firm name and GST",
               "Village/Post, Taluk, District and Pin Code",
               "GST certificate and Insecticide licence upload"
            ]}
          />
          <ServiceCard
            icon={<IconPrice />}
            accentVar="--sky-400"
            tag="Step 03"
            title="Approved Access"
            subtitle="Secure wholesale lists"
            items={[
               "Approved dealers only",
               "Protected download link",
               "Latest uploaded price list visible immediately"
            ]}
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="cl-section" aria-labelledby="dist-hiw-heading">
        <div className="cl-eyebrow">Step by Step</div>
        <h2 id="dist-hiw-heading" className="cl-h2">How it <em>works</em></h2>
        <p className="cl-lead">
          From first login to price list download — the full dealer onboarding flow in six
          straightforward steps.
        </p>

        <div className="cl-trust-grid">
          <StepCard number="01" label="Login" detail="Dealer opens Dealer Portal and enters mobile number." accent="--g500" />
          <StepCard number="02" label="Register Form" detail="Registration form opens with firm, GST, address." accent="--a400" />
          <StepCard number="03" label="Documents" detail="Dealer submits GST certificate and Insecticide licence." accent="--sky-400" />
          <StepCard number="04" label="Review" detail="Admin reviews the registration and documents." accent="--earth-400" />
          <StepCard number="05" label="Approval" detail="Admin can Approve or Reject with reason." accent="--g600" />
          <StepCard number="06" label="Access" detail="Approved dealer logs in and downloads the latest protected price list." accent="--g700" />
        </div>
      </section>

      {/* ── FUTURE FEATURES ── */}
      <section className="cl-section" aria-labelledby="dist-future-heading">
        <div className="cl-eyebrow">Roadmap</div>
        <h2 id="dist-future-heading" className="cl-h2">
          Future Distribution <em>Features</em>
        </h2>
        <p className="cl-lead">
          After dealer onboarding and price list access, the next phase will include full
          wholesale ordering and dispatch management.
        </p>

        <div className="cl-trust-grid">
          <TrustCard icon={<span style={{fontSize: "24px"}}>🛒</span>} title="Dealer product catalog" description="View available products" />
          <TrustCard icon={<span style={{fontSize: "24px"}}>📦</span>} title="Cart & Order" description="Cart and order confirmation" />
          <TrustCard icon={<span style={{fontSize: "24px"}}>🧾</span>} title="GST Invoice" description="GST invoice generation" />
          <TrustCard icon={<span style={{fontSize: "24px"}}>🚚</span>} title="Dispatch" description="Dispatch and LR tracking" />
          <TrustCard icon={<span style={{fontSize: "24px"}}>💬</span>} title="Support" description="Dealer support chat" />
          <TrustCard icon={<span style={{fontSize: "24px"}}>📣</span>} title="Notifications" description="Price list update notification" />
        </div>
      </section>

      <style>{`
        /* ══════════════════════════════════════════════
           @import: premium agricultural font pairing
        ══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           Design tokens — Shared with Clinic
        ══════════════════════════════════════════════ */
        .cl-root {
          /* Green ramp — primary brand */
          --g50:  #EAF3DE;
          --g100: #C0DD97;
          --g200: #97C459;
          --g400: #639922;
          --g500: #4E7F18;
          --g600: #3B6D11;
          --g700: #2F5A0D;
          --g800: #27500A;
          --g900: #173404;

          /* Amber ramp — warmth / treatment */
          --a50:  #FAEEDA;
          --a100: #FAC775;
          --a200: #EF9F27;
          --a400: #BA7517;
          --a600: #854F0B;
          --a800: #633806;

          /* Earth / soil accent */
          --earth-50:  #F5F0E8;
          --earth-100: #E3D5BC;
          --earth-400: #9C7A4A;
          --earth-600: #6B5030;

          /* Sky blue — trust */
          --sky-50:  #EBF5FB;
          --sky-100: #BAD9F1;
          --sky-400: #3A8DC5;
          --sky-600: #1E5F8A;

          /* Layout */
          --max-w: 1180px;
          --r-sm:  8px;
          --r-md:  14px;
          --r-lg:  20px;
          --r-xl:  28px;
          --r-2xl: 36px;

          /* Motion */
          --ease: cubic-bezier(0.4, 0, 0.2, 1);
          --dur:  220ms;

          font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
          color: var(--color-text-primary);
        }

        .cl-root {
          display: flex;
          flex-direction: column;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 0 1.5rem 5rem;
        }

        .cl-section {
          padding: 5rem 0;
        }
        .cl-section + .cl-section {
          border-top: 1px solid var(--color-border-tertiary);
        }

        .cl-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--g600);
          background: var(--g50);
          border: 1px solid var(--g100);
          border-radius: 100px;
          padding: 5px 14px;
          margin-bottom: 1.5rem;
        }

        .cl-h2 {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: var(--color-text-primary);
          margin: 0 0 0.75rem;
        }
        .cl-h2 em {
          font-style: italic;
          color: var(--g500);
        }

        .cl-lead {
          font-size: 1rem;
          color: var(--color-text-secondary);
          line-height: 1.75;
          margin: 0 0 3rem;
          max-width: 560px;
        }

        .cl-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 15px 30px;
          background: var(--g600);
          color: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: var(--r-md);
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background var(--dur) var(--ease),
                      transform var(--dur) var(--ease),
                      box-shadow var(--dur) var(--ease);
          position: relative;
          letter-spacing: 0.01em;
        }
        .cl-btn-primary:hover {
          background: var(--g800);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 109, 17, 0.35);
        }
        .cl-btn-primary:active { transform: translateY(0); box-shadow: none; }

        .cl-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 26px;
          background: transparent;
          color: var(--color-text-primary);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--r-md);
          border: 1.5px solid var(--color-border-secondary);
          cursor: pointer;
          text-decoration: none;
          transition: border-color var(--dur) var(--ease),
                      background var(--dur) var(--ease),
                      transform var(--dur) var(--ease);
        }
        .cl-btn-ghost:hover {
          border-color: var(--g400);
          background: var(--g50);
          transform: translateY(-2px);
        }

        .cl-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .cl-hero {
          padding: 5.5rem 0 4.5rem;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 4rem;
          align-items: center;
          position: relative;
        }
        .cl-hero::before {
          content: "";
          position: absolute;
          top: -60px;
          right: -80px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--g50) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        @media (max-width: 900px) {
          .cl-hero { grid-template-columns: 1fr; gap: 3rem; padding: 3.5rem 0 2.5rem; }
          .cl-hero::before { display: none; }
        }

        .cl-hero-left { position: relative; z-index: 1; }

        .cl-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--g600);
          margin-bottom: 1.5rem;
        }

        .cl-hero-pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--g400);
          display: inline-block;
          animation: cl-pulse 2.6s ease-in-out infinite;
        }
        @keyframes cl-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.7); }
        }

        .cl-hero-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(2.2rem, 5.5vw, 3.6rem);
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.01em;
          color: var(--color-text-primary);
          margin: 0 0 1.5rem;
        }
        .cl-hero-title em {
          font-style: italic;
          color: var(--g500);
        }

        .cl-hero-sub {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--color-text-secondary);
          margin: 0 0 2rem;
          max-width: 500px;
        }

        .cl-hero-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }
        .cl-hero-proof-text {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        .cl-hero-proof-divider {
          width: 1px;
          height: 16px;
          background: var(--color-border-tertiary);
        }
        .cl-hero-proof-tag {
          font-size: 0.8rem;
          color: var(--g600);
          font-weight: 600;
        }

        .cl-hero-panel {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-2xl);
          padding: 0;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) { .cl-hero-panel { display: none; } }

        .cl-panel-bar {
          background: var(--g600);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cl-panel-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.03em;
        }
        .cl-panel-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }
        .cl-panel-status {
          font-size: 11.5px;
          color: rgba(255,255,255,0.75);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cl-panel-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
          flex-shrink: 0;
        }

        .cl-panel-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-background-secondary);
          min-height: 260px;
        }

        .cl-bubble {
          max-width: 88%;
          padding: 10px 14px;
          font-size: 0.8rem;
          line-height: 1.55;
          color: var(--color-text-primary);
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px 16px 16px 4px;
        }
        .cl-bubble-user {
          align-self: flex-end;
          background: var(--g600);
          color: #fff;
          border-color: transparent;
          border-radius: 16px 16px 4px 16px;
        }

        .cl-typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 8px 12px;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px 16px 16px 4px;
          width: fit-content;
        }
        .cl-typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--g400);
          animation: cl-bounce 1.4s ease-in-out infinite;
        }
        .cl-typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .cl-typing-dot:nth-child(3) { animation-delay: 0.32s; }
        @keyframes cl-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }

        .cl-rx-card {
          background: var(--a50);
          border: 1px solid var(--a100);
          border-left: 3px solid var(--a200);
          border-radius: var(--r-md);
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 2px;
        }
        .cl-rx-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .cl-rx-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--a800);
          margin-bottom: 2px;
        }
        .cl-rx-sub {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .cl-panel-metrics {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--color-border-tertiary);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          background: var(--color-background-primary);
        }
        .cl-panel-metric {
          text-align: center;
          padding: 0.5rem;
        }
        .cl-panel-metric + .cl-panel-metric {
          border-left: 1px solid var(--color-border-tertiary);
        }
        .cl-panel-metric-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--g600);
          line-height: 1;
          margin-bottom: 3px;
        }
        .cl-panel-metric-label {
          font-size: 10.5px;
          color: var(--color-text-secondary);
        }

        .cl-trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .cl-trust-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-lg);
          padding: 1.6rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          overflow: hidden;
          transition: transform var(--dur) var(--ease);
        }
        .cl-trust-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 3px;
          background: var(--g400);
          border-radius: 0 0 4px 0;
        }
        .cl-trust-card:hover { transform: translateY(-3px); }
        .cl-trust-icon { color: var(--g600); margin-bottom: 4px; }
        .cl-trust-title { font-size: 0.94rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.3; }
        .cl-trust-desc { font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.6; }

        .cl-svc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
        }
        .cl-svc-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-xl);
          padding: 2.25rem 2rem;
          position: relative;
          overflow: hidden;
          transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
        }
        .cl-svc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
        }
        .cl-svc-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--svc-accent);
        }
        .cl-svc-tag {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--svc-accent);
          margin-bottom: 1.25rem;
        }
        .cl-svc-icon-wrap {
          width: 52px; height: 52px;
          border-radius: var(--r-md);
          background: color-mix(in srgb, var(--svc-accent) 15%, transparent);
          color: var(--svc-accent);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.5rem;
        }
        .cl-svc-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.5rem; color: var(--color-text-primary); margin-bottom: 0.5rem; }
        .cl-svc-subtitle { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 1.5rem; }
        .cl-svc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .cl-svc-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.5; }
        .cl-svc-check { color: var(--svc-accent); margin-top: 2px; flex-shrink: 0; }

        .cl-step-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-lg);
          padding: 1.6rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cl-step-number { font-weight: 800; font-size: 12px; margin-bottom: 8px; }
        .cl-step-label { font-size: 1rem; font-weight: 700; color: var(--color-text-primary); }
        .cl-step-detail { font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.6; }
      `}</style>
    </div>
  );
}