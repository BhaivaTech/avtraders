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
    <div className="guide-wrap">
      {/* Hero Section */}
      <section className="guide-hero">
        <h1>Farmer’s Guide: A to Z of Crop Production</h1>
        <p className="sub">
          Simple, practical chapters to help you diagnose, decide, and deliver better yields.
        </p>
      </section>

      {/* Chapter Index */}
      <section className="guide-index">
        <h2>Chapters</h2>
        <ol className="guide-list">
          {chapters.map((c, i) => (
            <li key={c.slug}>
              <Link to={`/guide/chapter/${c.slug}`} className="guide-link">
                <span className="pill">{i + 1}</span>
                <span className="chapter-title">{c.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* --- Pager at bottom (page 1 = Index) --- */}
      <nav className="pager-shelf">
        <div className="page-nums">
          <Link to="/guide" className="page-btn active">1</Link>
          <Link to="/guide/chapter/1-insecticides" className="page-btn">2</Link>
          <span className="dots">…</span>
          <Link to="/guide/chapter/15-faq" className="page-btn last">16</Link>
        </div>
        <Link to="/guide/chapter/1-insecticides" className="next-cta">
          Next page →
        </Link>
      </nav>
    </div>
  );
}

