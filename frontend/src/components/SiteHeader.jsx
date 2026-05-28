// src/components/SiteHeader.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import LanguageSwitch from "./LanguageSwitch.jsx";
import { socket } from "@/lib/socket";
import { api } from "@/lib/api";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // keep unread in state + localStorage
  const [unread, setUnread] = useState(() => {
    const n = parseInt(localStorage.getItem("farmerNotifCount") || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });

  const [farmerMobile, setFarmerMobile] = useState(null);
  const [farmerChatId, setFarmerChatId] = useState(null);

  const isActive = useMemo(() => {
    const p = typeof window !== "undefined" ? window.location.pathname : "/";
    return (href) => (p === href || p.startsWith(href + "/") ? "active" : "");
  }, []);

  const saveUnread = useCallback(
    (nOrFn) => {
      const next =
        typeof nOrFn === "function" ? nOrFn(unread) : Number(nOrFn) || 0;
      const clamped = Math.max(0, next);
      setUnread(clamped);
      try { localStorage.setItem("farmerNotifCount", String(clamped)); } catch {}
    },
    [unread]
  );

  // Ensure key exists (helps first load)
  useEffect(() => {
    if (!localStorage.getItem("farmerNotifCount")) {
      try { localStorage.setItem("farmerNotifCount", "0"); } catch {}
    }
  }, []);

  // Load logged-in farmer + their current chat_id (once)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const m = me?.data?.farmer?.mobile || null;
        if (!alive) return;
        if (m) {
          setFarmerMobile(String(m));
          try {
            const lr = await api.get(`/quotes/latest-by-mobile/${m}`, { withCredentials: true });
            if (!alive) return;
            const cid = lr?.data?.chat_id || null;
            if (cid) setFarmerChatId(String(cid));
          } catch {}
        }
      } catch {
        // not logged in as farmer
      }
    })();
    return () => { alive = false; };
  }, []);

  // Clear when /farmers is visible
  const clearIfFarmersVisible = useCallback(() => {
    const onFarmers =
      typeof window !== "undefined" && window.location.pathname.startsWith("/farmers");
    if (onFarmers && document.visibilityState === "visible") saveUnread(0);
  }, [saveUnread]);

  // SOCKET: increment when a new admin message targets this farmer
  useEffect(() => {
    const handleNew = (p = {}) => {
      // Normalize fields from various backends
      const pid = p.chat_id != null ? String(p.chat_id) : null;
      const fromRole = String(p.sender_role || "").toLowerCase();
      const toMobile =
        String(p.to_mobile || p.toMobile || p.to || p.mobile || "");

      const sameChat = farmerChatId && pid && pid === String(farmerChatId);
      const targetsMe =
        sameChat ||
        (!!farmerMobile && toMobile && toMobile.replace(/\D/g, "") === String(farmerMobile).replace(/\D/g, ""));

      // Ignore own echoes if role provided
      if (fromRole === "farmer") return;
      if (!targetsMe) return;

      const onFarmers =
        typeof window !== "undefined" && window.location.pathname.startsWith("/farmers");

      if (onFarmers && document.visibilityState === "visible") {
        saveUnread(0);
      } else {
        saveUnread((n) => n + 1);
      }
    };

    socket.on("chat:new_message", handleNew);

    // Clear when tab becomes visible on /farmers
    const onVis = () => clearIfFarmersVisible();
    document.addEventListener("visibilitychange", onVis);
    clearIfFarmersVisible();

    // Sync badge across tabs/windows when localStorage changes
    const onStorage = (e) => {
      if (e.key === "farmerNotifCount" && e.newValue != null) {
        const v = parseInt(e.newValue, 10);
        if (Number.isFinite(v)) setUnread(Math.max(0, v));
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      socket.off("chat:new_message", handleNew);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [farmerChatId, farmerMobile, clearIfFarmersVisible, saveUnread]);

  const handleFarmersClick = () => saveUnread(0);

  return (
    <>
      <header className="site-header">
        <button className="burger" aria-label="Open menu" onClick={() => setOpen(true)}>
          <span></span><span></span><span></span>
        </button>

        <a className="brand" href="/">
          <img className="brand-logo" src="/1234.png" alt="AV Traders logo" />
          <span className="brand-name">AV Traders Agri Clinic</span>
        </a>

        <div className="center-bar">
          <nav className="primary-nav" aria-label="Primary">
            <a className={isActive("/")} href="/">Home</a>
            <a className={isActive("/clinic")} href="/clinic">Clinic</a>
            <a className={isActive("/distribution")} href="/distribution">Distribution</a>
            <a className={isActive("/about")} href="/about">About</a>
            <a className={isActive("/contact")} href="/contact">Contact</a>
            <a className={isActive("/guide")} href="/guide">Farmer’s Guide</a>
            <a className={isActive("/admin")} href="/admin">Admin</a>

            <span className="notif-wrap">
              <a className={isActive("/farmers")} href="/farmers" onClick={handleFarmersClick}>
                Farmers
              </a>
              {unread > 0 && (
                <span className="notif-badge" aria-label={`${unread} new message${unread > 1 ? "s" : ""}`}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
          </nav>
        </div>

        <div className="right-tools">
          <div className="lang-switch"><LanguageSwitch /></div>
        </div>
      </header>
      <div className="header-spacer" />

      {/* Drawer (mobile) */}
      <aside className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="drawer-title">
            <img src="/1234.png" alt="" />
            <strong>Menu</strong>
          </div>
          <button className="drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav className="drawer-links">
          <a href="/" onClick={() => setOpen(false)} className={isActive("/")}>Home</a>
          <a href="/clinic" onClick={() => setOpen(false)} className={isActive("/clinic")}>Clinic</a>
          <a href="/distribution" onClick={() => setOpen(false)} className={isActive("/distribution")}>Distribution</a>
          <a href="/about" onClick={() => setOpen(false)} className={isActive("/about")}>About</a>
          <a href="/contact" onClick={() => setOpen(false)} className={isActive("/contact")}>Contact</a>
          <a href="/guide" onClick={() => setOpen(false)} className={isActive("/guide")}>Farmer’s Guide</a>
          <a href="/admin" onClick={() => setOpen(false)} className={isActive("/admin")}>Admin</a>

          <span className="notif-wrap">
            <a
              href="/farmers"
              onClick={() => { handleFarmersClick(); setOpen(false); }}
              className={isActive("/farmers")}
            >
              Farmers
            </a>
            {unread > 0 && <span className="notif-badge">{unread > 99 ? "99+" : unread}</span>}
          </span>
        </nav>
      </aside>
      <div className={`drawer-backdrop ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      <style>{`
        .notif-wrap { position: relative; display: inline-flex; align-items: center; }
        .notif-badge {
          position: absolute; top: -8px; right: -12px; min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 999px; background: #ef4444; color: #fff; font-size: 11px; line-height: 18px;
          text-align: center; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.18); pointer-events: none;
        }
        .mobile-drawer .drawer-links .notif-wrap { margin: 6px 0; }

        .right-tools{ position: relative; z-index: 1101; display:flex; align-items:center; gap:10px; }
        .drawer-backdrop{
          position: fixed; inset: 0; background: rgba(0,0,0,.35);
          opacity: 0; pointer-events: none; z-index: 1000;
        }
        .drawer-backdrop.show{ opacity: 1; pointer-events: auto; }
      `}</style>
    </>
  );
}
