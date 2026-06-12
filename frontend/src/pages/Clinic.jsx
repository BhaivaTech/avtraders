import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../lib/api.js";
import { resolveApiOrigin } from "../lib/endpoint.js";
import { WHATSAPP_URL } from "../lib/config.js";

/* ─────────────────────────────────────────────
   SVG Icons — stroke-based, tree-shakeable
───────────────────────────────────────────── */
const IconChat = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconCamera = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconFlask = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M9 3h6M9 3v7L4.5 18A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.9-3L15 10V3" />
    <path d="M7.5 16h9" />
  </svg>
);
const IconTruck = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 4v4h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconShield = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IconCard = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconLeaf = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconWhatsapp = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);
const IconStar = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const norm = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/* ─────────────────────────────────────────────
   useFarmerUnread — unchanged business logic
───────────────────────────────────────────── */
export function useFarmerUnread() {
  const [unread, setUnread] = useState(() =>
    Number(localStorage.getItem("farmerUnread") || 0)
  );
  const chatIdRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("farmerAuth") || "null");
    const mobile10 = norm(saved?.mobile);
    mobileRef.current = mobile10 || null;
    if (!mobile10) return;

    (async () => {
      try {
        const r = await api.get(`/quotes/latest-by-mobile/${mobile10}`, {
          withCredentials: true,
        });
        chatIdRef.current = r?.data?.chat_id || null;
      } catch { }
    })();

    const s = io(resolveApiOrigin(), { transports: ["websocket"], withCredentials: true });
    s.on("chat:new_message", (p) => {
      if (chatIdRef.current && p?.chat_id !== chatIdRef.current) return;
      setUnread((prev) => {
        const next = Math.min(99, Number(prev || 0) + 1);
        localStorage.setItem("farmerUnread", String(next));
        return next;
      });
    });
    return () => s.close();
  }, []);

  useEffect(() => {
    const onStorage = (ev) => {
      if (ev.key === "farmerUnread") setUnread(Number(ev.newValue || 0));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const clear = () => {
    setUnread(0);
    localStorage.setItem("farmerUnread", "0");
  };

  return { unread, clear };
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function UnreadBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="cl-badge" aria-label={`${count > 99 ? "99 plus" : count} unread messages`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TrustCard({ icon, title, description }) {
  return (
    <div className="cl-trust-card">
      <div className="cl-trust-icon">{icon}</div>
      <div className="cl-trust-title">{title}</div>
      <div className="cl-trust-desc">{description}</div>
    </div>
  );
}

function ServiceCard({ icon, accentVar, tag, title, subtitle, items, note }) {
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
      {note && <div className="cl-svc-note">{note}</div>}
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

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function Clinic() {
  const { unread, clear } = useFarmerUnread();

  return (
    <>
      <style>{`
        /* ══════════════════════════════════════════════
           @import: premium agricultural font pairing
        ══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           Design tokens — AV Agri Clinic Design System
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

        /* ══════════════════════════════════════════════
           Root layout
        ══════════════════════════════════════════════ */
        .cl-root {
          display: flex;
          flex-direction: column;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 0 1.5rem 5rem;
        }

        /* ══════════════════════════════════════════════
           Section wrapper
        ══════════════════════════════════════════════ */
        .cl-section {
          padding: 5rem 0;
        }
        .cl-section + .cl-section {
          border-top: 1px solid var(--color-border-tertiary);
        }

        /* Eyebrow pill */
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
        @media (prefers-color-scheme: dark) {
          .cl-eyebrow {
            background: rgba(23, 52, 4, 0.6);
            border-color: var(--g800);
            color: var(--g100);
          }
        }

        /* Section headings */
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
        @media (prefers-color-scheme: dark) {
          .cl-h2 em { color: var(--g200); }
        }

        .cl-lead {
          font-size: 1rem;
          color: var(--color-text-secondary);
          line-height: 1.75;
          margin: 0 0 3rem;
          max-width: 560px;
        }

        /* ══════════════════════════════════════════════
           BUTTONS
        ══════════════════════════════════════════════ */

        /* Primary — forest green */
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
        @media (prefers-color-scheme: dark) {
          .cl-btn-primary { background: var(--g400); color: var(--g900); }
          .cl-btn-primary:hover { background: var(--g200); box-shadow: 0 8px 24px rgba(99,153,34,0.3); }
        }

        /* Ghost — outlined */
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
        @media (prefers-color-scheme: dark) {
          .cl-btn-ghost:hover { background: rgba(23,52,4,0.5); border-color: var(--g200); }
        }

        /* WhatsApp btn */
        .cl-btn-wa {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 26px;
          background: transparent;
          color: #128C7E;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--r-md);
          border: 1.5px solid #128C7E;
          cursor: pointer;
          text-decoration: none;
          transition: background var(--dur) var(--ease), transform var(--dur) var(--ease);
        }
        .cl-btn-wa:hover { background: #edf7f6; transform: translateY(-2px); }
        @media (prefers-color-scheme: dark) {
          .cl-btn-wa { color: #25D366; border-color: #25D366; }
          .cl-btn-wa:hover { background: rgba(37,211,102,0.08); }
        }

        /* CTA row */
        .cl-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        /* Unread badge */
        .cl-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: #E53E3E;
          color: #fff;
          font-size: 10.5px;
          font-weight: 800;
          border-radius: 100px;
          line-height: 1;
        }

        /* ══════════════════════════════════════════════
           HERO SECTION
        ══════════════════════════════════════════════ */
        .cl-hero {
          padding: 5.5rem 0 4.5rem;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 4rem;
          align-items: center;
          position: relative;
        }
        /* Subtle organic background element */
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
        @media (prefers-color-scheme: dark) {
          .cl-hero::before { background: radial-gradient(circle, rgba(23,52,4,0.4) 0%, transparent 70%); }
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
        @media (prefers-color-scheme: dark) { .cl-hero-eyebrow { color: var(--g100); } }

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
        @media (prefers-color-scheme: dark) { .cl-hero-title em { color: var(--g200); } }

        .cl-hero-sub {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--color-text-secondary);
          margin: 0 0 2rem;
          max-width: 500px;
        }

        /* Social proof strip below hero CTAs */
        .cl-hero-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }
        .cl-hero-proof-stars {
          display: flex;
          gap: 2px;
          color: var(--a200);
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
        @media (prefers-color-scheme: dark) { .cl-hero-proof-tag { color: var(--g200); } }

        /* ── Hero right: decorative chat preview ── */
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

        /* Panel top bar */
        .cl-panel-bar {
          background: var(--g600);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @media (prefers-color-scheme: dark) { .cl-panel-bar { background: var(--g800); } }

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

        /* Panel chat body */
        .cl-panel-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-background-secondary);
          min-height: 260px;
        }
        @media (prefers-color-scheme: dark) {
          .cl-panel-body { background: var(--color-background-tertiary); }
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
        @media (prefers-color-scheme: dark) {
          .cl-bubble { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
        }
        .cl-bubble-user {
          align-self: flex-end;
          background: var(--g600);
          color: #fff;
          border-color: transparent;
          border-radius: 16px 16px 4px 16px;
        }
        @media (prefers-color-scheme: dark) {
          .cl-bubble-user { background: var(--g400); color: var(--g900); }
        }
        .cl-bubble-time {
          font-size: 10px;
          opacity: 0.6;
          text-align: right;
          margin-top: 3px;
        }

        /* Typing indicator */
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
        @media (prefers-color-scheme: dark) {
          .cl-typing { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
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

        /* Rx treatment card */
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
        @media (prefers-color-scheme: dark) {
          .cl-rx-card { background: rgba(186,117,23,0.1); border-color: var(--a600); border-left-color: var(--a200); }
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
        @media (prefers-color-scheme: dark) { .cl-rx-label { color: var(--a100); } }
        .cl-rx-sub {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        /* Panel metrics strip */
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
        @media (prefers-color-scheme: dark) { .cl-panel-metric-val { color: var(--g200); } }
        .cl-panel-metric-label {
          font-size: 10.5px;
          color: var(--color-text-secondary);
        }

        /* ══════════════════════════════════════════════
           TRUST CARDS
        ══════════════════════════════════════════════ */
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
        /* Subtle top-left corner accent */
        .cl-trust-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 3px;
          background: var(--g400);
          border-radius: 0 0 4px 0;
        }
        .cl-trust-card:hover { transform: translateY(-3px); }

        .cl-trust-icon {
          color: var(--g600);
          margin-bottom: 4px;
        }
        @media (prefers-color-scheme: dark) { .cl-trust-icon { color: var(--g100); } }

        .cl-trust-title {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .cl-trust-desc {
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        /* ══════════════════════════════════════════════
           SERVICE CARDS
        ══════════════════════════════════════════════ */
        .cl-svc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
        }

        .cl-svc-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-xl);
          padding: 2rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
          transition: transform var(--dur) var(--ease),
                      border-color var(--dur) var(--ease);
        }
        /* Left accent bar using CSS var */
        .cl-svc-card::after {
          content: "";
          position: absolute;
          left: 0; top: 1.5rem; bottom: 1.5rem;
          width: 3px;
          background: var(--svc-accent, var(--g400));
          border-radius: 0 2px 2px 0;
        }
        .cl-svc-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-border-secondary);
        }

        .cl-svc-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          margin-bottom: 2px;
        }

        .cl-svc-icon-wrap {
          width: 50px; height: 50px;
          border-radius: var(--r-md);
          background: var(--g50);
          border: 1px solid var(--g100);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--g600);
          margin-bottom: 2px;
        }
        @media (prefers-color-scheme: dark) {
          .cl-svc-icon-wrap {
            background: rgba(23,52,4,0.5);
            border-color: var(--g800);
            color: var(--g100);
          }
        }

        .cl-svc-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 1.2rem;
          font-weight: 400;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .cl-svc-subtitle {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .cl-svc-list {
          list-style: none;
          padding: 0;
          margin: 6px 0 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .cl-svc-list li {
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.45;
        }
        .cl-svc-check {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--g500);
        }
        @media (prefers-color-scheme: dark) { .cl-svc-check { color: var(--g200); } }
        .cl-svc-note {
          font-size: 0.77rem;
          font-weight: 600;
          color: var(--g700);
          background: var(--g50);
          border-radius: var(--r-sm);
          padding: 6px 10px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        @media (prefers-color-scheme: dark) {
          .cl-svc-note { background: rgba(23,52,4,0.5); color: var(--g100); }
        }
        .cl-svc-note::before {
          content: "💡";
          font-size: 12px;
        }

        /* ══════════════════════════════════════════════
           HOW IT WORKS — stepped grid
        ══════════════════════════════════════════════ */
        .cl-steps-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 760px) {
          .cl-steps-layout { grid-template-columns: 1fr; gap: 2rem; }
        }

        .cl-steps-copy .cl-lead { margin-bottom: 1.5rem; }

        .cl-steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 480px) {
          .cl-steps-grid { grid-template-columns: 1fr; }
        }

        .cl-step-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-lg);
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform var(--dur) var(--ease);
        }
        .cl-step-card:hover { transform: translateY(-2px); }

        .cl-step-number {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 400;
          line-height: 1;
          margin-bottom: 4px;
        }
        .cl-step-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .cl-step-detail {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }

        /* ══════════════════════════════════════════════
           FINAL CTA BANNER — earth tone
        ══════════════════════════════════════════════ */
        .cl-cta-banner {
          border-radius: var(--r-2xl);
          padding: 3.5rem 3rem;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2.5rem;
          align-items: center;
          background: var(--g600);
          position: relative;
          overflow: hidden;
          margin-top: 2rem;
        }
        /* Organic blob accent, top-right */
        .cl-cta-banner::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .cl-cta-banner::after {
          content: "";
          position: absolute;
          bottom: -80px; right: 120px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }
        @media (prefers-color-scheme: dark) { .cl-cta-banner { background: var(--g800); } }
        @media (max-width: 680px) {
          .cl-cta-banner {
            grid-template-columns: 1fr;
            padding: 2.5rem 1.75rem;
          }
        }

        .cl-cta-banner-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 0.75rem;
        }
        .cl-cta-banner-h {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 400;
          color: #fff;
          line-height: 1.25;
          margin: 0 0 0.6rem;
        }
        .cl-cta-banner-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.65;
          margin: 0;
        }

        .cl-cta-banner-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-start;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 680px) {
          .cl-cta-banner-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }

        /* White variant button for dark banner */
        .cl-btn-white {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 14px 28px;
          background: #fff;
          color: var(--g800);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: var(--r-md);
          border: none;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: background var(--dur) var(--ease), transform var(--dur) var(--ease);
          position: relative;
        }
        .cl-btn-white:hover {
          background: var(--g50);
          transform: translateY(-2px);
        }
        .cl-btn-white:active { transform: translateY(0); }

        /* Transparent/outline variant on dark bg */
        .cl-btn-outline-white {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          background: transparent;
          color: rgba(255,255,255,0.88);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.93rem;
          font-weight: 600;
          border-radius: var(--r-md);
          border: 1.5px solid rgba(255,255,255,0.35);
          cursor: pointer;
          text-decoration: none;
          transition: background var(--dur) var(--ease),
                      border-color var(--dur) var(--ease),
                      transform var(--dur) var(--ease);
        }
        .cl-btn-outline-white:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.6);
          transform: translateY(-2px);
        }

        /* ══════════════════════════════════════════════
           Misc mobile overrides
        ══════════════════════════════════════════════ */
        @media (max-width: 540px) {
          .cl-section { padding: 3.5rem 0; }
          .cl-trust-grid { grid-template-columns: 1fr 1fr; }
          .cl-svc-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 360px) {
          .cl-trust-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cl-root">

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section className="cl-hero" aria-label="Hero">

          {/* ── Left: copy ── */}
          <div className="cl-hero-left">
            <div className="cl-hero-eyebrow" aria-hidden="true">
              <span className="cl-hero-pulse" />
              Agri Clinic &amp; Agri Business Center
            </div>

            <h1 className="cl-hero-title">
              Expert care for<br />
              <em>every crop,</em><br />
              every farmer.
            </h1>

            <p className="cl-hero-sub">
              Precision agronomy consulting — from instant photo diagnosis and
              standardized spray schedules to secure quotations, payments, and
              pan-India doorstep delivery.
            </p>

            <div className="cl-cta-row">
              <Link
                className="cl-btn-primary"
                to="/farmers"
                onClick={clear}
                aria-label={
                  unread > 0
                    ? `Get solutions — ${unread > 99 ? "99+" : unread} unread messages`
                    : "Get solutions"
                }
              >
                Get solutions
                <UnreadBadge count={unread} />
                <IconArrow />
              </Link>
              <Link className="cl-btn-ghost" to="/contact">Contact us</Link>
            </div>

            {/* Social proof strip */}
            <div className="cl-hero-proof" aria-label="Farmer trust indicators">
              <div className="cl-hero-proof-stars" aria-label="5 stars">
                {[1, 2, 3, 4, 5].map(i => <IconStar key={i} />)}
              </div>
              <span className="cl-hero-proof-text">Trusted by farmers across Karnataka</span>
              <span className="cl-hero-proof-divider" aria-hidden="true" />
              <span className="cl-hero-proof-tag">🌱 English &amp; Kannada support</span>
            </div>
          </div>

          {/* ── Right: decorative chat preview panel ── */}
          <div className="cl-hero-panel" aria-hidden="true" role="presentation">
            {/* Green top bar */}
            <div className="cl-panel-bar">
              <div className="cl-panel-avatar">AV</div>
              <div>
                <div className="cl-panel-name">AV Agri Expert</div>
                <div className="cl-panel-status">
                  <span className="cl-panel-status-dot" />
                  Online — responding now
                </div>
              </div>
            </div>

            {/* Chat bubbles */}
            <div className="cl-panel-body">
              <div className="cl-bubble cl-bubble-user">
                My paddy leaves are yellowing at the tips. Any idea?
                <div className="cl-bubble-time">9:14 AM</div>
              </div>

              <div className="cl-bubble">
                Looks like nitrogen deficiency + early leaf blight. Could you share a close-up of the leaves?
                <div className="cl-bubble-time">9:15 AM</div>
              </div>

              <div className="cl-bubble cl-bubble-user">
                <em style={{ fontSize: "0.75rem", opacity: 0.8 }}>📷 photo_field_01.jpg</em>
                <div className="cl-bubble-time">9:16 AM</div>
              </div>

              <div className="cl-typing" aria-label="Expert is typing">
                <span className="cl-typing-dot" />
                <span className="cl-typing-dot" />
                <span className="cl-typing-dot" />
              </div>

              <div className="cl-rx-card">
                <div className="cl-rx-icon">📋</div>
                <div>
                  <div className="cl-rx-label">Treatment Plan Ready</div>
                  <div className="cl-rx-sub">Urea + Mancozeb · 3 sprays · 7-day interval</div>
                </div>
              </div>
            </div>

            {/* Bottom metric strip */}
            <div className="cl-panel-metrics">
              <div className="cl-panel-metric">
                <div className="cl-panel-metric-val">24h</div>
                <div className="cl-panel-metric-label">Avg response</div>
              </div>
              <div className="cl-panel-metric">
                <div className="cl-panel-metric-val">Pan-IN</div>
                <div className="cl-panel-metric-label">Delivery reach</div>
              </div>
              <div className="cl-panel-metric">
                <div className="cl-panel-metric-val">GST</div>
                <div className="cl-panel-metric-label">Invoice ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TRUST PILLARS
        ══════════════════════════════════════════════ */}
        <section className="cl-section" aria-label="Why choose us">
          <div className="cl-eyebrow">
            <IconLeaf />
            Why farmers trust us
          </div>

          <div className="cl-trust-grid">
            <TrustCard
              icon={<IconChat />}
              title="Real-time expert chat"
              description="Ask agronomists instantly with photo and video support — in English or Kannada."
            />
            <TrustCard
              icon={<IconShield />}
              title="Reliable advice"
              description="Standardized spray schedules with crop-stage precision — brand-agnostic guidance you can act on."
            />
            <TrustCard
              icon={<IconCard />}
              title="Secure payments"
              description="One-tap quotation to checkout. Invoice, GST, and multiple payment modes supported."
            />
            <TrustCard
              icon={<IconTruck />}
              title="LR tracking"
              description="Pan-India logistics with your LR number shared immediately after dispatch."
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SERVICES
        ══════════════════════════════════════════════ */}
        <section className="cl-section" aria-label="Our services">
          <div className="cl-eyebrow">
            <IconLeaf />
            End-to-end agronomy support
          </div>

          <h2 className="cl-h2">
            What we do for<br />
            <em>your farm</em>
          </h2>
          <p className="cl-lead">
            From field diagnosis to doorstep delivery — every step of your
            crop's health journey is covered by our expert team.
          </p>

          <div className="cl-svc-grid">
            <ServiceCard
              icon={<IconCamera />}
              accentVar="--g400"
              tag="01 · Diagnosis"
              title="Diagnosis with photos"
              subtitle="Upload field images, describe the pest or disease, and get instant expert triage — right in chat."
              items={[
                "WhatsApp-style chat interface",
                "Multiple images & PDF uploads",
                "Supports English & Kannada",
              ]}
              note="Works reliably on rural mobile networks."
            />
            <ServiceCard
              icon={<IconFlask />}
              accentVar="--a200"
              tag="02 · Treatment"
              title="Treatment & nutrition plan"
              subtitle="Clear last-spray, date, and dosage details in a fixed, readable layout every time."
              items={[
                "Crop-stage specific schedules",
                "Brand-agnostic recommendations",
                "Follow-up reminders included",
              ]}
              note="Save plans as PDF directly from chat."
            />
            <ServiceCard
              icon={<IconTruck />}
              accentVar="--sky-400"
              tag="03 · Delivery"
              title="Quotation, payment & LR"
              subtitle="One-tap quote to secure payment to LR number — a seamless end-to-end purchase journey."
              items={[
                "Multiple payment modes",
                "Invoice & GST support",
                "Real-time order tracking updates",
              ]}
              note="Pan-India logistics partners."
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            HOW IT WORKS — 2-col layout
        ══════════════════════════════════════════════ */}
        <section className="cl-section" aria-label="How it works">
          <div className="cl-steps-layout">

            {/* Left: copy + CTA */}
            <div className="cl-steps-copy">
              <div className="cl-eyebrow">
                <IconLeaf />
                Simple, four-step process
              </div>
              <h2 className="cl-h2">How it works</h2>
              <p className="cl-lead">
                From your first photo to final delivery — here's exactly what happens, step by step.
              </p>
              <div className="cl-cta-row">
                <Link
                  className="cl-btn-primary"
                  to="/farmers"
                  onClick={clear}
                  aria-label={
                    unread > 0
                      ? `Start chat — ${unread > 99 ? "99+" : unread} unread messages`
                      : "Start chat"
                  }
                >
                  Start chat
                  <UnreadBadge count={unread} />
                  <IconArrow />
                </Link>
                <a
                  className="cl-btn-wa"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contact us on WhatsApp"
                >
                  <IconWhatsapp />
                  WhatsApp us
                </a>
              </div>
            </div>

            {/* Right: 2×2 step cards */}
            <div className="cl-steps-grid" role="list">
              <div role="listitem">
                <StepCard
                  number="01"
                  accent="--g400"
                  label="Start a chat"
                  detail="Tap Get Solutions, open a chat, and share photos or videos of your affected field."
                />
              </div>
              <div role="listitem">
                <StepCard
                  number="02"
                  accent="--a200"
                  label="Get your plan"
                  detail="Receive a standardized treatment plan with crop stage, dosage, and spray intervals."
                />
              </div>
              <div role="listitem">
                <StepCard
                  number="03"
                  accent="--sky-400"
                  label="Confirm & pay"
                  detail="Approve your quotation and complete secure payment — invoice and GST ready."
                />
              </div>
              <div role="listitem">
                <StepCard
                  number="04"
                  accent="--g600"
                  label="Track delivery"
                  detail="We dispatch your order and share your LR number immediately for live tracking."
                />
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FINAL CTA BANNER
        ══════════════════════════════════════════════ */}
        <div className="cl-cta-banner" role="complementary" aria-label="Get started">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="cl-cta-banner-kicker">Ready when you are</div>
            <h3 className="cl-cta-banner-h">
              Fix your crop issue today.
            </h3>
            <p className="cl-cta-banner-sub">
              Instant expert help, a clear spray plan, and reliable<br />
              doorstep delivery — all in one place.
            </p>
          </div>

          <div className="cl-cta-banner-actions">
            <Link
              className="cl-btn-white"
              to="/farmers"
              onClick={clear}
              aria-label={
                unread > 0
                  ? `Get solutions — ${unread > 99 ? "99+" : unread} unread messages`
                  : "Get solutions"
              }
            >
              Get solutions
              <UnreadBadge count={unread} />
              <IconArrow />
            </Link>
            <Link className="cl-btn-outline-white" to="/about">
              Know more
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}