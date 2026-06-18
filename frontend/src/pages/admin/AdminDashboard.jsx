// src/pages/admin/AdminDashboard.jsx
// Overview / home page for the admin panel. Displays summary KPI cards
// fetched from existing API endpoints and provides quick links to deeper
// admin sections.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { resolveApiOrigin } from '@/lib/endpoint';

/* ── stat card ── */
function StatCard({ label, value, tone = 'neutral', href, isLoading }) {
  const toneStyles = {
    neutral:  { borderColor: '#e2e8f0', valueColor: '#0f172a' },
    primary:  { borderColor: '#3b82f6', valueColor: '#2563eb' },
    success:  { borderColor: '#22c55e', valueColor: '#16a34a' },
    danger:   { borderColor: '#ef4444', valueColor: '#dc2626' },
    warning:  { borderColor: '#f59e0b', valueColor: '#d97706' },
  };
  const t = toneStyles[tone] || toneStyles.neutral;

  const body = (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${t.borderColor}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.03em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: t.valueColor, lineHeight: 1.1 }}>
        {isLoading ? '…' : value}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
        {body}
      </Link>
    );
  }
  return body;
}

/* ── quick-link tile ── */
function QuickLink({ to, label, icon }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        textDecoration: 'none',
        color: '#0f172a',
        fontWeight: 600,
        fontSize: 14,
        transition: 'box-shadow .15s, transform .1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      {label}
    </Link>
  );
}

/* ── page ── */
export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalFarmers: 0, chatsToday: 0, totalRevenue: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingQuotations, setPendingQuotations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);

        // 1) admin stats
        const statsRes = await api.get('/admin/stats', { withCredentials: true });
        if (!cancelled && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }

        // 2) unread count (lightweight — limit 1, just need total from headers or count)
        const unreadRes = await api.get('/chat/all?status=UNREAD&limit=1', {
          withCredentials: true,
        });
        if (!cancelled) {
          // backend may return total count in a header or we count the array
          const list = unreadRes.data || [];
          setUnreadCount(list.length > 0 ? (unreadRes.headers['x-total-count'] ? parseInt(unreadRes.headers['x-total-count'], 10) : list.length) : 0);
        }

        // 3) pending quotations count — use overall chat list and filter locally
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

  return (
    <div className="admin-page" data-admin-page="dashboard">
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
        Dashboard
      </h1>

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Unread Messages"
          value={unreadCount}
          tone="danger"
          href="/admin/inbox"
          isLoading={loading}
        />
        <StatCard
          label="Messages Today"
          value={stats.chatsToday}
          tone="primary"
          isLoading={loading}
        />
        <StatCard
          label="Pending Quotations"
          value={pendingQuotations}
          tone="warning"
          href="/admin/quotations"
          isLoading={loading}
        />
        <StatCard
          label="Total Farmers"
          value={stats.totalFarmers}
          tone="neutral"
          isLoading={loading}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          tone="success"
          href="/admin/payments"
          isLoading={loading}
        />
      </div>

      {/* Quick links */}
      <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#334155' }}>
        Quick Links
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <QuickLink to="/admin/inbox"      label="Inbox"       icon="💬" />
        <QuickLink to="/admin/quotations"  label="Quotations"  icon="📄" />
        <QuickLink to="/admin/payments"    label="Payments"    icon="₹" />
        <QuickLink to="/admin/tracking"    label="Tracking"    icon="🚚" />
        <QuickLink to="/admin/users"       label="Users"       icon="👥" />
        <QuickLink to="/admin/analytics"   label="Analytics"   icon="📊" />
        <QuickLink to="/admin/settings"    label="Settings"    icon="⚙️" />
      </div>
    </div>
  );
}
