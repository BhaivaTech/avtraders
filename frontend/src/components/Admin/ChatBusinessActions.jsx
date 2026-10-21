import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api.js';
import toast from '../../lib/toast.js';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import './ChatBusinessActions.css';

const DEFAULT_TRACK_LINK = 'https://www.vrlgroup.in/Tracking/TrackShipment';
const QUOTE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function SendDialog({ mode, chat, onClose, onSent }) {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [lr, setLr] = useState('');
  const [link, setLink] = useState(DEFAULT_TRACK_LINK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const dialogRef = useRef(null);
  const sending = useRef(false);
  const quotation = mode === 'quotation';
  const title = quotation ? 'Send quotation' : 'Send tracking';
  useFocusTrap(dialogRef);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => { if (event.key === 'Escape' && !sending.current) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  useEffect(() => {
    if (!file?.type.startsWith('image/')) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    setError('');
    if (quotation) {
      if (!file || !QUOTE_TYPES.includes(file.type) || file.size > 15 * 1024 * 1024) return setError('Choose a PDF, JPG, PNG or WebP file up to 15 MB.');
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 1000000) return setError('Enter an amount greater than ₹0 and no more than ₹10,00,000.');
    } else {
      if (!lr.trim() || lr.trim().length > 50) return setError('Enter an LR / tracking number up to 50 characters.');
      try { if (!['http:', 'https:'].includes(new URL(link.trim()).protocol)) throw new Error(); }
      catch { return setError('Enter a valid http or https tracking link.'); }
    }
    sending.current = true; setBusy(true);
    try {
      if (quotation) {
        const data = new FormData();
        data.append('chat_id', String(chat.id)); data.append('amount', amount);
        data.append('file', file); data.append('original_name', file.name);
        await api.post('/quotes/upload', data, { headers: { 'Content-Type': undefined } });
      } else {
        await api.post('/chat/lr', { chat_id: chat.id, lr_number: lr.trim(), tracking_link: link.trim() });
      }
      toast.success(quotation ? 'Quotation sent in this chat.' : 'Tracking sent. Conversation marked Sent.');
      onClose();
      Promise.resolve(onSent?.(chat.id)).catch(() => {});
    } catch (ex) {
      const data = ex.response?.data;
      setError(typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : 'Could not send. Please try again.');
    } finally { sending.current = false; setBusy(false); }
  }

  return createPortal(<div className="chat-business-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !sending.current) onClose(); }}>
    <section ref={dialogRef} className="chat-business-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-business-title">
      <header><div><p>Send directly in this conversation</p><h2 id="chat-business-title">{title}</h2></div><button type="button" aria-label="Close popup" onClick={onClose} disabled={busy}>×</button></header>
      <div className="chat-business-recipient"><span>To</span><strong>{chat.name || 'Farmer'}</strong><span>+91 {chat.mobile}</span></div>
      {error && <p className="chat-business-error" role="alert">{error}</p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {quotation ? <>
            <label>Quotation amount (₹)<input type="number" min="0.01" max="1000000" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="e.g. 1250" /></label>
            <label>Quotation file<input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={event => { setFile(event.target.files?.[0] || null); setError(''); }} /></label>
            <p className="chat-business-hint">PDF, JPG, PNG or WebP · maximum 15 MB</p>
            {file && <div className="chat-business-preview">{preview && <img src={preview} alt="Quotation preview" />}<strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB{amount ? ` · ₹${Number(amount).toLocaleString('en-IN')}` : ''}</span></div>}
          </> : <>
            <label>LR / tracking number<input required maxLength={50} value={lr} onChange={event => setLr(event.target.value)} placeholder="Enter the consignment number" /></label>
            <label>Tracking link<input type="url" required maxLength={500} value={link} onChange={event => setLink(event.target.value)} /></label>
            <p className="chat-business-hint">VRL is prefilled. You can use another courier’s tracking link.</p>
            <p className="chat-business-preview">Tracking details will appear in this conversation and the chat will be marked <strong>Sent</strong>.</p>
          </>}
        </fieldset>
        <footer><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="chat-business-primary" type="submit" disabled={busy || (quotation ? !file || !amount : !lr.trim())}>{busy ? 'Sending…' : title}</button></footer>
      </form>
    </section>
  </div>, document.body);
}

export default function ChatBusinessActions({ chat, onSent, disabled = false }) {
  const { hasPermission, loading } = useAdminAuth();
  const [mode, setMode] = useState(null);
  const close = React.useCallback(() => setMode(null), []);
  if (loading || (!hasPermission('quotations') && !hasPermission('chats'))) return null;
  return <>
    <div className="chat-business-toolbar" aria-label="Send to this contact">
      <span>Send to this contact</span>
      {hasPermission('quotations') && <button type="button" disabled={disabled} onClick={() => setMode('quotation')}>Send quotation</button>}
      {hasPermission('chats') && <button type="button" disabled={disabled} onClick={() => setMode('tracking')}>Send tracking</button>}
    </div>
    {mode && <SendDialog mode={mode} chat={chat} onClose={close} onSent={onSent} />}
  </>;
}
