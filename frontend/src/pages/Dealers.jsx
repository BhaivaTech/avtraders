import React, { useEffect, useMemo, useRef, useState } from "react";
import { CONTACT_EMAIL } from '../lib/config.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const LOGIN_MODE = import.meta.env.VITE_DEALER_LOGIN_MODE || "simple";
const OTP_RESEND_SECONDS = 30;

function normalizePhone(phone) {
  const p = (phone || "").replace(/\D/g, "");
  if (p.length === 10) return p;
  if (p.length === 12 && p.startsWith("91")) return p.slice(2);
  if (p.length > 10) return p.slice(-10);
  return p;
}

function gstLooksValid(gst) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    (gst || "").toUpperCase()
  );
}

function fileLooksValid(file) {
  if (!file) return false;
  const okTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxBytes = 8 * 1024 * 1024;
  return okTypes.includes(file.type) && file.size <= maxBytes;
}

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSuccess = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function Dealers() {
  const [step, setStep] = useState("intro");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [token, setToken] = useState("");
  const [dealer, setDealer] = useState(null);

  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [form, setForm] = useState({
    dealer_name: "",
    firm_name: "",
    email: "",
    gst: "",
    village_post: "",
    taluk: "",
    district: "",
    pincode: "",
    confirm_true: false,
  });

  const [gstFile, setGstFile] = useState(null);
  const [licFile, setLicFile] = useState(null);

  const mailtoHref = useMemo(() => {
    const to = CONTACT_EMAIL;
    const subject = "Dealer Portal — Enquiry";
    const body = [
      "Hello AV Traders / AV Agro Distribution,",
      "",
      "I am interested in the Dealer Portal.",
      "",
      "Dealer Name:",
      "Firm Name:",
      "Mobile:",
      "GST No:",
      "Place:",
      "",
      "Message:",
    ].join("\n");

    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function clearAlerts() {
    setMsg("");
    setErr("");
  }

  function startCooldown(seconds = OTP_RESEND_SECONDS) {
    if (cooldownRef.current) clearInterval(cooldownRef.current);

    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = options.headers || {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : "Request failed");

      const extra =
        data && typeof data === "object" ? `\n\n${JSON.stringify(data, null, 2)}` : "";

      throw new Error(message + extra);
    }

    return data;
  }

  async function handleSimpleLogin(e) {
    e.preventDefault();
    clearAlerts();

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const out = await api("/api/dealer/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });

      if (out?.token) setToken(out.token);
      if (out?.dealer) setDealer(out.dealer);

      if (out?.next === "dashboard") {
        setStep("dashboard");
        setMsg("Login successful.");
      } else if (out?.next === "pending") {
        setStep("pending");
      } else if (out?.next === "rejected") {
        setStep("register");
        setErr(out?.message || "Your request was rejected. Please re-submit correct details.");
      } else {
        setStep("register");
        setMsg("Mobile verified. Please complete dealer registration.");
      }
    } catch (ex) {
      setErr(ex.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    clearAlerts();

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const out = await api("/api/dealer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });

      if (out?.dev_otp) {
        setMsg(`DEV OTP: ${out.dev_otp}`);
      } else {
        setMsg("OTP sent on WhatsApp. Please check your WhatsApp messages.");
      }

      setStep("verifyOtp");
      startCooldown();
    } catch (ex) {
      setErr(ex.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    clearAlerts();

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!otp || otp.length < 4) {
      setErr("Enter the OTP you received.");
      return;
    }

    try {
      setLoading(true);

      const out = await api("/api/dealer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, otp }),
      });

      if (out?.token) setToken(out.token);
      if (out?.dealer) setDealer(out.dealer);

      if (out?.next === "dashboard") {
        setStep("dashboard");
        setMsg("Login successful.");
      } else if (out?.next === "pending") {
        setStep("pending");
      } else if (out?.next === "rejected") {
        setStep("register");
        setErr(out?.message || "Your request was rejected. Please re-submit correct details.");
      } else {
        setStep("register");
        setMsg("OTP verified. Please complete dealer registration.");
      }
    } catch (ex) {
      setErr(ex.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    clearAlerts();

    if (cooldown > 0) return;

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const out = await api("/api/dealer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });

      if (out?.dev_otp) {
        setMsg(`DEV OTP: ${out.dev_otp}`);
      } else {
        setMsg("OTP re-sent on WhatsApp.");
      }

      startCooldown();
    } catch (ex) {
      setErr(ex.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearAlerts();

    const p = normalizePhone(phone);

    if (p.length !== 10) return setErr("Invalid mobile number.");
    if (!form.dealer_name.trim()) return setErr("Dealer name is required.");
    if (!form.firm_name.trim()) return setErr("Firm / Company name is required.");
    if (!gstLooksValid(form.gst)) return setErr("Enter a valid GST number.");
    if (!form.village_post.trim()) return setErr("Village / Post is required.");
    if (!form.taluk.trim()) return setErr("Taluk is required.");
    if (!form.district.trim()) return setErr("District is required.");
    if (!/^\d{6}$/.test(form.pincode)) return setErr("Enter a valid 6-digit Pin Code.");
    if (!gstFile) return setErr("GST Certificate upload is required.");
    if (!licFile) return setErr("Insecticide licence upload is required.");
    if (!fileLooksValid(gstFile)) return setErr("GST file must be PDF/JPG/PNG and less than 8MB.");
    if (!fileLooksValid(licFile)) return setErr("Licence file must be PDF/JPG/PNG and less than 8MB.");
    if (!form.confirm_true) return setErr("Please confirm that the information is true.");
    if (!token) return setErr("Session expired. Please login again.");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("dealer_name", form.dealer_name.trim());
      fd.append("firm_name", form.firm_name.trim());
      fd.append("phone", p);
      fd.append("email", form.email.trim());
      fd.append("gst", form.gst.toUpperCase().trim());
      fd.append("village_post", form.village_post.trim());
      fd.append("taluk", form.taluk.trim());
      fd.append("district", form.district.trim());
      fd.append("pincode", form.pincode.trim());
      fd.append("confirm_true", String(form.confirm_true));
      fd.append("gst_certificate", gstFile);
      fd.append("insecticide_licence", licFile);

      const out = await api("/api/dealer/register", {
        method: "POST",
        body: fd,
      });

      setMsg(out?.message || "Request received. Wait till admin verifies and approves.");
      setStep("pending");
    } catch (ex) {
      setErr(ex.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPriceInfo() {
    clearAlerts();

    try {
      setLoading(true);
      const out = await api("/api/dealer/pricelist", { method: "GET" });
      setMsg("Price list is ready.");
      return out;
    } catch (ex) {
      setErr(ex.message || "Unable to fetch price list.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPriceList() {
    const out = await fetchPriceInfo();

    if (!out?.download_url) return;

    window.open(`${API_BASE}${out.download_url}`, "_blank", "noopener,noreferrer");
  }

  function resetToIntro() {
    setStep("intro");
    setOtp("");
    setToken("");
    setDealer(null);
    setMsg("");
    setErr("");
  }

  const isSimpleMode = LOGIN_MODE === "simple";

  return (
    <div className="cl-root">

      {/* ── HERO ── */}
      <section className="cl-hero" style={{ paddingBottom: "3rem" }}>
        <div className="cl-hero-left">
          <div className="cl-hero-eyebrow">
            <span className="cl-hero-pulse" aria-hidden="true" />
            AV Agro Distribution
          </div>

          <h1 className="cl-hero-title">
            Dealer <em>Portal</em>
          </h1>

          <p className="cl-hero-sub">
            Secure dealer onboarding, document verification and protected access to the latest
            wholesale price list after admin approval.
          </p>

          <div className="cl-hero-proof">
            <div className="cl-hero-proof-tag">Secure Access</div>
            <div className="cl-hero-proof-divider" aria-hidden="true" />
            <div className="cl-hero-proof-text">JWT-secured &amp; Document-verified</div>
          </div>
        </div>
      </section>

      {/* ── ALERTS ── */}
      {(msg || err) && (
        <div className={`cl-alert ${err ? "cl-alert-error" : "cl-alert-success"}`}>
          <div className="cl-alert-icon">
            {err ? <IconAlert /> : <IconSuccess />}
          </div>
          <div className="cl-alert-text" style={{ whiteSpace: "pre-wrap" }}>
            {err || msg}
          </div>
          <button type="button" className="cl-alert-close" onClick={clearAlerts}>✕</button>
        </div>
      )}

      {/* ── LAYOUT ── */}
      <div className="cl-dealer-layout">
        <div className="cl-svc-card cl-info-sidebar" style={{ "--svc-accent": "var(--g600)", padding: "2rem" }}>
          <h2 className="cl-h2" style={{ fontSize: "1.4rem" }}>Requirements</h2>
          <p className="cl-lead" style={{ fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            New dealers must submit valid business details and documents. Admin approval is required
            before accessing the dealer price list.
          </p>

          <ul className="cl-svc-list" style={{ marginBottom: "2rem" }}>
            <li><span className="cl-svc-check"><IconCheck /></span>Dealer name and firm details</li>
            <li><span className="cl-svc-check"><IconCheck /></span>Valid GST number</li>
            <li><span className="cl-svc-check"><IconCheck /></span>Complete address with pincode</li>
            <li><span className="cl-svc-check"><IconCheck /></span>GST certificate upload</li>
            <li><span className="cl-svc-check"><IconCheck /></span>Insecticide licence upload</li>
          </ul>

          <div className="cl-rx-card">
            <div className="cl-rx-icon">ℹ️</div>
            <div>
              <div className="cl-rx-label">{isSimpleMode ? "Temporary Mode" : "Secure Login"}</div>
              <div className="cl-rx-sub">
                {isSimpleMode
                  ? "Mobile login is enabled. WhatsApp OTP verification will be activated in an upcoming update."
                  : "WhatsApp OTP verification is enabled."}
              </div>
            </div>
          </div>
        </div>

        <div className="cl-svc-card cl-form-card" style={{ "--svc-accent": "var(--sky-600)", padding: "2.5rem 2rem" }}>

          {/* STEP: INTRO */}
          {step === "intro" && (
            <form onSubmit={isSimpleMode ? handleSimpleLogin : handleSendOtp} className="cl-form">
              <h2 className="cl-h2" style={{ fontSize: "1.8rem" }}>
                {isSimpleMode ? "Dealer Mobile Login" : "Dealer WhatsApp OTP Login"}
              </h2>
              <p className="cl-lead" style={{ marginBottom: "2rem" }}>
                {isSimpleMode
                  ? "Enter your mobile number to continue. OTP connection is kept ready for future activation."
                  : "Enter your mobile number. OTP will be sent to your WhatsApp."}
              </p>

              <div className="cl-form-group">
                <label className="cl-label">Mobile Number</label>
                <input
                  className="cl-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  inputMode="numeric"
                />
              </div>

              <div className="cl-cta-row" style={{ marginTop: "1rem" }}>
                <button className="cl-btn-primary" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : isSimpleMode
                      ? "Continue"
                      : "Send OTP"}
                </button>
                <a className="cl-btn-ghost" href="/contact">Contact Support</a>
              </div>

              <div className="cl-rx-card" style={{ marginTop: "1.5rem", background: "transparent", border: "none", borderLeft: "3px solid var(--sky-400)" }}>
                <div className="cl-rx-sub">
                  {isSimpleMode
                    ? "For now, mobile login is active. We will transition to secure WhatsApp OTP login soon."
                    : "Approved dealers will be redirected to dashboard after OTP verification."}
                </div>
              </div>
            </form>
          )}

          {/* STEP: VERIFY OTP */}
          {step === "verifyOtp" && (
            <form onSubmit={handleVerifyOtp} className="cl-form">
              <h2 className="cl-h2" style={{ fontSize: "1.8rem" }}>Verify OTP</h2>
              <p className="cl-lead" style={{ marginBottom: "2rem" }}>
                OTP sent to WhatsApp number: <b>{normalizePhone(phone)}</b>
              </p>

              <div className="cl-form-group">
                <label className="cl-label">Enter OTP</label>
                <input
                  className="cl-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                />
              </div>

              <div className="cl-cta-row" style={{ marginTop: "1rem" }}>
                <button className="cl-btn-primary" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  className="cl-btn-ghost"
                  onClick={handleResendOtp}
                  disabled={loading || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>

                <button type="button" className="cl-btn-ghost" onClick={resetToIntro}>
                  Change Number
                </button>
              </div>
            </form>
          )}

          {/* STEP: REGISTER */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="cl-form">
              <h2 className="cl-h2" style={{ fontSize: "1.8rem" }}>Dealer Registration</h2>
              <p className="cl-lead" style={{ marginBottom: "2rem" }}>
                Mobile: <b>{normalizePhone(phone)}</b>
              </p>

              <div className="cl-form-grid">
                <div className="cl-form-group">
                  <label className="cl-label">Dealer Name *</label>
                  <input
                    className="cl-input"
                    value={form.dealer_name}
                    onChange={(e) => setForm({ ...form, dealer_name: e.target.value })}
                    placeholder="Enter dealer name"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Firm / Company Name *</label>
                  <input
                    className="cl-input"
                    value={form.firm_name}
                    onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
                    placeholder="Enter firm name"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Email <span style={{ opacity: 0.6, fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    className="cl-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@gmail.com"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">GST Number *</label>
                  <input
                    className="cl-input"
                    value={form.gst}
                    onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })}
                    placeholder="15-character GSTIN"
                    maxLength={15}
                  />
                  {form.gst && (
                    <div className="cl-input-msg" style={{ color: gstLooksValid(form.gst) ? "var(--g600)" : "#e53e3e" }}>
                      {gstLooksValid(form.gst) ? "GST format looks valid" : "GST format is invalid"}
                    </div>
                  )}
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Village / Post *</label>
                  <input
                    className="cl-input"
                    value={form.village_post}
                    onChange={(e) => setForm({ ...form, village_post: e.target.value })}
                    placeholder="Village / Post"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Taluk *</label>
                  <input
                    className="cl-input"
                    value={form.taluk}
                    onChange={(e) => setForm({ ...form, taluk: e.target.value })}
                    placeholder="Taluk"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">District *</label>
                  <input
                    className="cl-input"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="District"
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Pin Code *</label>
                  <input
                    className="cl-input"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">GST Certificate * <span style={{ opacity: 0.6, fontWeight: 400 }}>(PDF/JPG/PNG ≤ 8MB)</span></label>
                  <input
                    className="cl-input-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setGstFile(e.target.files?.[0] || null)}
                  />
                  <div className="cl-input-msg">{gstFile ? `Selected: ${gstFile.name}` : "No file selected"}</div>
                </div>

                <div className="cl-form-group">
                  <label className="cl-label">Insecticide Licence * <span style={{ opacity: 0.6, fontWeight: 400 }}>(PDF/JPG/PNG ≤ 8MB)</span></label>
                  <input
                    className="cl-input-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setLicFile(e.target.files?.[0] || null)}
                  />
                  <div className="cl-input-msg">{licFile ? `Selected: ${licFile.name}` : "No file selected"}</div>
                </div>
              </div>

              <label className="cl-checkbox">
                <input
                  type="checkbox"
                  checked={form.confirm_true}
                  onChange={(e) => setForm({ ...form, confirm_true: e.target.checked })}
                />
                <span>I confirm the information provided is true and correct.</span>
              </label>

              <div className="cl-cta-row" style={{ marginTop: "1.5rem" }}>
                <button className="cl-btn-primary" disabled={loading}>
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>
                <button type="button" className="cl-btn-ghost" onClick={resetToIntro}>
                  Back
                </button>
              </div>
            </form>
          )}

          {/* STEP: PENDING */}
          {step === "pending" && (
            <div className="cl-status-box">
              <h2 className="cl-h2" style={{ fontSize: "1.8rem" }}>Request Received ✅</h2>
              <p className="cl-lead" style={{ marginBottom: "2rem" }}>
                Your dealer registration request has been received. Please wait until admin verifies
                and approves your documents. Once approved, you will get access to the protected
                price list.
              </p>

              <div className="cl-cta-row">
                <button className="cl-btn-primary" onClick={resetToIntro}>Back to Dealer Login</button>
                <a className="cl-btn-ghost" href="/contact">Contact Support</a>
              </div>
            </div>
          )}

          {/* STEP: DASHBOARD */}
          {step === "dashboard" && (
            <div className="cl-status-box">
              <h2 className="cl-h2" style={{ fontSize: "1.8rem" }}>Dealer Dashboard</h2>
              <p className="cl-lead" style={{ marginBottom: "2rem" }}>
                Status: <b>{dealer?.status || "approved"}</b>
                <br />
                Mobile: <b>{normalizePhone(phone)}</b>
              </p>

              <div className="cl-rx-card" style={{ background: "var(--g50)", borderColor: "var(--g100)", borderLeftColor: "var(--g600)", padding: "1.5rem", flexDirection: "column", gap: "12px", marginBottom: "2rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--g900)" }}>Download Latest Price List</h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--g800)", opacity: 0.8 }}>
                  This file is protected and available only for approved dealers.
                </p>

                <div className="cl-cta-row" style={{ marginTop: "0.5rem" }}>
                  <button className="cl-btn-primary" onClick={handleDownloadPriceList} disabled={loading}>
                    {loading ? "Loading..." : "Download Price List"}
                  </button>
                  <button className="cl-btn-ghost" onClick={resetToIntro}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ══════════════════════════════════════════════
           @import: premium agricultural font pairing
        ══════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ══════════════════════════════════════════════
           Design tokens — Shared with Clinic
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
          color: #1a2e1a;
        }

        .cl-root {
          display: flex;
          flex-direction: column;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 0 1.5rem 5rem;
        }

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

        .cl-h2 {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: inherit;
          margin: 0 0 0.75rem;
        }
        .cl-h2 em {
          font-style: italic;
          color: var(--g500);
        }

        .cl-lead {
          font-size: 1rem;
          color: #4a5e4a;
          line-height: 1.75;
          margin: 0 0 3rem;
          max-width: 560px;
        }

        .cl-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 26px;
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
        .cl-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .cl-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: inherit;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--r-md);
          border: 1.5px solid #dbe3ef;
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
        .cl-btn-ghost:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cl-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        /* Hero */
        .cl-hero {
          padding: 4.5rem 0;
          position: relative;
        }
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
          margin: 0 0 1.5rem;
        }
        .cl-hero-title em { font-style: italic; color: var(--g500); }
        .cl-hero-sub {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #4a5e4a;
          margin: 0 0 2rem;
          max-width: 600px;
        }
        .cl-hero-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }
        .cl-hero-proof-tag { font-size: 0.8rem; color: var(--g600); font-weight: 600; }
        .cl-hero-proof-divider { width: 1px; height: 16px; background: #dbe3ef; }
        .cl-hero-proof-text { font-size: 0.8rem; color: #4a5e4a; font-weight: 500; }

        /* Alerts */
        .cl-alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-radius: var(--r-md);
          margin-bottom: 2rem;
          animation: cl-fade-in var(--dur) var(--ease);
        }
        .cl-alert-icon { margin-top: 2px; flex-shrink: 0; }
        .cl-alert-text { font-size: 0.95rem; font-weight: 600; line-height: 1.5; flex-grow: 1; }
        .cl-alert-close { background: none; border: none; cursor: pointer; opacity: 0.5; transition: opacity var(--dur); font-size: 16px; font-weight: 700; padding: 0 4px; }
        .cl-alert-close:hover { opacity: 1; }
        .cl-alert-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .cl-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        @keyframes cl-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* Forms Layout */
        .cl-dealer-layout {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 2rem;
          align-items: start;
        }

        .cl-svc-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: var(--r-xl);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
        }
        .cl-svc-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--svc-accent);
        }
        
        .cl-svc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .cl-svc-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.95rem; color: #4a5e4a; font-weight: 500; }
        .cl-svc-check { color: var(--svc-accent); margin-top: 2px; flex-shrink: 0; }

        .cl-rx-card {
          background: var(--a50);
          border: 1px solid var(--a100);
          border-left: 3px solid var(--a200);
          border-radius: var(--r-md);
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .cl-rx-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .cl-rx-label { font-size: 13px; font-weight: 700; color: var(--a800); margin-bottom: 2px; }
        .cl-rx-sub { font-size: 12px; color: #4a5e4a; line-height: 1.5; }

        /* Form Controls */
        .cl-form { display: flex; flex-direction: column; }
        .cl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
        .cl-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
        .cl-form-grid .cl-form-group { margin-bottom: 0; }
        .cl-label { font-size: 0.9rem; font-weight: 700; color: #1a2e1a; }
        .cl-input {
          padding: 12px 14px;
          border: 1px solid #dbe3ef;
          border-radius: var(--r-sm);
          font-family: inherit;
          font-size: 0.95rem;
          transition: all var(--dur) var(--ease);
          background: #fff;
          width: 100%;
          box-sizing: border-box;
        }
        .cl-input:focus { border-color: var(--sky-400); box-shadow: 0 0 0 3px rgba(58, 141, 197, 0.15); outline: none; }
        
        .cl-input-file {
          padding: 8px 0;
          font-family: inherit;
          font-size: 0.9rem;
        }
        
        .cl-input-msg { font-size: 0.8rem; color: #64748b; margin-top: 2px; }

        .cl-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: var(--r-md);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cl-checkbox input { margin: 0; width: 18px; height: 18px; cursor: pointer; }

        /* Responsive */
        @media (max-width: 900px) {
          .cl-dealer-layout { grid-template-columns: 1fr; }
          .cl-hero { padding: 3rem 0; }
          .cl-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .cl-svc-card { padding: 1.5rem 1.25rem !important; }
          .cl-cta-row button { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}