// src/pages/admin/AdminSettings.jsx
// Admin settings page: notification preferences, session controls,
// and Admin User Management (superadmin only).

import React, { useState, useEffect, useCallback } from 'react';
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

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-label">{label}</span>
    </label>
  );
}

function RoleBadge({ role }) {
  const info = ROLE_LABELS[role] || { label: role, color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: `${info.color}22`,
      border: `1px solid ${info.color}55`,
      color: info.color,
    }}>
      {info.label}
    </span>
  );
}

/* ── Admin Users Management (superadmin only) ── */
function AdminUsersSection() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState({ email: '', name: '', role: 'support' });
  const [saving, setSaving]   = useState(false);
  const [editUser, setEditUser] = useState(null); // { id, name, role }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/admin/admin-users');
      if (data?.ok) setUsers(data.admins || []);
    } catch (e) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function createUser(e) {
    e.preventDefault();
    if (!form.email || !form.name || !form.role) return;
    setSaving(true);
    try {
      const data = await api.post('/admin/admin-users', form);
      if (data?.ok) {
        toast.success('Admin user created');
        setShowModal(false);
        setForm({ email: '', name: '', role: 'support' });
        loadUsers();
      } else {
        toast.error(data?.message || 'Failed to create user');
      }
    } catch (e) {
      toast.error('Failed to create admin user');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const data = await api.patch(`/admin/admin-users/${editUser.id}`, {
        name: editUser.name,
        role: editUser.role,
      });
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
      const data = await api.patch(`/admin/admin-users/${user.id}/${action}`, {});
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

  return (
    <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Admin Users</h3>
        <button className="btn" onClick={() => setShowModal(true)}>+ Add Admin</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-soft)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--admin-border, #f3f4f6)', opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: u.is_active ? '#10b981' : '#ef4444' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setEditUser({ id: u.id, name: u.name, role: u.role })}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn ${u.is_active ? 'danger' : ''}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--ink-soft)' }}>No admin users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--admin-surface, #fff)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px' }}>Add Admin User</h3>
            <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                className="admin-input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                className="admin-input"
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <select
                className="admin-input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="superadmin">Superadmin</option>
                <option value="manager">Manager</option>
                <option value="support">Support</option>
                <option value="finance">Finance</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Creating…' : 'Create'}
                </button>
                <button type="button" className="btn ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--admin-surface, #fff)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px' }}>Edit Admin User</h3>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                className="admin-input"
                type="text"
                placeholder="Full name"
                value={editUser.name}
                onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
                required
              />
              <select
                className="admin-input"
                value={editUser.role}
                onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
              >
                <option value="superadmin">Superadmin</option>
                <option value="manager">Manager</option>
                <option value="support">Support</option>
                <option value="finance">Finance</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn ghost" onClick={() => setEditUser(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Settings Page ── */
export default function AdminSettings() {
  const navigate = useNavigate();
  const { role, hasPermission } = useAdminAuth();
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
              <div className="label">Role</div>
              <div style={{ marginTop: 4 }}><RoleBadge role={role || 'superadmin'} /></div>
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

        {/* Admin User Management — superadmin only */}
        {hasPermission('admin_users') && <AdminUsersSection />}
      </div>
    </div>
  );
}
