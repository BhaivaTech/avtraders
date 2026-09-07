// src/pages/admin/AdminSettings.jsx
// Admin settings page: account & session info, self-service password
// change, notification preferences, cache maintenance, and Admin User
// Management (superadmin only).

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';

const ADMIN_AUTH_KEY = 'adminAuth';
const NOTIFY_KEY = 'admin-notify';

const ROLE_LABELS = {
  superadmin: { label: 'Superadmin', color: '#8b5cf6' },
  manager:    { label: 'Manager',    color: '#3b82f6' },
  support:    { label: 'Support',    color: '#10b981' },
  finance:    { label: 'Finance',    color: '#f59e0b' },
};

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="set-toggle">
      <span className="set-toggle-text">
        <span className="set-toggle-label">{label}</span>
        {hint && <span className="set-toggle-hint">{hint}</span>}
      </span>
      <span className={'set-switch' + (checked ? ' on' : '')}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="knob" />
      </span>
    </label>
  );
}

function RoleBadge({ role }) {
  const info = ROLE_LABELS[role] || { label: role, color: '#6b7280' };
  return <span className={`role-badge role-${role}`}>{info.label}</span>;
}

function SettingsCard({ icon, title, subtitle, children, className = '' }) {
  return (
    <section className={'settings-card ' + className}>
      <div className="settings-card-head">
        <span className="settings-card-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}

/* ── Change password form (any admin role) ── */
function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;

  async function submit(e) {
    e.preventDefault();
    if (mismatch || saving) return;
    setSaving(true);
    try {
      const res = await api.patch(
        '/admin/my-password',
        { current_password: current, new_password: next },
        { withCredentials: true }
      );
      if (res?.data?.ok) {
        toast.success('Password updated');
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        toast.error(res?.data?.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="pw-form">
      <label className="field">
        <span>Current password</span>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="field">
        <span>New password</span>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          placeholder="min 8 characters"
          required
        />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          style={mismatch ? { borderColor: '#ef4444' } : undefined}
          required
        />
        {mismatch && <em className="field-error">Passwords do not match</em>}
      </label>
      <button className="btn primary" disabled={saving || mismatch || !next}>
        {saving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

/* ── Cache maintenance ── */
function CacheSection() {
  const [clearing, setClearing] = useState(false);

  async function clearCache() {
    if (!window.confirm('Clear locally cached files and reload? The app will refresh.')) return;
    setClearing(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      toast.success('Cache cleared — reloading');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error('Could not clear cache');
      setClearing(false);
    }
  }

  return (
    <>
      <p className="settings-note">
        If pages look stale or the app misbehaves after an update, clear the
        offline cache. This only affects this device.
      </p>
      <button className="btn ghost danger" onClick={clearCache} disabled={clearing}>
        {clearing ? 'Clearing…' : 'Clear cached data & reload'}
      </button>
    </>
  );
}

/* ── Admin Users Management (superadmin only) ── */
function AdminUsersSection() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState({ email: '', name: '', role: 'support', password: '' });
  const [saving, setSaving]   = useState(false);
  const [editUser, setEditUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('/admin/admin-users');
      const data = res?.data;
      if (data?.ok) setUsers(data.admins || []);
    } catch (e) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }, [users, filter]);

  async function createUser(e) {
    e.preventDefault();
    if (!form.email || !form.name || !form.role || !form.password) return;
    setSaving(true);
    try {
      const res = await api.post('/admin/admin-users', form);
      const data = res?.data;
      if (data?.ok) {
        toast.success('Admin user created');
        setShowModal(false);
        setForm({ email: '', name: '', role: 'support', password: '' });
        loadUsers();
      } else {
        toast.error(data?.message || 'Failed to create user');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create admin user');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const payload = { name: editUser.name, role: editUser.role };
      if (editUser.password) payload.password = editUser.password;
      const res = await api.patch(`/admin/admin-users/${editUser.id}`, payload);
      const data = res?.data;
      if (data?.ok) {
        toast.success('Admin user updated');
        setEditUser(null);
        loadUsers();
      } else {
        toast.error(data?.message || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update admin user');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    const action = user.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;
    try {
      const res = await api.patch(`/admin/admin-users/${user.id}/${action}`, {});
      const data = res?.data;
      if (data?.ok) {
        toast.success(`Admin user ${action}d`);
        loadUsers();
      } else {
        toast.error(data?.message || `Failed to ${action}`);
      }
    } catch {
      toast.error(`Failed to ${action} admin user`);
    }
  }

  function Modal({ title, onClose, children }) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h3>{title}</h3>
          {children}
        </div>
      </div>
    );
  }

  return (
    <SettingsCard
      icon="👥"
      title="Admin Users"
      subtitle="Manage team accounts and their access roles"
      className="settings-card-full"
    >
      <div className="au-toolbar">
        <input
          className="au-search"
          placeholder="Search by name, email or role…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="btn primary" onClick={() => setShowModal(true)}>+ Add Admin</button>
      </div>

      {loading ? (
        <div className="settings-note">Loading…</div>
      ) : (
        <div className="table-wrap">
          <table className="au-table">
            <thead>
              <tr>{['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id} className={u.is_active ? '' : 'row-inactive'}>
                  <td className="cell-name">{u.name}</td>
                  <td className="cell-email">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={'status-pill ' + (u.is_active ? 'ok' : 'off')}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="au-actions">
                      <button
                        className="btn tiny"
                        onClick={() => setEditUser({ id: u.id, name: u.name, role: u.role, password: '' })}
                      >
                        Edit
                      </button>
                      <button
                        className={'btn tiny ' + (u.is_active ? 'ghost danger' : 'ghost')}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr><td colSpan={5} className="empty-cell">No matching admin users.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Add Admin User" onClose={() => setShowModal(false)}>
          <form onSubmit={createUser} className="stack-form">
            <input className="admin-input" type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <input className="admin-input" type="text" placeholder="Full name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input className="admin-input" type="password" placeholder="Password (min 6 characters)" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
            <select className="admin-input" value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="superadmin">Superadmin</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
            </select>
            <div className="modal-actions">
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
              <button type="button" className="btn ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Edit ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={saveEdit} className="stack-form">
            <input className="admin-input" type="text" placeholder="Full name" value={editUser.name}
              onChange={(e) => setEditUser((u) => ({ ...u, name: e.target.value }))} required />
            <input className="admin-input" type="password" placeholder="New password (leave blank to keep)"
              value={editUser.password || ''}
              onChange={(e) => setEditUser((u) => ({ ...u, password: e.target.value }))} />
            <select className="admin-input" value={editUser.role}
              onChange={(e) => setEditUser((u) => ({ ...u, role: e.target.value }))}>
              <option value="superadmin">Superadmin</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
            </select>
            <div className="modal-actions">
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn ghost" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </SettingsCard>
  );
}

/* ── live session countdown (fixed 12h from login) ── */
function SessionCountdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!expiresAt) return <>—</>;
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  if (remaining === 0) return <span style={{ color: '#dc2626', fontWeight: 700 }}>Expired</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <>
      {pad(h)}:{pad(m)}:{pad(s)}
      <span style={{ display: 'block', fontWeight: 400, fontSize: 12, color: 'var(--muted)' }}>
        auto-logout at expiry
      </span>
    </>
  );
}

/* ── Main Settings Page ── */
export default function AdminSettings() {
  const navigate = useNavigate();
  const { role, hasPermission, refresh, sessionExpiresAt } = useAdminAuth();
  const [notifyNewMsg, setNotifyNewMsg] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [sessionInfo, setSessionInfo] = useState({ email: '', ts: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  // When the fixed 12h window closes, bounce to login immediately.
  useEffect(() => {
    if (!sessionExpiresAt) return;
    const msLeft = sessionExpiresAt - Date.now();
    if (msLeft <= 0) {
      try { localStorage.removeItem(ADMIN_AUTH_KEY); } catch {}
      toast.error('Session expired — please log in again');
      navigate('/admin/login');
      return;
    }
    const t = setTimeout(() => refresh(), msLeft + 1500);
    return () => clearTimeout(t);
  }, [sessionExpiresAt, navigate, refresh]);

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

  const initials = (sessionInfo.email || 'A').slice(0, 2).toUpperCase();

  return (
    <div className="admin-page" data-admin-page="settings">
      <div className="admin-page-head">
        <h1>Settings</h1>
        <p className="muted">Account, security and workspace preferences</p>
      </div>

      <div className="settings-grid">
        {/* Account */}
        <SettingsCard icon="👤" title="Account" subtitle="Your admin identity and session">
          <div className="account-row">
            <span className="avatar-lg">{initials}</span>
            <div className="account-main">
              <div className="account-email">{sessionInfo.email || '—'}</div>
              <RoleBadge role={role || 'superadmin'} />
            </div>
          </div>
          <dl className="kv-list">
            <div><dt>Session expires in</dt><dd><SessionCountdown expiresAt={sessionExpiresAt} /></dd></div>
            <div><dt>Signed in</dt><dd>{sessionInfo.ts ? new Date(sessionInfo.ts).toLocaleString('en-IN') : '—'}</dd></div>
            <div><dt>Session length</dt><dd>12 hours (fixed, from login)</dd></div>
          </dl>
          <button className="btn danger" onClick={logoutNow} disabled={loggingOut} style={{ marginTop: 'auto' }}>
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </SettingsCard>

        {/* Security */}
        <SettingsCard icon="🔒" title="Change Password" subtitle="Update your own login password">
          <ChangePasswordSection />
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard icon="🔔" title="Notifications" subtitle="Real-time alerts inside the panel">
          <Toggle checked={notifyNewMsg} onChange={(v) => saveNotify('newMessage', v)}
            label="New messages" hint="Toast when a farmer sends a message" />
          <Toggle checked={notifyPayment} onChange={(v) => saveNotify('payment', v)}
            label="Payment updates" hint="Toast on payment status changes" />
        </SettingsCard>

        {/* Maintenance */}
        <SettingsCard icon="🧰" title="Maintenance" subtitle="Fix loading issues on this device">
          <CacheSection />
        </SettingsCard>

        {/* Admin User Management — superadmin only */}
        {hasPermission('admin_users') && <AdminUsersSection />}
      </div>
    </div>
  );
}
