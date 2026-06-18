import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Language switcher.
 *
 * The visible UI is a custom dropdown with the native script name for
 * each language (English / ಕನ್ನಡ). Behind the scenes we still load
 * the Google Translate widget so the actual body text is translated
 * without us having to maintain hand-written i18n for every string.
 */
const LANGUAGES = [
  { code: "en", label: "English",  native: "English" },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ" },
];

export default function LanguageSwitch() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("site_lang") || "en"; } catch { return "en"; }
  });
  const [booted, setBooted] = useState(false);
  const [open, setOpen]   = useState(false);
  const selectRef = useRef(null);
  const wrapRef   = useRef(null);
  const { pathname } = useLocation();

  /* ---- prevent duplicate button/host if component mounts twice ---- */
  useEffect(() => {
    const btns = document.querySelectorAll("#lang-toggle-btn");
    btns.forEach((n, i) => { if (i > 0) n.remove(); });
    const hosts = document.querySelectorAll("#google_translate_container");
    hosts.forEach((n, i) => { if (i > 0) n.remove(); });
  }, []);

  /* ---------------- utils ---------------- */
  const hideBanner = () => {
    try {
      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.style.display = "none";
      const skip = document.querySelector("body > .skiptranslate");
      if (skip) skip.style.display = "none";
      const tt = document.getElementById("goog-gt-tt");
      if (tt) tt.style.display = "none";
      document
        .querySelectorAll(".VIpgJd-ZVi9od-ORHb-OEVmcd,.goog-tooltip,.goog-te-balloon-frame")
        .forEach(n => (n.style.display = "none"));

      document.documentElement.style.top = "0";
      document.body.style.top = "0";
      document.documentElement.style.position = "static";
      document.body.style.position = "static";
      document.body.style.transform = "none";
    } catch {}
  };

  const ensureHostDiv = () => {
    let host = document.getElementById("google_translate_container");
    if (!host) {
      host = document.createElement("div");
      host.id = "google_translate_container";
      host.style.display = "none";
      document.body.appendChild(host);
    }
  };

  const initTranslate = () => {
    ensureHostDiv();
    if (window.google?.translate?.TranslateElement) {
      /* global google */
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,kn", autoDisplay: false },
        "google_translate_container"
      );
      hideBanner();
      setTimeout(hideBanner, 50);
      setTimeout(hideBanner, 300);
      return true;
    }
    return false;
  };

  /* --------------- boot script --------------- */
  useEffect(() => {
    if (window.__gtLoaded) {
      setBooted(true);
      initTranslate();
    } else {
      window.__gtLoaded = true;
      window.__googleTranslateInit = () => {
        initTranslate();
        setBooted(true);
        hideBanner();
      };
      const s = document.createElement("script");
      s.src = "https://translate.google.com/translate_a/element.js?cb=__googleTranslateInit";
      s.async = true;
      s.onerror = () => setBooted(true);
      s.onload = () => { hideBanner(); setTimeout(hideBanner, 50); setTimeout(hideBanner, 300); };
      document.body.appendChild(s);
    }

    const obs = new MutationObserver(hideBanner);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", hideBanner);
    window.addEventListener("scroll", hideBanner);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", hideBanner);
      window.removeEventListener("scroll", hideBanner);
    };
  }, []);

  /* --------------- find hidden combo --------------- */
  useEffect(() => {
    if (!booted) return;
    let tries = 0;
    const t = setInterval(() => {
      const combo = selectRef.current || document.querySelector("select.goog-te-combo");
      if (combo) {
        selectRef.current = combo;
        clearInterval(t);
        hideBanner();
        // restore persisted lang once combo exists
        if (lang === "kn") apply("kn", { silent: true });
      } else if (++tries > 40) {
        clearInterval(t); // ~8s
      }
    }, 200);
    return () => clearInterval(t);
  }, [booted]); // eslint-disable-line

  /* --------------- apply language --------------- */
  const apply = (target, opts = {}) => {
    if (!window.google?.translate?.TranslateElement) initTranslate();
    const combo = selectRef.current || document.querySelector("select.goog-te-combo");
    if (!combo) { setTimeout(() => apply(target, opts), 300); return; }

    if (combo.value !== target) {
      combo.value = target;
      combo.dispatchEvent(new Event("change"));
    }

    if (!opts.silent) {
      setLang(target);
      try { localStorage.setItem("site_lang", target); } catch {}
    }
    document.documentElement.classList.toggle("kn", target === "kn");
    document.documentElement.setAttribute("lang", target);
    document.documentElement.setAttribute("dir",  "ltr");
    hideBanner();
  };

  const handleSelect = (code) => {
    setOpen(false);
    apply(code);
  };

  /* --------------- close on outside click --------------- */
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  /* --------------- close on route change --------------- */
  useEffect(() => {
    setOpen(false);
    if (lang === "kn") apply("kn", { silent: true });
    hideBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={wrapRef} className="lang-dropdown notranslate" translate="no">
      <div id="google_translate_container" style={{ display: "none" }} />
      <button
        id="lang-toggle-btn"
        type="button"
        className="btn secondary"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Translate this page"
      >
        <span aria-hidden="true" style={{ marginRight: 6 }}>🌐</span>
        <span>{current.native}</span>
        <span aria-hidden="true" style={{ marginLeft: 6, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Select language" className="lang-dropdown-menu">
          {LANGUAGES.map((l) => (
            <li
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              tabIndex={0}
              className={`lang-option ${l.code === lang ? "is-active" : ""}`}
              onClick={() => handleSelect(l.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(l.code);
                }
              }}
            >
              <span className="lang-native">{l.native}</span>
              <span className="lang-english">{l.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
