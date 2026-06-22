import React from "react";
import { Link } from "react-router-dom";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  WHATSAPP_URL,
  WHATSAPP_CHANNEL_URL,
  MAPS_LINK,
  SITE_URL,
} from "../lib/config.js";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Agri Clinic", to: "/clinic" },
  { label: "Distribution", to: "/distribution" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Farmer Guide", to: "/guide" },
  { label: "Farmers", to: "/farmers" },
  { label: "Products", to: "/products" },
];

const POLICY_LINKS = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Return Policy", to: "/return-policy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const displayPhone = CONTACT_PHONE
    ? CONTACT_PHONE.replace(/^\+91/, "+91 ")
    : "";

  return (
    <footer className="ft-root" role="contentinfo">
      <div className="ft-inner">
        {/* ── Main Grid ── */}
        <div className="ft-grid">
          {/* Brand */}
          <div className="ft-col ft-col-brand">
            <Link to="/" className="ft-brand-link">
              <div className="ft-brand">AV Traders Agri Clinic</div>
            </Link>
            <p className="ft-tagline">
              Healthy Plants, Prosperous Farmers.
            </p>
            <p className="ft-desc">
              Empowering Karnataka farmers with scientific agriculture,
              quality inputs, and trusted guidance since 1995.
            </p>
          </div>

          {/* Quick Links */}
          <div className="ft-col">
            <h3 className="ft-heading">Quick Links</h3>
            <ul className="ft-list">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="ft-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="ft-col">
            <h3 className="ft-heading">Policies</h3>
            <ul className="ft-list">
              {POLICY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="ft-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="ft-col">
            <h3 className="ft-heading">Contact</h3>
            <ul className="ft-list">
              {CONTACT_PHONE && (
                <li>
                  <a href={`tel:${CONTACT_PHONE}`} className="ft-link">
                    <span className="ft-icon" aria-hidden="true">📞</span>
                    {displayPhone}
                  </a>
                </li>
              )}
              {CONTACT_EMAIL && (
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="ft-link">
                    <span className="ft-icon" aria-hidden="true">✉️</span>
                    {CONTACT_EMAIL}
                  </a>
                </li>
              )}
              {WHATSAPP_URL && (
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-link"
                  >
                    <span className="ft-icon" aria-hidden="true">💬</span>
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <a
                  href={MAPS_LINK || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-link"
                >
                  <span className="ft-icon" aria-hidden="true">📍</span>
                  Kurubarahally, Tumkur Road,
                  <br />
                  Doddaballapura, Bengaluru Rural,
                  <br />
                  Karnataka — 561203
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Social + Copyright ── */}
        <div className="ft-bottom">
          <div className="ft-social">
            {WHATSAPP_CHANNEL_URL && (
              <a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-social-link ft-social-wa"
                title="WhatsApp Channel"
                aria-label="WhatsApp Channel"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
            <a
              href="https://youtube.com/@dravenugopal"
              target="_blank"
              rel="noopener noreferrer"
              className="ft-social-link ft-social-yt"
              title="YouTube"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          <div className="ft-legal">
            <span className="ft-copy">
              © {year} AV Traders Agri Clinic. All rights reserved.
            </span>
            {SITE_URL && (
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-site-link"
              >
                {SITE_URL.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ft-root {
          border-top: 1px solid #e2eedb;
          background: linear-gradient(180deg, #f8faf6 0%, #eef5ea 100%);
          color: #1a2b1b;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          padding: 56px 0 0;
          margin-top: auto;
        }

        .ft-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ft-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 40px;
          padding-bottom: 40px;
        }

        .ft-col-brand {
          padding-right: 16px;
        }

        .ft-brand-link {
          text-decoration: none;
          display: inline-block;
          margin-bottom: 10px;
        }

        .ft-brand {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 400;
          color: #1e5631;
          line-height: 1.2;
          transition: opacity 0.2s ease;
        }
        .ft-brand-link:hover .ft-brand {
          opacity: 0.8;
        }

        .ft-tagline {
          font-size: 0.92rem;
          font-weight: 600;
          color: #48a43f;
          margin: 0 0 12px;
          letter-spacing: 0.01em;
        }

        .ft-desc {
          font-size: 0.85rem;
          color: #4a5e45;
          line-height: 1.7;
          margin: 0;
          max-width: 280px;
        }

        .ft-heading {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1e5631;
          margin: 0 0 16px;
        }

        .ft-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ft-link {
          display: inline-flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.88rem;
          color: #3d5440;
          text-decoration: none;
          line-height: 1.6;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .ft-link:hover {
          color: #1e5631;
          transform: translateX(2px);
        }

        .ft-icon {
          flex-shrink: 0;
          font-size: 0.9rem;
          margin-top: 1px;
        }

        /* ── Bottom bar ── */
        .ft-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 20px 0;
          border-top: 1px solid #d4e4cd;
        }

        .ft-social {
          display: flex;
          gap: 10px;
        }

        .ft-social-link {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ft-social-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .ft-social-wa {
          background: #25d366;
          color: #fff;
        }
        .ft-social-yt {
          background: #ff0000;
          color: #fff;
        }

        .ft-legal {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ft-copy {
          font-size: 0.78rem;
          color: #7a9a72;
        }

        .ft-site-link {
          font-size: 0.78rem;
          color: #48a43f;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .ft-site-link:hover {
          color: #1e5631;
          text-decoration: underline;
        }

        /* ── Responsive ── */
        @media (max-width: 980px) {
          .ft-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }
          .ft-col-brand {
            grid-column: 1 / -1;
            padding-right: 0;
          }
          .ft-desc {
            max-width: 100%;
          }
        }

        @media (max-width: 560px) {
          .ft-root {
            padding-top: 40px;
          }
          .ft-inner {
            padding: 0 18px;
          }
          .ft-grid {
            grid-template-columns: 1fr;
            gap: 28px;
            padding-bottom: 28px;
          }
          .ft-col-brand {
            grid-column: auto;
          }
          .ft-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </footer>
  );
}
