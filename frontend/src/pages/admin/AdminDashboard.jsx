// src/pages/admin/AdminDashboard.jsx
// Overview / home page for the admin panel. Displays summary KPI cards
// fetched from existing API endpoints and provides quick links to deeper
// admin sections.

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

/* ── animated counter hook ── */
function useCountUp(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
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

/* ── stat card ── */
function StatCard({ label, value, tone = 'neutral', href, isLoading, delay = 0 }) {
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);
  const displayValue = isLoading ? '…' : (numericValue !== null ? animatedValue : value);

  const inner = (
    <>
      <div className="stat-card-icon">
        {tone === 'danger' && <span className="pulse-dot" />}
      </div>
      <div className="stat-card-body">
        <div className="label">{label}</div>
        <div className="value">{displayValue}</div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={`stat-card tone-${tone}`} style={{ animationDelay: `${delay}ms` }}>
        {inner}
        <div className="stat-card-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    );
  }
  return (
    <div className={`stat-card tone-${tone}`} style={{ animationDelay: `${delay}ms` }}>
      {inner}
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

/* ── page ── */
export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalFarmers: 0, chatsToday: 0, totalRevenue: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingQuotations, setPendingQuotations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);

        const statsRes = await api.get('/admin/stats', { withCredentials: true });
        if (!cancelled && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }

        const unreadRes = await api.get('/chat/all?status=UNREAD&limit=1', {
          withCredentials: true,
        });
        if (!cancelled) {
          const list = unreadRes.data || [];
          setUnreadCount(list.length > 0 ? (unreadRes.headers['x-total-count'] ? parseInt(unreadRes.headers['x-total-count'], 10) : list.length) : 0);
        }

        const qRes = await api.get('/chat/all?status=SENT&limit=100', { withCredentials: true });
        if (!cancelled) {
          const list = qRes.data || [];
          setPendingQuotations(list.length);
        }
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  const greeting = currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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

      {/* KPI cards */}
      <div className="stat-grid">
        <StatCard
          label="Unread Messages"
          value={unreadCount}
          tone="danger"
          href="/admin/inbox"
          isLoading={loading}
          delay={0}
        />
        <StatCard
          label="Messages Today"
          value={stats.chatsToday}
          tone="primary"
          isLoading={loading}
          delay={60}
        />
        <StatCard
          label="Pending Quotations"
          value={pendingQuotations}
          tone="warning"
          href="/admin/quotations"
          isLoading={loading}
          delay={120}
        />
        <StatCard
          label="Total Farmers"
          value={stats.totalFarmers}
          tone="neutral"
          isLoading={loading}
          delay={180}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          tone="success"
          href="/admin/payments"
          isLoading={loading}
          delay={240}
        />
      </div>

      {/* Quick links */}
      <h2>Quick Links</h2>
      <div className="quick-grid">
        <QuickLink to="/admin/inbox"      label="Inbox"       icon="💬" delay={0} />
        <QuickLink to="/admin/quotations"  label="Quotations"  icon="📄" delay={40} />
        <QuickLink to="/admin/payments"    label="Payments"    icon="₹" delay={80} />
        <QuickLink to="/admin/tracking"    label="Tracking"    icon="🚚" delay={120} />
        <QuickLink to="/admin/users"       label="Users"       icon="👥" delay={160} />
        <QuickLink to="/admin/analytics"   label="Analytics"   icon="📊" delay={200} />
        <QuickLink to="/admin/settings"    label="Settings"    icon="⚙️" delay={240} />
      </div>
    </div>
  );
}
