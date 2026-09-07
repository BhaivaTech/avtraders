// src/pages/admin/AdminDashboard.jsx
// Overview / home page for the admin panel. Renders KPI cards plus
// analytical insights (14-day message activity, chat pipeline,
// revenue breakdown, top farmers) from GET /api/admin/insights.

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

const EMPTY_INSIGHTS = {
  farmers: { total: 0, blocked: 0, new_7d: 0, new_30d: 0 },
  chats: { UNREAD: 0, READ: 0, SENT: 0, messages_today: 0 },
  activity_14d: [],
  revenue: { total: 0, today: 0, last7d: 0, last30d: 0, avg_order: 0, orders: 0 },
  top_farmers_7d: [],
  quotations_total: 0,
};

/* ── animated counter hook ── */
function useCountUp(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!Number.isFinite(target)) { setDisplay(0); return; }
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return display;
}

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ── stat card ── */
function StatCard({ label, value, sub, tone = 'neutral', href, isLoading, delay = 0 }) {
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);
  const displayValue = isLoading ? '…' : (numericValue !== null ? animatedValue : value);

  const inner = (
    <>
      <div className="stat-card-body">
        <div className="label">{label}</div>
        <div className="value">{displayValue}</div>
        {!isLoading && sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </>
  );

  const cls = `stat-card tone-${tone}`;
  const style = { animationDelay: `${delay}ms` };
  if (href) {
    return (
      <Link to={href} className={cls} style={style}>
        {inner}
        <div className="stat-card-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    );
  }
  return <div className={cls} style={style}>{inner}</div>;
}

/* ── small insight tile ── */
function InsightTile({ label, value, hint, tone = 'neutral' }) {
  return (
    <div className={`insight-tile tone-${tone}`}>
      <div className="insight-tile-value">{value}</div>
      <div className="insight-tile-label">{label}</div>
      {hint && <div className="insight-tile-hint">{hint}</div>}
    </div>
  );
}

/* ── quick-link tile ── */
function QuickLink({ to, label, icon, delay = 0 }) {
  return (
    <Link to={to} className="quick-link" style={{ animationDelay: `${delay}ms` }}>
      <span className="icon">{icon}</span>
      <span className="quick-link-label">{label}</span>
      <span className="quick-link-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}

/* ── 14-day message activity chart (pure CSS bars) ── */
function ActivityChart({ data }) {
  if (!data?.length) {
    return <div className="muted">No message activity yet.</div>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="activity-chart">
      {data.map((d, i) => (
        <div key={i} className="activity-col" title={`${d.date} — ${d.count} messages`}>
          <div className="activity-count">{d.count || ''}</div>
          <div
            className={'activity-bar' + (i === data.length - 1 ? ' today' : '')}
            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
          />
          <div className="activity-day">{i % 2 === 0 || i === data.length - 1 ? d.day : ''}</div>
        </div>
      ))}
    </div>
  );
}

/* ── chat pipeline (UNREAD → READ → SENT) ── */
function ChatPipeline({ chats }) {
  const { UNREAD = 0, READ = 0, SENT = 0 } = chats;
  const total = UNREAD + READ + SENT;
  const segs = [
    { label: 'Unread', value: UNREAD, cls: 'unread' },
    { label: 'Read', value: READ, cls: 'read' },
    { label: 'Dispatched', value: SENT, cls: 'sent' },
  ];
  return (
    <div className="pipeline">
      <div className="pipeline-bar">
        {segs.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.cls}
                className={`pipeline-seg ${s.cls}`}
                style={{ width: `${(s.value / Math.max(total, 1)) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            )
        )}
        {total === 0 && <div className="pipeline-seg empty" style={{ width: '100%' }} />}
      </div>
      <div className="pipeline-legend">
        {segs.map((s) => (
          <span key={s.cls} className="pipeline-legend-item">
            <span className={`dot ${s.cls}`} />
            {s.label}
            <b>{s.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── page ── */
export default function AdminDashboard() {
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const r = await api.get('/admin/insights', { withCredentials: true });
        if (!cancelled && r.data?.ok && r.data.insights) {
          setInsights({ ...EMPTY_INSIGHTS, ...r.data.insights });
        }
      } catch (err) {
        console.error('Dashboard insights load error', err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const greeting =
    currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rev = insights.revenue || EMPTY_INSIGHTS.revenue;
  const farmers = insights.farmers || EMPTY_INSIGHTS.farmers;

  return (
    <div className="admin-page" data-admin-page="dashboard">
      {/* Welcome banner */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-text">
          <h1>{greeting}, Admin</h1>
          <p className="dashboard-date">{dateStr}</p>
        </div>
        <div className="dashboard-welcome-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>AV Traders Admin Panel</span>
        </div>
      </div>

      {loadError && (
        <div className="dashboard-error">
          Could not load insights.{' '}
          <button className="btn tiny ghost" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="stat-grid">
        <StatCard
          label="Unread Chats"
          value={insights.chats.UNREAD}
          tone="danger"
          href="/admin/inbox"
          isLoading={loading}
          delay={0}
        />
        <StatCard
          label="Messages Today"
          value={insights.chats.messages_today}
          tone="primary"
          isLoading={loading}
          delay={60}
        />
        <StatCard
          label="Awaiting Dispatch"
          value={insights.chats.SENT}
          sub="chats marked SENT"
          tone="warning"
          href="/admin/quotations"
          isLoading={loading}
          delay={120}
        />
        <StatCard
          label="Total Farmers"
          value={farmers.total}
          sub={`+${farmers.new_7d} this week`}
          tone="neutral"
          isLoading={loading}
          delay={180}
        />
        <StatCard
          label="Revenue (30 days)"
          value={rupees(rev.last30d)}
          sub={`${rupees(rev.total)} all time`}
          tone="success"
          href="/admin/payments"
          isLoading={loading}
          delay={240}
        />
      </div>

      {/* Analytics row */}
      <h2>Insights</h2>
      <div className="dash-panels">
        {/* Message activity */}
        <section className="dash-panel dash-panel-wide">
          <div className="dash-panel-head">
            <h3>Message Activity</h3>
            <span className="dash-panel-hint">last 14 days</span>
          </div>
          {loading ? <div className="muted">Loading…</div> : <ActivityChart data={insights.activity_14d} />}
        </section>

        {/* Chat pipeline */}
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h3>Chat Pipeline</h3>
            <span className="dash-panel-hint">all conversations</span>
          </div>
          {loading ? <div className="muted">Loading…</div> : <ChatPipeline chats={insights.chats} />}
          <div className="dash-panel-foot">
            <Link to="/admin/inbox" className="btn tiny ghost">Open inbox →</Link>
          </div>
        </section>
      </div>

      {/* Revenue + growth tiles */}
      <div className="insight-grid">
        <InsightTile label="Revenue Today" value={loading ? '…' : rupees(rev.today)} tone="success" />
        <InsightTile label="Revenue This Week" value={loading ? '…' : rupees(rev.last7d)} tone="success" />
        <InsightTile label="Avg Order Value" value={loading ? '…' : rupees(rev.avg_order)} hint={`${rev.orders} paid orders`} />
        <InsightTile label="New Farmers (30d)" value={loading ? '…' : farmers.new_30d} hint={`+${farmers.new_7d} in last 7 days`} tone="primary" />
        <InsightTile label="Blocked Farmers" value={loading ? '…' : farmers.blocked} hint={farmers.blocked > 0 ? 'review in inbox' : 'all clear'} tone={farmers.blocked > 0 ? 'warning' : 'neutral'} />
        <InsightTile label="Quotations Sent" value={loading ? '…' : insights.quotations_total} tone="neutral" />
      </div>

      {/* Top farmers */}
      <h2>Most Active Farmers (7 days)</h2>
      <div className="top-farmers">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : insights.top_farmers_7d.length === 0 ? (
          <div className="muted">No farmer activity in the last 7 days.</div>
        ) : (
          insights.top_farmers_7d.map((f, i) => {
            const maxMsgs = insights.top_farmers_7d[0].msgs || 1;
            return (
              <div key={f.mobile} className="top-farmer-row">
                <span className="rank">{i + 1}</span>
                <span className="tf-name">{f.name}</span>
                <span className="tf-mobile">+91 {f.mobile}</span>
                <span className="tf-bar-wrap">
                  <span className="tf-bar" style={{ width: `${(f.msgs / maxMsgs) * 100}%` }} />
                </span>
                <span className="tf-msgs">{f.msgs} msgs</span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick links */}
      <h2>Quick Links</h2>
      <div className="quick-grid">
        <QuickLink to="/admin/inbox"      label="Inbox"       icon="💬" delay={0} />
        <QuickLink to="/admin/quotations"  label="Quotations"  icon="📄" delay={40} />
        <QuickLink to="/admin/payments"    label="Payments"    icon="₹" delay={80} />
        <QuickLink to="/admin/tracking"    label="Tracking"    icon="🚚" delay={120} />
        <QuickLink to="/admin/users"       label="Users"       icon="👥" delay={160} />
        <QuickLink to="/admin/announcements" label="Announcements" icon="📢" delay={200} />
        <QuickLink to="/admin/analytics"   label="Analytics"   icon="📊" delay={240} />
        <QuickLink to="/admin/settings"    label="Settings"    icon="⚙️" delay={280} />
      </div>
    </div>
  );
}
