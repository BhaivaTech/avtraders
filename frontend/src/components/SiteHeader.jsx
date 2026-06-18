import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch.jsx";
import { socket } from "@/lib/socket";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...p}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconX = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─────────────────────────────────────────────
   Nav items
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Home",         href: "/" },
  { label: "Clinic",       href: "/clinic" },
  { label: "Distribution", href: "/distribution" },
  { label: "About",        href: "/about" },
  { label: "Contact",      href: "/contact" },
  { label: "Guide",        href: "/guide" },
  { label: "Admin",        href: "/admin" },
  { label: "Farmers",      href: "/farmers", hasBadge: true },
];

/* ─────────────────────────────────────────────
   SiteHeader
───────────────────────────────────────────── */
export default function SiteHeader() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Unread ── */
  const [unread, setUnread] = useState(() => {
    const n = parseInt(localStorage.getItem("farmerNotifCount") || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
  const [farmerMobile, setFarmerMobile] = useState(null);
  const [farmerChatId, setFarmerChatId] = useState(null);

  const saveUnread = useCallback((nOrFn) => {
    const next = typeof nOrFn === "function" ? nOrFn(unread) : Number(nOrFn) || 0;
    const clamped = Math.max(0, next);
    setUnread(clamped);
    try { localStorage.setItem("farmerNotifCount", String(clamped)); } catch {}
  }, [unread]);

  useEffect(() => {
    if (!localStorage.getItem("farmerNotifCount"))
      try { localStorage.setItem("farmerNotifCount", "0"); } catch {}
  }, []);

  /* Load farmer + chat_id */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const m = me?.data?.farmer?.mobile || null;
        if (!alive || !m) return;
        setFarmerMobile(String(m));
        try {
          const lr = await api.get(`/quotes/latest-by-mobile/${m}`, { withCredentials: true });
          if (!alive) return;
          const cid = lr?.data?.chat_id || null;
          if (cid) setFarmerChatId(String(cid));
        } catch {}
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  /* Clear on /farmers visible */
  const clearIfFarmersVisible = useCallback(() => {
    if (window.location.pathname.startsWith("/farmers") && document.visibilityState === "visible")
      saveUnread(0);
  }, [saveUnread]);

  /* Socket listener */
  useEffect(() => {
    const handleNew = (p = {}) => {
      const pid = p.chat_id != null ? String(p.chat_id) : null;
      const fromRole = String(p.sender_role || "").toLowerCase();
      const toMobile = String(p.to_mobile || p.toMobile || p.to || p.mobile || "");
      const sameChat = farmerChatId && pid && pid === String(farmerChatId);
      const targetsMe = sameChat ||
        (!!farmerMobile && toMobile.replace(/\D/g, "") === String(farmerMobile).replace(/\D/g, ""));
      if (fromRole === "farmer" || !targetsMe) return;
      if (window.location.pathname.startsWith("/farmers") && document.visibilityState === "visible")
        saveUnread(0);
      else saveUnread((n) => n + 1);
    };
    socket.on("chat:new_message", handleNew);
    const onVis = () => clearIfFarmersVisible();
    document.addEventListener("visibilitychange", onVis);
    clearIfFarmersVisible();
    const onStorage = (e) => {
      if (e.key === "farmerNotifCount" && e.newValue != null)
        setUnread(Math.max(0, parseInt(e.newValue, 10) || 0));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      socket.off("chat:new_message", handleNew);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [farmerChatId, farmerMobile, clearIfFarmersVisible, saveUnread]);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close drawer on navigate */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const isActive = (href) => {
    const p = location.pathname;
    if (href === "/") return p === "/" ? "active" : "";
    return p === href || p.startsWith(href + "/") ? "active" : "";
  };

  const handleFarmersClick = () => saveUnread(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           HEADER — Semi-transparent dark green glass
        ══════════════════════════════════════════════ */
        .hdr {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 70;
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 clamp(16px, 3vw, 32px);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: rgba(23, 52, 4, 0.78);
          backdrop-filter: blur(14px) saturate(1.5);
          -webkit-backdrop-filter: blur(14px) saturate(1.5);
          transition: background 0.35s ease, box-shadow 0.35s ease;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hdr.scrolled {
          background: rgba(23, 52, 4, 0.94);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
          border-bottom-color: rgba(255,255,255,0.08);
        }
        .hdr-spacer { height: 64px; }

        /* ── Brand ── */
        .hdr-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          min-width: 0;
          flex-shrink: 0;
        }
        .hdr-brand-logo {
          width: 34px; height: 34px;
          object-fit: cover;
          border-radius: 8px;
        }
        .hdr-brand-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 1rem;
          font-weight: 400;
          color: #fff;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        /* ── Center nav ── */
        .hdr-nav {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: none;
          align-items: center;
          gap: 0;
        }
        @media (min-width: 992px) { .hdr-nav { display: flex; } }

        .hdr-link {
          position: relative;
          padding: 7px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .hdr-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
        }
        .hdr-link.active {
          color: #fff;
          font-weight: 700;
        }
        .hdr-link.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 2.5px;
          background: #C0DD97;
          border-radius: 2px;
        }

        /* ── Badge ── */
        .hdr-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 17px; height: 17px;
          padding: 0 4px;
          background: #E53E3E;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          border-radius: 100px;
          line-height: 1;
          margin-left: 4px;
        }

        /* ── Right ── */
        .hdr-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Override .lang-switch fixed positioning from styles.css */
        .hdr-right .lang-switch {
          position: relative !important;
          top: auto !important;
          right: auto !important;
          z-index: auto !important;
          padding: 0 !important;
        }
        .hdr-right .lang-switch button,
        .hdr-right .lang-switch .btn {
          height: 34px !important;
          padding: 0 12px !important;
          border-radius: 8px !important;
          border: 1px solid rgba(255,255,255,0.28) !important;
          background: rgba(255,255,255,0.08) !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 0.78rem !important;
          transition: background 0.2s, border-color 0.2s;
        }
        .hdr-right .lang-switch button:hover,
        .hdr-right .lang-switch .btn:hover {
          background: rgba(255,255,255,0.16) !important;
          border-color: rgba(255,255,255,0.45) !important;
        }

        /* ── Burger ── */
        .hdr-burger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px; height: 34px;
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .hdr-burger:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.45);
        }
        @media (min-width: 992px) { .hdr-burger { display: none; } }

        /* ══════════════════════════════════════════════
           MOBILE DRAWER
        ══════════════════════════════════════════════ */
        .hdr-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 90;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .hdr-backdrop.open { opacity: 1; pointer-events: auto; }

        .hdr-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 280px; max-width: 85vw;
          background: #fff;
          z-index: 91;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column;
          box-shadow: -8px 0 32px rgba(0,0,0,0.12);
        }
        .hdr-drawer.open { transform: translateX(0); }
        @media (prefers-color-scheme: dark) {
          .hdr-drawer { background: #141414; }
        }

        .hdr-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        @media (prefers-color-scheme: dark) {
          .hdr-drawer-head { border-bottom-color: rgba(255,255,255,0.08); }
        }
        .hdr-drawer-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .hdr-drawer-brand img { width: 30px; height: 30px; border-radius: 7px; }
        .hdr-drawer-brand-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 0.95rem;
          color: #0f172a;
        }
        @media (prefers-color-scheme: dark) {
          .hdr-drawer-brand-name { color: #f1f5f9; }
        }
        .hdr-drawer-close {
          width: 34px; height: 34px;
          border: 1px solid #e2e8f0;
          background: transparent;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: color 0.2s, border-color 0.2s;
        }
        .hdr-drawer-close:hover { color: #0f172a; border-color: #3B6D11; }
        @media (prefers-color-scheme: dark) {
          .hdr-drawer-close { border-color: rgba(255,255,255,0.1); color: #94a3b8; }
          .hdr-drawer-close:hover { color: #f1f5f9; border-color: #97C459; }
        }

        .hdr-drawer-nav {
          flex: 1; overflow-y: auto;
          padding: 8px 12px;
          display: flex; flex-direction: column; gap: 1px;
        }
        .hdr-drawer-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px;
          font-size: 0.88rem; font-weight: 600;
          color: #475569;
          text-decoration: none;
          border-radius: 10px;
          transition: color 0.2s, background 0.2s;
        }
        .hdr-drawer-link:hover { color: #0f172a; background: #f8fafc; }
        .hdr-drawer-link.active {
          color: #3B6D11;
          background: rgba(59,109,17,0.07);
          font-weight: 700;
        }
        .hdr-drawer-link.active::before {
          content: "";
          width: 3px; height: 18px;
          background: #3B6D11;
          border-radius: 2px;
          flex-shrink: 0;
          margin-right: -2px;
        }
        @media (prefers-color-scheme: dark) {
          .hdr-drawer-link { color: #94a3b8; }
          .hdr-drawer-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.04); }
          .hdr-drawer-link.active { color: #97C459; background: rgba(151,196,89,0.08); }
          .hdr-drawer-link.active::before { background: #97C459; }
        }

        /* ══════════════════════════════════════════════
           HIDE OLD HEADER from styles.css
        ══════════════════════════════════════════════ */
        .site-header { display: none !important; }
        .header-spacer { display: none !important; }
        .mobile-drawer { display: none !important; }
        .drawer-backdrop { display: none !important; }
      `}</style>

      {/* ── Header bar ── */}
      <header className={`hdr ${scrolled ? "scrolled" : ""}`}>
        <Link className="hdr-brand" to="/" aria-label="Home">
          <img className="hdr-brand-logo" src="/1234.png" alt="AV Traders" />
          <span className="hdr-brand-name">AV Traders Agri Clinic</span>
        </Link>

        <nav className="hdr-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className={`hdr-link ${isActive(item.href)}`}
              to={item.href}
              onClick={item.hasBadge ? handleFarmersClick : undefined}
            >
              {item.label}
              {item.hasBadge && unread > 0 && (
                <span className="hdr-badge">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hdr-right">
          <div className="lang-switch"><LanguageSwitch /></div>
          <button className="hdr-burger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <IconMenu />
          </button>
        </div>
      </header>
      <div className="hdr-spacer" />

      {/* ── Mobile drawer ── */}
      <div className={`hdr-backdrop ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`hdr-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="hdr-drawer-head">
          <div className="hdr-drawer-brand">
            <img src="/1234.png" alt="" />
            <span className="hdr-drawer-brand-name">AV Traders</span>
          </div>
          <button className="hdr-drawer-close" aria-label="Close" onClick={() => setDrawerOpen(false)}>
            <IconX />
          </button>
        </div>
        <nav className="hdr-drawer-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className={`hdr-drawer-link ${isActive(item.href)}`}
              to={item.href}
              onClick={item.hasBadge ? handleFarmersClick : undefined}
            >
              {item.label}
              {item.hasBadge && unread > 0 && (
                <span className="hdr-badge">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
