import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import './AdminAnnouncements.css'; // we’ll create small CSS

export default function AdminAnnouncements() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    type: 'general',      // 'holiday' | 'timing' | 'video' | 'alert' | 'general'
    title: '',
    message: '',
    link: '',
    image_url: '',
    active: true,
  });

  const [list, setList] = useState([]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function loadAnnouncements() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/announcements', { withCredentials: true });
      const rows = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      setList(rows);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to load announcements');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.message.trim()) {
      setError('Message is required');
      return;
    }
    setSaving(true);
    try {
      await api.post(
        '/announcements',
        {
          type: form.type,
          title: form.title || null,
          message: form.message,
          link: form.link || null,
          image_url: form.image_url || null,
          active: form.active,
        },
        { withCredentials: true }
      );
      setSuccess('Announcement saved & pushed to website.');
      setForm((f) => ({ ...f, title: '', message: '', link: '', image_url: '' }));
      await loadAnnouncements();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to save announcement');
    }
    setSaving(false);
  }

  return (
    <div className="admin-ann-container">
      <header className="admin-ann-header">
        <button
          className="icon-btn ghost"
          onClick={() => navigate('/admin')}
          aria-label="Back"
        >
          ←
        </button>
        <div className="admin-ann-title">Announcements</div>
      </header>

      <main className="admin-ann-main">
        <section className="admin-ann-card">
          <h3>Create / Update Announcement</h3>
          <p className="admin-ann-hint">
            This text will appear on the Home page inside the Announcement box
            and scroll from right to left (like a standard website ticker).
          </p>

          {error && <div className="admin-ann-banner error">{error}</div>}
          {success && <div className="admin-ann-banner ok">{success}</div>}

          <form onSubmit={handleSubmit} className="admin-ann-form">
            <div className="row">
              <label>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="general">General</option>
                <option value="holiday">Holiday notice</option>
                <option value="timing">Shop timing update</option>
                <option value="video">New video uploaded</option>
                <option value="alert">Important alert</option>
              </select>
            </div>

            <div className="row">
              <label>Title (optional)</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder='Eg: "Today Shop Closed"'
              />
            </div>

            <div className="row">
              <label>Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                placeholder='Eg: "Today (26 Jan) AV Traders Agri Clinic will remain closed for Republic Day."'
              />
            </div>

            <div className="row">
              <label>Link (optional)</label>
              <input
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="row">
              <label>Image URL (optional)</label>
              <input
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="row row-inline">
              <label className="chk">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <span>Show on website (active)</span>
              </label>
            </div>

            <div className="actions">
              <button
                type="submit"
                className="btn primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Announcement'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-ann-card">
          <h3>Recent Announcements</h3>
          {loading && <div className="muted">Loading…</div>}
          {!loading && list.length === 0 && (
            <div className="muted">No announcements yet.</div>
          )}
          {!loading && list.length > 0 && (
            <ul className="admin-ann-list">
              {list.map((a) => (
                <li key={a.id || a.created_at}>
                  <div className="top">
                    <span className={`pill pill-${a.type || 'general'}`}>
                      {a.type || 'general'}
                    </span>
                    {a.active ? (
                      <span className="status active">Visible</span>
                    ) : (
                      <span className="status">Hidden</span>
                    )}
                  </div>
                  <div className="msg">
                    {a.title && <strong>{a.title} – </strong>}
                    {a.message}
                  </div>
                  {a.link && (
                    <a
                      href={a.link}
                      className="small-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.link}
                    </a>
                  )}
                  <div className="meta">
                    {a.created_at &&
                      new Date(a.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
