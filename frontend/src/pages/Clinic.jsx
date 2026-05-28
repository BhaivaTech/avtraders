import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../lib/api.js";


/* ========== tiny inline icons (no deps) ========== */
const IconChat = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
  </svg>
);
const IconCamera = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm-8 13a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-10a4 4 0 1 0 .001 8.001A4 4 0 0 0 12 8z"/>
  </svg>
);
const IconFlask = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M9 2h6v2h-1v4.1l4.9 8.5A3 3 0 0 1 16.3 21H7.7a3 3 0 0 1-2.6-4.4L10 8.1V4H9V2zm3 8.8-4.5 7.8c-.2.3 0 .7.4.7h8.2c.4 0 .6-.4.4-.7L12 10.8z"/>
  </svg>
);
const IconShield = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"/>
  </svg>
);
const IconTruck = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M3 6h11v7h2.5l2 2H21V9h-3l-2-3H14V4H3v2zm2 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
  </svg>
);
const IconCard = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M2 5h20v14H2zM2 8h20v3H2z"/>
  </svg>
);

/* ========== helpers ========== */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const norm = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/* 
  useFarmerUnread()
  -----------------
  - Reads farmer mobile from localStorage ('farmerAuth').
  - Gets latest chat_id (once) so we can filter socket events.
  - Listens to socket 'chat:new_message' and increments a local counter.
  - Persists the counter in localStorage('farmerUnread') so other pages can show it.
  - Exposes `clear()` to reset when the farmer opens the chat.
*/
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

    // Try to discover chat_id (same endpoint Farmers.jsx already uses)
    (async () => {
      try {
        const r = await api.get(`/api/quotes/latest-by-mobile/${mobile10}`, {
          withCredentials: true,
        });
        chatIdRef.current = r?.data?.chat_id || null;
      } catch {}
    })();

    // real-time increment on new messages
    const s = io(API_BASE, { transports: ["websocket"], withCredentials: true });
    s.on("chat:new_message", (p) => {
      // If we know chat_id, require it to match; otherwise optimistically increment
      if (chatIdRef.current && p?.chat_id !== chatIdRef.current) return;
      setUnread((prev) => {
        const next = Math.min(99, Number(prev || 0) + 1);
        localStorage.setItem("farmerUnread", String(next));
        return next;
      });
    });
    return () => s.close();
  }, []);

  // keep in sync across tabs
  useEffect(() => {
    const onStorage = (ev) => {
      if (ev.key === "farmerUnread") {
        setUnread(Number(ev.newValue || 0));
      }
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

export default function Clinic() {
  const { unread, clear } = useFarmerUnread();

return (
  <div className="container grid clinic-page">
    {/* HERO */}
    <div className="card hero">
      <div className="hero-wrap">
        <h1 className="hero-title">AV Traders Agri Clinic</h1>
        <p className="hero-sub">
          Farmer-focused diagnosis, treatment plans, and soil &amp; nutrient
          guidance. Share field photos, get a precise spray schedule, and track
          your order till delivery.
        </p>

        <div className="cta-row">
          {/* Get Solutions with unread badge */}
          <Link className="btn hero-cta badge-btn" to="/farmers" onClick={clear}>
            Get Solutions
            {unread > 0 && (
              <span className="badge-pill">{unread > 99 ? "99+" : unread}</span>
            )}
          </Link>
          <Link className="btn ghost" to="/contact">Contact Us</Link>
        </div>
      </div>
    </div>

    {/* QUICK STATS / VALUE POINTS */}
    <div className="card stats">
      <div className="stats-grid">
        <div className="stat">
          <div className="num with-icon"><IconChat /> Real-time Chat</div>
          <div className="lbl">Ask experts with photo/video</div>
        </div>
        <div className="stat">
          <div className="num with-icon"><IconCard /> Secure Payments</div>
          <div className="lbl">Simple quotation → checkout</div>
        </div>
        <div className="stat">
          <div className="num with-icon"><IconTruck /> LR Tracking</div>
          <div className="lbl">Get LR number after dispatch</div>
        </div>
        <div className="stat">
          <div className="num with-icon"><IconShield /> Reliable Advice</div>
          <div className="lbl">Standardized spray schedules</div>
        </div>
      </div>
    </div>

    {/* SERVICES / EXPERTISE */}
    <div className="card expertise">
      {/* stays centered on desktop per your CSS; mobile text is justified below */}
      <div className="intro">
        <h2 className="mb-8">What we do</h2>
        <p>End-to-end agronomy support from field diagnosis to doorstep delivery.</p>
      </div>

      <div className="grid">
        <div className="box">
          <div className="title with-icon"><IconCamera /> Diagnosis with Photos</div>
          <div className="sub justify-sm">
            Upload field images, describe pest/disease, get instant triage.
          </div>
          <ul className="justify-sm">
            <li>WhatsApp-style chat UI</li>
            <li>Multiple images &amp; PDFs</li>
            <li>Language: English / Kannada</li>
          </ul>
          <div className="note justify-sm">Works great on mobile networks.</div>
        </div>

        <div className="box">
          <div className="title with-icon"><IconFlask /> Treatment &amp; Nutrition Plan</div>
          <div className="sub justify-sm">
            Clear <b>last spray / date / dosage</b> details in a fixed layout.
          </div>
          <ul className="justify-sm">
            <li>Crop-stage specific schedules</li>
            <li>Brand-agnostic recommendations</li>
            <li>Follow-up reminders</li>
          </ul>
          <div className="note justify-sm">Save plans as PDF from chat.</div>
        </div>

        <div className="box">
          <div className="title with-icon"><IconTruck /> Quotation, Payment &amp; LR</div>
          <div className="sub justify-sm">
            One-tap quote → secure payment → LR number after dispatch.
          </div>
          <ul className="justify-sm">
            <li>Multiple payment modes</li>
            <li>Invoice &amp; GST support</li>
            <li>Order tracking updates</li>
          </ul>
          <div className="note justify-sm">Pan-India logistics partners.</div>
        </div>
      </div>
    </div>

    {/* HOW IT WORKS */}
    <div className="card">
      <h2>How it works</h2>
      <ol className="justify-sm" style={{ lineHeight: 1.8, paddingLeft: 18 }}>
        <li>Tap <b>Get Solutions</b> and start a chat (share photos/videos of the field).</li>
        <li>Receive a <b>standardized treatment plan</b> with crop, dose, and interval.</li>
        <li>Confirm your <b>quotation</b>, make <b>secure payment</b>.</li>
        <li>We dispatch and share your <b>LR number</b> for tracking.</li>
      </ol>

      <div className="cta-row">
        <Link className="btn badge-btn" to="/farmers" onClick={clear}>
          Start chat
          {unread > 0 && (
            <span className="badge-pill">{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>
        <a
          className="btn secondary"
          href="https://wa.me/919886371630"
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp Us
        </a>
      </div>
    </div>

    {/* FINAL CTA */}
    <div className="card">
      <h3 className="mt-0">Ready to fix your crop issue?</h3>
      <p className="mb-8 justify-sm">
        Instant help, clear spray plan, and reliable delivery — all in one place.
      </p>
      <div className="cta-row">
        <Link className="btn badge-btn" to="/farmers" onClick={clear}>
          Get Solutions
          {unread > 0 && (
            <span className="badge-pill">{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>
        <Link className="btn ghost" to="/about">Know More</Link>
      </div>
    </div>
  </div>
);


}
