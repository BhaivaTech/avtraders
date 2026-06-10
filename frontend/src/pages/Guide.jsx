import React from "react";
import { Link } from "react-router-dom";

const chapters = [
  { slug: "1-insecticides", title: "Chapter 1 — Insecticides: Classification & Groups" },
  { slug: "2-fungicides", title: "Chapter 2 — Fungicides: Groups & Practical Use" },
  { slug: "3-biofertilizers", title: "Chapter 3 — Bio-fertilizers & Microbial Roles" },
  { slug: "4-tank-mixing", title: "Chapter 4 — Tank Mixing Process" },
  { slug: "5-nutrition", title: "Chapter 5 — Nutritional Management in Crops" },
  { slug: "6-biostimulants", title: "Chapter 6 — Bio-Stimulants" },
  { slug: "7-soil-carbon", title: "Chapter 7 — Soil Health & Organic Carbon" },
  { slug: "8-bio-inputs", title: "Chapter 8 — Bio-fertilizers / Bio-fungicides / Bio-pesticides" },
  { slug: "9-mulching", title: "Chapter 9 — Mulching & Its Advantages" },
  { slug: "10-ipm", title: "Chapter 10 — Integrated Pest Management (IPM)" },
  { slug: "11-weeds", title: "Chapter 11 — Weed Management" },
  { slug: "12-irrigation", title: "Chapter 12 — Irrigation & Water Management" },
  { slug: "13-soil-health", title: "Chapter 13 — Soil Health Management" },
  { slug: "14-soil-test", title: "Chapter 14 — Basics of Soil Testing" },
  { slug: "15-faq", title: "Chapter 15 — Farmer’s FAQ Corner" },
];

export default function Guide() {
  return (
    <div className="cl-root">

      {/* ── HERO ── */}
      <section className="cl-hero" style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="cl-hero-eyebrow">
            <span className="cl-hero-pulse" aria-hidden="true" />
            Knowledge Base
          </div>
        </div>

        <h1 className="cl-hero-title" style={{ maxWidth: "800px", margin: "0 auto 1.5rem" }}>
          Farmer’s Guide: <br />
          <em>A to Z of Crop Production</em>
        </h1>

        <p className="cl-hero-sub" style={{ margin: "0 auto", maxWidth: "600px" }}>
          Simple, practical chapters to help you diagnose, decide, and deliver better yields.
        </p>
      </section>

      {/* ── CHAPTER INDEX ── */}
      <section className="cl-svc-card" style={{ "--svc-accent": "var(--g600)", padding: "2.5rem", marginBottom: "3rem" }}>
        <h2 className="cl-h2" style={{ marginBottom: "2rem", fontSize: "1.8rem" }}>Table of Contents</h2>

        <div className="cl-guide-grid">
          {chapters.map((c, i) => (
            <Link key={c.slug} to={`/guide/chapter/${c.slug}`} className="cl-chapter-link">
              <div className="cl-chapter-num">{i + 1}</div>
              <div className="cl-chapter-title">{c.title.replace(/^Chapter \d+ — /, '')}</div>
              <div className="cl-chapter-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PAGER ── */}
      <nav className="cl-pager" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div className="cl-cta-row">
          <Link to="/guide" className="cl-btn-primary" style={{ padding: "8px 16px" }}>1</Link>
          <Link to="/guide/chapter/1-insecticides" className="cl-btn-ghost" style={{ padding: "8px 16px" }}>2</Link>
          <span style={{ color: "var(--g600)", fontWeight: 700 }}>…</span>
          <Link to="/guide/chapter/15-faq" className="cl-btn-ghost" style={{ padding: "8px 16px" }}>16</Link>
        </div>

        <Link to="/guide/chapter/1-insecticides" className="cl-btn-ghost">
          Next page →
        </Link>
      </nav>

      <style>{`
        /* ══════════════════════════════════════════════
           @import: premium agricultural font pairing
        ══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           Design tokens — Shared with Clinic, Dealers, About
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

        /* Chapter Links for Guide */
        .cl-guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .cl-chapter-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: var(--r-md);
          text-decoration: none;
          color: inherit;
          transition: all var(--dur) var(--ease);
        }
        .cl-chapter-link:hover {
          border-color: var(--g400);
          background: var(--g50);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(59, 109, 17, 0.08);
        }
        
        .cl-chapter-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          background: #fff;
          border: 1px solid #dbe3ef;
          border-radius: 50%;
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--g600);
          transition: all var(--dur) var(--ease);
        }
        .cl-chapter-link:hover .cl-chapter-num {
          background: var(--g600);
          color: #fff;
          border-color: var(--g600);
        }

        .cl-chapter-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: #1a2e1a;
          flex-grow: 1;
          line-height: 1.4;
        }
        
        .cl-chapter-arrow {
          font-size: 1.2rem;
          color: #94a3b8;
          font-weight: 600;
          transition: transform var(--dur) var(--ease), color var(--dur) var(--ease);
        }
        .cl-chapter-link:hover .cl-chapter-arrow {
          transform: translateX(4px);
          color: var(--g600);
        }

        @media (max-width: 600px) {
          .cl-svc-card { padding: 1.5rem !important; }
          .cl-guide-grid { grid-template-columns: 1fr; }
          .cl-pager { flex-direction: column; align-items: stretch !important; gap: 1.5rem; }
          .cl-pager .cl-cta-row { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
