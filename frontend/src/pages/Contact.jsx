// src/pages/Contact.jsx
import React from "react";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  WHATSAPP_URL,
  MAPS_LINK,
  MAPS_ADDRESS,
  SITE_TITLE,
} from '../lib/config.js';

export default function Contact() {
  const phone   = CONTACT_PHONE;
  const whatsapp = WHATSAPP_URL;
  const email   = CONTACT_EMAIL;

  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(
    `Enquiry from ${SITE_TITLE}`
  )}&body=${encodeURIComponent("Hello,\n\nI would like to know more about...")}`;

  const mapsLink  = MAPS_LINK;
  const mapAddress = encodeURIComponent(MAPS_ADDRESS);
  const embedSrc  = `https://www.google.com/maps?q=${mapAddress}&z=16&output=embed`;

  return (
    <div className="card contact" style={{ padding: 0, overflow: "hidden" }}>
      <div className="contact-grid">
        {/* HERO (always top, full width on desktop; first on mobile) */}
        <section className="c-card hero-card">
          <div className="hero-bg">
            <div className="hero-inner">
              <span className="c-emoji" aria-hidden>📍</span>
              <div>
                <h2 className="hero-title">We’re here to help you grow</h2>
                <p className="hero-sub">
                  Reach AV Traders Agri Clinic for support, guidance, and genuine agricultural
                  solutions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LEFT STACK */}
        <div className="left-col">
          {/* Address */}
          <section className="c-card sec-address">
            <div className="c-head">
              <span className="c-emoji">🏠</span>
              <div className="c-title">Address</div>
            </div>
            <div className="c-text">
              Kurubarahally, Tumkur road, Doddaballapura, Bengaluru Rural, Karnataka, 561203
            </div>
          </section>

          {/* Phone */}
          <section className="c-card sec-phone c-card--green">
            <div className="c-head">
              <span className="c-emoji">📞</span>
              <div className="c-title">Phone</div>
            </div>
            <a className="c-link" href={`tel:${phone}`}>{phone.startsWith('+91') ? phone.replace('+91', '+91 ') : phone}</a>
            <div className="btn-row">
              <a className="btn btn-call" href={`tel:${phone}`}>☎ Call</a>
              <a className="btn btn-wa" href={whatsapp} target="_blank" rel="noreferrer">💬 WhatsApp</a>
            </div>
          </section>

          {/* Email */}
          <section className="c-card sec-email c-card--peach">
            <div className="c-head">
              <span className="c-emoji">✉️</span>
              <div className="c-title">Email</div>
            </div>
            <a className="c-link" href={mailtoHref}>{email}</a>
            <div className="c-hint">For queries and support, write to us anytime.</div>
          </section>

          {/* Working Hours */}
          <section className="c-card sec-hours c-card--blue">
            <div className="c-head">
              <span className="c-emoji">🕒</span>
              <div className="c-title">Working Hours</div>
            </div>
            <div className="c-text"><b>Mon – Sat:</b> 9:30 AM – 6:30 PM</div>
            <div className="c-text"><b>Sunday:</b> Closed</div>
          </section>
        </div>

        {/* RIGHT COLUMN (Map) */}
        <div className="right-col">
          <section className="c-card sec-map">
            <div className="c-head">
              <span className="c-emoji">🗺️</span>
              <div className="c-title">Find Us on Google Maps</div>
            </div>

            <div className="map-wrap">
              <iframe
                title="AV Traders Agri Clinic Map"
                src={embedSrc}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a className="btn btn-map" href={mapsLink} target="_blank" rel="noreferrer">
              📍 Open in Google Maps
            </a>
          </section>
        </div>
      </div>

      {/* Page-scoped styles */}
      <style>{`
        /* --- base card look --- */
        .c-card{ background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:14px 16px; display:grid; gap:8px; }
        .c-head{ display:flex; align-items:center; gap:10px; }
        .c-emoji{ font-size:22px; }
        .c-title{ font-weight:800; }
        .c-text{ color:#334155; }
        .c-link{ color:#065f46; font-weight:800; word-break:break-word; text-decoration:underline; }
        .c-hint{ color:#a16207; font-size:13px; }

        .c-card--green{ background:#f0fdf4; border-color:#bbf7d0; }
        .c-card--peach{ background:#fff7ed; border-color:#fed7aa; }
        .c-card--blue { background:#eef2ff; border-color:#c7d2fe; }

        .btn-row{ display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
        .btn{ height:40px; padding:0 16px; border-radius:12px; font-weight:800; display:inline-grid; place-items:center; text-decoration:none; border:none; }
        .btn-call{ background:#10b981; color:#fff; }
        .btn-wa  { background:#25D366; color:#063d1e; }
        .btn-map { background:#0ea5e9; color:#fff; }

        /* Map 16:9 */
        .map-wrap{ position:relative; width:100%; overflow:hidden; border-radius:12px; }
        .map-wrap::before{ content:""; display:block; padding-top:56.25%; }
        .map-wrap iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }

        /* ---------- DESKTOP GRID with explicit AREAS ---------- */
        .contact-grid{
          display:grid;
          gap:16px;
          grid-template-columns: 1.1fr 1.4fr; /* left column + wider map column */
          grid-template-areas:
            "hero  hero"
            "left  right"
            "left  right"
            "left  right";
        }
        .hero-card{ grid-area:hero; padding:0; overflow:hidden; }
        .left-col { grid-area:left;  display:grid; gap:12px; }
        .right-col{ grid-area:right; display:grid; }

        /* Hero visual */
        .hero-bg{
          background: linear-gradient(135deg,#22c55e 0%, #16a34a 50%, #065f46 100%);
          color:#fff;
          border-radius:16px;
        }
        .hero-inner{
          display:flex; align-items:center; gap:12px;
          padding:24px 20px;
        }
        .hero-title{ margin:0; font-size:28px; }
        .hero-sub{ margin:6px 0 0; opacity:.95; max-width:60ch; }

        /* ---------- MOBILE: EXACT ORDER per your screenshots ---------- */
        @media (max-width: 900px){
          .contact-grid{
            display:flex;
            flex-direction:column;
            gap:12px;
          }
          .hero-card { order:1; }
          .sec-address{ order:2; }
          .sec-phone  { order:3; }
          .sec-email  { order:4; }
          .sec-hours  { order:5; }
          .right-col  { order:6; } /* map last */
          .c-card{ border-radius:16px; }
          .hero-inner{ padding:20px 16px; }
          .hero-title{ font-size:24px; }
        }
      `}</style>
    </div>
  );
}
