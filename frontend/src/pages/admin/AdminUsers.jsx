// src/pages/admin/AdminUsers.jsx
// User management page for farmers & dealers.

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';

/* ── user detail modal ── */
function UserModal({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.mobile) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/farmers/profile/admin', { params: { mobile: user.mobile }, withCredentials: true });
        if (!cancelled) setProfile(res.data?.profile || null);
      } catch { /* ignore */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const p = profile || {};
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body" onClick={(e)=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'var(--ink)' }}>👤 {p.full_name || user.name || 'Farmer'}</h3>
        {loading ? <div style={{ color:'var(--muted)' }}>Loading profile…</div> : (
          <div style={{ display:'grid', gap:10, fontSize:14, color:'var(--ink-soft)' }}>
            <div><strong>Mobile:</strong> {p.mobile || user.mobile}</div>
            {p.whatsapp && <div><strong>WhatsApp:</strong> {p.whatsapp}</div>}
            {p.village && <div><strong>Village:</strong> {p.village}</div>}
            {p.taluk && <div><strong>Taluk:</strong> {p.taluk}</div>}
            {p.district && <div><strong>District:</strong> {p.district}</div>}
            {p.pincode && <div><strong>Pincode:</strong> {p.pincode}</div>}
            {p.land_size && <div><strong>Land Size:</strong> {p.land_size}</div>}
            {p.crops_text && <div><strong>Crops:</strong> {p.crops_text}</div>}
            <div><strong>Status:</strong> {p.blocked ? <span className="badge danger">Blocked</span> : <span className="badge success">Active</span>}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── page ── */
export default function AdminUsers() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [blockingMobile, setBlockingMobile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/chat/all?limit=200', { withCredentials: true });
        if (!cancelled) setChats(res.data || []);
      } catch (err) { console.error('Users load error', err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const users = useMemo(() => {
    const map = new Map();
    chats.forEach((c) => {
      const key = c.mobile || c.id;
      if (!map.has(key)) {
        map.set(key, { mobile: c.mobile, name: c.name, chats: 0, unread_total: 0, blocked: false, user_id: c.user_id || null });
      }
      const u = map.get(key);
      u.chats += 1;
      u.unread_total += Number(c.unread_count || 0);
      if (c.blocked != null) u.blocked = !!c.blocked;
    });
    return Array.from(map.values()).sort((a, b) => b.chats - a.chats);
  }, [chats]);

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.mobile || '').includes(q));
  }, [users, query]);

  async function toggleBlock(user) {
    if (blockingMobile) return;
    setBlockingMobile(user.mobile);
    try {
      let uid = user.user_id;
      if (!uid) {
        const exists = await api.get(`/auth/exists/${user.mobile}`, { withCredentials: true });
        uid = exists.data?.user?.id;
      }
      if (!uid) { toast.error('Could not find user ID'); return; }
      const newBlocked = !user.blocked;
      await api.patch(`/admin/farmers/${uid}/block`, { blocked: newBlocked }, { withCredentials: true });
      setChats((prev) => prev.map((c) => {
        if (c.mobile === user.mobile) return { ...c, blocked: newBlocked };
        return c;
      }));
      toast.success(newBlocked ? 'User blocked' : 'User unblocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setBlockingMobile(null);
    }
  }

  const totalBlocked = users.filter((u) => u.blocked).length;

  return (
    <div className="admin-page" data-admin-page="users">
      <div className="admin-page-head">
        <h1>User Management</h1>
        <p className="muted">Manage farmer accounts, view profiles, and block/unblock users.</p>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card tone-neutral">
          <div className="label">Total Users</div>
          <div className="value">{users.length}</div>
        </div>
        <div className="stat-card tone-danger">
          <div className="label">Blocked</div>
          <div className="value">{totalBlocked}</div>
        </div>
      </div>

      <div className="search" style={{ maxWidth: 360, marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or mobile…"
        />
      </div>

      {loading ? (
        <div className="loading">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="title">{query.trim() ? 'No matches' : 'No users'}</div>
          <p>{query.trim() ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Chats</th>
                <th>Unread</th>
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.mobile}>
                  <td>
                    <strong>{u.name || '—'}</strong>
                    {u.blocked && <span className="badge danger" style={{ marginLeft: 8 }}>Blocked</span>}
                  </td>
                  <td>{u.mobile || '—'}</td>
                  <td>{u.chats} chat{u.chats !== 1 ? 's' : ''}</td>
                  <td>
                    {u.unread_total > 0 ? (
                      <span className="badge danger">{u.unread_total}</span>
                    ) : (
                      <span className="muted">0</span>
                    )}
                  </td>
                  <td className="cell-actions">
                    <button className="btn ghost tiny" onClick={() => setModalUser(u)}>
                      View
                    </button>
                    <button
                      className={`btn tiny ${u.blocked ? 'success' : 'danger'}`}
                      onClick={() => toggleBlock(u)}
                      disabled={blockingMobile === u.mobile}
                    >
                      {blockingMobile === u.mobile ? '…' : (u.blocked ? 'Unblock' : 'Block')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalUser && <UserModal user={modalUser} onClose={() => setModalUser(null)} />}
    </div>
  );
}
