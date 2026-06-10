import React from "react";

export default function About() {
  return (
    <div className="cl-root">
      
      {/* ── HERO ── */}
      <section className="cl-hero" style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="cl-hero-eyebrow">
            <span className="cl-hero-pulse" aria-hidden="true" />
            Agricultural Clinic & Agri Business Center
          </div>
        </div>

        <h1 className="cl-hero-title" style={{ maxWidth: "800px", margin: "0 auto 1.5rem" }}>
          Empowering Farmers Through<br />
          <em>Scientific Agriculture</em>
        </h1>

        <p className="cl-hero-sub" style={{ margin: "0 auto 2.5rem", maxWidth: "760px" }}>
          AV Traders Agri Clinic combines agricultural science,
          field experience, and practical farm solutions to help
          farmers improve productivity, profitability, and long-term
          sustainability.
        </p>
      </section>

      {/* ── FOUNDER CARD ── */}
      <section className="cl-svc-card cl-about-founder" style={{ "--svc-accent": "var(--g600)", padding: "3rem", marginBottom: "3rem", textAlign: "center" }}>
        <span className="cl-eyebrow" style={{ marginBottom: "1rem" }}>Founder & Agricultural Consultant</span>
        <h2 className="cl-h2">Dr. A. Venugopal</h2>
        <div style={{ color: "var(--g600)", fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.05rem" }}>
          M.Sc. Agriculture • 30+ Years of Agricultural Consultancy
        </div>
        <p className="cl-lead" style={{ margin: "0 auto", maxWidth: "800px" }}>
          With over three decades of hands-on experience working
          directly with farmers across Karnataka, Dr. A. Venugopal
          has dedicated his career to bringing scientific and
          practical agricultural solutions to the field. His mission
          is to help farmers achieve better yields, healthier crops,
          and sustainable growth through knowledge-driven farming.
        </p>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="cl-about-grid" style={{ marginBottom: "4rem" }}>
        <div className="cl-rx-card cl-feature-card" style={{ padding: "2rem", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
          <div className="cl-feature-icon">🌱</div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--g900)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Farm Advisory</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#4a5e4a", lineHeight: 1.6 }}>
            Personalized crop guidance based on soil condition,
            climate patterns, crop stage, and local farming
            practices.
          </p>
        </div>

        <div className="cl-rx-card cl-feature-card" style={{ padding: "2rem", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
          <div className="cl-feature-icon">🌾</div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--g900)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Quality Agri Inputs</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#4a5e4a", lineHeight: 1.6 }}>
            Reliable seeds, fertilizers, micronutrients, and crop
            protection products sourced from trusted manufacturers.
          </p>
        </div>

        <div className="cl-rx-card cl-feature-card" style={{ padding: "2rem", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
          <div className="cl-feature-icon">📈</div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--g900)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Profitability Focus</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#4a5e4a", lineHeight: 1.6 }}>
            Helping farmers reduce input costs, improve efficiency,
            and increase farm profitability.
          </p>
        </div>

        <div className="cl-rx-card cl-feature-card" style={{ padding: "2rem", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
          <div className="cl-feature-icon">🤝</div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--g900)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Distribution Network</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#4a5e4a", lineHeight: 1.6 }}>
            Supporting dealers and retailers with dependable product
            supply and technical agricultural expertise.
          </p>
        </div>
      </section>

      {/* ── VISION ── */}
      <section className="cl-svc-card cl-about-vision" style={{ "--svc-accent": "var(--sky-400)", padding: "4rem 2rem", marginBottom: "4rem", textAlign: "center", background: "linear-gradient(to bottom, #fff, var(--sky-50))" }}>
        <span className="cl-eyebrow" style={{ marginBottom: "1rem" }}>Our Vision</span>
        <h2 className="cl-h2" style={{ maxWidth: "800px", margin: "0 auto 1.5rem" }}>
          Building a Future Where Every Farmer Has Access to
          Knowledge, Technology, and Opportunity
        </h2>
        <p className="cl-lead" style={{ margin: "0 auto", maxWidth: "720px" }}>
          We envision a sustainable agricultural ecosystem where
          innovation, education, and trusted partnerships empower
          farmers to thrive in an ever-changing world.
        </p>
      </section>

      {/* ── STATS ── */}
      <section className="cl-stats-grid" style={{ marginBottom: "4rem" }}>
        <div className="cl-stat-item">
          <h3>30+</h3>
          <span>Years Experience</span>
        </div>
        <div className="cl-stat-item">
          <h3>1000+</h3>
          <span>Farmers Guided</span>
        </div>
        <div className="cl-stat-item">
          <h3>100+</h3>
          <span>Training Programs</span>
        </div>
        <div className="cl-stat-item">
          <h3>24/7</h3>
          <span>Farmer Support</span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cl-cta-row" style={{ justifyContent: "center", paddingBottom: "2rem" }}>
        <a href="/farmers" className="cl-btn-primary">
          Explore Agricultural Solutions
        </a>
        <a
          href="https://youtube.com/@dravenugopal"
          target="_blank"
          rel="noreferrer"
          className="cl-btn-ghost"
        >
          Watch Expert Farming Guidance
        </a>
      </section>

      <style>{`
        /* ══════════════════════════════════════════════
           @import: premium agricultural font pairing
        ══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           Design tokens — Shared with Clinic & Dealers
        ══════════════════════════════════════════════ */
        .cl-root {
          --g50:  #EAF3DE;
          --g100: #C0DD97;
          --g200: #97C459;
          --g400: #639922;
          --g500: #4E7F18;
          --g600: #3B6D11;
          --g700: #2F5A0D;
          --g800: #27500A;
          --g900: #173404;

          --a50:  #FAEEDA;
          --a100: #FAC775;
          --a200: #EF9F27;
          --a400: #BA7517;
          --a600: #854F0B;
          --a800: #633806;

          --sky-50:  #EBF5FB;
          --sky-100: #BAD9F1;
          --sky-400: #3A8DC5;
          --sky-600: #1E5F8A;

          --max-w: 1180px;
          --r-sm:  8px;
          --r-md:  14px;
          --r-lg:  20px;
          --r-xl:  28px;
          --r-2xl: 36px;

          --ease: cubic-bezier(0.4, 0, 0.2, 1);
          --dur:  220ms;

          font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
          color: #1a2e1a;
        }

        .cl-root {
          display: flex;
          flex-direction: column;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 0 1.5rem 5rem;
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
        }

        .cl-h2 {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: inherit;
          margin: 0 0 0.75rem;
        }
        .cl-h2 em {
          font-style: italic;
          color: var(--g500);
        }

        .cl-lead {
          font-size: 1.05rem;
          color: #4a5e4a;
          line-height: 1.8;
          margin: 0;
        }

        /* Buttons */
        .cl-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 26px;
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
          letter-spacing: 0.01em;
        }
        .cl-btn-primary:hover {
          background: var(--g800);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 109, 17, 0.35);
        }

        .cl-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: inherit;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--r-md);
          border: 1.5px solid #dbe3ef;
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

        /* Hero */
        .cl-hero {
          padding: 4.5rem 0;
          position: relative;
        }
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
          font-size: clamp(2.2rem, 5.5vw, 4rem);
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .cl-hero-title em { font-style: italic; color: var(--g500); }
        .cl-hero-sub {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #4a5e4a;
        }

        /* Cards */
        .cl-svc-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: var(--r-xl);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
        }
        .cl-svc-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--svc-accent);
        }

        .cl-rx-card {
          background: var(--g50);
          border: 1px solid var(--g100);
          border-radius: var(--r-md);
          display: flex;
          transition: all var(--dur) var(--ease);
        }
        .cl-feature-card {
          background: #fff;
          border-color: #e5e7eb;
        }
        .cl-feature-card:hover {
          border-color: var(--g400);
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(59, 109, 17, 0.05);
        }
        .cl-feature-icon {
          width: 54px; height: 54px;
          border-radius: var(--r-md);
          background: var(--g50);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
        }

        /* Layout Grids specifically for About page */
        .cl-about-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .cl-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .cl-stat-item {
          border: 1px solid #e5e7eb;
          border-radius: var(--r-lg);
          padding: 2rem 1.5rem;
          text-align: center;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .cl-stat-item h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 2.4rem;
          color: var(--g600);
          margin: 0 0 0.25rem;
          line-height: 1;
        }
        .cl-stat-item span {
          font-size: 0.95rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 900px) {
          .cl-about-grid { grid-template-columns: 1fr; }
          .cl-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .cl-stats-grid { grid-template-columns: 1fr; }
          .cl-about-founder, .cl-about-vision { padding: 2rem 1.25rem !important; }
          .cl-cta-row { flex-direction: column; }
          .cl-cta-row a { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}