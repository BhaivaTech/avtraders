import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import './AdminDealers.css';

export default function AdminDealers() {
  const [status, setStatus] = useState('pending');
  const [dealers, setDealers] = useState([]);
  const [pending, setPending] = useState(0);
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function load() {
    try {
      const applications = await api.get('/admin/dealers', { params: { status } });
      setDealers(applications.data.dealers); setPending(applications.data.pending);
    } catch (ex) { setError(ex.response?.data?.message || 'Unable to load dealer portal'); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [status]);
  async function review(id) {
    setBusy(true); setError(''); setReason('');
    try { setDetail((await api.get(`/admin/dealers/${id}`)).data); }
    catch (ex) { setError(ex.response?.data?.message || 'Unable to open application'); }
    finally { setBusy(false); }
  }
  async function decide(action) {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.post(`/admin/dealers/${detail.dealer.id}/${action}`, { reason });
      setDetail(null);
      setMessage(result.data.notification_warning ? 'Decision saved. A notification could not be delivered; check the messaging configuration and server logs.' : 'Decision saved and dealer notified.');
      await load();
    } catch (ex) { setError(ex.response?.data?.message || 'Unable to save decision'); }
    finally { setBusy(false); }
  }
  async function download(doc) {
    try {
      const result = await api.get(`/admin/dealers/${detail.dealer.id}/documents/${doc.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(result.data); const link = document.createElement('a');
      link.href = url; link.download = doc.file_name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Unable to download document'); }
  }
  return <section className="dealer-admin">
    <header><div><p>AV Agro Distribution</p><h1>Dealer portal</h1></div><strong>{pending} pending application{pending === 1 ? '' : 's'}</strong></header>
    {error && <p role="alert" className="dealer-admin-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div className="dealer-admin-grid"><section className="dealer-admin-card">
      <h2>Applications</h2><label>Status <select value={status} onChange={e => { setStatus(e.target.value); setDetail(null); }}>
        {['pending', 'approved', 'rejected', 'all'].map(s => <option key={s}>{s}</option>)}
      </select></label><button onClick={load} disabled={busy}>Refresh</button>
      <div className="dealer-admin-table"><table><thead><tr><th>Dealer / firm</th><th>Phone</th><th>Status</th><th>Review</th></tr></thead><tbody>
        {dealers.map(d => <tr key={d.id}><td><strong>{d.name}</strong><br />{d.firm_name}</td><td>{d.phone}</td><td>{d.status}</td><td><button disabled={busy} onClick={() => review(d.id)}>View</button></td></tr>)}
      </tbody></table></div>{!dealers.length && <p>No {status === 'all' ? '' : status} applications.</p>}
    </section><section className="dealer-admin-card"><h2>Product catalogue</h2><p>Approved distributors can browse published products, pack sizes and current prices in their dashboard.</p><p>The super admin manages products and categories from the Products menu.</p>    </section></div>
    {detail && <section className="dealer-admin-card"><button onClick={() => setDetail(null)}>Close application</button><h2>{detail.dealer.firm_name}</h2>
      <dl>{[['Dealer', detail.dealer.name], ['Mobile', detail.dealer.phone], ['Email', detail.dealer.email || 'Not provided'], ['GST', detail.dealer.gst], ['Address', `${detail.dealer.village_post}, ${detail.dealer.taluk}, ${detail.dealer.district} — ${detail.dealer.pincode}`], ['Status', detail.dealer.status], ['Rejection reason', detail.dealer.rejection_reason || '—']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <h3>Verification documents</h3>{detail.documents.map(doc => <button key={doc.id} onClick={() => download(doc)}>{doc.type}: {doc.file_name}</button>)}
      {detail.dealer.status === 'pending' && <div className="dealer-admin-decision"><button disabled={busy} onClick={() => decide('approve')}>Approve dealer</button><label>Reason for rejection<textarea maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={busy || !reason.trim()} onClick={() => decide('reject')}>Reject application</button></div>}
      <h3>Audit history</h3><ul>{detail.audit.map(a => <li key={a.id}>{a.action} · {a.actor_id} · {a.created_at ? new Date(a.created_at).toLocaleString() : ''}<br />{a.note}</li>)}</ul>
    </section>}
  </section>;
}
