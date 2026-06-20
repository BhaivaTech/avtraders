// src/pages/admin/AdminPayments.jsx
// Payments dashboard — recorded payments with status filtering.
// Carved out of the monolithic Admin.jsx payments tab during the
// admin restructure ferment. Hits the `/admin/payments` endpoint
// and renders a simple status-filtered list.
//
// Self-contained: manages its own state, calls the API directly,
// and renders its own JSX. Receives no props.
//
// Pure behaviour-preserving extraction: every handler, helper, and
// className is identical to the original inline implementation in
// Admin.jsx (panel === 'payments' block).

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';
import '../Admin.css';

/* ------------ constants ------------ */
const PAYMENT_STATUSES = ['all', 'pending', 'success', 'failed'];

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payStatusFilter, setPayStatusFilter] = useState('all');

  /* ---------- payments loader ---------- */
  async function loadPayments() {
    setPayLoading(true);
    try {
      const r = await api.get('/admin/payments', {
        params: { status: payStatusFilter, limit: 100 },
        withCredentials: true,
      });
      setPayments(r.data?.rows || []);
    } catch (err) {
      console.error('loadPayments error:', err);
      setPayments([]);
      toast.error('Failed to load payments.');
    } finally {
      setPayLoading(false);
    }
  }

  // Re-fetch whenever the status filter changes (mirrors the
  // auto-refresh-on-filter behaviour of the original panel).
  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payStatusFilter]);

  return (
    <div className="admin-page" data-admin-page="payments">
      <div className="admin-page-head">
        <h1>Payment History</h1>
        <p className="muted">
          Recorded payments across PhonePe / UPI / manual entries.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              className={'chip ' + (payStatusFilter === s ? 'active' : '')}
              onClick={() => setPayStatusFilter(s)}
            >
              {s}
            </button>
          ))}
          <button
            className="btn ghost"
            style={{ fontSize: 12 }}
            onClick={loadPayments}
          >
            Refresh
          </button>
        </div>

        {payLoading ? (
          <div className="muted">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="muted">No payments found.</div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>
                  {p.farmer_name || p.farmer_mobile || '—'}
                </span>
                <span
                  style={{
                    color:
                      p.status === 'success'
                        ? '#16a34a'
                        : p.status === 'failed'
                        ? '#dc2626'
                        : '#d97706',
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  {p.status?.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                ₹{p.amount} · {p.provider} · {p.txn_id || 'No TxnID'} ·{' '}
                {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
