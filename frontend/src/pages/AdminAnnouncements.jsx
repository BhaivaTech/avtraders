// src/pages/AdminAnnouncements.jsx
// Full management for the public announcement ticker.
//
// Tabs:     Live | Scheduled | Hidden | All
// Search:   debounced client-side filter on title / body / link
// Actions:  Edit · Hide/Show · Pin/Unpin · Delete (with confirm)
//
// Optimistic UI for hide/show/pin/delete — the local list flips
// immediately, the server call follows, and we revert on error.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Seo from '../components/Seo.jsx';
import { Skeleton, SkeletonText, SkeletonCard } from '../components/Skeleton.jsx';
import toast from '../lib/toast.js';
import './AdminAnnouncements.css';

const TYPES = [
  { value: 'general', label: 'General' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'timing',  label: 'Shop timing' },
  { value: 'video',   label: 'New video' },
  { value: 'alert',   label: 'Important alert' },
];

const TABS = [
  { key: 'live',      label: 'Live' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'hidden',    label: 'Hidden' },
  { key: 'all',       label: 'All' },
];

const EMPTY_FORM = {
  type: 'general',
  title: '',
  body: '',
  link_url: '',
  image_url: '',
  active: true,
  pinned: false,
  starts_at: '',
  ends_at: '',
};

export default function AdminAnnouncements() {
  return (
    <>
      <Seo pageKey="admin/announcements" />
      <AdminAnnouncementsInner />
    </>
  );
}

function AdminAnnouncementsInner() {
  const navigate = useNavigate();

  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [tab, setTab]         = useState('live');
  const [query, setQuery]     = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const debounceRef           = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  /* ---------------------------------------------------------------- */
  /*  Data load                                                        */
  /* ---------------------------------------------------------------- */

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/announcements/all', { withCredentials: true });
      const items = Array.isArray(res?.data?.items) ? res.data.items : [];
      setList(items);
    } catch (e) {
      console.error('[AdminAnnouncements] load failed:', e);
      setError(e?.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Debounce the search box by 200 ms so we do not refilter on every keystroke. */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  /* ---------------------------------------------------------------- */
  /*  Derived view                                                     */
  /* ---------------------------------------------------------------- */

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = debouncedQuery.trim().toLowerCase();
    return list.filter((a) => {
      if (q) {
        const hay = `${a.title || ''} ${a.body || ''} ${a.link_url || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (tab) {
        case 'live':
          return Number(a.active) === 1
            && (!a.starts_at || new Date(a.starts_at).getTime() <= now)
            && (!a.ends_at   || new Date(a.ends_at).getTime()   >= now);
        case 'scheduled':
          return Number(a.active) === 1
            && a.starts_at
            && new Date(a.starts_at).getTime() > now;
        case 'hidden':
          return Number(a.active) === 0;
        case 'all':
        default:
          return true;
      }
    });
  }, [list, tab, debouncedQuery]);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      type:      item.type || 'general',
      title:     item.title || '',
      body:      item.body || item.message || '',
      link_url:  item.link_url  || '',
      image_url: item.image_url || '',
      active:    Number(item.active) === 1,
      pinned:    Number(item.pinned) === 1,
      // datetime-local input wants "YYYY-MM-DDTHH:MM" without timezone.
      starts_at: toLocalInput(item.starts_at),
      ends_at:   toLocalInput(item.ends_at),
    });
    // Scroll the form into view on small screens.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function toLocalInput(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  }

  function fromLocalInput(value) {
    if (!value) return null;
    // datetime-local has no tz — treat as Asia/Kolkata, convert to UTC.
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  /* ---------------------------------------------------------------- */
  /*  Save (create or update)                                          */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.body.trim()) {
      setError('Message is required');
      toast.error('Message is required');
      return;
    }
    setSaving(true);
    const payload = {
      type:      form.type,
      title:     form.title.trim() || null,
      body:      form.body.trim(),
      message:   form.body.trim(),
      link_url:  form.link_url.trim()  || '',
      image_url: form.image_url.trim() || '',
      active:    !!form.active,
      pinned:    !!form.pinned,
      starts_at: fromLocalInput(form.starts_at),
      ends_at:   fromLocalInput(form.ends_at),
    };
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, payload, { withCredentials: true });
        toast.success('Announcement updated.');
      } else {
        await api.post('/announcements', payload, { withCredentials: true });
        toast.success('Announcement published.');
      }
      resetForm();
      await load();
    } catch (e) {
      console.error('[AdminAnnouncements] save failed:', e);
      const msg = e?.response?.data?.message || 'Failed to save announcement';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Row actions — optimistic UI                                      */
  /* ---------------------------------------------------------------- */

  function patchLocal(id, patch) {
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function toggleVisibility(item) {
    const next = Number(item.active) === 1 ? 0 : 1;
    patchLocal(item.id, { active: next });
    try {
      await api.patch(
        `/announcements/${item.id}/visibility`,
        { active: !!next },
        { withCredentials: true }
      );
      toast.success(next ? 'Shown on website.' : 'Hidden from website.');
    } catch (e) {
      patchLocal(item.id, { active: item.active }); // revert
      toast.error(e?.response?.data?.message || 'Could not change visibility.');
    }
  }

  async function togglePin(item) {
    const next = Number(item.pinned) === 1 ? 0 : 1;
    patchLocal(item.id, { pinned: next });
    try {
      await api.patch(
        `/announcements/${item.id}/pin`,
        { pinned: !!next },
        { withCredentials: true }
      );
      toast.success(next ? 'Pinned to top.' : 'Unpinned.');
    } catch (e) {
      patchLocal(item.id, { pinned: item.pinned });
      toast.error(e?.response?.data?.message || 'Could not change pin.');
    }
  }

  async function handleDelete(id) {
    setConfirmId(null);
    const snapshot = list;
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, active: 0 } : a)));
    try {
      await api.delete(`/announcements/${id}`, { withCredentials: true });
      toast.success('Announcement deleted.');
    } catch (e) {
      setList(snapshot);
      toast.error(e?.response?.data?.message || 'Could not delete announcement.');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="admin-ann-container">
      <header className="admin-ann-header">
        <button
          type="button"
          className="icon-btn ghost"
          onClick={() => navigate('/admin')}
          aria-label="Back to admin"
        >
          ←
        </button>
        <div className="admin-ann-title">Announcements</div>
        <div className="admin-ann-spacer" />
        <button
          type="button"
          className="btn ghost"
          onClick={resetForm}
          disabled={!editingId}
        >
          {editingId ? 'Cancel edit' : 'New'}
        </button>
      </header>

      <main className="admin-ann-main">
        {/* ============================== Form ============================== */}
        <section className="admin-ann-card">
          <h3>{editingId ? 'Edit announcement' : 'Create announcement'}</h3>
          <p className="admin-ann-hint">
            Shown on the Home page ticker. Scheduled items appear automatically
            when their start time arrives.
          </p>

          {error && <div className="admin-ann-banner error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="admin-ann-form">
            <div className="grid-2">
              <div className="row">
                <label htmlFor="ann-type">Type</label>
                <select
                  id="ann-type"
                  name="type"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="row">
                <label htmlFor="ann-title">Title (optional)</label>
                <input
                  id="ann-title"
                  name="title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder='e.g. "Today Shop Closed"'
                />
              </div>
            </div>

            <div className="row">
              <label htmlFor="ann-body">Message *</label>
              <textarea
                id="ann-body"
                name="body"
                value={form.body}
                onChange={(e) => setField('body', e.target.value)}
                rows={3}
                placeholder="The ticker text shown to visitors."
              />
            </div>

            <div className="grid-2">
              <div className="row">
                <label htmlFor="ann-link">Link (optional)</label>
                <input
                  id="ann-link"
                  type="url"
                  name="link_url"
                  value={form.link_url}
                  onChange={(e) => setField('link_url', e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="row">
                <label htmlFor="ann-image">Image URL (optional)</label>
                <input
                  id="ann-image"
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={(e) => setField('image_url', e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="row">
                <label htmlFor="ann-starts">Starts at (optional)</label>
                <input
                  id="ann-starts"
                  type="datetime-local"
                  name="starts_at"
                  value={form.starts_at}
                  onChange={(e) => setField('starts_at', e.target.value)}
                />
              </div>
              <div className="row">
                <label htmlFor="ann-ends">Ends at (optional)</label>
                <input
                  id="ann-ends"
                  type="datetime-local"
                  name="ends_at"
                  value={form.ends_at}
                  onChange={(e) => setField('ends_at', e.target.value)}
                />
              </div>
            </div>

            <div className="row row-inline">
              <label className="chk">
                <input
                  type="checkbox"
                  name="active"
                  checked={!!form.active}
                  onChange={(e) => setField('active', e.target.checked)}
                />
                <span>Show on website (active)</span>
              </label>
              <label className="chk">
                <input
                  type="checkbox"
                  name="pinned"
                  checked={!!form.pinned}
                  onChange={(e) => setField('pinned', e.target.checked)}
                />
                <span>Pin to top</span>
              </label>
            </div>

            <div className="actions">
              {editingId && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : (editingId ? 'Update' : 'Publish')}
              </button>
            </div>
          </form>
        </section>

        {/* ============================== List ============================== */}
        <section className="admin-ann-card">
          <header className="admin-ann-list-head">
            <h3>Manage</h3>
            <input
              type="search"
              className="admin-ann-search"
              placeholder="Search title, body, link…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search announcements"
            />
          </header>

          <div className="admin-ann-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`admin-ann-tab ${tab === t.key ? 'is-active' : ''}`}
                onClick={() => setTab(t.key)}
                type="button"
              >
                {t.label}
                <span className="admin-ann-tab-count">
                  {tab === t.key ? filtered.length : countForTab(list, t.key)}
                </span>
              </button>
            ))}
          </div>

          {loading && <AnnouncementListSkeleton />}

          {!loading && filtered.length === 0 && (
            <div className="muted">No announcements match.</div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="admin-ann-list">
              {filtered.map((a) => (
                <AnnouncementRow
                  key={a.id}
                  item={a}
                  isEditing={editingId === a.id}
                  onEdit={() => startEdit(a)}
                  onToggleVisibility={() => toggleVisibility(a)}
                  onTogglePin={() => togglePin(a)}
                  onAskDelete={() => setConfirmId(a.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      {confirmId != null && (
        <div className="admin-ann-modal-backdrop" role="presentation" onClick={() => setConfirmId(null)}>
          <div className="admin-ann-modal" role="dialog" aria-modal="true" aria-labelledby="del-title">
            <h3 id="del-title">Delete this announcement?</h3>
            <p>It will be hidden from the website and kept in the database for audit. This action cannot be undone from the UI.</p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={() => handleDelete(confirmId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function countForTab(list, key) {
  const now = Date.now();
  switch (key) {
    case 'live':
      return list.filter((a) => Number(a.active) === 1
        && (!a.starts_at || new Date(a.starts_at).getTime() <= now)
        && (!a.ends_at   || new Date(a.ends_at).getTime()   >= now)).length;
    case 'scheduled':
      return list.filter((a) => Number(a.active) === 1
        && a.starts_at && new Date(a.starts_at).getTime() > now).length;
    case 'hidden':
      return list.filter((a) => Number(a.active) === 0).length;
    case 'all':
    default:
      return list.length;
  }
}

function AnnouncementRow({ item, isEditing, onEdit, onToggleVisibility, onTogglePin, onAskDelete }) {
  const active   = Number(item.active) === 1;
  const pinned   = Number(item.pinned) === 1;
  const startStr = item.starts_at ? new Date(item.starts_at).toLocaleString() : null;
  const endStr   = item.ends_at   ? new Date(item.ends_at).toLocaleString()   : null;

  return (
    <li className={`admin-ann-row ${isEditing ? 'is-editing' : ''}`}>
      <div className="admin-ann-row-main">
        <div className="top">
          <span className={`pill pill-${item.type || 'general'}`}>{item.type || 'general'}</span>
          {pinned && <span className="pill pill-pin">📌 Pinned</span>}
          {active
            ? <span className="status active">Visible</span>
            : <span className="status">Hidden</span>}
        </div>
        <div className="msg">
          {item.title && <strong>{item.title} – </strong>}
          {item.body || item.message}
        </div>
        {item.link_url && (
          <a href={item.link_url} className="small-link" target="_blank" rel="noreferrer">
            {item.link_url}
          </a>
        )}
        <div className="meta">
          <span>Created {new Date(item.created_at).toLocaleString()}</span>
          {item.created_by && <span> · by {item.created_by}</span>}
          {item.updated_at && item.updated_at !== item.created_at && (
            <span> · updated {new Date(item.updated_at).toLocaleString()}</span>
          )}
          {startStr && <span> · starts {startStr}</span>}
          {endStr   && <span> · ends {endStr}</span>}
        </div>
      </div>
      <div className="admin-ann-row-actions">
        <button type="button" className="btn ghost small" onClick={onEdit}>
          {isEditing ? 'Editing…' : 'Edit'}
        </button>
        <button type="button" className="btn ghost small" onClick={onTogglePin}>
          {pinned ? 'Unpin' : 'Pin'}
        </button>
        <button type="button" className="btn ghost small" onClick={onToggleVisibility}>
          {active ? 'Hide' : 'Show'}
        </button>
        <button type="button" className="btn danger small" onClick={onAskDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}

function AnnouncementListSkeleton() {
  return (
    <ul className="admin-ann-list">
      {[0, 1, 2].map((i) => (
        <li key={i} className="admin-ann-row">
          <div className="admin-ann-row-main">
            <Skeleton width={80} height={18} />
            <div style={{ height: 8 }} />
            <SkeletonText lines={2} />
            <div style={{ height: 8 }} />
            <Skeleton width={140} height={12} />
          </div>
        </li>
      ))}
    </ul>
  );
}
