// src/pages/admin/AdminQuotations.jsx
// Quotations management — list, search and select a farmer chat,
// then upload a quotation PDF / image or send LR (VRL) tracking
// details. Carved out of the monolithic Admin.jsx quotation + LR
// slideover panels during the admin restructure ferment.
//
// Self-contained: manages its own state, calls the API directly,
// and renders its own JSX. Receives no props.
//
// Pure behaviour-preserving extraction: every handler, helper, and
// className is identical to the original inline implementation in
// Admin.jsx (panel === 'quote' and panel === 'lr' blocks).

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';
import '../Admin.css';

/* ------------ constants ------------ */
const DEFAULT_TRACK_LINK = 'http://www.vrlgroup.in/track_consignment.aspx';

/* ------------ helpers ------------ */
async function copyText(txt = '') {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(txt || '');
    } else {
      const ta = document.createElement('textarea');
      ta.value = txt || '';
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  } catch (e) {
    console.error('copyText failed', e);
  }
}

/* ------------ inline icon set (mirrors Admin.jsx Icon.Close / Icon.Copy) ------------ */
const Icon = {
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

/* ------------ display components (QuoteChip / LRChip) ------------ */
function QuoteChip({ amount, fileName, fileUrl, onCopy }) {
  return (
    <div className="quote-chip">
      <div className="q-dot">Q</div>
      <div className="q-details">
        <div className="q-title">Quotation</div>
        {amount != null && amount !== '' && (
          <div className="q-amt">₹{amount}</div>
        )}
        {(fileName || fileUrl) && (
          <div className="q-file-row">
            {!!fileName && (
              <div className="q-file" title={fileName}>
                {fileName}
              </div>
            )}
            {fileUrl && (
              <a
                className="btn tiny"
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            )}
            {onCopy && fileName && (
              <button
                className="icon-btn ghost"
                title="Copy file name"
                onClick={async () => {
                  await copyText(fileName);
                  toast.success('File name copied');
                }}
              >
                <Icon.Copy />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LRChip({ lr, track }) {
  const link = track || DEFAULT_TRACK_LINK;
  return (
    <div className="lr-chip">
      <div className="lr-left">
        <div className="lr-title">LR Number</div>
        <div className="lr-no" title={lr || '-'}>
          {lr || '-'}
        </div>
      </div>
      <div className="lr-actions">
        <button
          className="icon-btn ghost"
          title="Copy LR"
          onClick={async () => {
            if (lr) {
              await copyText(lr);
              toast.success('LR number copied');
            }
          }}
          disabled={!lr}
        >
          <Icon.Copy />
        </button>
        <a
          className="btn tiny"
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          Track
        </a>
      </div>
      <style>{`
        .lr-chip{
          display:flex;align-items:center;justify-content:space-between;gap:10px;
          background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:10px 12px;
        }
        .lr-title{font-size:12px;color:#374151;margin-bottom:2px}
        .lr-no{font-weight:700;letter-spacing:.2px;word-break:break-all}
        .lr-actions{display:flex;align-items:center;gap:8px}
        .lr-chip .btn.tiny{padding:6px 10px;border-radius:10px}
      `}</style>
    </div>
  );
}

/* =================================================================== */
/* Main page                                                          */
/* =================================================================== */
export default function AdminQuotations() {
  const navigate = useNavigate();

  // --- farmer / chat lookup -----------------------------------------
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sel, setSel] = useState(null);

  // --- quotation form ------------------------------------------------
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

  // --- LR form -------------------------------------------------------
  const [lr, setLr] = useState('');
  const [track, setTrack] = useState(DEFAULT_TRACK_LINK);
  const [busy, setBusy] = useState(false);

  const debounceRef = useRef(null);

  /* ---------- farmer / chat lookup ---------- */
  async function loadChats(q) {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      params.set('limit', 30);
      const r = await api.get(`/chat/all?${params.toString()}`, {
        withCredentials: true,
      });
      setChats(r.data || []);
    } catch (err) {
      console.error('loadChats error:', err);
      setChats([]);
      toast.error('Failed to load chats.');
    } finally {
      setSearchLoading(false);
    }
  }

  // Debounced re-fetch on query change (same UX as Admin.jsx inbox).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadChats(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Initial load
  useEffect(() => {
    loadChats('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- handlers ---------- */
  async function uploadQuote() {
    if (busy) return;
    if (!sel) {
      toast.error('Select a chat first.');
      return;
    }
    if (!file) {
      toast.error('Choose a PDF/JPG/PNG first.');
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.append('chat_id', sel.id);
    fd.append('amount', amount || 0);
    fd.append('file', file);
    fd.append('original_name', file.name);
    try {
      await api.post('/quotes/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      toast.success('Quotation uploaded.');
      setAmount('');
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFile(null);
      setFileName('');
      setFileUrl('');
    } catch (err) {
      console.error('uploadQuote error:', err);
      toast.error('Could not upload quotation.');
    } finally {
      setBusy(false);
    }
  }

  async function sendLR() {
    if (busy) return;
    if (!sel || !lr) return;
    setBusy(true);
    const link = track || DEFAULT_TRACK_LINK;
    try {
      await api.post(
        '/chat/lr',
        { chat_id: sel.id, lr_number: lr, tracking_link: link },
        { withCredentials: true },
      );
      toast.success('LR sent.');
      setLr('');
    } catch (err) {
      console.error('sendLR error:', err);
      toast.error('Failed to send LR.');
    } finally {
      setBusy(false);
    }
  }

  function clearSelection() {
    setSel(null);
    setAmount('');
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileName('');
    setFileUrl('');
    setLr('');
    setTrack(DEFAULT_TRACK_LINK);
  }

  /* =================================================================== */
  /* Render                                                              */
  /* =================================================================== */
  return (
    <div className="admin-page" data-admin-page="quotations">
      <div className="admin-page-head">
        <h1>Quotations</h1>
        <p className="muted">
          Search for a farmer chat and upload a quotation PDF / image,
          or send VRL LR + tracking details.
        </p>
      </div>

      <div className="quote-layout">
        {/* --------------------- LEFT: farmer lookup --------------------- */}
        <div className="quote-lookup">
          <div className="search">
            <Icon.Search />
            <input
              placeholder="Search by name, mobile or last message…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn ghost tiny" onClick={() => loadChats(query)}>
              Refresh
            </button>
          </div>

          <div className="list-inner">
            {searchLoading && chats.length === 0 ? (
              <div className="muted" style={{ padding: 8 }}>Loading…</div>
            ) : chats.length === 0 ? (
              <div className="muted" style={{ padding: 8 }}>No chats found.</div>
            ) : (
              chats.map((c) => {
                const active = sel && sel.id === c.id;
                const initials = (c.name || 'U')
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join('');
                return (
                  <div
                    key={c.id}
                    className={'row ' + (active ? 'active' : '')}
                    onClick={() => setSel(c)}
                  >
                    <div className="avatar">{initials || 'U'}</div>
                    <div className="meta">
                      <div className="name">{c.name || c.mobile || 'Unknown'}</div>
                      <div className="preview">
                        {c.last_message || c.mobile || ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --------------------- RIGHT: forms --------------------- */}
        <div className="quote-forms">
          {!sel ? (
            <p className="muted">Select a chat to send a quotation or LR.</p>
          ) : (
            <>
              <div className="quote-sel-head">
                <div>
                  <div className="q-name">
                    {sel.name || sel.mobile || 'Selected chat'}
                  </div>
                  <div className="q-sub">Chat ID: {sel.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="btn primary"
                    title="Open this chat in the Inbox"
                    onClick={() =>
                      navigate('/admin/inbox', { state: { chat: sel } })
                    }
                  >
                    Go to chat →
                  </button>
                  <button
                    className="icon-btn"
                    title="Clear selection"
                    onClick={clearSelection}
                  >
                    <Icon.Close />
                  </button>
                </div>
              </div>

              {/* Quotation panel */}
              <section className="quote-section">
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>
                  Send Quotation
                </h3>

                <label>Quotation Amount (₹)</label>
                <input
                  className="input"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.]/g, ''))
                  }
                  placeholder="e.g., 1250"
                />

                <label style={{ marginTop: 10 }}>
                  Upload Quotation (PDF/JPEG/PNG)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (fileUrl) URL.revokeObjectURL(fileUrl);
                    setFile(f);
                    setFileName(f.name);
                    setFileUrl('');
                  }}
                />
                {fileName && (
                  <div className="file-hint">📎 {fileName}</div>
                )}

                {fileName && (
                  <div style={{ marginTop: 10 }}>
                    <QuoteChip
                      amount={amount}
                      fileName={fileName}
                      fileUrl={fileUrl}
                    />
                  </div>
                )}

                <button
                  className="btn primary"
                  style={{ marginTop: 10 }}
                  onClick={uploadQuote}
                  disabled={busy || !file}
                >
                  {busy ? 'Uploading…' : 'Upload Quotation'}
                </button>

                <div className="muted" style={{ marginTop: 8 }}>
                  This will also appear inside the chat as{' '}
                  <b>Quotation</b> with amount and file name (with an{' '}
                  <b>Open</b> button).
                </div>
              </section>

              {/* LR / dispatch panel */}
              <section className="quote-section">
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>
                  Dispatch (VRL / LR)
                </h3>

                <label>LR Number (VRL)</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <input
                    className="input"
                    value={lr}
                    onChange={(e) => setLr(e.target.value)}
                    placeholder="e.g., VRL123456"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="icon-btn ghost"
                    title="Copy LR"
                    onClick={async () => {
                      await copyText(lr || '');
                      if (lr) toast.success('LR number copied');
                    }}
                    disabled={!lr}
                  >
                    <Icon.Copy />
                  </button>
                </div>

                <label style={{ marginTop: 10 }}>Tracking Link</label>
                <input
                  className="input"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder={DEFAULT_TRACK_LINK}
                />

                {lr && (
                  <div style={{ marginTop: 10 }}>
                    <LRChip lr={lr} track={track} />
                  </div>
                )}

                <button
                  className="btn info"
                  style={{ marginTop: 10 }}
                  onClick={sendLR}
                  disabled={busy || !lr}
                >
                  {busy ? 'Sending…' : 'Send LR & Mark Sent'}
                </button>

                <div className="muted" style={{ marginTop: 8 }}>
                  This will send LR details in chat and mark this chat as{' '}
                  <b>Sent</b> so you can track dispatched orders quickly.
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
