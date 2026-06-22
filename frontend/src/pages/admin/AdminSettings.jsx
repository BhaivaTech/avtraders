// src/pages/admin/AdminSettings.jsx
// Admin settings page: notification preferences and session controls.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';

const ADMIN_AUTH_KEY = 'adminAuth';
const NOTIFY_KEY = 'admin-notify';

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-label">{label}</span>
    </label>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [notifyNewMsg, setNotifyNewMsg] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [sessionInfo, setSessionInfo] = useState({ email: '', ts: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
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
    navigate('/admin');
    window.location.reload();
  }

  const sessionAge = sessionInfo.ts ? Math.round((Date.now() - sessionInfo.ts) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="admin-page" data-admin-page="settings">
      <h1>Settings</h1>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <div className="admin-card">
          <h3>Notifications</h3>
          <Toggle checked={notifyNewMsg} onChange={(v) => saveNotify('newMessage', v)} label="New messages" />
          <Toggle checked={notifyPayment} onChange={(v) => saveNotify('payment', v)} label="Payment updates" />
          <div className="toggle-hint">These control real-time toast alerts in the admin panel.</div>
        </div>

        <div className="admin-card">
          <h3>Session</h3>
          <div style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--ink-soft)' }}>
            <div>
              <div className="label">Email</div>
              <div>{sessionInfo.email || '—'}</div>
            </div>
            <div>
              <div className="label">Session age</div>
              <div>{sessionAge > 0 ? `${sessionAge} day${sessionAge > 1 ? 's' : ''}` : 'Today'}</div>
            </div>
          </div>
          <button
            className="btn danger"
            style={{ marginTop: 16 }}
            onClick={logoutNow}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
