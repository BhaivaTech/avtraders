import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ADMIN_EMAIL_ALLOWED } from '../lib/config.js';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const ADMIN_AUTH_KEY = 'adminAuth';

/* ── Inline CSS ─────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .al-shell {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    font-family: 'Inter', system-ui, sans-serif;
  }
  .al-card {
    width: 100%; max-width: 400px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 40px 32px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    animation: al-card-in .4s ease-out;
  }
  @keyframes al-card-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .al-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .al-logo-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: #16a34a;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 4px 10px rgba(22, 163, 74, 0.2);
  }
  .al-logo-text { color: #0f172a; }
  .al-logo-text strong { display: block; font-size: 15px; font-weight: 700; }
  .al-logo-text span { font-size: 11px; color: #64748b; }
  
  .al-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
  .al-subtitle { margin: 0 0 24px; font-size: 14px; color: #64748b; }
  
  .al-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .al-input-wrap { position: relative; margin-bottom: 16px; }
  .al-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .al-input {
    width: 100%; box-sizing: border-box;
    padding: 12px 42px 12px 42px;
    background: #ffffff; border: 1px solid #cbd5e1;
    border-radius: 8px; font-size: 14px; font-family: inherit; color: #0f172a; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .al-eye {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    padding: 8px; display: flex; align-items: center; justify-content: center;
    color: #94a3b8; border-radius: 6px;
    transition: color .15s, background .15s;
  }
  .al-eye:hover { color: #16a34a; background: #f0fdf4; }
  .al-input::placeholder { color: #94a3b8; }
  .al-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15); }
  .al-input:disabled { background: #f8fafc; color: #64748b; opacity: .7; }
  
  .al-btn {
    width: 100%; padding: 12px;
    background: #16a34a;
    color: #fff; border: none; border-radius: 8px;
    font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
    transition: background .2s, transform .1s;
    margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .al-btn:hover:not(:disabled) { background: #15803d; }
  .al-btn:active:not(:disabled) { transform: scale(0.98); }
  .al-btn:disabled { opacity: .6; cursor: not-allowed; }
  
  .al-err {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
    font-size: 13px; color: #dc2626; line-height: 1.4;
  }
  .al-ok {
    display: flex; align-items: flex-start; gap: 8px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
    font-size: 13px; color: #15803d; line-height: 1.4;
  }
  
  .al-hint { font-size: 12px; color: #64748b; margin: 12px 0 0; text-align: center; }
  .al-hint b { color: #334155; }
  .al-link { background: none; border: none; color: #16a34a; cursor: pointer; padding: 0; font-size: 12px; text-decoration: underline; font-family: inherit; }
  
  .al-divider { display: flex; align-items: center; gap: 10px; margin: 20px 0; color: #94a3b8; font-size: 12px; }
  .al-divider::before, .al-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
  
  @keyframes al-spin { to { transform: rotate(360deg); } }
  .al-spin { animation: al-spin .8s linear infinite; display: inline-block; }
  .al-footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otpCode, setOtpCode]   = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [otpTTL, setOtpTTL]     = useState(0);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState('err');
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function startLogin(e) {
    e?.preventDefault();
    setMsg('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL_ALLOWED) {
      setMsg('Incorrect email. Farmers please use the Clinic section.');
      return;
    }
    try {
      setBusy(true);
      const r = await api.post('/admin/login-start', { email, password }, { withCredentials: true });
      if (r?.data?.ok) {
        setOtpSent(true);
        setOtpCode('');
        const ttl = Number(r.data.ttl || 60);
        setOtpTTL(ttl);
        setMsg(`OTP sent to ${ADMIN_EMAIL_ALLOWED}. Valid for ${ttl} seconds.`);
        setMsgType('ok');
        const t = setInterval(() => setOtpTTL((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
      } else {
        setMsg('Login failed.'); setMsgType('err');
      }
    } catch (err) {
      setMsg(err?.response?.status === 401 ? 'Incorrect email or password.' : 'Server error — could not send OTP.');
      setMsgType('err');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e) {
    e?.preventDefault();
    setMsg('');
    try {
      setBusy(true);
      const r = await api.post('/admin/verify-otp', { email, code: otpCode }, { withCredentials: true });
      if (r?.data?.ok) {
        localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ ts: Date.now(), email }));
        navigate(from, { replace: true });
      } else {
        setMsg('Invalid or expired OTP.'); setMsgType('err');
      }
    } catch {
      setMsg('Invalid or expired OTP.'); setMsgType('err');
    } finally {
      setBusy(false);
    }
  }

  const expired = otpSent && otpTTL === 0;

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.notice}>
          <b>Office Use Only</b><br />
          Farmers: use the <a href="/farmers">Clinic section</a> for chat and messages.
        </div>
        <h1 style={s.title}>Admin Login</h1>

        {(!otpSent || expired) && (
          <form onSubmit={startLogin} style={s.form}>
            <label style={s.label}>Email</label>
            <input style={s.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin email" autoComplete="username" />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••" autoComplete="current-password" />
            {msg && <div style={s.err}>{msg}</div>}
            <button style={s.btn} disabled={busy || !email || !password}>
              {busy ? 'Sending OTP…' : 'Login'}
            </button>
            <p style={s.hint}>OTP is required for every login and valid for 1 minute.</p>
          </form>
        )}

          {/* ── Step 2: OTP verify ── */}
          {otpSent && !expired && (
            <form onSubmit={verifyOtp}>
              <label className="al-label">Email</label>
              <div className="al-input-wrap">
                <span className="al-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </span>
                <input className="al-input" value={email} disabled />
              </div>

              <div className="al-divider">OTP Verification</div>

              <label className="al-label">6-Digit OTP Code</label>
              <div className="al-input-wrap">
                <span className="al-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1l3 6 6 .75-4.5 4.25L17.5 18 12 15l-5.5 3 1-5.5L3 8.5 9 7z"
                      stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  className="al-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  autoFocus
                />
              </div>

              <p className="al-hint">
                Expires in <b>00:{String(otpTTL).padStart(2, '0')}</b>.{' '}
                <button type="button" className="al-link" onClick={startLogin} disabled={busy}>
                  Resend OTP
                </button>
              </p>

              {msg && (
                <div className={msgType === 'ok' ? 'al-ok' : 'al-err'} style={{ marginTop: 10 }}>
                  <span>{msgType === 'ok' ? '✅' : '⚠️'}</span>
                  <span>{msg}</span>
                </div>
              )}

              <button className="al-btn" disabled={busy || otpCode.length !== 6} type="submit"
                style={{ marginTop: 12 }}>
                {busy
                  ? <><span className="al-spin">⏳</span> Verifying…</>
                  : <>Verify &amp; Enter</>}
              </button>
            </form>
          )}

          <div className="al-footer">
            AV Traders Agri Clinic &nbsp;·&nbsp; Admin Portal
          </div>
        </div>
      </div>
    // </>
  );
}

const s = {
  shell:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '24px' },
  card:   { width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
  notice: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.5' },
  title:  { margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: '#1e293b' },
  form:   { display: 'flex', flexDirection: 'column', gap: '10px' },
  label:  { fontSize: '13px', fontWeight: 600, color: '#475569' },
  input:  { padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  btn:    { marginTop: '6px', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  hint:   { fontSize: '12px', color: '#64748b', margin: '4px 0 0' },
  err:    { fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' },
  link:   { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: '12px', textDecoration: 'underline' },
};
