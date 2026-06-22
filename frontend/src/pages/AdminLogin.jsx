import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ADMIN_EMAIL_ALLOWED } from '../lib/config.js';

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
            <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••" autoComplete="current-password" />
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
