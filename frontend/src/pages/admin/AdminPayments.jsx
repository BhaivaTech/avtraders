// src/pages/admin/AdminPayments.jsx
// Payments dashboard — recorded payments with status filtering.

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';

const PAYMENT_STATUSES = ['all', 'pending', 'success', 'failed'];

function StatusBadge({ status }) {
  const tone =
    status === 'success' ? 'success' :
    status === 'failed'  ? 'danger' :
    status === 'pending' ? 'warn' : 'ghost';
  return <span className={`badge ${tone}`}>{status?.toUpperCase()}</span>;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payStatusFilter, setPayStatusFilter] = useState('all');

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

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payStatusFilter]);

  return (
    <div className="admin-page" data-admin-page="payments">
      <div className="admin-page-head">
        <div>
          <h1>Payment History</h1>
          <p className="muted">Recorded payments across PhonePe / UPI / manual entries.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              className={'chip ' + (payStatusFilter === s ? 'active' : '')}
              onClick={() => setPayStatusFilter(s)}
            >
              {s}
            </button>
          ))}
          <button className="btn ghost" style={{ fontSize: 12 }} onClick={loadPayments}>
            Refresh
          </button>
        </div>

        {payLoading ? (
          <div className="loading">Loading payments…</div>
        ) : payments.length === 0 ? (
          <div className="admin-empty">
            <div className="title">No payments</div>
            <p>{payStatusFilter !== 'all' ? `No ${payStatusFilter} payments found.` : 'No payments found.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Mobile</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Txn ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.farmer_name || '—'}</strong></td>
                    <td>{p.farmer_mobile || '—'}</td>
                    <td>₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td>{p.provider || '—'}</td>
                    <td className="muted">{p.txn_id || '—'}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
