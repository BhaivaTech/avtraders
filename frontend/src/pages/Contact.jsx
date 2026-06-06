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
  const phone = CONTACT_PHONE;
  const whatsapp = WHATSAPP_URL;
  const email = CONTACT_EMAIL;

  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(
    `Enquiry from ${SITE_TITLE}`
  )}&body=${encodeURIComponent("Hello,\n\nI would like to know more about...")}`;

  const mapsLink = MAPS_LINK;
  const mapAddress = encodeURIComponent(MAPS_ADDRESS);
  const embedSrc = `https://www.google.com/maps?q=${mapAddress}&z=16&output=embed`;

  const displayPhone = phone.startsWith('+91')
    ? phone.replace('+91', '+91\u00a0')
    : phone;

  return (
    <div className="ct-root">

      {/* ── HERO SECTION ── */}
      <section className="ct-hero" aria-label="Contact introduction">

        {/* Left */}
        <div className="ct-hero-left">
          <div className="ct-eyebrow">
            <span className="ct-eyebrow-dot" aria-hidden="true" />
            Contact us
          </div>

          <h1 className="ct-hero-title">
            Talk to a real<br />
            <em className="ct-hero-italic">agri expert,</em><br />
            not a bot.
          </h1>

          <p className="ct-hero-sub">
            Whether you need a spray schedule, a bulk quote, or guidance on a crop problem —
            our team is ready to help in English and Kannada.
          </p>

          <div className="ct-hero-actions">
            <a className="ct-btn-primary" href={`tel:${phone}`}>
              Call now &rarr;
            </a>
            <a className="ct-btn-ghost" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </div>

          {/* Trustbar — mirrors homepage */}
          <div className="ct-trustbar">
            <div className="ct-trust-stars" aria-label="5 stars">★★★★★</div>
            <span className="ct-trust-label">Trusted by farmers across Karnataka</span>
            <span className="ct-trust-divider" aria-hidden="true" />
            <span className="ct-trust-lang">🌐&nbsp;English &amp; Kannada support</span>
          </div>
        </div>

        {/* Right — contact card widget (mirrors the chat widget on homepage) */}
        <div className="ct-hero-right" aria-label="Contact details">

          {/* Header strip — same dark green as homepage chat widget */}
          <div className="ct-widget-header">
            <div className="ct-widget-avatar" aria-hidden="true">AV</div>
            <div>
              <p className="ct-widget-name">AV Traders Support</p>
              <p className="ct-widget-status">
                <span className="ct-online-dot" aria-hidden="true" />
                Mon–Sat · 9:30 AM – 6:30 PM
              </p>
            </div>
          </div>

          {/* Info rows */}
          <div className="ct-widget-body">
            <div className="ct-info-row">
              <span className="ct-info-icon" aria-hidden="true">📞</span>
              <div className="ct-info-text">
                <p className="ct-info-label">Phone</p>
                <a className="ct-info-value ct-info-link" href={`tel:${phone}`}>
                  {displayPhone}
                </a>
              </div>
              <div className="ct-info-btns">
                <a className="ct-chip ct-chip-green" href={`tel:${phone}`}>Call</a>
                <a className="ct-chip ct-chip-wa" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
              </div>
            </div>

            <div className="ct-divider" aria-hidden="true" />

            <div className="ct-info-row">
              <span className="ct-info-icon" aria-hidden="true">✉️</span>
              <div className="ct-info-text">
                <p className="ct-info-label">Email</p>
                <a className="ct-info-value ct-info-link ct-email" href={mailtoHref}>
                  {email}
                </a>
              </div>
              <a className="ct-chip ct-chip-outline" href={mailtoHref}>Send email</a>
            </div>

            <div className="ct-divider" aria-hidden="true" />

            <div className="ct-info-row ct-info-row--addr">
              <span className="ct-info-icon" aria-hidden="true">📍</span>
              <div className="ct-info-text">
                <p className="ct-info-label">Address</p>
                <address className="ct-info-value ct-addr">
                  Kurubarahally, Tumkur Road, Doddaballapura<br />
                  Bengaluru Rural, Karnataka — 561 203
                </address>
              </div>
              <a className="ct-chip ct-chip-outline" href={mapsLink} target="_blank" rel="noreferrer">
                Open maps
              </a>
            </div>
          </div>

          {/* Stat bar — identical to homepage metric strip */}
          <div className="ct-widget-stats" role="list">
            <div className="ct-stat" role="listitem">
              <p className="ct-stat-num">24h</p>
              <p className="ct-stat-label">Avg response</p>
            </div>
            <div className="ct-stat-sep" aria-hidden="true" />
            <div className="ct-stat" role="listitem">
              <p className="ct-stat-num">Pan&#8209;IN</p>
              <p className="ct-stat-label">Delivery reach</p>
            </div>
            <div className="ct-stat-sep" aria-hidden="true" />
            <div className="ct-stat" role="listitem">
              <p className="ct-stat-num">GST</p>
              <p className="ct-stat-label">Invoice ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP SECTION ── */}
      <section className="ct-map-section" aria-labelledby="map-heading">
        <div className="ct-map-head">
          <div className="ct-eyebrow">
            <span className="ct-eyebrow-dot" aria-hidden="true" />
            Find us
          </div>
          <h2 className="ct-section-title" id="map-heading">
            Visit us at<br />
            <em className="ct-hero-italic">Doddaballapura</em>
          </h2>
          <p className="ct-section-sub">
            On Tumkur Road, easily accessible from Bengaluru and nearby taluks.
            Walk-ins welcome during working hours.
          </p>
          <a className="ct-btn-primary" href={mapsLink} target="_blank" rel="noreferrer">
            Get directions &rarr;
          </a>
        </div>

        <div className="ct-map-wrap">
          <iframe
            title="AV Traders Agri Clinic location"
            src={embedSrc}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* ── SCOPED STYLES ── */}
      <style>{`
        /*
          Fonts (add to index.html <head> if not already present):
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        */

        /* ── Root ── */
        .ct-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #1a2b1b;
          display: grid;
          gap: 0;
        }

        /* ── Eyebrow (matches homepage dot + caps label) ── */
        .ct-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4a6741;
          margin-bottom: 18px;
        }
        .ct-eyebrow-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #5a9e3a;
          flex-shrink: 0;
        }

        /* ── Hero ── */
        .ct-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
          padding: 80px 72px 88px;
          background: #f8faf7;
        }

        .ct-hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 4.5vw, 56px);
          font-weight: 700;
          line-height: 1.15;
          color: #1a2b1b;
          margin: 0 0 20px;
        }
        .ct-hero-italic {
          font-style: italic;
          color: #4a9c2a;
          font-weight: 600;
        }
        .ct-hero-sub {
          font-size: 15px;
          color: #4a5e45;
          line-height: 1.8;
          max-width: 42ch;
          margin: 0 0 32px;
          font-weight: 300;
        }

        .ct-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 36px;
          align-items: center;
        }

        /* Primary button — same as homepage "Get solutions" */
        .ct-btn-primary {
          display: inline-flex;
          align-items: center;
          height: 48px;
          padding: 0 26px;
          background: #2d5a1b;
          color: #e8f5e2;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.18s, transform 0.1s;
          font-family: inherit;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
        }
        .ct-btn-primary:hover  { background: #1e3f12; }
        .ct-btn-primary:active { transform: scale(0.97); }

        /* Ghost button — same as homepage "Contact us" */
        .ct-btn-ghost {
          display: inline-flex;
          align-items: center;
          height: 48px;
          padding: 0 24px;
          background: transparent;
          color: #2d5a1b;
          border: 1.5px solid #2d5a1b;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.18s;
          font-family: inherit;
          letter-spacing: 0.01em;
        }
        .ct-btn-ghost:hover { background: #eef5ea; }

        /* Trustbar */
        .ct-trustbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ct-trust-stars {
          color: #f5a623;
          font-size: 14px;
          letter-spacing: 1px;
        }
        .ct-trust-label {
          font-size: 13px;
          color: #4a5e45;
        }
        .ct-trust-divider {
          width: 1px; height: 14px;
          background: #c5d9bf;
        }
        .ct-trust-lang {
          font-size: 13px;
          color: #4a9c2a;
          font-weight: 500;
        }

        /* ── Right: contact widget card ── */
        .ct-hero-right {
          background: #fff;
          border: 1px solid #ddecd6;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(45,90,27,0.09);
        }

        /* Header — same dark green as homepage chat widget header */
        .ct-widget-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          background: #2d5a1b;
        }
        .ct-widget-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #4a9c2a;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .ct-widget-name {
          font-size: 14px;
          font-weight: 500;
          color: #e8f5e2;
          margin: 0 0 4px;
        }
        .ct-widget-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #9fc98a;
          margin: 0;
        }
        .ct-online-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6ecf4a;
          flex-shrink: 0;
        }

        /* Body rows */
        .ct-widget-body { padding: 4px 22px; }

        .ct-info-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 0;
          flex-wrap: wrap;
        }
        .ct-info-row--addr { align-items: flex-start; }

        .ct-info-icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 26px;
          text-align: center;
        }
        .ct-info-text { flex: 1; min-width: 0; }

        .ct-info-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #8aab80;
          margin: 0 0 2px;
        }
        .ct-info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a2b1b;
          margin: 0;
        }
        .ct-info-link {
          text-decoration: none;
          color: #1a2b1b;
        }
        .ct-info-link:hover { color: #2d5a1b; }
        .ct-email {
          font-size: 13px;
          word-break: break-all;
        }
        .ct-addr {
          font-style: normal;
          font-size: 12.5px;
          font-weight: 400;
          line-height: 1.65;
          color: #3d5440;
          margin: 0;
        }

        .ct-info-btns {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        /* Chips */
        .ct-chip {
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          font-family: inherit;
          transition: opacity 0.15s;
          border: none;
          cursor: pointer;
        }
        .ct-chip:hover { opacity: 0.82; }
        .ct-chip-green   { background: #2d5a1b; color: #e8f5e2; }
        .ct-chip-wa      { background: #25D366; color: #063d1e; }
        .ct-chip-outline {
          background: transparent;
          color: #2d5a1b;
          border: 1px solid #b5d4a8;
        }

        .ct-divider {
          height: 1px;
          background: #f0f7ec;
        }

        /* Stat bar — identical copy of homepage "24h / Pan-IN / GST" strip */
        .ct-widget-stats {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 16px 22px;
          background: #f4faf0;
          border-top: 1px solid #e2eedb;
        }
        .ct-stat { text-align: center; }
        .ct-stat-num {
          font-size: 15px;
          font-weight: 600;
          color: #4a9c2a;
          margin: 0 0 2px;
          letter-spacing: 0.01em;
        }
        .ct-stat-label {
          font-size: 11px;
          color: #7a9a72;
          margin: 0;
        }
        .ct-stat-sep {
          width: 1px;
          height: 28px;
          background: #cde3c5;
        }

        /* ── Map section ── */
        .ct-map-section {
          display: grid;
          grid-template-columns: 1fr 1.65fr;
          gap: 72px;
          align-items: center;
          padding: 80px 72px;
          background: #fff;
          border-top: 1px solid #e8f0e4;
        }
        .ct-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 700;
          line-height: 1.2;
          color: #1a2b1b;
          margin: 0 0 16px;
        }
        .ct-section-sub {
          font-size: 14px;
          color: #4a5e45;
          line-height: 1.8;
          max-width: 34ch;
          margin: 0 0 28px;
          font-weight: 300;
        }

        .ct-map-wrap {
          position: relative;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #ddecd6;
          box-shadow: 0 4px 28px rgba(45,90,27,0.08);
        }
        .ct-map-wrap::before {
          content: "";
          display: block;
          padding-top: 60%;
        }
        .ct-map-wrap iframe {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          border: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 980px) {
          .ct-hero {
            grid-template-columns: 1fr;
            padding: 48px 32px 56px;
            gap: 40px;
          }
          .ct-map-section {
            grid-template-columns: 1fr;
            padding: 56px 32px;
            gap: 36px;
          }
        }

        @media (max-width: 540px) {
          .ct-hero { padding: 36px 20px 44px; }
          .ct-map-section { padding: 44px 20px; }
          .ct-hero-actions { flex-direction: column; align-items: stretch; }
          .ct-btn-primary,
          .ct-btn-ghost { justify-content: center; }
          .ct-info-row { gap: 10px; }
          .ct-info-btns { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}