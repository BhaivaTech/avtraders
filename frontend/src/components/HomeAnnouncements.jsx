import React, { useState } from 'react';
import './HomeAnnouncements.css';

function updateLink(item) {
  const candidate = item.link_url || item.link || item.url || item.youtube_url || String(item.body || item.message || item.text || '').match(/https?:\/\/[^\s]+/i)?.[0];
  if (!candidate) return null;
  try {
    const url = new URL(candidate, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export default function HomeAnnouncements({ items = [], loading, error, onRetry }) {
  const [selected, setSelected] = useState(0);
  const index = items.length ? selected % items.length : 0;
  const item = items[index];
  const title = String(item?.title || 'Latest from AV Traders');
  const body = String(item?.body || item?.message || item?.text || '');
  const href = item ? updateLink(item) : null;
  return <section className="home-notice" id="announcements" aria-label="Announcements" aria-busy={loading}>
    <div className="home-notice-brand">
      <span className="home-notice-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 14-5v14L3 14zM17 9h2a3 3 0 0 1 0 6h-2M6 15l1 5h4l-2-4M3 10v4" /></svg></span>
      <div><span className="home-notice-eyebrow">STAY IN THE KNOW</span><h2>Announcements</h2></div>
    </div>
    <div className="home-notice-content" aria-live="polite" aria-atomic="true">
      {loading ? <p className="home-notice-state">Getting the latest updates…</p> : error ? <p className="home-notice-state">Updates are temporarily unavailable.</p> : item ? <>
        <div className="home-notice-meta"><span className="home-notice-badge">{item.pinned ? 'Pinned update' : 'Latest update'}</span></div>
        <h3>{title}</h3>{body && body !== title && <p className="home-notice-body">{body}</p>}
      </> : <><h3>You’re all caught up</h3><p className="home-notice-body">News, events and important updates will appear here.</p></>}
    </div>
    <div className="home-notice-actions">
      {!loading && error && <button className="home-notice-link" onClick={onRetry}>Try again <span aria-hidden="true">↻</span></button>}
      {!loading && !error && href && <a className="home-notice-link" href={href} target="_blank" rel="noopener noreferrer">View update <span aria-hidden="true">↗</span></a>}
      {!loading && !error && items.length > 1 && <div className="home-notice-navigation"><span>{index + 1}<span className="home-notice-count"> / {items.length}</span></span><button aria-label="Previous announcement" onClick={() => setSelected((index - 1 + items.length) % items.length)}>‹</button><button aria-label="Next announcement" onClick={() => setSelected((index + 1) % items.length)}>›</button></div>}
    </div>
  </section>;
}
