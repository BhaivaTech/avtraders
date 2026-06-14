import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { socket as sharedSocket } from "../lib/socket.js";
import { CONTACT_PHONE, CONTACT_EMAIL, WHATSAPP_CHANNEL_URL, WHATSAPP_URL } from '../lib/config.js';

/* ─────────────────────────────────────────────
   SVG Icons — stroke-based, tree-shakeable
   (mirrored from Clinic.jsx)
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
const IconPlay = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...p}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* ─────────────────────────────────────────────
   Preloading helper
───────────────────────────────────────────── */
function preload(srcs = []) {
  const loaders = srcs.map(
    (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      })
  );
  return Promise.all(loaders);
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

/* ─────────────────────────────────────────────
   Image Carousel (seamless infinite loop)
───────────────────────────────────────────── */
function ImageCarousel({
  images = [],
  interval = 3800,
  ratio = "40%",
  fit = "cover",
  objectPosition = "center center",
}) {
  const hasLoop = images.length > 1;
  const ext = hasLoop ? [images[images.length - 1], ...images, images[0]] : images;

  const [i, setI] = useState(hasLoop ? 1 : 0);
  const [anim, setAnim] = useState(true);
  const [ready, setReady] = useState(!hasLoop);
  const timer = useRef(null);
  const paused = useRef(false);
  const touch = useRef({ x: 0 });
  const mouse = useRef({ down: false, x: 0 });

  useEffect(() => {
    let on = true;
    setI(hasLoop ? 1 : 0);
    setAnim(true);
    setReady(!hasLoop);
    if (hasLoop) preload(images).then(() => on && setReady(true));
    return () => { on = false; };
  }, [images, hasLoop]);

  const schedule = useCallback(() => {
    if (!hasLoop || !ready || paused.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setI((p) => p + 1), interval);
  }, [hasLoop, ready, interval]);

  useEffect(() => {
    schedule();
    return () => clearTimeout(timer.current);
  }, [i, schedule]);

  const pause = useCallback(() => {
    paused.current = true;
    clearTimeout(timer.current);
  }, []);
  const resume = useCallback(() => {
    paused.current = false;
    schedule();
  }, [schedule]);

  useEffect(() => {
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pause, resume]);

  const next = () => setI((p) => p + 1);
  const prev = () => setI((p) => p - 1);
  const go = (n) => setI(n);

  const onTouchStart = (e) => { pause(); touch.current.x = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    resume();
  };
  const onMouseDown = (e) => { mouse.current = { down: true, x: e.clientX }; pause(); };
  const onMouseUp = (e) => {
    if (!mouse.current.down) return;
    const dx = e.clientX - mouse.current.x;
    mouse.current.down = false;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    resume();
  };
  const onMouseLeave = () => { mouse.current.down = false; resume(); };
  const onKeyDown = (e) => { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };

  const onTransitionEnd = () => {
    if (!hasLoop) return;
    if (i === ext.length - 1) {
      setAnim(false); setI(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    } else if (i === 0) {
      setAnim(false); setI(ext.length - 2);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    }
  };

  const shouldEager = (idx) => {
    if (!hasLoop) return true;
    const lastIdx = ext.length - 1;
    return idx === 0 || idx === lastIdx || idx === i;
  };

  if (ext.length === 0) return null;

  return (
    <div className="h-carousel-wrap">
      <div
        className="h-carousel"
        role="region"
        aria-label="Promotional banners"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <div className="h-carousel-aspect" style={{ paddingTop: ratio }} />
        <div
          className="h-carousel-track"
          style={{
            transform: `translateX(-${i * 100}%)`,
            transition: anim ? "transform 450ms ease" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {ext.map((src, idx) => (
            <div className="h-carousel-slide" key={`${idx}-${src}`}>
              <img
                className="h-carousel-img"
                src={src}
                alt=""
                loading={shouldEager(idx) ? "eager" : "lazy"}
                fetchpriority={shouldEager(idx) ? "high" : "auto"}
                decoding="async"
                style={{ objectFit: fit, objectPosition }}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button className="h-carousel-arrow left" onClick={prev} aria-label="Previous slide">‹</button>
            <button className="h-carousel-arrow right" onClick={next} aria-label="Next slide">›</button>
            <div className="h-carousel-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-carousel-dot ${i === idx + 1 ? "active" : ""}`}
                  onClick={() => go(idx + 1)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WhatsApp Channel Popup (1-week snooze)
───────────────────────────────────────────── */
function WhatsAppChannelPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const until = localStorage.getItem("waPopupDismissedUntil");
    const now = Date.now();
    if (!until || now > Number(until)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const closeForAWeek = () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("waPopupDismissedUntil", String(Date.now() + sevenDays));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <aside className="wa-popup" role="dialog" aria-label="Join our WhatsApp Channel">
      <button className="wa-popup-close" aria-label="Close" onClick={closeForAWeek}>×</button>
      <div className="wa-popup-header">
        <img src="/profile/R10.jpg" alt="Dr A Venugopal" className="wa-popup-avatar" />
        <div>
          <div className="wa-popup-name">Dr A Venugopal | WhatsApp Channel</div>
          <div className="wa-popup-status">Plant doctor · 1.5K+ followers</div>
        </div>
      </div>
      <p className="wa-popup-desc">
        Join our WhatsApp Channel — shop timings, holiday alerts &amp; farming tips in one place.
      </p>
      <div className="wa-popup-actions">
        <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noreferrer" className="cl-btn-wa">
          <IconWhatsapp /> Join Now
        </a>
        <span className="wa-popup-domain">whatsapp.com · official</span>
      </div>
      <div className="wa-popup-note">Tip: closing hides it for a week.</div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   HOME — main export
───────────────────────────────────────────── */
export default function Home() {
  const bannerImages = [
    "/banners/R4.png", "/banners/R1.jpg", "/banners/R2.png",
    "/banners/R3.jpg", "/banners/R5.png", "/banners/R6.jpg",
    "/banners/R7.png", "/banners/R8.png", "/banners/R9.png",
  ];

  /* ---- Announcements state ---- */
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState("");

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnLoading(true);
      setAnnError("");
      const res = await api.get("/announcements", {
        withCredentials: true,
      });
      const list =
        Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.items) ? res.data.items
            : [];
      setAnnouncements(list);
    } catch (e) {
      console.error("loadAnnouncements failed", e);
      setAnnouncements([]);
      setAnnError("Could not load announcements right now.");
    } finally {
      setAnnLoading(false);
    }
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  /* ---- Chat notification badge ---- */
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("farmerNotifCount");
      const n = raw ? parseInt(raw, 10) || 0 : 0;
      setChatCount(n);
    } catch { }
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "farmerNotifCount") {
        const n = e.newValue ? parseInt(e.newValue, 10) || 0 : 0;
        setChatCount(n);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const s = sharedSocket;
    if (!s) return;
    const onNew = (payload = {}) => {
      if (window.location.pathname.includes("/farmers")) return;
      const role = payload.sender_role?.toLowerCase?.() || "";
      const isFromAdmin =
        role === "admin" || role === "support" || role === "staff" ||
        role === "team" || role === "" || role === undefined;
      if (!isFromAdmin) return;
      try {
        const raw = localStorage.getItem("farmerNotifCount") || "0";
        const prev = parseInt(raw, 10) || 0;
        const next = Math.min(999, prev + 1);
        localStorage.setItem("farmerNotifCount", String(next));
        setChatCount(next);
      } catch (e) { console.error("notifCount update failed", e); }
    };
    s.on("chat:new_message", onNew);
    return () => s.off("chat:new_message", onNew);
  }, []);

  const openChat = () => {
    try { localStorage.setItem("farmerNotifCount", "0"); } catch { }
    setChatCount(0);
    window.location.href = "/farmers";
  };

  /* ---- Latest announcement ticker ---- */
  const hasTicker = !annLoading && !annError && announcements && announcements.length > 0;

  let tickerNode = null;
  if (hasTicker) {
    const a = announcements[0];
    const rawBody = (a.body || a.text || "").trim();
    const rawTitle = (a.title || "").trim();
    let fullText = rawBody || rawTitle || "";
    if (rawTitle && rawBody && !rawBody.startsWith(rawTitle)) fullText = `${rawTitle} — ${rawBody}`;
    if (!fullText) fullText = "New announcement from AV Traders Agri Clinic.";
    const fieldUrl = a.link_url || a.link || a.url || a.youtube_url || "";
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    let detectedUrl = fieldUrl || "";
    if (!detectedUrl) { const m = fullText.match(urlRegex); if (m) detectedUrl = m[0]; }

    if (detectedUrl) {
      if (!fieldUrl && fullText.includes(detectedUrl)) {
        const parts = fullText.split(detectedUrl);
        tickerNode = <>{parts[0]}<a href={detectedUrl} target="_blank" rel="noreferrer">{detectedUrl}</a>{parts.slice(1).join(detectedUrl)}</>;
      } else {
        tickerNode = <a href={detectedUrl} target="_blank" rel="noreferrer">{fullText}</a>;
      }
    } else {
      tickerNode = <>{fullText}</>;
    }
  }

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
        .h-root {
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
        .h-root {
          display: flex;
          flex-direction: column;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 0 1.5rem 5rem;
        }

        /* ══════════════════════════════════════════════
           Section wrapper
        ══════════════════════════════════════════════ */
        .h-section {
          padding: 5rem 0;
        }
        .h-section + .h-section {
          border-top: 1px solid var(--color-border-tertiary);
        }

        /* Eyebrow pill */
        .h-eyebrow {
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
          .h-eyebrow {
            background: rgba(23, 52, 4, 0.6);
            border-color: var(--g800);
            color: var(--g100);
          }
        }

        /* Section headings */
        .h-h2 {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: var(--color-text-primary);
          margin: 0 0 0.75rem;
        }
        .h-h2 em {
          font-style: italic;
          color: var(--g500);
        }
        @media (prefers-color-scheme: dark) {
          .h-h2 em { color: var(--g200); }
        }

        .h-lead {
          font-size: 1rem;
          color: var(--color-text-secondary);
          line-height: 1.75;
          margin: 0 0 3rem;
          max-width: 560px;
        }

        /* ══════════════════════════════════════════════
           BUTTONS
        ══════════════════════════════════════════════ */
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

        .h-cta-row {
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
           ANNOUNCEMENT BAR (top ticker)
        ══════════════════════════════════════════════ */
        .h-announce-bar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 16px;
          box-sizing: border-box;
          background: linear-gradient(90deg, var(--g800), var(--g600));
          color: #fff;
          font-size: 13px;
          line-height: 1.3;
          position: relative;
          z-index: 30;
          white-space: nowrap;
          overflow: hidden;
          border-radius: var(--r-md);
          margin-bottom: 2rem;
        }
        .h-announce-label {
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
          padding-right: 8px;
          border-right: 1px solid rgba(255,255,255,0.3);
          letter-spacing: 0.03em;
        }
        .h-announce-status {
          font-size: 12px;
          color: rgba(255,255,255,0.85);
          padding-left: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .h-ticker-shell {
          flex: 1;
          overflow: hidden;
          position: relative;
          min-height: 18px;
        }
        .h-ticker-track {
          display: flex;
          width: max-content;
          animation: h-ticker 20s linear infinite;
        }
        .h-ticker-item {
          padding-right: 3rem;
          white-space: nowrap;
          font-size: 13px;
          color: rgba(255,255,255,0.95);
        }
        .h-announce-bar a {
          color: #fff;
          text-decoration: underline;
        }
        .h-announce-bar a:hover {
          text-decoration: none;
        }
        @keyframes h-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ══════════════════════════════════════════════
           HERO SECTION
        ══════════════════════════════════════════════ */
        .h-hero {
          padding: 5.5rem 0 4.5rem;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 4rem;
          align-items: center;
          position: relative;
        }
        .h-hero::before {
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
          .h-hero::before { background: radial-gradient(circle, rgba(23,52,4,0.4) 0%, transparent 70%); }
        }
        @media (max-width: 900px) {
          .h-hero { grid-template-columns: 1fr; gap: 3rem; padding: 3.5rem 0 2.5rem; }
          .h-hero::before { display: none; }
        }

        .h-hero-left { position: relative; z-index: 1; }

        .h-hero-eyebrow {
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
        @media (prefers-color-scheme: dark) { .h-hero-eyebrow { color: var(--g100); } }

        .h-hero-pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--g400);
          display: inline-block;
          animation: h-pulse 2.6s ease-in-out infinite;
        }
        @keyframes h-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.7); }
        }

        .h-hero-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(2.2rem, 5.5vw, 3.6rem);
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.01em;
          color: var(--color-text-primary);
          margin: 0 0 1.5rem;
        }
        .h-hero-title em {
          font-style: italic;
          color: var(--g500);
        }
        @media (prefers-color-scheme: dark) { .h-hero-title em { color: var(--g200); } }

        .h-hero-sub {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--color-text-secondary);
          margin: 0 0 2rem;
          max-width: 500px;
        }

        /* Social proof strip below hero CTAs */
        .h-hero-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }
        .h-hero-proof-stars {
          display: flex;
          gap: 2px;
          color: var(--a200);
        }
        .h-hero-proof-text {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        .h-hero-proof-divider {
          width: 1px;
          height: 16px;
          background: var(--color-border-tertiary);
        }
        .h-hero-proof-tag {
          font-size: 0.8rem;
          color: var(--g600);
          font-weight: 600;
        }
        @media (prefers-color-scheme: dark) { .h-hero-proof-tag { color: var(--g200); } }

        /* ── Hero right: stats panel ── */
        .h-hero-panel {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-2xl);
          padding: 0;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) { .h-hero-panel { display: none; } }

        .h-panel-bar {
          background: var(--g600);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @media (prefers-color-scheme: dark) { .h-panel-bar { background: var(--g800); } }

        .h-panel-avatar {
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
        .h-panel-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }
        .h-panel-status {
          font-size: 11.5px;
          color: rgba(255,255,255,0.75);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .h-panel-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
          flex-shrink: 0;
        }

        .h-panel-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-background-secondary);
          min-height: 200px;
        }
        @media (prefers-color-scheme: dark) {
          .h-panel-body { background: var(--color-background-tertiary); }
        }

        .h-panel-metrics {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--color-border-tertiary);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          background: var(--color-background-primary);
        }
        .h-panel-metric {
          text-align: center;
          padding: 0.5rem;
        }
        .h-panel-metric + .h-panel-metric {
          border-left: 1px solid var(--color-border-tertiary);
        }
        .h-panel-metric-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--g600);
          line-height: 1;
          margin-bottom: 3px;
        }
        @media (prefers-color-scheme: dark) { .h-panel-metric-val { color: var(--g200); } }
        .h-panel-metric-label {
          font-size: 10.5px;
          color: var(--color-text-secondary);
        }

        /* ══════════════════════════════════════════════
           CAROUSEL
        ══════════════════════════════════════════════ */
        .h-carousel-wrap {
          border-radius: var(--r-2xl);
          overflow: hidden;
          position: relative;
          margin-bottom: 0;
        }
        .h-carousel {
          position: relative;
          overflow: hidden;
          outline: none;
          user-select: none;
          -webkit-user-select: none;
          cursor: grab;
        }
        .h-carousel:active { cursor: grabbing; }
        .h-carousel-aspect { width: 100%; pointer-events: none; }
        .h-carousel-track {
          display: flex;
          position: absolute;
          inset: 0;
          will-change: transform;
        }
        .h-carousel-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          position: relative;
        }
        .h-carousel-img {
          display: block;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          object-fit: cover;
        }
        .h-carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: var(--r-md);
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--color-border-tertiary);
          color: var(--g700);
          font-size: 22px;
          line-height: 38px;
          text-align: center;
          cursor: pointer;
          z-index: 2;
          opacity: 0;
          transition: opacity var(--dur) var(--ease);
        }
        .h-carousel:hover .h-carousel-arrow { opacity: 1; }
        .h-carousel-arrow.left { left: 12px; }
        .h-carousel-arrow.right { right: 12px; }
        .h-carousel-dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 2;
        }
        .h-carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.55);
          cursor: pointer;
          padding: 0;
          transition: background var(--dur) var(--ease), transform var(--dur) var(--ease);
        }
        .h-carousel-dot.active {
          background: #fff;
          transform: scale(1.25);
        }

        /* ══════════════════════════════════════════════
           TRUST CARDS
        ══════════════════════════════════════════════ */
        .h-trust-grid {
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
           SERVICE CARDS (Expertise)
        ══════════════════════════════════════════════ */
        .h-svc-grid {
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
           FOUNDER SECTION
        ══════════════════════════════════════════════ */
        .h-founder-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 760px) {
          .h-founder-layout { grid-template-columns: 1fr; gap: 2rem; }
        }

        .h-founder-quote {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 1.2rem;
          font-style: italic;
          color: var(--g600);
          margin: 0 0 1rem;
          line-height: 1.5;
        }
        @media (prefers-color-scheme: dark) { .h-founder-quote { color: var(--g200); } }

        .h-founder-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 0.5rem;
        }

        .h-founder-bio {
          font-size: 0.92rem;
          color: var(--color-text-secondary);
          line-height: 1.75;
          margin: 0;
        }

        .h-founder-photo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .h-founder-photo img {
          width: 200px;
          height: 200px;
          object-fit: cover;
          border-radius: var(--r-2xl);
          border: 3px solid var(--g100);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        @media (prefers-color-scheme: dark) {
          .h-founder-photo img { border-color: var(--g800); }
        }
        .h-founder-photo-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--g700);
          text-align: center;
        }
        @media (prefers-color-scheme: dark) { .h-founder-photo-name { color: var(--g200); } }

        /* ══════════════════════════════════════════════
           TESTIMONIALS
        ══════════════════════════════════════════════ */
        .h-testimonial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .h-testimonial-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: var(--r-lg);
          padding: 1.75rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform var(--dur) var(--ease);
          position: relative;
          overflow: hidden;
        }
        .h-testimonial-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 3px;
          background: var(--a200);
          border-radius: 0 0 4px 0;
        }
        .h-testimonial-card:hover { transform: translateY(-3px); }

        .h-testimonial-quote-mark {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 3rem;
          line-height: 1;
          color: var(--g100);
        }
        @media (prefers-color-scheme: dark) { .h-testimonial-quote-mark { color: var(--g800); } }

        .h-testimonial-text {
          font-size: 0.88rem;
          color: var(--color-text-secondary);
          line-height: 1.7;
          margin: 0;
          flex: 1;
        }

        .h-testimonial-author {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--g600);
          padding-top: 8px;
          border-top: 1px solid var(--color-border-tertiary);
        }
        @media (prefers-color-scheme: dark) { .h-testimonial-author { color: var(--g200); } }

        /* ══════════════════════════════════════════════
           EDUCATION SECTION
        ══════════════════════════════════════════════ */
        .h-edu-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }
        @media (max-width: 760px) {
          .h-edu-layout { grid-template-columns: 1fr; gap: 2rem; }
        }

        .h-edu-list {
          list-style: none;
          padding: 0;
          margin: 1rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .h-edu-list li {
          font-size: 0.88rem;
          color: var(--color-text-secondary);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        .h-edu-list li span {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--g500);
        }
        @media (prefers-color-scheme: dark) { .h-edu-list li span { color: var(--g200); } }
        .h-edu-list .h-edu-highlight {
          color: var(--g600);
          font-weight: 600;
        }
        @media (prefers-color-scheme: dark) { .h-edu-list .h-edu-highlight { color: var(--g200); } }

        .h-edu-video {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          border-radius: var(--r-lg);
          overflow: hidden;
          background: #000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .h-edu-video iframe {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border: 0;
        }

        .h-edu-topics {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 1.25rem;
        }
        .h-edu-topic {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--r-md);
          background: var(--color-background-secondary);
          border: 1px solid var(--color-border-tertiary);
          transition: transform var(--dur) var(--ease);
        }
        .h-edu-topic:hover { transform: translateX(3px); }
        .h-edu-topic-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .h-edu-topic-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .h-edu-topic-sub {
          font-size: 0.78rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        /* ══════════════════════════════════════════════
           FOOTER
        ══════════════════════════════════════════════ */
        .h-footer {
          border-top: 1px solid var(--color-border-tertiary);
          padding: 3rem 0 0;
          margin-top: 3rem;
        }
        .h-footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 760px) {
          .h-footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .h-footer-grid { grid-template-columns: 1fr; }
        }

        .h-footer-brand {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 400;
          color: var(--color-text-primary);
          margin: 0 0 6px;
        }
        .h-footer-tagline {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .h-footer-heading {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 10px;
          letter-spacing: 0.02em;
        }

        .h-footer-text {
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        .h-footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .h-footer-link-list a {
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color var(--dur) var(--ease);
        }
        .h-footer-link-list a:hover {
          color: var(--g600);
          text-decoration: underline;
        }
        @media (prefers-color-scheme: dark) {
          .h-footer-link-list a:hover { color: var(--g200); }
        }

        .h-footer-copy {
          font-size: 0.78rem;
          color: var(--color-text-tertiary);
          padding-top: 1.5rem;
          margin-top: 2rem;
          border-top: 1px solid var(--color-border-tertiary);
        }

        /* ══════════════════════════════════════════════
           CTA BANNER
        ══════════════════════════════════════════════ */
        .h-cta-banner {
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
        .h-cta-banner::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .h-cta-banner::after {
          content: "";
          position: absolute;
          bottom: -80px; right: 120px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }
        @media (prefers-color-scheme: dark) { .h-cta-banner { background: var(--g800); } }
        @media (max-width: 680px) {
          .h-cta-banner {
            grid-template-columns: 1fr;
            padding: 2.5rem 1.75rem;
          }
        }

        .h-cta-banner-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 0.75rem;
        }
        .h-cta-banner-h {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 400;
          color: #fff;
          line-height: 1.25;
          margin: 0 0 0.6rem;
        }
        .h-cta-banner-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.65;
          margin: 0;
        }

        .h-cta-banner-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-start;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 680px) {
          .h-cta-banner-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }

        /* ══════════════════════════════════════════════
           WHATSAPP POPUP
        ══════════════════════════════════════════════ */
        .wa-popup {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 60;
          max-width: 400px;
          width: calc(100% - 32px);
          box-shadow: 0 12px 24px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
          border-radius: var(--r-xl);
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          overflow: hidden;
        }
        .wa-popup-close {
          position: absolute;
          top: 8px; right: 8px;
          width: 32px; height: 32px;
          border-radius: var(--r-sm);
          border: 1px solid var(--color-border-tertiary);
          background: var(--color-background-primary);
          cursor: pointer;
          line-height: 30px;
          text-align: center;
          font-size: 18px;
          color: var(--color-text-tertiary);
          transition: color var(--dur) var(--ease);
        }
        .wa-popup-close:hover { color: var(--color-text-primary); }
        .wa-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px 10px;
        }
        .wa-popup-avatar {
          width: 48px; height: 48px;
          border-radius: var(--r-md);
          object-fit: cover;
        }
        .wa-popup-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .wa-popup-status {
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .wa-popup-desc {
          padding: 0 14px 10px;
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        .wa-popup-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px 14px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wa-popup-domain {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .wa-popup-note {
          border-top: 1px dashed var(--color-border-tertiary);
          background: var(--color-background-secondary);
          padding: 10px 14px;
          font-size: 12px;
          color: var(--color-text-tertiary);
        }

        /* ══════════════════════════════════════════════
           FLOATING CHAT FAB
        ══════════════════════════════════════════════ */
        .h-chat-fab {
          position: fixed;
          right: 18px;
          bottom: 120px;
          z-index: 70;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--g600), var(--g400));
          color: #f9fafb;
          box-shadow: 0 14px 30px rgba(59, 109, 17, 0.45);
          cursor: pointer;
          transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
        }
        .h-chat-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(59, 109, 17, 0.55);
        }
        .h-chat-fab-icon { font-size: 22px; }
        .h-chat-fab-badge {
          position: absolute;
          top: -4px; right: -4px;
          min-width: 20px; height: 20px;
          padding: 0 5px;
          border-radius: 999px;
          background: #E53E3E;
          color: #fff;
          font-size: 11px;
          line-height: 20px;
          text-align: center;
          box-shadow: 0 0 0 2px var(--color-background-primary);
        }

        /* ══════════════════════════════════════════════
           MOBILE OVERRIDES
        ══════════════════════════════════════════════ */
        @media (max-width: 540px) {
          .h-section { padding: 3.5rem 0; }
          .h-trust-grid { grid-template-columns: 1fr 1fr; }
          .h-svc-grid { grid-template-columns: 1fr; }
          .h-testimonial-grid { grid-template-columns: 1fr; }
          .h-panel-metrics { grid-template-columns: repeat(2, 1fr); }
          .h-panel-metric:nth-child(n+3) { border-top: 1px solid var(--color-border-tertiary); }
          .h-panel-metric:nth-child(odd) { border-left: none; }
        }
        @media (max-width: 360px) {
          .h-trust-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .h-announce-bar { font-size: 12px; padding: 6px 12px; }
          .h-announce-label { font-size: 11px; }
          .h-chat-fab { width: 52px; height: 52px; bottom: 112px; right: 14px; }
        }
      `}</style>

      <div className="h-root">
        {/* WhatsApp Channel Popup */}
        <WhatsAppChannelPopup />

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section className="h-hero" aria-label="Hero">
          {/* Left: copy */}
          <div className="h-hero-left">
            <div className="h-hero-eyebrow" aria-hidden="true">
              <span className="h-hero-pulse" />
              AV Traders Agri Clinic
            </div>

            <h1 className="h-hero-title">
              Healthy plants,<br />
              <em>prosperous</em> farmers.
            </h1>

            <p className="h-hero-sub">
              The fastest growing agro-input supply company, trusted by
              6000+ farmers across Karnataka. Quality products, expert
              guidance, and eco-friendly farming practices.
            </p>

            <div className="h-cta-row">
              <Link className="cl-btn-primary" to="/farmers" aria-label="Explore solutions">
                Explore Solutions
                <IconArrow />
              </Link>
              <Link className="cl-btn-ghost" to="/contact">Contact us</Link>
              <a
                className="cl-btn-wa"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Contact us on WhatsApp"
              >
                <IconWhatsapp /> WhatsApp
              </a>
            </div>

            {/* Social proof strip */}
            <div className="h-hero-proof" aria-label="Farmer trust indicators">
              <div className="h-hero-proof-stars" aria-label="5 stars">
                {[1, 2, 3, 4, 5].map(i => <IconStar key={i} />)}
              </div>
              <span className="h-hero-proof-text">6000+ satisfied customers</span>
              <span className="h-hero-proof-divider" aria-hidden="true" />
              <span className="h-hero-proof-tag">🌱 English &amp; Kannada support</span>
            </div>
          </div>

          {/* Right: stats panel */}
          <div className="h-hero-panel" aria-hidden="true" role="presentation">
            <div className="h-panel-bar">
              <div className="h-panel-avatar">AV</div>
              <div>
                <div className="h-panel-name">AV Traders Agri Clinic</div>
                <div className="h-panel-status">
                  <span className="h-panel-status-dot" />
                  Open now — serving farmers
                </div>
              </div>
            </div>
            <div className="h-panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "1rem 1.25rem" }}>
              {[
                { num: "30+", label: "Years Experience" },
                { num: "6000+", label: "Farmers Helped" },
                { num: "200+", label: "Training Sessions" },
                { num: "90%", label: "Success Rate" },
              ].map((s, idx) => (
                <div key={idx} style={{ textAlign: "center", padding: "0.75rem 0.5rem", borderRadius: "var(--r-md)", background: "var(--g50)", border: "1px solid var(--g100)" }}>
                  <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 400, color: "var(--g600)", lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="h-panel-metrics">
              <div className="h-panel-metric">
                <div className="h-panel-metric-val">24h</div>
                <div className="h-panel-metric-label">Response time</div>
              </div>
              <div className="h-panel-metric">
                <div className="h-panel-metric-val">Pan-IN</div>
                <div className="h-panel-metric-label">Delivery reach</div>
              </div>
              <div className="h-panel-metric">
                <div className="h-panel-metric-val">GST</div>
                <div className="h-panel-metric-label">Invoice ready</div>
              </div>
              <div className="h-panel-metric">
                <div className="h-panel-metric-val">100%</div>
                <div className="h-panel-metric-label">Genuine products</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            ANNOUNCEMENT TICKER
        ══════════════════════════════════════════════ */}
        <div className="h-announce-bar" id="announcements">
          <div className="h-announce-label">📢 Latest</div>
          {annLoading && <div className="h-announce-status">Loading latest updates…</div>}
          {!annLoading && annError && <div className="h-announce-status">{annError}</div>}
          {!annLoading && !annError && hasTicker && (
            <div className="h-ticker-shell">
              <div className="h-ticker-track">
                <div className="h-ticker-item">{tickerNode}</div>
                <div className="h-ticker-item">{tickerNode}</div>
              </div>
            </div>
          )}
          {!annLoading && !annError && !hasTicker && (
            <div className="h-announce-status">No announcements yet. Please check back soon.</div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            CAROUSEL
        ══════════════════════════════════════════════ */}
        <ImageCarousel
          images={bannerImages}
          interval={5000}
          ratio="36%"
          fit="cover"
        />

        {/* ══════════════════════════════════════════════
            TRUST PILLARS
        ══════════════════════════════════════════════ */}
        <section className="h-section" aria-label="Why choose us">
          <div className="h-eyebrow">
            <IconLeaf />
            Why farmers trust us
          </div>

          <h2 className="h-h2">
            Healthy crops,<br />
            <em>better livelihoods</em>
          </h2>
          <p className="h-lead">
            Comprehensive agricultural solutions combining scientific knowledge,
            practical experience, and farmer-centric care for sustainable results.
          </p>

          <div className="h-trust-grid">
            <TrustCard
              icon={<IconChat />}
              title="Real-time expert chat"
              description="Connect with agronomists instantly — share photos, get diagnosis, and receive treatment plans in English or Kannada."
            />
            <TrustCard
              icon={<IconShield />}
              title="Genuine products only"
              description="Every product we supply is verified for quality and authenticity — no compromises on your crop's health."
            />
            <TrustCard
              icon={<IconFlask />}
              title="Science-backed advice"
              description="Standardized spray schedules with crop-stage precision, soil testing, and nutrient management."
            />
            <TrustCard
              icon={<IconTruck />}
              title="Pan-India delivery"
              description="Reliable logistics with LR tracking, secure payments, and GST invoicing for every order."
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            EXPERTISE / SERVICES
        ══════════════════════════════════════════════ */}
        <section className="h-section" aria-label="Our expertise">
          <div className="h-eyebrow">
            <IconLeaf />
            End-to-end agronomy support
          </div>

          <h2 className="h-h2">
            What we do for<br />
            <em>your farm</em>
          </h2>
          <p className="h-lead">
            From field diagnosis to doorstep delivery — every step of your
            crop's health journey is covered by our expert team.
          </p>

          <div className="h-svc-grid">
            <ServiceCard
              icon={<IconCamera />}
              accentVar="--g400"
              tag="01 · Diagnosis"
              title="Plant health management"
              subtitle="Advanced disease diagnosis, integrated pest management, and nutrient deficiency detection with customized treatment plans."
              items={[
                "Photo-based disease identification",
                "Integrated pest management strategies",
                "Nutrient deficiency detection & correction",
              ]}
              note="Reduce unnecessary chemical usage while protecting crops."
            />
            <ServiceCard
              icon={<IconFlask />}
              accentVar="--a200"
              tag="02 · Soil care"
              title="Soil & fertility solutions"
              subtitle="Comprehensive soil testing, fertility enhancement, and sustainable soil & water management for long-term productivity."
              items={[
                "Comprehensive soil testing & analysis",
                "Fertility enhancement programs",
                "Micronutrient optimization",
              ]}
              note="Improve soil health today for better harvests tomorrow."
            />
            <ServiceCard
              icon={<IconTruck />}
              accentVar="--sky-400"
              tag="03 · Consultancy"
              title="Agricultural consultancy"
              subtitle="From crop planning and scientific rotation to market strategy and wholesale input supply — guidance you can trust."
              items={[
                "Crop planning & scientific rotation",
                "Smart technology integration",
                "Market strategy & price guidance",
              ]}
              note="We stand with farmers at every step — production, protection, and profit."
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FOUNDER
        ══════════════════════════════════════════════ */}
        <section className="h-section" aria-label="Our founder">
          <div className="h-eyebrow">
            <IconLeaf />
            Leadership
          </div>

          <h2 className="h-h2">
            Meet our <em>founder</em>
          </h2>
          <p className="h-lead">
            Bridging traditional wisdom and modern agri-tech to transform
            the lives of thousands of farmers.
          </p>

          <div className="h-founder-layout">
            <div>
              <blockquote className="h-founder-quote">
                "When plants grow healthy, farmers grow wealthy."
              </blockquote>
              <p className="h-founder-name">
                Dr. A. Venugopal — Founder &amp; Chief Plant Doctor
              </p>
              <p className="h-founder-bio">
                With over <strong>30 years</strong> of experience in agricultural
                sciences, Dr. Venugopal has transformed the lives of thousands
                of farmers through innovative training programs, diagnostic
                techniques, and sustainable consultations — bridging traditional
                wisdom and modern agri-tech.
              </p>
            </div>
            <div className="h-founder-photo">
              <img src="/profile/R4.png" alt="Dr. A. Venugopal" />
              <div className="h-founder-photo-name">Dr. A. Venugopal</div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════ */}
        <section className="h-section" aria-label="Success stories">
          <div className="h-eyebrow">
            <IconLeaf />
            Farmer voices
          </div>

          <h2 className="h-h2">
            Real farmers, <em>real results</em>
          </h2>
          <p className="h-lead">
            Transforming agriculture across Karnataka — hear from the
            farmers who trust us.
          </p>

          <div className="h-testimonial-grid">
            {[
              {
                quote:
                  "I have been following Dr. Venugopal Sir for the past 3 years. Since then, all my crops have been successful and profitable. I'm from Malavalli, Mandya, and though I've never visited their shop, I've been receiving genuine products regularly through VRL. The trust and results speak for themselves.",
                author: "Mohan Kumar – Malavalli, Mandya",
              },
              {
                quote:
                  "Earlier I used to buy chemicals from local shops without knowing if they were genuine. The strong smell and harmful nature of those products even started affecting my health. After switching to genuine products from AV Traders under Dr. Venugopal's guidance, my crops became healthier, yields improved, and even my own health recovered.",
                author: "Manjunath — Hoskote",
              },
              {
                quote:
                  "I was struggling with soil that had lost fertility due to excessive chemical use. After consulting Dr. Venugopal Sir and following eco-friendly practices suggested by AV Traders, I not only revived my soil but also saw a bumper yield in paddy and vegetables. Today, I save on costs, earn better profits, and farm with confidence again.",
                author: "Ramesh Gowda – Hassan",
              },
            ].map((t, idx) => (
              <div className="h-testimonial-card" key={idx}>
                <div className="h-testimonial-quote-mark">"</div>
                <p className="h-testimonial-text">{t.quote}</p>
                <div className="h-testimonial-author">{t.author}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            EDUCATIONAL CONTENT
        ══════════════════════════════════════════════ */}
        <section className="h-section" aria-label="Educational content">
          <div className="h-eyebrow">
            <IconLeaf />
            Knowledge hub
          </div>

          <h2 className="h-h2">
            Learn from <em>expert-led</em> training
          </h2>
          <p className="h-lead">
            At AV Traders Agri Clinic, we believe knowledge is the most
            powerful tool for farmers. Through videos and demos, we share
            practical guidance you can adopt in your fields.
          </p>

          <div className="h-edu-layout">
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 8 }}>
                🎥 What you'll find
              </div>
              <ul className="h-edu-list">
                <li>
                  <span><IconCheck /></span>
                  Step-by-step crop management videos <span className="h-edu-highlight">(in local language)</span>
                </li>
                <li>
                  <span><IconCheck /></span>
                  Soil health tips — maintain fertility &amp; long-term productivity
                </li>
                <li>
                  <span><IconCheck /></span>
                  Water management techniques — save water, improve yield
                </li>
                <li>
                  <span><IconCheck /></span>
                  Crop rotation planning — increase soil life &amp; reduce pests
                </li>
                <li>
                  <span><IconCheck /></span>
                  Market insights — strategies for better pricing &amp; profit
                </li>
                <li>
                  <span><IconCheck /></span>
                  Farmer Success Stories — higher yields with less cost &amp; chemicals
                </li>
              </ul>

              <div className="h-cta-row" style={{ marginTop: "1.25rem" }}>
                <a
                  className="cl-btn-primary"
                  href="https://youtube.com/@dravenugopal"
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconPlay /> Subscribe on YouTube
                </a>
              </div>

              <div className="h-edu-topics">
                {[
                  { icon: "🧪", title: "Soil Health Assessment", sub: "Balanced nutrition & lab-grade testing" },
                  { icon: "💧", title: "Water Management Systems", sub: "Irrigation planning & saving water smartly" },
                  { icon: "🔁", title: "Crop Rotation Planning", sub: "Scientific rotations to protect soil life" },
                  { icon: "📈", title: "Market Pricing Strategies", sub: "Sell better with data-driven guidance" },
                ].map((k, i) => (
                  <div className="h-edu-topic" key={i}>
                    <div className="h-edu-topic-icon">{k.icon}</div>
                    <div>
                      <div className="h-edu-topic-title">{k.title}</div>
                      <div className="h-edu-topic-sub">{k.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-edu-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/nn6O27lkbrQ?si=SSVfdZJ9l8JqkDmH"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FINAL CTA BANNER
        ══════════════════════════════════════════════ */}
        <div className="h-cta-banner" role="complementary" aria-label="Get started">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="h-cta-banner-kicker">Ready when you are</div>
            <h3 className="h-cta-banner-h">
              Start your farming journey today.
            </h3>
            <p className="h-cta-banner-sub">
              Expert guidance, genuine products, and reliable<br />
              doorstep delivery — all in one place.
            </p>
          </div>
          <div className="h-cta-banner-actions">
            <Link className="cl-btn-white" to="/farmers">
              Get solutions
              <IconArrow />
            </Link>
            <Link className="cl-btn-outline-white" to="/about">
              Know more
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════ */}
        <footer className="h-footer" role="contentinfo">
          <div className="h-footer-grid">
            <div>
              <div className="h-footer-brand">AV Traders Agri Clinic</div>
              <div className="h-footer-tagline">Healthy Plants, Prosperous Farmers.</div>
            </div>
            <div>
              <div className="h-footer-heading">Contact</div>
              <div className="h-footer-text">
                📞 {CONTACT_PHONE.replace('+91', '+91 ')}<br />
                ✉️ {CONTACT_EMAIL}
              </div>
            </div>
            <div>
              <div className="h-footer-heading">Address</div>
              <div className="h-footer-text">
                AV Traders Agri Clinic, Kurubarahally, Tumkur road,
                Doddaballapura, Bengaluru Rural, Karnataka, 561203
              </div>
            </div>
            <div>
              <div className="h-footer-heading">Policies</div>
              <ul className="h-footer-link-list">
                <li><a href="/terms-and-conditions">Terms &amp; Conditions</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/refund-policy">Refund Policy</a></li>
                <li><a href="/return-policy">Return Policy</a></li>
                <li><a href="/shipping-policy">Shipping Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="h-footer-copy">
            © {new Date().getFullYear()} AV Traders Agri Clinic. All rights reserved.
          </div>
        </footer>

        {/* Floating Chat FAB */}
        <button
          type="button"
          className="h-chat-fab"
          onClick={openChat}
          aria-label="Open Farmer Chat"
        >
          <span className="h-chat-fab-icon">💬</span>
          {chatCount > 0 && (
            <span className="h-chat-fab-badge">
              {chatCount > 99 ? "99+" : chatCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
