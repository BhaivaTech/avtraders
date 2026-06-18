// src/pages/admin/AdminSettings.jsx
// Admin settings page: dark-mode toggle, notification preferences, and session controls.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';

const ADMIN_AUTH_KEY = 'adminAuth';
const DARK_MODE_KEY = 'admin-dark-mode';
const NOTIFY_KEY = 'admin-notify';

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 0', userSelect:'none' }}>
      <div style={{ position:'relative', width:44, height:24, flexShrink:0 }}>
        <input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} style={{ position:'absolute', opacity:0, width:0, height:0 }} />
        <div style={{
          width:44, height:24, borderRadius:12, background: checked ? '#3b82f6' : '#cbd5e1',
          transition:'background .2s', position:'relative',
        }}>
          <div style={{
            width:20, height:20, borderRadius:'50%', background:'#fff',
            position:'absolute', top:2, left: checked ? 22 : 2,
            transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)',
          }} />
        </div>
      </div>
      <span style={{ fontSize:14, fontWeight:500, color:'#334155' }}>{label}</span>
    </label>
  );
}

function SettingCard({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:18, marginBottom:16 }}>
      <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'#0f172a' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifyNewMsg, setNotifyNewMsg] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [sessionInfo, setSessionInfo] = useState({ email: '', ts: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const dm = localStorage.getItem(DARK_MODE_KEY);
      setDarkMode(dm === 'true');
    } catch {}
    try {
      const nf = JSON.parse(localStorage.getItem(NOTIFY_KEY) || '{}');
      if (typeof nf.newMessage === 'boolean') setNotifyNewMsg(nf.newMessage);
      if (typeof nf.payment === 'boolean') setNotifyPayment(nf.payment);
    } catch {}
    try {
      const raw = localStorage.getItem(ADMIN_AUTH_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.email) setSessionInfo({ email: saved.email, ts: Number(saved.ts || 0) });
    } catch {}
  }, []);

  function saveDarkMode(v) {
    setDarkMode(v);
    try { localStorage.setItem(DARK_MODE_KEY, String(v)); } catch {}
    // dispatch a custom event so AdminLayout picks it up without full reload
    window.dispatchEvent(new StorageEvent('storage', { key: DARK_MODE_KEY, newValue: String(v) }));
  }

  function saveNotify(type, v) {
    const next = { newMessage: type === 'newMessage' ? v : notifyNewMsg, payment: type === 'payment' ? v : notifyPayment };
    if (type === 'newMessage') setNotifyNewMsg(v); else setNotifyPayment(v);
    try { localStorage.setItem(NOTIFY_KEY, JSON.stringify(next)); } catch {}
  }

  async function logoutNow() {
    if (!window.confirm('Do you want to logout?')) return;
    setLoggingOut(true);
    try {
      await api.post('/admin/logout', {}, { withCredentials: true });
    } catch {}
    try { localStorage.removeItem(ADMIN_AUTH_KEY); } catch {}
    toast.success('Logged out');
    setLoggingOut(false);
    navigate('/admin');            // redirect to admin login (original Admin.jsx)
    window.location.reload();       // force reload to clear state
  }

  const sessionAge = sessionInfo.ts ? Math.round((Date.now() - sessionInfo.ts) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="admin-page" data-admin-page="settings">
      <h1 style={{ margin:'0 0 20px', fontSize:22, fontWeight:800, color:'#0f172a' }}>Settings</h1>

      <SettingCard title="Appearance">
        <Toggle checked={darkMode} onChange={saveDarkMode} label="Dark mode" />
        <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Applies to the admin panel only.</div>
      </SettingCard>

      <SettingCard title="Notifications">
        <Toggle checked={notifyNewMsg} onChange={(v)=>saveNotify('newMessage',v)} label="New messages" />
        <Toggle checked={notifyPayment} onChange={(v)=>saveNotify('payment',v)} label="Payment updates" />
        <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>These control real-time toast alerts in the admin panel.</div>
      </SettingCard>

      <SettingCard title="Session">
        <div style={{ display:'grid', gap:8, fontSize:14, color:'#334155' }}>
          <div><strong style={{ color:'#64748b', fontSize:12, textTransform:'uppercase' }}>Email</strong><br/>{sessionInfo.email || '—'}</div>
          <div><strong style={{ color:'#64748b', fontSize:12, textTransform:'uppercase' }}>Session age</strong><br/>{sessionAge > 0 ? `${sessionAge} day${sessionAge > 1 ? 's' : ''}` : 'Today'}</div>
        </div>
        <button
          onClick={logoutNow}
          disabled={loggingOut}
          style={{
            marginTop:16, padding:'8px 16px', border:'1px solid #e2e8f0', borderRadius:8,
            background:'#fef2f2', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer',
          }}
        >
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </SettingCard>
    </div>
  );
}
