import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
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
    const to = "info.avtradersagriclinic@gmail.com";
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
    <div className="dealer-page">
      <section className="dealer-hero">
        <div className="dealer-hero-content">
          <div className="dealer-badge">AV Agro Distribution</div>
          <h1>Dealer Portal</h1>
          <p>
            Secure dealer onboarding, document verification and protected access to the latest
            wholesale price list after admin approval.
          </p>

          <div className="dealer-hero-grid">
            <div>✅ Dealer Registration</div>
            <div>🧾 GST & Licence Verification</div>
            <div>🔐 Approved Dealer Access</div>
            <div>📥 Protected Price List</div>
          </div>
        </div>
      </section>

      {(msg || err) && (
        <div className={`dealer-alert ${err ? "dealer-alert-error" : "dealer-alert-success"}`}>
          <div style={{ whiteSpace: "pre-wrap" }}>{err || msg}</div>
          <button type="button" onClick={clearAlerts}>✕</button>
        </div>
      )}

      <section className="dealer-layout">
        <div className="dealer-info-card">
          <h2>Dealer Onboarding Requirements</h2>
          <p>
            New dealers must submit valid business details and documents. Admin approval is required
            before accessing the dealer price list.
          </p>

          <div className="dealer-checklist">
            <div>✔ Dealer name and firm details</div>
            <div>✔ Valid GST number</div>
            <div>✔ Complete address with pincode</div>
            <div>✔ GST certificate upload</div>
            <div>✔ Insecticide licence upload</div>
          </div>

          <div className="dealer-note">
            {isSimpleMode
              ? "Temporary mode: mobile login is enabled now. WhatsApp OTP can be connected later after MSG91/Meta issue is fixed."
              : "Secure login: WhatsApp OTP verification is enabled."}
          </div>
        </div>

        <div className="dealer-form-card">
          {step === "intro" && (
            <form onSubmit={isSimpleMode ? handleSimpleLogin : handleSendOtp} className="dealer-form">
              <h2>{isSimpleMode ? "Dealer Mobile Login" : "Dealer WhatsApp OTP Login"}</h2>
              <p>
                {isSimpleMode
                  ? "Enter your mobile number to continue. OTP connection is kept ready for future activation."
                  : "Enter your mobile number. OTP will be sent to your WhatsApp."}
              </p>

              <label>Mobile Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
              />

              <div className="dealer-actions">
                <button disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : isSimpleMode
                    ? "Continue"
                    : "Send OTP"}
                </button>

                <a href="/contact">Contact Support</a>
              </div>

              <small>
                {isSimpleMode
                  ? "After MSG91 is corrected, this same screen can be changed to WhatsApp OTP login."
                  : "Approved dealers will be redirected to dashboard after OTP verification."}
              </small>
            </form>
          )}

          {step === "verifyOtp" && (
            <form onSubmit={handleVerifyOtp} className="dealer-form">
              <h2>Verify OTP</h2>
              <p>
                OTP sent to WhatsApp number: <b>{normalizePhone(phone)}</b>
              </p>

              <label>Enter OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                inputMode="numeric"
              />

              <div className="dealer-actions">
                <button disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleResendOtp}
                  disabled={loading || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>

                <button type="button" className="secondary-btn" onClick={resetToIntro}>
                  Change Number
                </button>
              </div>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="dealer-form">
              <h2>Dealer Registration</h2>
              <p>
                Mobile: <b>{normalizePhone(phone)}</b>
              </p>

              <div className="dealer-form-grid">
                <div>
                  <label>Dealer Name *</label>
                  <input
                    value={form.dealer_name}
                    onChange={(e) => setForm({ ...form, dealer_name: e.target.value })}
                    placeholder="Enter dealer name"
                  />
                </div>

                <div>
                  <label>Firm / Company Name *</label>
                  <input
                    value={form.firm_name}
                    onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
                    placeholder="Enter firm name"
                  />
                </div>

                <div>
                  <label>Email Optional</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@gmail.com"
                  />
                </div>

                <div>
                  <label>GST Number *</label>
                  <input
                    value={form.gst}
                    onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })}
                    placeholder="15-character GSTIN"
                    maxLength={15}
                  />
                  {form.gst && (
                    <small className={gstLooksValid(form.gst) ? "valid-text" : "invalid-text"}>
                      {gstLooksValid(form.gst)
                        ? "GST format looks valid"
                        : "GST format is invalid"}
                    </small>
                  )}
                </div>

                <div>
                  <label>Village / Post *</label>
                  <input
                    value={form.village_post}
                    onChange={(e) => setForm({ ...form, village_post: e.target.value })}
                    placeholder="Village / Post"
                  />
                </div>

                <div>
                  <label>Taluk *</label>
                  <input
                    value={form.taluk}
                    onChange={(e) => setForm({ ...form, taluk: e.target.value })}
                    placeholder="Taluk"
                  />
                </div>

                <div>
                  <label>District *</label>
                  <input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="District"
                  />
                </div>

                <div>
                  <label>Pin Code *</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label>GST Certificate * PDF/JPG/PNG ≤ 8MB</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setGstFile(e.target.files?.[0] || null)}
                  />
                  <small>{gstFile ? `Selected: ${gstFile.name}` : "No file selected"}</small>
                </div>

                <div>
                  <label>Insecticide Licence * PDF/JPG/PNG ≤ 8MB</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setLicFile(e.target.files?.[0] || null)}
                  />
                  <small>{licFile ? `Selected: ${licFile.name}` : "No file selected"}</small>
                </div>
              </div>

              <label className="dealer-checkbox">
                <input
                  type="checkbox"
                  checked={form.confirm_true}
                  onChange={(e) => setForm({ ...form, confirm_true: e.target.checked })}
                />
                <span>I confirm the information provided is true and correct.</span>
              </label>

              <div className="dealer-actions">
                <button disabled={loading}>
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>

                <button type="button" className="secondary-btn" onClick={resetToIntro}>
                  Back
                </button>
              </div>
            </form>
          )}

          {step === "pending" && (
            <div className="dealer-status-box">
              <h2>Request Received ✅</h2>
              <p>
                Your dealer registration request has been received. Please wait until admin verifies
                and approves your documents. Once approved, you will get access to the protected
                price list.
              </p>

              <div className="dealer-actions">
                <button onClick={resetToIntro}>Back to Dealer Login</button>
                <a href="/contact">Contact Support</a>
              </div>
            </div>
          )}

          {step === "dashboard" && (
            <div className="dealer-status-box">
              <h2>Dealer Dashboard</h2>
              <p>
                Status: <b>{dealer?.status || "approved"}</b>
                <br />
                Mobile: <b>{normalizePhone(phone)}</b>
              </p>

              <div className="price-card">
                <h3>Download Latest Price List</h3>
                <p>
                  This file is protected and available only for approved dealers.
                </p>

                <div className="dealer-actions">
                  <button onClick={handleDownloadPriceList} disabled={loading}>
                    {loading ? "Loading..." : "Download Price List"}
                  </button>

                  <button className="secondary-btn" onClick={resetToIntro}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="dealer-coming">
        <div>
          <h2>Ordering Coming Soon</h2>
          <p>
            Dealer ordering, quotations, invoices and dispatch tracking will be enabled in the next phase.
          </p>
        </div>

        <div className="dealer-actions">
          <a href={mailtoHref}>Dealer Enquiry</a>
          <a href="/contact">Contact Support</a>
        </div>
      </section>

      <style>{`
        .dealer-page {
          display: grid;
          gap: 20px;
        }

        .dealer-hero {
          border-radius: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,.28), transparent 30%),
            linear-gradient(135deg, #0f766e, #2563eb 48%, #1e3a8a);
          color: white;
          box-shadow: 0 18px 45px rgba(15, 23, 42, .18);
        }

        .dealer-hero-content {
          padding: 34px 26px;
          display: grid;
          gap: 14px;
          text-align: center;
        }

        .dealer-badge {
          width: fit-content;
          margin: 0 auto;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          border: 1px solid rgba(255,255,255,.24);
          font-weight: 800;
          font-size: 13px;
          letter-spacing: .4px;
        }

        .dealer-hero h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 52px);
          line-height: 1;
          font-weight: 950;
        }

        .dealer-hero p {
          margin: 0 auto;
          max-width: 880px;
          line-height: 1.7;
          opacity: .96;
        }

        .dealer-hero-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .dealer-hero-grid div {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
          font-weight: 800;
        }

        .dealer-layout {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 20px;
          align-items: start;
        }

        .dealer-info-card,
        .dealer-form-card,
        .dealer-coming,
        .dealer-alert {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, .08);
        }

        .dealer-info-card,
        .dealer-form-card {
          padding: 22px;
        }

        .dealer-info-card {
          border-top: 5px solid #10b981;
        }

        .dealer-form-card {
          border-top: 5px solid #2563eb;
        }

        .dealer-info-card h2,
        .dealer-form h2,
        .dealer-status-box h2,
        .dealer-coming h2 {
          margin: 0 0 10px;
          color: #0f172a;
          font-weight: 950;
        }

        .dealer-info-card p,
        .dealer-form p,
        .dealer-status-box p,
        .dealer-coming p,
        .price-card p {
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 12px;
        }

        .dealer-checklist {
          display: grid;
          gap: 10px;
          margin: 16px 0;
        }

        .dealer-checklist div {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          padding: 11px 12px;
          border-radius: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .dealer-note {
          background: #eff6ff;
          color: #1e3a8a;
          border: 1px solid #bfdbfe;
          padding: 12px;
          border-radius: 14px;
          line-height: 1.6;
          font-weight: 800;
        }

        .dealer-form {
          display: grid;
          gap: 12px;
        }

        .dealer-form label {
          font-weight: 900;
          color: #0f172a;
          font-size: 13px;
        }

        .dealer-form input {
          width: 100%;
          padding: 12px 13px;
          border: 1px solid #dbe3ef;
          border-radius: 14px;
          outline: none;
          background: #fff;
        }

        .dealer-form input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, .13);
        }

        .dealer-form small {
          color: #64748b;
          line-height: 1.5;
        }

        .dealer-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .dealer-form-grid > div {
          display: grid;
          gap: 6px;
        }

        .dealer-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .dealer-checkbox input {
          width: auto;
        }

        .dealer-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .dealer-actions button,
        .dealer-actions a,
        .dealer-form button {
          border: none;
          background: #111827;
          color: white;
          padding: 11px 14px;
          border-radius: 14px;
          cursor: pointer;
          text-decoration: none;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }

        .dealer-actions button:disabled,
        .dealer-form button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .secondary-btn {
          background: #f8fafc !important;
          color: #111827 !important;
          border: 1px solid #e5e7eb !important;
        }

        .dealer-status-box {
          display: grid;
          gap: 12px;
        }

        .price-card {
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          border-radius: 18px;
          padding: 16px;
        }

        .price-card h3 {
          margin: 0 0 8px;
          color: #0f172a;
          font-weight: 950;
        }

        .dealer-alert {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          font-weight: 800;
          line-height: 1.6;
        }

        .dealer-alert button {
          border: none;
          background: rgba(255,255,255,.75);
          border-radius: 10px;
          cursor: pointer;
          padding: 6px 10px;
          font-weight: 900;
        }

        .dealer-alert-success {
          background: #ecfdf5;
          border-left: 5px solid #10b981;
          color: #065f46;
        }

        .dealer-alert-error {
          background: #fef2f2;
          border-left: 5px solid #ef4444;
          color: #991b1b;
        }

        .valid-text {
          color: #047857 !important;
          font-weight: 800;
        }

        .invalid-text {
          color: #dc2626 !important;
          font-weight: 800;
        }

        .dealer-coming {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
        }

        @media (max-width: 950px) {
          .dealer-layout {
            grid-template-columns: 1fr;
          }

          .dealer-hero-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .dealer-hero-content {
            padding: 26px 16px;
          }

          .dealer-hero-grid,
          .dealer-form-grid {
            grid-template-columns: 1fr;
          }

          .dealer-info-card,
          .dealer-form-card {
            padding: 16px;
          }

          .dealer-coming {
            flex-direction: column;
            align-items: flex-start;
          }

          .dealer-actions {
            width: 100%;
          }

          .dealer-actions button,
          .dealer-actions a {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}