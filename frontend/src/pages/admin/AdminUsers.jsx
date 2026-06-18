// src/pages/admin/AdminUsers.jsx
// User management page for farmers & dealers.
// Fetches unique users from /chat/all and shows them in a searchable table.
// Supports viewing profiles and blocking/unblocking users.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';

/* ── icons ── */
function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

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
    <div className="modal-overlay" onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20 }}>
      <div className="modal-body" style={{ background:'#fff',borderRadius:12,maxWidth:420,width:'100%',padding:20,position:'relative' }} onClick={(e)=>e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute',top:10,right:10,background:'none',border:'none',fontSize:20,color:'#64748b',cursor:'pointer' }}>×</button>
        <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#0f172a' }}>👤 {p.full_name || user.name || 'Farmer'}</h3>
        {loading ? <div style={{ color:'#94a3b8' }}>Loading profile…</div> : (
          <div style={{ display:'grid', gap:10, fontSize:14, color:'#334155' }}>
            <div><strong>Mobile:</strong> {p.mobile || user.mobile}</div>
            {p.whatsapp && <div><strong>WhatsApp:</strong> {p.whatsapp}</div>}
            {p.village && <div><strong>Village:</strong> {p.village}</div>}
            {p.taluk && <div><strong>Taluk:</strong> {p.taluk}</div>}
            {p.district && <div><strong>District:</strong> {p.district}</div>}
            {p.pincode && <div><strong>Pincode:</strong> {p.pincode}</div>}
            {p.land_size && <div><strong>Land Size:</strong> {p.land_size}</div>}
            {p.crops_text && <div><strong>Crops:</strong> {p.crops_text}</div>}
            <div><strong>Status:</strong> {p.blocked ? <span style={{ color:'#dc2626' }}>Blocked</span> : <span style={{ color:'#16a34a' }}>Active</span>}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── row ── */
function UserRow({ user, onView, onToggleBlock, blocking }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderBottom:'1px solid #f1f5f9', background:'#fff', borderRadius:0 }} className="user-row">
      <div style={{ flex:2, minWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600, color:'#0f172a' }}>{user.name || '—'}</div>
      <div style={{ flex:1.5, minWidth:100, color:'#334155', fontSize:13 }}>{user.mobile || '—'}</div>
      <div style={{ flex:1, minWidth:80, fontSize:12 }}>
        {user.chats > 1 ? `${user.chats} chats` : `${user.chats} chat`}
      </div>
      <div style={{ flex:1, minWidth:70, fontSize:12, color:user.unread_total > 0 ? '#dc2626' : '#94a3b8' }}>
        {user.unread_total} unread
      </div>
      <div style={{ flex:1.5, minWidth:90, display:'flex', gap:6, justifyContent:'flex-end' }}>
        <button onClick={()=>onView(user)} style={{ padding:'4px 10px', border:'1px solid #e2e8f0', borderRadius:6, background:'#fff', fontSize:12, cursor:'pointer', color:'#334155' }}>View</button>
        <button onClick={()=>onToggleBlock(user)} disabled={blocking===user.mobile} style={{ padding:'4px 10px', border:'1px solid '+(user.blocked?'#22c55e':'#ef4444'), borderRadius:6, background:user.blocked?'#f0fdf4':'#fef2f2', fontSize:12, cursor:'pointer', color:user.blocked?'#16a34a':'#dc2626' }}>
          {blocking===user.mobile ? '…' : (user.blocked ? 'Unblock' : 'Block')}
        </button>
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
      // resolve userId
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

  return (
    <div className="admin-page" data-admin-page="users">
      <h1 style={{ margin:'0 0 20px', fontSize:22, fontWeight:800, color:'#0f172a' }}>User Management</h1>

      {/* Search bar */}
      <div style={{ display:'flex', gap:8, marginBottom:16, maxWidth:360 }}>
        <div style={{ flex:1, position:'relative' }}>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name or mobile…"
            style={{ width:'100%', padding:'8px 12px 8px 32px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}
          />
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}><IconSearch/></span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', minWidth:100 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase' }}>Total Users</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#0f172a' }}>{users.length}</div>
        </div>
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', minWidth:100 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase' }}>Blocked</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#dc2626' }}>{users.filter((u)=>u.blocked).length}</div>
        </div>
      </div>

      {/* Table header */}
      {filtered.length > 0 && (
        <div style={{ display:'flex', gap:12, padding:'8px 12px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.03em', borderBottom:'1px solid #e2e8f0' }}>
          <div style={{ flex:2, minWidth:120 }}>Name</div>
          <div style={{ flex:1.5, minWidth:100 }}>Mobile</div>
          <div style={{ flex:1, minWidth:80 }}>Chats</div>
          <div style={{ flex:1, minWidth:70 }}>Unread</div>
          <div style={{ flex:1.5, minWidth:90 }}></div>
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div style={{ padding:20, color:'#94a3b8', fontSize:14 }}>Loading users…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:20, color:'#94a3b8', fontSize:14 }}>{query.trim() ? 'No users match your search.' : 'No users found.'}</div>
      ) : (
        filtered.map((u) => (
          <UserRow key={u.mobile} user={u} onView={setModalUser} onToggleBlock={toggleBlock} blocking={blockingMobile} />
        ))
      )}

      {modalUser && <UserModal user={modalUser} onClose={()=>setModalUser(null)} />}
    </div>
  );
}
