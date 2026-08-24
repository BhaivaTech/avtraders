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

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode]   = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [otpTTL, setOtpTTL]     = useState(0);
  const [msg, setMsg]           = useState('');
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function startLogin(e) {
    e?.preventDefault();
    setMsg('');
    try {
      setBusy(true);
      const r = await api.post('/admin/login-start', { email, password }, { withCredentials: true });
      if (r?.data?.ok) {
        setOtpSent(true);
        setOtpCode('');
        const ttl = Number(r.data.ttl || 60);
        setOtpTTL(ttl);
        setMsg(`OTP sent to ${email || ADMIN_EMAIL_ALLOWED}. Valid for ${ttl} seconds.`);
        const t = setInterval(() => setOtpTTL((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
      } else {
        setMsg('Login failed.');
      }
    } catch (err) {
      setMsg(err?.response?.status === 401 ? 'Incorrect email or password.' : 'Server error — could not send OTP.');
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
        setMsg('Invalid or expired OTP.');
      }
    } catch {
      setMsg('Invalid or expired OTP.');
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
            <div style={s.passWrap}>
              <input style={{...s.input, flex: 1, border: 'none', outline: 'none', padding: 0}} type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••" autoComplete="current-password" />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            {msg && <div style={s.err}>{msg}</div>}
            <button style={s.btn} disabled={busy || !email || !password}>
              {busy ? 'Sending OTP…' : 'Login'}
            </button>
            <p style={s.hint}>OTP is required for every login and valid for 1 minute.</p>
          </form>
        )}

        {otpSent && !expired && (
          <form onSubmit={verifyOtp} style={s.form}>
            <label style={s.label}>Email</label>
            <input style={s.input} value={email} disabled />
            <label style={s.label}>Enter OTP</label>
            <input
              style={s.input}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              autoFocus
            />
            <p style={s.hint}>
              Expires in <b>00:{String(otpTTL).padStart(2, '0')}</b>.{' '}
              <button type="button" style={s.link} onClick={startLogin} disabled={busy}>Resend OTP</button>
            </p>
            {msg && <div style={s.err}>{msg}</div>}
            <button style={s.btn} disabled={busy || otpCode.length !== 6}>
              {busy ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  shell:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '24px' },
  card:     { width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
  notice:   { background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.5' },
  title:    { margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: '#1e293b' },
  form:     { display: 'flex', flexDirection: 'column', gap: '10px' },
  label:    { fontSize: '13px', fontWeight: 600, color: '#475569' },
  input:    { padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  passWrap: { display: 'flex', alignItems: 'center', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', background: '#fff', gap: '6px' },
  eyeBtn:   { background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 },
  btn:      { marginTop: '6px', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  hint:     { fontSize: '12px', color: '#64748b', margin: '4px 0 0' },
  err:      { fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' },
  link:     { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: '12px', textDecoration: 'underline' },
};
