import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function LanguageSwitch() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("site_lang") || "en"; } catch { return "en"; }
  });
  const [booted, setBooted] = useState(false);
  const selectRef = useRef(null);
  const btnRef = useRef(null);
  const { pathname } = useLocation();

  /* ---- prevent duplicate button/host if component mounts twice ---- */
  useEffect(() => {
    // remove duplicate toggle buttons (keep first)
    const btns = document.querySelectorAll("#lang-toggle-btn");
    btns.forEach((n, i) => { if (i > 0) n.remove(); });
    // remove duplicate hidden host containers (keep first)
    const hosts = document.querySelectorAll("#google_translate_container");
    hosts.forEach((n, i) => { if (i > 0) n.remove(); });
  }, []);

  /* ---------------- utils ---------------- */
  const setBtnLabel = (code) => {
    if (!btnRef.current) return;
    // EN page -> show Kannada pill; KN page -> show English pill
    btnRef.current.textContent = code === "en" ? "ಕನ್ನಡ" : "English";
  };

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

      // undo any scroll/top shift
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
    setBtnLabel(target === "kn" ? "kn" : "en");
    hideBanner();
  };

  /* --------------- persist across routes --------------- */
  useEffect(() => {
    setBtnLabel(lang);
    if (lang === "kn") apply("kn", { silent: true });
    hideBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <div id="google_translate_container" style={{ display: "none" }} />
      <button
        id="lang-toggle-btn"
        ref={btnRef}
        className="btn secondary notranslate"
        translate="no"
        data-gt-ignore="true"
        onClick={() => apply(lang === "en" ? "kn" : "en")}
        title="Translate this page"
      >
        {lang === "en" ? "ಕನ್ನಡ" : "English"}
      </button>
    </>
  );
}
