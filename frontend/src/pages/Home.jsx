// src/pages/Home.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../lib/api.js";
import { socket as sharedSocket } from "../lib/socket.js";
import { CONTACT_PHONE, CONTACT_EMAIL, WHATSAPP_CHANNEL_URL } from '../lib/config.js';

/* ---------- Preloading helper ---------- */
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

/* ---------- Infinite, responsive carousel (seamless) ---------- */
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
    return () => {
      on = false;
    };
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

  const onTouchStart = (e) => {
    pause();
    touch.current.x = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    resume();
  };
  const onMouseDown = (e) => {
    mouse.current = { down: true, x: e.clientX };
    pause();
  };
  const onMouseUp = (e) => {
    if (!mouse.current.down) return;
    const dx = e.clientX - mouse.current.x;
    mouse.current.down = false;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    resume();
  };
  const onMouseLeave = () => {
    mouse.current.down = false;
    resume();
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const onTransitionEnd = () => {
    if (!hasLoop) return;
    if (i === ext.length - 1) {
      setAnim(false);
      setI(1);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnim(true))
      );
    } else if (i === 0) {
      setAnim(false);
      setI(ext.length - 2);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnim(true))
      );
    }
  };

  const shouldEager = (idx) => {
    if (!hasLoop) return true;
    const lastIdx = ext.length - 1;
    return idx === 0 || idx === lastIdx || idx === i;
  };

  if (ext.length === 0) return null;

  return (
    <div className="card" style={{ gridColumn: "1 / -1", padding: 0 }}>
      <div
        className="carousel"
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
        <div className="carousel-aspect" style={{ paddingTop: ratio }} />
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${i * 100}%)`,
            transition: anim ? "transform 450ms ease" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {ext.map((src, idx) => (
            <div className="carousel-slide" key={`${idx}-${src}`}>
              <img
                className="carousel-img"
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
            <button
              className="carousel-arrow left"
              onClick={prev}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              className="carousel-arrow right"
              onClick={next}
              aria-label="Next slide"
            >
              ›
            </button>
            <div className="carousel-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${i === idx + 1 ? "active" : ""}`}
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

/* ---------- WhatsApp Channel Popup (1-week snooze) ---------- */
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
    localStorage.setItem(
      "waPopupDismissedUntil",
      String(Date.now() + sevenDays)
    );
    setOpen(false);
  };

  if (!open) return null;

  const styles = {
    shell: {
      position: "fixed",
      right: 16,
      bottom: 16,
      zIndex: 60,
      maxWidth: 420,
      width: "calc(100% - 32px)",
      boxShadow: "0 12px 24px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)",
      borderRadius: 14,
      background: "#fff",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 12px 8px",
    },
    img: {
      width: 48,
      height: 48,
      borderRadius: 8,
      objectFit: "cover",
    },
    title: { fontWeight: 700, fontSize: 16, lineHeight: 1.2 },
    subtitle: { color: "#64748b", fontSize: 13 },
    desc: {
      padding: "0 12px 8px 12px",
      color: "#334155",
      fontSize: 14,
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px 12px",
      gap: 10,
      flexWrap: "wrap",
    },
    btn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #10b981",
      color: "#064e3b",
      background: "linear-gradient(180deg,#d1fae5 0%,#a7f3d0 100%)",
      fontWeight: 700,
      fontSize: 14,
      textDecoration: "none",
    },
    close: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
      lineHeight: "30px",
      textAlign: "center",
      fontSize: 18,
      color: "#6b7280",
    },
    note: {
      borderTop: "1px dashed #e5e7eb",
      background: "#f9fafb",
      padding: "10px 12px",
      fontSize: 12,
      color: "#64748b",
    },
  };

  return (
    <aside
      role="dialog"
      aria-label="Join our WhatsApp Channel"
      style={styles.shell}
    >
      <button
        aria-label="Close"
        onClick={closeForAWeek}
        style={styles.close}
      >
        ×
      </button>
      <div style={styles.header}>
        <img
          src="/profile/R10.jpg"
          alt="Dr A Venugopal"
          style={styles.img}
        />
        <div>
          <div style={styles.title}>
            Dr A Venugopal | WhatsApp Channel
          </div>
          <div style={styles.subtitle}>
            Plant doctor 🌿 · 1.5K+ followers
          </div>
        </div>
      </div>
      <p style={styles.desc}>
        📢 Join our WhatsApp Channel — shop timings, holiday alerts &amp;
        farming tips in one place.
      </p>
      <div style={styles.row}>
        <a
          href={WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
          style={styles.btn}
        >
          👉 Join Now
        </a>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          whatsapp.com · official
        </span>
      </div>
      <div style={styles.note}>Tip: closing hides it for a week.</div>
    </aside>
  );
}

/* ---------- HOME ---------- */
export default function Home() {
  const images = [
    "/banners/R4.png",
    "/banners/R1.jpg",
    "/banners/R2.png",
    "/banners/R3.jpg",
    "/banners/R5.png",
    "/banners/R6.jpg",
    "/banners/R7.png",
    "/banners/R8.png",
    "/banners/R9.png",
  ];

  /* -------- Announcements state -------- */
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState("");

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnLoading(true);
      setAnnError("");
      const res = await api.get("/api/announcements", {
        withCredentials: true,
      });

      const list =
        Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.items)
          ? res.data.items
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

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  /* -------- Chat notification badge (homepage) -------- */
  const [chatCount, setChatCount] = useState(0);

  // Read count from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("farmerNotifCount");
      const n = raw ? parseInt(raw, 10) || 0 : 0;
      setChatCount(n);
    } catch {}
  }, []);

  // React to changes from other tabs / Farmers.jsx via storage event
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

// Live chat notification badge (when admin sends a new message)
useEffect(() => {
  const s = sharedSocket;
  if (!s) return;

  const onNew = (payload = {}) => {
    // If user is already inside chat, do nothing
    if (window.location.pathname.includes("/farmers")) return;

    const role = payload.sender_role?.toLowerCase?.() || "";

    // Count ONLY admin/support messages
    const isFromAdmin =
      role === "admin" ||
      role === "support" ||
      role === "staff" ||
      role === "team" ||
      role === "" ||          // backend sometimes sends empty role
      role === undefined;

    if (!isFromAdmin) return;

    try {
      const raw = localStorage.getItem("farmerNotifCount") || "0";
      const prev = parseInt(raw, 10) || 0;

      const next = Math.min(999, prev + 1);
      localStorage.setItem("farmerNotifCount", String(next));
      setChatCount(next);
    } catch (e) {
      console.error("notifCount update failed", e);
    }
  };

  s.on("chat:new_message", onNew);
  return () => s.off("chat:new_message", onNew);
}, []);

  const openChat = () => {
    try {
      localStorage.setItem("farmerNotifCount", "0");
    } catch {}
    setChatCount(0);
    window.location.href = "/farmers";
  };

  /* -------- Build latest announcement ticker content -------- */
  const hasTicker =
    !annLoading && !annError && announcements && announcements.length > 0;

  let tickerNode = null;
  if (hasTicker) {
    const a = announcements[0]; // only the latest one

    const rawBody = (a.body || a.text || "").trim();
    const rawTitle = (a.title || "").trim();

    let fullText = rawBody || rawTitle || "";
    if (rawTitle && rawBody && !rawBody.startsWith(rawTitle)) {
      fullText = `${rawTitle} — ${rawBody}`;
    }
    if (!fullText) {
      fullText = "New announcement from AV Traders Agri Clinic.";
    }

    const fieldUrl =
      a.link_url || a.link || a.url || a.youtube_url || "";

    const urlRegex = /(https?:\/\/[^\s]+)/i;
    let detectedUrl = fieldUrl || "";
    if (!detectedUrl) {
      const m = fullText.match(urlRegex);
      if (m) detectedUrl = m[0];
    }

    if (detectedUrl) {
      // If URL is inside the text, split so only that part is underlined
      if (!fieldUrl && fullText.includes(detectedUrl)) {
        const parts = fullText.split(detectedUrl);
        tickerNode = (
          <>
            {parts[0]}
            <a
              href={detectedUrl}
              target="_blank"
              rel="noreferrer"
            >
              {detectedUrl}
            </a>
            {parts.slice(1).join(detectedUrl)}
          </>
        );
      } else {
        // Whole ticker clickable
        tickerNode = (
          <a
            href={detectedUrl}
            target="_blank"
            rel="noreferrer"
          >
            {fullText}
          </a>
        );
      }
    } else {
      tickerNode = <>{fullText}</>;
    }
  }

  return (
    <div className="home-root">
      {/* WhatsApp Channel Popup */}
      <WhatsAppChannelPopup />

      {/* 🔔 Thin top announcement bar (no box) */}
      <div
        id="announcements"
        className="announce-bar"
      >
        <div className="announce-label">
          📢 Announcements
        </div>

        {annLoading && (
          <div className="announce-status">
            Loading latest updates…
          </div>
        )}

        {!annLoading && annError && (
          <div className="announce-status">
            {annError}
          </div>
        )}

        {!annLoading && !annError && hasTicker && (
          <div className="ticker-shell">
            <div className="ticker-track">
              <div className="ticker-item">{tickerNode}</div>
              <div className="ticker-item">{tickerNode}</div>
            </div>
          </div>
        )}

        {!annLoading && !annError && !hasTicker && (
          <div className="announce-status">
            No announcements yet. Please check back soon.
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="container grid grid-3">
        {/* Carousel – comes immediately after announcement bar */}
        <ImageCarousel
          images={images}
          interval={5000}
          ratio="40%"
          fit="cover"
        />

        {/* Welcome */}
        <div className="card soft" style={{ gridColumn: "1 / -1" }}>
          <h2 className="mt-0" style={{ marginBottom: 8 }}>
            Welcome to AV Traders Agri Clinic
          </h2>
          <p
            className="justify"
            style={{ marginTop: 0, color: "#334155" }}
          >
            <b>
              {" "}
              The fastest growing agro-input supply company, trusted by
              farmers across Karnataka and beyond.
            </b>
            In a short span of time, we have built the largest farmer base
            with <b>6000+ satisfied customers</b> who rely on us for
            quality products and guidance.
          </p>
          <p className="justify" style={{ color: "#334155" }}>
            We believe agriculture is not just about extracting from the
            soil, but about giving back to preserve its health forever.
            That’s why we promote eco-friendly farming practices that
            protect the land, sustain productivity, and secure the future
            of farming.
          </p>
          <p
            className="justify"
            style={{
              marginBottom: 0,
              color: "#0f766e",
              fontWeight: 600,
            }}
          >
            Our mission is clear – to promote healthy agricultural
            practices and inspire people to return to agriculture with
            pride and prosperity. Together, let’s cultivate a greener,
            healthier tomorrow.
          </p>
        </div>

        {/* Hero + Stats */}
        <div
          className="card hero"
          style={{ gridColumn: "1 / -1", padding: 0 }}
        >
          <div className="hero-wrap">
            <h1 className="hero-title">
              Healthy Plants, Prosperous Farmers
            </h1>
            <p className="hero-sub">
              Your trusted Agri Clinic for comprehensive plant health
              solutions, expert consultancy, and sustainable farming
              success.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <a className="btn hero-cta" href="/farmers">
                Explore Solutions →
              </a>
             
            </div>
          </div>

          <div
            className="card stats"
            style={{ boxShadow: "none", border: 0 }}
          >
            <div className="stats-grid">
              {[
                { num: "30+", label: "Years Experience" },
                { num: "6000+", label: "Farmers Helped (and counting)" },
                { num: "200+", label: "Training Sessions" },
                { num: "90%", label: "Success Rate" },
              ].map((s, idx) => (
                <div className="stat" key={idx}>
                  <div className="num">{s.num}</div>
                  <div className="lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Expertise */}
        <div
          className="card expertise soft"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="intro">
            <h2 className="mt-0">Our Expertise</h2>
            <p className="justify">
              Comprehensive agricultural solutions tailored to modern
              farming challenges. We combine scientific knowledge,
              practical experience, and farmer-centric care to deliver
              sustainable results.
            </p>
          </div>

          <div className="grid">
            <div className="box">
              <div className="title">🌿 Plant Health Management</div>
              <div className="sub">Healthy crops, better yields.</div>
              <ul>
                <li>Advanced disease diagnosis &amp; solutions</li>
                <li>Integrated pest management strategies</li>
                <li>Nutrient deficiency detection &amp; correction</li>
                <li>Customized treatment recommendations</li>
              </ul>
              <div className="note">
                👉 Reduce unnecessary chemical usage while protecting
                crops.
              </div>
            </div>

            <div className="box">
              <div className="title">🌍 Soil &amp; Fertility Solutions</div>
              <div className="sub">
                Soil is the foundation of farming—we help you keep it
                strong.
              </div>
              <ul>
                <li>Comprehensive soil testing &amp; analysis</li>
                <li>Fertility enhancement programs</li>
                <li>Sustainable soil &amp; water management</li>
                <li>
                  Micronutrient optimization for productivity
                </li>
              </ul>
              <div className="note">
                👉 Improve soil health today for better harvests
                tomorrow.
              </div>
            </div>

            <div className="box">
              <div className="title">👨‍🌾 Agricultural Consultancy</div>
              <div className="sub">
                Guidance you can trust, from seed to market.
              </div>
              <ul>
                <li>Crop planning &amp; scientific crop rotation</li>
                <li>Smart technology integration for farming</li>
                <li>Market strategy &amp; price guidance</li>
                <li>Wholesale input supply with genuine products</li>
              </ul>
              <div className="note">
                👉 We stand with farmers at every step—production,
                protection, and profit.
              </div>
            </div>
          </div>
        </div>

        {/* Founder */}
        <div
          className="card founder soft"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="wrap">
            <div>
              <h2 className="mt-0">Meet Our Founder</h2>
              <div
                style={{
                  fontStyle: "italic",
                  color: "#0f766e",
                  marginBottom: 8,
                }}
              >
                "When plants grow healthy, farmers grow wealthy."
              </div>
              <p>
                <b>
                  Dr. A. Venugopal, Founder &amp; Chief Plant Doctor
                </b>
              </p>
              <p
                className="justify"
                style={{ color: "#475569" }}
              >
                With over <b>30 years</b> of experience in
                agricultural sciences, Dr. Venugopal has transformed
                the lives of thousands of farmers through innovative
                training programs, diagnostic techniques, and
                sustainable consultations—bridging traditional wisdom
                and modern agri-tech.
              </p>
            </div>
            <div className="photo">
              <img
                src="/profile/R4.png"
                alt="Dr. A. Venugopal"
              />
              <div className="name">Dr. A. Venugopal</div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div
          className="card testimonials soft"
          style={{ gridColumn: "1 / -1" }}
        >
          <h2 className="mt-0" style={{ textAlign: "center" }}>
            Success Stories
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginTop: -6,
              marginBottom: 18,
            }}
          >
            Real farmers, real results — transforming agriculture across
            Karnataka.
          </p>
          <div className="grid">
            {[
              {
                quote:
                  "I have been following Dr. Venugopal Sir for the past 3 years. Since then, all my crops have been successful and profitable. I’m from Malavalli, Mandya, and though I’ve never visited their shop, I’ve been receiving genuine products regularly through VRL. The trust and results speak for themselves.",
                author: "Mohan Kumar – Malavalli, Mandya",
              },
              {
                quote:
                  "Earlier I used to buy chemicals from local shops without knowing if they were genuine. The strong smell and harmful nature of those products even started affecting my health – I would get headaches after every use. After switching to genuine products from AV Traders under Dr. Venugopal’s guidance, my crops became healthier, yields improved, and even my own health recovered.",
                author: "Manjunath — Hoskote",
              },
              {
                quote:
                  "I was struggling with soil that had lost fertility due to excessive chemical use. After consulting Dr. Venugopal Sir and following eco-friendly practices suggested by AV Traders, I not only revived my soil but also saw a bumper yield in paddy and vegetables. Today, I save on costs, earn better profits, and most importantly – I am farming with confidence again.",
                author: "Ramesh Gowda – Hassan",
              },
            ].map((t, idx) => (
              <div className="t" key={idx}>
                <div className="quote-mark">“</div>
                <p
                  className="justify"
                  style={{ marginTop: 4, color: "#334155" }}
                >
                  {t.quote}
                </p>
                <div className="author">{t.author}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Content */}
        <div
          className="card education soft"
          style={{ gridColumn: "1 / -1" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 28 }}>📚</span>
            <h2 className="mt-0">Educational Content</h2>
          </div>

          <div className="intro">
            <p className="justify">
              Learn from our expert-led agricultural training sessions
              and field demonstrations. At{" "}
              <b>AV Traders Agri Clinic</b>, we believe knowledge is the
              most powerful tool for farmers. Through videos and demos,
              we share practical guidance you can adopt in your fields.
            </p>
            <div
              style={{
                fontWeight: 700,
                margin: "8px 0 6px",
              }}
            >
              🎥 What You’ll Find
            </div>
            <ul>
              <li>
                Step-by-step crop management videos{" "}
                <span style={{ color: "#0f766e" }}>
                  (in local language)
                </span>
              </li>
              <li>
                Soil health tips — maintain fertility &amp; long-term
                productivity
              </li>
              <li>
                Water management techniques — save water, improve yield
              </li>
              <li>
                Crop rotation planning — increase soil life &amp; reduce
                pests
              </li>
              <li>
                Market insights — strategies for better pricing &amp;
                profit
              </li>
              <li>
                Farmer Success Stories — higher yields with less cost
                &amp; chemicals
              </li>
            </ul>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginTop: 6,
              }}
            >
              <span>👉 Subscribe to our YouTube Channel:</span>
              <a
                className="btn"
                href="https://youtube.com/@dravenugopal"
                target="_blank"
                rel="noreferrer"
              >
                Dr. A. Venugopal on YouTube
              </a>
            </div>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "2fr 1fr" }}
          >
            <div className="video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/nn6O27lkbrQ?si=SSVfdZJ9l8JqkDmH"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            <div className="topics">
              {[
                {
                  icon: "🧪",
                  title: "Soil Health Assessment",
                  sub: "Balanced nutrition & lab-grade testing",
                },
                {
                  icon: "💧",
                  title: "Water Management Systems",
                  sub: "Irrigation planning & saving water smartly",
                },
                {
                  icon: "🔁",
                  title: "Crop Rotation Planning",
                  sub: "Scientific rotations to protect soil life",
                },
                {
                  icon: "📈",
                  title: "Market Pricing Strategies",
                  sub: "Sell better with data-driven guidance",
                },
              ].map((k, i) => (
                <div className="topic" key={i}>
                  <div className="ico">{k.icon}</div>
                  <div className="txt">
                    <div className="ttl">{k.title}</div>
                    <div className="sub">{k.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className="card site-footer"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="grid">
            <div>
              <div
                style={{ fontWeight: 800, marginBottom: 8 }}
              >
                AV Traders Agri Clinic
              </div>
              <div>Healthy Plants, Prosperous Farmers.</div>
            </div>
            <div>
              <div
                style={{ fontWeight: 700, marginBottom: 6 }}
              >
                Contact
              </div>
              <div>📞 {CONTACT_PHONE.replace('+91', '+91 ')}</div>
              <div>✉️ {CONTACT_EMAIL}</div>
            </div>
            <div>
              <div
                style={{ fontWeight: 700, marginBottom: 6 }}
              >
                Address
              </div>
              <div>
                AV Traders Agri Clinic, Kurubarahally, Tumkur road,
                Doddaballapura, Bengaluru Rural, Karnataka, 561203
              </div>
            </div>
            <div>
              <div
                style={{ fontWeight: 700, marginBottom: 6 }}
              >
                Policies
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                <li>
                  <a href="/terms-and-conditions">
                    📜 Terms &amp; Conditions
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy">🔒 Privacy Policy</a>
                </li>
                <li>
                  <a href="/refund-policy">↩ Refund Policy</a>
                </li>
                <li>
                  <a href="/return-policy">📦 Return Policy</a>
                </li>
                <li>
                  <a href="/shipping-policy">🚚 Shipping Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="copy">
            © {new Date().getFullYear()} AV Traders Agri Clinic. All
            rights reserved.
          </div>
        </footer>

        {/* Floating Chat button with red badge – raised slightly higher */}
        <button
          type="button"
          className="chat-fab"
          onClick={openChat}
          aria-label="Open Farmer Chat"
        >
          <span className="chat-fab-icon">💬</span>
          {chatCount > 0 && (
            <span className="chat-fab-badge">
              {chatCount > 99 ? "99+" : chatCount}
            </span>
          )}
        </button>

        {/* Local styles for announcements + fab */}
        <style>{`
/* 🔔 Top announcement bar (no card / box) */
.home-root {
  background: #f3f4f6;
  min-height: 100vh;
}

.announce-bar{
  width:100%;
  display:flex;
  align-items:center;
  gap:10px;
  padding:6px 14px;
  box-sizing:border-box;
  background:linear-gradient(90deg,#b91c1c,#ef4444);
  color:#fee2e2;
  font-size:13px;
  line-height:1.3;
  position:relative;
  z-index:30;
  white-space:nowrap;
  overflow:hidden;
}

.announce-label{
  font-weight:700;
  font-size:13px;
  flex-shrink:0;
  padding-right:8px;
  border-right:1px solid rgba(254,226,226,0.5);
}

.announce-status{
  font-size:12px;
  color:#fee2e2;
  opacity:0.9;
  padding-left:8px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

/* Scrolling ticker */
.ticker-shell{
  flex:1;
  overflow:hidden;
  position:relative;
  min-height:18px;
}

.ticker-track{
  display:flex;
  width:max-content;
  animation:av-ticker 20s linear infinite;
}

.ticker-item{
  padding-right:3rem;
  white-space:nowrap;
  font-size:13px;
  color:#fee2e2;
}

/* Links inside ticker */
.announce-bar a{
  color:#fef2f2;
  text-decoration:underline;
}

.announce-bar a:hover{
  text-decoration:none;
}

@keyframes av-ticker{
  0%{
    transform:translateX(0);
  }
  100%{
    transform:translateX(-50%);
  }
}

/* (Old list styles kept in case you reuse later) */
.announcement-list{
  list-style:none;
  padding:0;
  margin:8px 0 0;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.announcement-item{
  display:flex;
  gap:10px;
  padding:10px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
}
@media(max-width:640px){
  .announcement-item{
    flex-direction:column;
  }
}
.ann-main{
  flex:1;
  min-width:0;
}
.ann-top-row{
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:4px;
}
.ann-chip{
  font-size:11px;
  font-weight:600;
  padding:2px 8px;
  border-radius:999px;
  background:#ecfdf5;
  color:#166534;
  border:1px solid #bbf7d0;
}
.ann-date{
  font-size:11px;
  color:#6b7280;
}
.ann-title{
  font-weight:600;
  font-size:14px;
  margin-bottom:2px;
  color:#0f172a;
}
.ann-body{
  font-size:13px;
  color:#4b5563;
  margin:0;
}
.ann-link{
  display:inline-flex;
  align-items:center;
  margin-top:4px;
  font-size:13px;
  color:#0f766e;
  text-decoration:none;
}
.ann-link:hover{
  text-decoration:underline;
}
.ann-thumb-wrap{
  flex-shrink:0;
}
.ann-thumb{
  width:96px;
  height:96px;
  object-fit:cover;
  border-radius:10px;
  border:1px solid #e5e7eb;
}

/* Floating chat button – raised slightly higher for mobile & laptop */
.chat-fab{
  position:fixed;
  right:18px;
  bottom:120px;
  z-index:70;
  width:56px;
  height:56px;
  border-radius:999px;
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg,#16a34a,#22c55e);
  color:#f9fafb;
  box-shadow:0 14px 30px rgba(22,163,74,.55);
  cursor:pointer;
}
.chat-fab-icon{
  font-size:22px;
}
.chat-fab-badge{
  position:absolute;
  top:-4px;
  right:-4px;
  min-width:20px;
  height:20px;
  padding:0 5px;
  border-radius:999px;
  background:#ef4444;
  color:#fff;
  font-size:11px;
  line-height:20px;
  text-align:center;
  box-shadow:0 0 0 2px #f9fafb;
}

@media(max-width:640px){
  .announce-bar{
    font-size:12px;
    padding:5px 10px;
  }
  .announce-label{
    font-size:12px;
  }
  .chat-fab{
    width:52px;
    height:52px;
    bottom:112px;
    right:14px;
  }
}
        `}</style>
      </div>
    </div>
  );
}
