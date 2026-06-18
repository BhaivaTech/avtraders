// src/pages/admin/AdminAnalytics.jsx
// Recharts-based analytics charts for the admin panel. Fetches payments and chat lists,
// aggregates them client-side by date, and renders line + bar + pie charts
// using recharts.

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { api } from '../../lib/api.js';

const TONES = {
  primary:   '#3b82f6',
  secondary: '#8b5cf6',
  success:   '#22c55e',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  slate:     '#64748b',
};
const PIE_COLORS = [TONES.success, TONES.warning, TONES.danger, TONES.slate];

/* ── helpers ── */
function fmtDate(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function toISODate(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toISOString().slice(0, 10);
}

function aggregateByDate(rows, dateKey = 'created_at') {
  const map = new Map();
  rows.forEach((row) => {
    const key = toISODate(row[dateKey] || row.created_at || row.date);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: fmtDate(date), count }));
}

function aggregatePaymentsByDate(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = toISODate(row.created_at);
    map.set(key, (map.get(key) || 0) + (Number(row.amount) || 0));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: fmtDate(date), amount }));
}

function aggregateStatus(rows, key = 'status') {
  const map = new Map();
  rows.forEach((r) => {
    const v = r[key] || 'unknown';
    map.set(v, (map.get(v) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

/* ── chart card ── */
function ChartCard({ title, children, isLoading }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 320,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#334155' }}>{title}</h3>
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading…
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ── page ── */
export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [chatsRes, payRes] = await Promise.all([
          api.get('/chat/all?limit=200', { withCredentials: true }),
          api.get('/admin/payments?limit=200', { withCredentials: true }),
        ]);
        if (!cancelled) {
          setChats(chatsRes.data || []);
          setPayments(payRes.data?.rows || payRes.data || []);
        }
      } catch (err) {
        console.error('Analytics load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const messageTrend = useMemo(() => aggregateByDate(chats), [chats]);
  const paymentTrend = useMemo(() => aggregatePaymentsByDate(payments), [payments]);
  const payStatusPie = useMemo(() => aggregateStatus(payments), [payments]);

  return (
    <div className="admin-page" data-admin-page="analytics">
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
        Analytics
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <ChartCard title="Messages Over Time" isLoading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={messageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Messages"
                stroke={TONES.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Volume Over Time" isLoading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} />
              <Legend />
              <Bar dataKey="amount" name="Revenue (₹)" fill={TONES.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Status Breakdown" isLoading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={payStatusPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {payStatusPie.map((_entry, i) => (
                  <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
