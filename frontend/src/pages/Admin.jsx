// src/pages/Admin.jsx
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { io } from 'socket.io-client';
import { useRecorder } from '../lib/useRecorder.js';
import './Admin.css';

// Centralized endpoint helpers
import { resolveApiOrigin, buildMediaUrl } from '@/lib/endpoint';

/* ------------ constants ------------ */
const DEFAULT_TRACK_LINK = 'http://www.vrlgroup.in/track_consignment.aspx';
const ADMIN_EMAIL_ALLOWED = 'info.avtradersagriclinic@gmail.com';
const ADMIN_AUTH_KEY = 'adminAuth';
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const MAX_MEDIA_FILES = 15;

/* ------------ helpers ------------ */
const isMobileUA = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

const sameDay = (a, b) => {
  const d1 = new Date(a),
    d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dd = (n) => new Date(start(now).getTime() - n * 24 * 60 * 60 * 1000);
  const within7 = (date) => (start(now) - start(date)) / (24 * 60 * 60 * 1000) < 7;
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, dd(1))) return 'Yesterday';
  if (within7(d))
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  const z = (n) => String(n).padStart(2, '0');
  return `${z(d.getDate())}-${z(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// linkify plain URLs inside text
function linkify(text = '') {
  const esc = (s) =>
    s.replace(/[&<>"']/g, (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[c]),
    );
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  return esc(text).replace(re, (m) => {
    const href = m.startsWith('www.') ? `http://${m}` : m;
    return `<a href="${href}" target="_blank" rel="noreferrer">${m}</a>`;
  });
}

/* ---- filename helpers ---- */
function safeDecode(s = '') {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function nameFromUrlPath(url = '') {
  try {
    const u = new URL(url, resolveApiOrigin());
    const last = u.pathname.split('/').pop() || 'document';
    return safeDecode(last);
  } catch {
    const last = url.split('/').pop() || 'document';
    return safeDecode(last);
  }
}
async function fetchFilenameFromHeaders(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', credentials: 'include' });
    const cd = r.headers.get('content-disposition') || '';
    const m1 = cd.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/i);
    if (m1 && m1[1]) return safeDecode(m1[1].replace(/"/g, ''));
  } catch {}
  return null;
}
function parseMeta(m) {
  return typeof m.meta === 'string'
    ? JSON.parse(m.meta || '{}')
    : m.meta || {};
}
async function bestFilename(m, fileUrl) {
  const meta = parseMeta(m);
  const first =
    meta.original_name ||
    m.original_name ||
    m.original_filename ||
    m.file_name ||
    m.name ||
    meta.file_name ||
    meta.filename ||
    meta.name;
  if (first) return first;
  const fromHeader = await fetchFilenameFromHeaders(fileUrl);
  if (fromHeader) return fromHeader;
  return nameFromUrlPath(fileUrl);
}

/* ---- copy helper ---- */
async function copyText(txt = '') {
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch {}
    document.body.removeChild(ta);
  }
}

/* ---- LR text parser ---- */
function parseLRFromText(t = '') {
  const lrMatch = t.match(/LR\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
  const linkMatch = t.match(/Track\s*[:\-]?\s*(https?:\/\/\S+)/i);
  const lrNo = (lrMatch?.[1] || '').trim();
  const link = (linkMatch?.[1] || DEFAULT_TRACK_LINK).trim();
  return { lrNo, link, ok: !!lrNo };
}

/* ------------ inline icons ------------ */
const Icon = {
  Send: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
        fill="currentColor"
      />
    </svg>
  ),
  Mic: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19v3h2v-3h-2z"
        fill="currentColor"
      />
    </svg>
  ),
  Stop: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill="currentColor"
      />
    </svg>
  ),
  Reply: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M10 8V5L3 12l7 7v-3c7 0 10 3 11 7-1-9-6-13-11-13z"
        fill="currentColor"
      />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  ),
  Pause: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
    </svg>
  ),
  Down: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...p}>
      <path
        d="M12 5v13m0 0l-5-5m5 5l5-5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Rupee: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M5 5h14M5 9h14M12 9c-1.5 0-3 1-3 3s2 3 3 3h2l-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M3 7l9 5 9-5-9-5-9 5zm0 3l9 5 9-5M3 10v7l9 5 9-5v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Power: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M12 3v10M6.8 5.6a8 8 0 1010.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path
        d="M21 21l-4.3-4.3M10 18a8 8 0 110-16 8 8 0 010 16z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Cam: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M9 4l1.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h4L9 4zM12 17a4 4 0 100-8 4 4 0 000 8z"
        fill="currentColor"
      />
    </svg>
  ),
  Clip: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M16.5 6.5l-7.78 7.78a3 3 0 104.24 4.24l8.49-8.49a5 5 0 10-7.07-7.07L5.9 7.54"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Dots: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  Back: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v16h13a2 2 0 002-2V7a2 2 0 00-2-2zm0 18H8V7h11v16z"
        fill="currentColor"
      />
    </svg>
  ),
  Announcement: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M3 10v4a2 2 0 002 2h2l4 3v-14l-4 3H5a2 2 0 00-2 2zM18 9a3 3 0 010 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ------ small async file widgets ------ */
function AsyncFileCard({ m, fileUrl }) {
  const [name, setName] = React.useState(null);
  useEffect(() => {
    let ok = true;
    (async () => {
      const n = await bestFilename(m, fileUrl);
      if (ok) setName(n);
    })();
    return () => {
      ok = false;
    };
  }, [m.id, fileUrl]);
  const shown = name || 'document';
  const ext = (shown.split('.').pop() || '').toUpperCase();
  return (
    <div className="doc-card">
      <div className={`doc-icon ${ext === 'PDF' ? 'pdf' : ''}`}>
        {ext || 'FILE'}
      </div>
      <div className="doc-main">
        <div className="doc-title" title={shown}>
          {shown}
        </div>
        <div className="doc-meta">Tap to open</div>
      </div>
      <a
        className="doc-open"
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        download={shown}
      >
        Open
      </a>
    </div>
  );
}
function AsyncImageCaption({ m, fileUrl }) {
  const [name, setName] = React.useState(null);
  useEffect(() => {
    let ok = true;
    (async () => {
      const n = await bestFilename(m, fileUrl);
      if (ok) setName(n);
    })();
    return () => {
      ok = false;
    };
  }, [m.id, fileUrl]);
  if (!name) return null;
  return (
    <a
      className="img-caption"
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      download={name}
      title={name}
    >
      {name}
    </a>
  );
}
function QuoteChip({ m, fileUrl }) {
  const [fname, setFname] = React.useState('');
  const meta = parseMeta(m);
  useEffect(() => {
    let ok = true;
    (async () => {
      const n = fileUrl
        ? await bestFilename(m, fileUrl)
        : meta.original_name || meta.file_name || 'quotation';
      if (ok) setFname(n);
    })();
    return () => {
      ok = false;
    };
  }, [m.id, fileUrl]);
  const amt = meta?.amount ?? meta?.Amount ?? meta?.price ?? meta?.amt;
  return (
    <div className="quote-chip">
      <div className="q-dot">Q</div>
      <div className="q-details">
        <div className="q-title">Quotation</div>
        {amt != null && <div className="q-amt">₹{amt}</div>}
        {(fname || fileUrl) && (
          <div className="q-file-row">
            {!!fname && (
              <div className="q-file" title={fname}>
                {fname}
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
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- LR chip ---- */
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
              alert('LR number copied');
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

/* ------------ voice bubble ------------ */
function VoiceBubble({ src, mine }) {
  const aRef = useRef(null);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = aRef.current;
    if (!a) return;
    const onLoaded = () =>
      setDur(Number.isFinite(a.duration) ? Math.round(a.duration) : 0);
    const onTime = () => setCur(a.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setCur(a.duration || 0);
    };
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const a = aRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };
  const seek = (e) => {
    const a = aRef.current;
    if (!a || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
    a.currentTime = (x / r.width) * dur;
  };

  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;
  const fmt = (s = 0) =>
    Number.isFinite(s) && s > 0
      ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(
          2,
          '0',
        )}`
      : '0:00';

  return (
    <div className={'vmsg ' + (mine ? 'me' : 'them')}>
      <button className={'v-play ' + (mine ? 'me' : '')} onClick={toggle}>
        {playing ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div className="v-wave" onClick={seek}>
        <div className="v-dots" />
        <div className="v-knob" style={{ left: `${pct}%` }} />
      </div>
      <div className="v-time">
        {playing ? fmt(cur) : fmt(dur)}
      </div>
      <audio ref={aRef} preload="metadata" src={src} />
    </div>
  );
}

/* ===== Context Menu + Action Sheet ===== */
function ContextMenu({
  open,
  x,
  y,
  onClose,
  onDeleteMe,
  onDeleteAll,
  onReply,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const pad = 8;
    const rect = el.getBoundingClientRect();
    const dx = Math.max(
      0,
      x + rect.width + pad - window.innerWidth,
    );
    const dy = Math.max(
      0,
      y + rect.height + pad - window.innerHeight,
    );
    el.style.left = `${Math.max(pad, x - dx)}px`;
    el.style.top = `${Math.max(pad, y - dy)}px`;
  }, [open, x, y]);

  if (!open) return null;
  return (
    <div className="ctx-overlay" onClick={onClose}>
      <div
        ref={ref}
        className="ctx-new"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ctx-item" onClick={onDeleteMe}>
          <Icon.Trash /> Delete for me
        </button>
        <button className="ctx-item danger" onClick={onDeleteAll}>
          <Icon.Trash /> Delete for everyone
        </button>
        <button className="ctx-item" onClick={onReply}>
          Reply
        </button>
        <button className="ctx-item" onClick={onClose}>
          <Icon.Close /> Cancel
        </button>
      </div>
    </div>
  );
}
function ActionSheet({ open, onClose, onDeleteMe, onDeleteAll, onReply }) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        <button className="sheet-item" onClick={onDeleteMe}>
          <Icon.Trash /> Delete for me
        </button>
        <button className="sheet-item danger" onClick={onDeleteAll}>
          <Icon.Trash /> Delete for everyone
        </button>
        <button className="sheet-item" onClick={onReply}>
          Reply
        </button>
        <button className="sheet-item" onClick={onClose}>
          <Icon.Close /> Cancel
        </button>
      </div>
    </div>
  );
}

/* =================================================================== */

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  // auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTTL, setOtpTTL] = useState(0);

  // data
  const [chats, setChats] = useState([]);
  const [sel, setSel] = useState(null);
  const [thread, setThread] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  // selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // compose (single file for docs / other attachments)
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // NEW: multi-media (images + videos) for up to 15 files
  const [mediaFiles, setMediaFiles] = useState([]); // [{file, url, type}]
  const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // quotation & LR
  const [amount, setAmount] = useState('');
  const [lr, setLr] = useState('');
  const [track, setTrack] = useState(DEFAULT_TRACK_LINK);

  // misc
  const [blocked, setBlocked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [panel, setPanel] = useState('none');

  // farmer profile overlay
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState('');

  // message menu
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, msgId: null });
  const [sheetOpen, setSheetOpen] = useState(false);

  // chat list menu
  const [listMenu, setListMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    chat: null,
  });

  const [showDown, setShowDown] = useState(false);

  // voice draft
  const [audioDraft, setAudioDraft] = useState(null);
  const voiceRef = useRef(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceCur, setVoiceCur] = useState(0);
  const { start, stop, recording } = useRecorder();
  const [recSec, setRecSec] = useState(0);

  useEffect(() => {
    let t;
    if (recording) {
      setRecSec(0);
      t = setInterval(() => setRecSec((s) => s + 1), 1000);
    }
    return () => t && clearInterval(t);
  }, [recording]);

  // preview overlay (for single file sending)
  const [preview, setPreview] = useState(null);
  const isPdfType = (t) =>
    !!t && (t === 'application/pdf' || /pdf/i.test(t));

  // viewer overlay (tap image / video)
  const [viewer, setViewer] = useState(null);

  /* ============ BACK GESTURE HANDLING FOR VIEWER POPUP ============ */
  // When viewer opens, push a dummy history state so the first back gesture
  // stays on this page instead of going home.
  useEffect(() => {
    if (!viewer) return;
    if (typeof window === 'undefined' || !window.history?.pushState) return;
    try {
      const current = window.history.state || {};
      window.history.pushState(
        { ...current, adminViewer: true },
        '',
        window.location.href,
      );
    } catch {
      // ignore if history is not available
    }
  }, [viewer]);

  // Intercept browser/gesture back: if viewer is open, just close it.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPop = () => {
      if (viewer) {
        setViewer(null);
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [viewer]);
  /* ================================================================ */

  // refs
  const chatBodyRef = useRef(null);
  const taRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});
  const swipeRef = useRef({});

  const [isNarrow, setIsNarrow] = useState(
    () => window.innerWidth <= 1000,
  );
  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 1000);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const showSend = !!(
    text.trim() ||
    file ||
    audioDraft ||
    mediaFiles.length
  );

  const isNearBottom = (el, pad = 120) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < pad;
  };
  const scrollToBottom = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 1000;
  };
  const scrollToBottomSoon = () =>
    requestAnimationFrame(scrollToBottom);

  // 🔔 ANNOUNCEMENT STATE
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annType, setAnnType] = useState('UPDATE');
  const [annLink, setAnnLink] = useState('');
  const [annSaveMsg, setAnnSaveMsg] = useState('');
  const [annSaving, setAnnSaving] = useState(false);

  /* ---------- loaders ---------- */
  async function loadChats() {
    try {
      const r = await api.get('/api/chat/all', {
        withCredentials: true,
      });
      const list = r.data || [];
      setChats(list);

      const sentCount = list.filter((c) => c.status === 'SENT').length;
      try {
        localStorage.setItem('farmersBadge', String(sentCount));
        window.dispatchEvent(
          new CustomEvent('farmers-badge', { detail: sentCount }),
        );
      } catch {}
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        setAuthed(false);
      }
    }
  }
  async function loadThread(chatId) {
    try {
      const r = await api.get(
        `/api/chat/thread/${chatId}?role=admin`,
        { withCredentials: true },
      );
      setThread(r.data || []);
      scrollToBottomSoon();
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        setAuthed(false);
        setSel(null);
        setThread([]);
      }
    }
  }
  async function markRead(chatId) {
    try {
      await api.post(
        '/api/chat/status',
        { chat_id: chatId, status: 'READ' },
        { withCredentials: true },
      );
    } catch {}
  }
  async function loadSelectedChatExtras(c) {
    try {
      const u = await api.get(`/api/auth/exists/${c.mobile}`, {
        withCredentials: true,
      });
      setBlocked(!!u?.data?.user?.blocked);
      setUserId(u?.data?.user?.id || null);
    } catch (_) {}
  }

  // open farmer profile overlay for selected chat or given chat
  async function showProfileFor(chatLike) {
    const chat = chatLike || sel;
    if (!chat || !chat.mobile) return;

    // keep selection in sync
    if (!sel || sel.id !== chat.id) setSel(chat);

    const mobile = chat.mobile;
    const fallbackName = chat.name || '';

    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError('');
    setProfileData(null);

    try {
      // backend route: /farmers/profile/admin?mobile=XXXXXXXXXX
      const res = await api.get('/farmers/profile/admin', {
        params: { mobile },
        withCredentials: true,
      });
      const profile = res?.data?.profile || null;

      if (profile) {
        setProfileData(profile);
      } else {
        setProfileData({
          full_name: fallbackName,
          mobile,
        });
        setProfileError(
          'Farmer has not filled full profile yet. Showing basic details only.',
        );
      }
    } catch (err) {
      console.error('admin profile fetch error:', err);
      setProfileData({
        full_name: fallbackName,
        mobile,
      });
      setProfileError(
        err?.response?.data?.message ||
          'Could not load full profile. Showing basic details only.',
      );
    } finally {
      setProfileLoading(false);
    }
  }

  /* ---------- login persistence ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_AUTH_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved?.ts) return;

      if (Date.now() - Number(saved.ts) > TEN_DAYS_MS) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        return;
      }

      setAuthed(true);
      loadChats();
    } catch {}
  }, []);

  // sockets
  useEffect(() => {
    if (!authed) return;
    const ORIGIN = resolveApiOrigin();
    const s = io(ORIGIN, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });

    const onNew = (p) => {
      if (sel && p.chat_id === sel.id) loadThread(sel.id);
      loadChats();
    };
    const reloadThread = (p) => {
      if (sel && p.chat_id === sel.id) loadThread(sel.id);
    };

    s.on('chat:new_message', onNew);
    s.on('chat:delete', reloadThread);
    s.on('chat:status', loadChats);
    s.on('chat:cleared', reloadThread);
    s.on('chat:deleted', (p) => {
      if (sel && p.chat_id === sel.id) {
        setThread([]);
        setSel(null);
        loadChats();
      }
    });
    s.on('user:blocked', (p) => {
      if (userId && p.user_id === userId) setBlocked(!!p.blocked);
    });

    return () => {
      s.off('chat:new_message', onNew);
      s.off('chat:delete', reloadThread);
      s.off('chat:status', loadChats);
      s.off('chat:cleared', reloadThread);
      s.off('chat:deleted');
      s.off('user:blocked');
      s.close();
    };
  }, [sel, userId, authed]);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    const onScroll = () => setShowDown(!isNearBottom(el, 20));
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [chatBodyRef.current]);

  useEffect(() => {
    if (!sel?.id) return;
    (async () => {
      await loadThread(sel.id);
      await markRead(sel.id);
      await loadSelectedChatExtras(sel);
      scrollToBottomSoon();
    })();
    setPanel('none');
  }, [sel?.id]);

  // OTP tick
  useEffect(() => {
    if (!otpSent || otpTTL <= 0) return;
    const t = setInterval(
      () => setOtpTTL((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(t);
  }, [otpSent, otpTTL]);

  /* ---------- auth actions ---------- */
  async function startLogin(e) {
    e?.preventDefault?.();
    setLoginMsg('');

    if ((loginEmail || '').trim().toLowerCase() !== ADMIN_EMAIL_ALLOWED) {
      setLoginMsg(
        'Incorrect email. If you are a farmer, please use the Clinic section for chat/messages.',
      );
      return;
    }
    try {
      setBusy(true);
      const r = await api.post(
        '/api/admin/login-start',
        { email: loginEmail, password: loginPassword },
        { withCredentials: true },
      );
      if (r?.data?.ok) {
        setOtpSent(true);
        setOtpCode('');
        setOtpTTL(Number(r.data.ttl || 60));
        setLoginMsg(
          `OTP sent to ${ADMIN_EMAIL_ALLOWED}. Please enter within ${
            r.data.ttl || 60
          } seconds.`,
        );
      } else setLoginMsg('Login failed.');
    } catch (err) {
      setLoginMsg(
        err?.response?.status === 401
          ? 'Incorrect email or password. If you are a farmer, please use the Clinic section.'
          : 'Could not send OTP (server error).',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e) {
    e?.preventDefault?.();
    setLoginMsg('');
    try {
      setBusy(true);
      const r = await api.post(
        '/api/admin/verify-otp',
        { email: loginEmail, code: otpCode },
        { withCredentials: true },
      );
      if (r?.data?.ok) {
        setAuthed(true);
        localStorage.setItem(
          ADMIN_AUTH_KEY,
          JSON.stringify({ ts: Date.now(), email: loginEmail }),
        );
        await loadChats();
      } else setLoginMsg('Invalid/expired OTP.');
    } catch {
      setLoginMsg('Invalid/expired OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function logoutNow() {
    if (!confirm('Do you want to logout?')) return;
    try {
      await api.post(
        '/api/admin/logout',
        {},
        { withCredentials: true },
      );
    } catch {}
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthed(false);
    setSel(null);
    setThread([]);
    try {
      localStorage.setItem('farmersBadge', '0');
      window.dispatchEvent(
        new CustomEvent('farmers-badge', { detail: 0 }),
      );
    } catch {}
  }

   /* ---------- announcements: save ---------- */
 async function saveAnnouncement(e) {
  e?.preventDefault?.();
  setAnnSaveMsg('');

  if (!annBody.trim()) {
    setAnnSaveMsg('Please enter the announcement text.');
    return;
  }

  try {
    setAnnSaving(true);

    const payload = {
      // only message/body, backend will use default type + null title/link
      body: annBody.trim(),
    };

    const res = await api.post('/api/announcements', payload, {
      withCredentials: true,
    });

    const data = res?.data || {};
    const ok =
      data.ok === true ||
      data.success === true ||
      typeof data.id === 'number';

    if (ok) {
      setAnnSaveMsg('Announcement posted ✅');
      setAnnBody('');

      setTimeout(() => {
        setPanel('none');
        setAnnSaveMsg('');
      }, 700);
    } else {
      console.warn('Unexpected announcement response:', data);
      setAnnSaveMsg('Could not save (unknown error).');
    }
  } catch (err) {
    console.error('saveAnnouncement error:', err);
    setAnnSaveMsg(
      err?.response?.data?.message ||
        'Could not save announcement.'
    );
  } finally {
    setAnnSaving(false);
  }
}


  /* ---------- UI helpers ---------- */
  function filtered() {
    const base = chats.filter(
      (c) => statusFilter === 'ALL' || c.status === statusFilter,
    );
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        String(c.mobile || '').includes(q) ||
        (c.last_message || '').toLowerCase().includes(q),
    );
  }
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }
  function onTextChange(e) {
    const v = e.target.value;
    setText(v);
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      const max = 160;
      ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
      scrollToBottomSoon();
    }
  }

  function isQuotationMsg(m) {
    const meta = parseMeta(m);
    const t = (m.message_type || meta?.type || '')
      .toString()
      .toLowerCase();
    return (
      t.includes('quot') ||
      meta?.amount !== undefined ||
      meta?.Amount !== undefined ||
      m.message_type === 'quotation' ||
      m.message_type === 'quote'
    );
  }

  function isLRMsg(m) {
    const meta = parseMeta(m);
    const t = (m.message_type || meta?.type || '')
      .toString()
      .toLowerCase();
    const lrNo =
      meta?.lr_number ||
      meta?.lr ||
      meta?.LR ||
      meta?.lrNo ||
      meta?.LRNumber ||
      meta?.lrnumber;
    const link =
      meta?.tracking_link ||
      meta?.track ||
      meta?.link ||
      meta?.url;
    if (t === 'lr' || t.includes('lr') || !!lrNo || !!link) return true;
    if (m.text && parseLRFromText(m.text).ok) return true;
    return false;
  }

  function getLRPayload(m) {
    const meta = parseMeta(m);
    const metaLr = (
      meta?.lr_number ||
      meta?.lr ||
      meta?.LR ||
      meta?.lrNo ||
      meta?.LRNumber ||
      meta?.lrnumber ||
      ''
    )
      .toString()
      .trim();
    const metaLink = (
      meta?.tracking_link ||
      meta?.track ||
      meta?.link ||
      meta?.url ||
      ''
    )
      .toString()
      .trim();
    if (metaLr || metaLink)
      return {
        lrNo: metaLr,
        link: metaLink || DEFAULT_TRACK_LINK,
      };
    if (m.text) {
      const { lrNo, link, ok } = parseLRFromText(m.text);
      if (ok) return { lrNo, link };
    }
    return { lrNo: '', link: DEFAULT_TRACK_LINK };
  }

  function getMessagePreview(m) {
    if (!m) return '';
    const meta = parseMeta(m);
    const fileUrl = m.file_path ? buildMediaUrl(m.file_path) : null;
    const isAudio =
      !!fileUrl &&
      m.mime_type &&
      (m.mime_type.startsWith('audio/') ||
        m.mime_type.includes('webm') ||
        m.mime_type.includes('ogg'));
    const isImage =
      !!fileUrl &&
      m.mime_type &&
      m.mime_type.startsWith('image/');
    const isVideo =
      !!fileUrl &&
      m.mime_type &&
      m.mime_type.startsWith('video/');
    const isPdf =
      fileUrl && m.mime_type === 'application/pdf';
    const isQ = isQuotationMsg(m);
    const isLR = isLRMsg(m);

    if (m.text && !isLR)
      return m.text.length > 60
        ? m.text.slice(0, 60) + '…'
        : m.text;
    if (isLR) {
      const { lrNo } = getLRPayload(m);
      return lrNo ? `LR ${lrNo}` : 'LR details';
    }
    if (isImage) return 'Photo';
    if (isVideo) return 'Video';
    if (isPdf)
      return meta.original_name || nameFromUrlPath(fileUrl);
    if (isAudio) return 'Voice message';
    if (isQ)
      return `Quotation ₹${
        meta?.amount ?? meta?.Amount ?? ''
      }`;
    if (meta?.spray) return 'Spray details';
    return 'Message';
  }

  function setReplyFromId(id) {
    const m = thread.find((x) => String(x.id) === String(id));
    if (!m) return;
    setReplyTo({ id, snippet: getMessagePreview(m) });
  }

  /* ---------- chat actions ---------- */
  async function deleteOneMe(id) {
    if (!sel || !id) return;
    if (!confirm('Delete this message for you?')) return;
    try {
      await api.delete(
        `/api/chat/message/${id}?role=admin&mode=me`,
        { withCredentials: true },
      );
    } catch {}
    await loadThread(sel.id);
  }

  async function deleteOneEveryone(id) {
    if (!sel || !id) return;
    if (
      !confirm(
        'Delete this message for everyone? This removes it for the farmer also.',
      )
    )
      return;
    try {
      await api.delete(
        `/api/chat/message/${id}?role=admin&mode=everyone`,
        { withCredentials: true },
      );
    } catch {}
    await loadThread(sel.id);
    await loadChats();
  }

  async function clearChatMeById(chatId) {
    if (!chatId) return;
    if (
      !confirm(
        'Clear all messages in this chat for you? (Farmer will still see them)',
      )
    )
      return;
    try {
      await api.post(
        '/api/chat/clear',
        { chat_id: chatId, role: 'admin', scope: 'me' },
        { withCredentials: true },
      );
    } catch {}
    if (sel?.id === chatId) await loadThread(chatId);
    await loadChats();
  }

  async function deleteChatMeById(chatId) {
    if (!chatId) return;
    if (
      !confirm(
        'Delete this chat for you? It will disappear until a new message arrives.',
      )
    )
      return;
    try {
      await api.post(
        '/api/chat/delete',
        { chat_id: chatId, role: 'admin' },
        { withCredentials: true },
      );
    } catch {}
    if (sel?.id === chatId) {
      setSel(null);
      setThread([]);
    }
    await loadChats();
  }

  // helper: clear multi-media selection
  function clearMediaSelection() {
    setMediaFiles((prev) => {
      prev.forEach((mf) => {
        if (mf.url) URL.revokeObjectURL(mf.url);
      });
      return [];
    });
    setActiveMediaIndex(0);
  }

  async function sendMessage() {
    if (!sel) return;

    // this send is only for text + single file (doc / any single attach)
    if (!text && !file) return;

    const fd = new FormData();
    fd.append('mobile', sel.mobile);
    fd.append('sender_role', 'admin');
    fd.append('text', text || '');
    if (replyTo?.id) fd.append('reply_to', replyTo.id);
    if (file) {
      fd.append('file', file);
      fd.append('original_name', file.name);
    }

    try {
      // show circular upload only when there is an attached file
      if (file) {
        setUploading(true);
        setUploadProgress(0);
      }

      await api.post('/api/chat/message', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      if (file) {
        // for single file we just jump to 100%
        setUploadProgress(100);
      }
    } catch (err) {
      console.error('admin sendMessage error:', err);
      alert('Could not send message. Please try again.');
    } finally {
      if (file) {
        // small timeout so 100% is visible for a moment
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 400);
      }
    }

    setText('');
    if (taRef.current) taRef.current.style.height = '44px';
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileName('');
    setFileUrl('');
    setReplyTo(null);
    await loadThread(sel.id);
    await loadChats();
  }

  // NEW: send batch of up to 15 images/videos (+ optional text in first msg)
  async function sendMediaBatch() {
    if (!sel || mediaFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const total = mediaFiles.length;
    let done = 0;

    try {
      // If text is present, send it once before media
      if (text.trim()) {
        const fdText = new FormData();
        fdText.append('mobile', sel.mobile);
        fdText.append('sender_role', 'admin');
        fdText.append('text', text.trim());
        if (replyTo?.id) fdText.append('reply_to', replyTo.id);
        await api.post('/api/chat/message', fdText, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
      }

      for (const item of mediaFiles) {
        const fd = new FormData();
        fd.append('mobile', sel.mobile);
        fd.append('sender_role', 'admin');
        fd.append('text', '');
        if (replyTo?.id) fd.append('reply_to', replyTo.id);
        fd.append('file', item.file);
        fd.append('original_name', item.file.name);

        await api.post('/api/chat/message', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        done += 1;
        setUploadProgress(Math.round((done / total) * 100));
      }

      setText('');
      if (taRef.current) taRef.current.style.height = '44px';
      clearMediaSelection();
      setReplyTo(null);
      setMediaPreviewOpen(false);

      await loadThread(sel.id);
      await loadChats();
    } catch (err) {
      console.error('media batch send error:', err);
      alert('Could not upload media. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function stopToDraft() {
    if (!sel) return;
    const rec = await stop();
    if (rec?.blob) {
      const url = URL.createObjectURL(rec.blob);
      setAudioDraft({
        blob: rec.blob,
        url,
        duration: Math.max(
          1,
          Math.round(rec.duration || 0),
        ),
        mime: rec.mime || 'audio/webm',
      });
      setVoiceCur(0);
      setVoicePlaying(false);
    }
  }

  function discardAudioDraft() {
    if (audioDraft?.url) URL.revokeObjectURL(audioDraft.url);
    setAudioDraft(null);
    setVoiceCur(0);
    setVoicePlaying(false);
  }

  async function sendAudioDraft() {
    if (!sel || !audioDraft) return;
    const fd = new FormData();
    fd.append('mobile', sel.mobile);
    fd.append('sender_role', 'admin');
    fd.append('text', '');
    if (replyTo?.id) fd.append('reply_to', replyTo.id);
    fd.append(
      'file',
      new File(
        [audioDraft.blob],
        `voice-${Date.now()}.webm`,
        { type: audioDraft.mime },
      ),
    );
    fd.append(
      'audio_duration',
      Math.max(
        1,
        Math.round(audioDraft.duration || 0),
      ),
    );
    await api.post('/api/chat/message', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    discardAudioDraft();
    setReplyTo(null);
    await loadThread(sel.id);
    await loadChats();
  }

  async function uploadQuote() {
    if (!sel || !file) return alert('Choose a PDF/JPG/PNG first');
    const fd = new FormData();
    fd.append('chat_id', sel.id);
    fd.append('amount', amount || 0);
    fd.append('file', file);
    fd.append('original_name', file.name);
    await api.post('/api/quotes/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    setAmount('');
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileName('');
    setFileUrl('');
    await loadThread(sel.id);
    await loadChats();
  }

  async function sendLR() {
    if (!sel || !lr) return;
    const link = track || DEFAULT_TRACK_LINK;
    await api.post(
      '/api/chat/lr',
      { chat_id: sel.id, lr_number: lr, tracking_link: link },
      { withCredentials: true },
    );
    setLr('');
    await loadThread(sel.id);
    await loadChats();
  }

  /* ---------- gesture helpers ---------- */
  const onTouchStartMsg = (m, e) => {
    const t = e.touches?.[0];
    if (!t) return;
    swipeRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      t0: Date.now(),
      moved: false,
      longTimer: setTimeout(() => {
        setSelectedIds(new Set([m.id]));
        setSheetOpen(true);
      }, 550),
    };
  };

  const onTouchMoveMsg = (m, e) => {
    const t = e.touches?.[0];
    const s = swipeRef.current;
    if (!t || !s) return;
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      s.moved = true;
      if (s.longTimer) {
        clearTimeout(s.longTimer);
        s.longTimer = null;
      }
    }
    if (dx > 60 && Math.abs(dy) < 40) {
      if (s.longTimer) {
        clearTimeout(s.longTimer);
        s.longTimer = null;
      }
      setReplyFromId(m.id);
    }
  };

  const onTouchEndMsg = () => {
    const s = swipeRef.current;
    if (!s) return;
    if (s.longTimer) clearTimeout(s.longTimer);
    swipeRef.current = {};
  };

  /* -------- context menu positioning -------- */
  const posMenuFromBtn = (btnEl, msgId) => {
    const r = btnEl.getBoundingClientRect();
    setMenu({
      open: true,
      x: r.right,
      y: r.bottom,
      msgId,
    });
  };

  const posListMenu = (x, y, chat) => {
    const MENU_W = 220,
      MENU_H = 160;
    const pad = 8;
    const maxX = window.innerWidth - MENU_W - pad;
    const maxY = window.innerHeight - MENU_H - pad;
    return {
      open: true,
      x: Math.max(pad, Math.min(x, maxX)),
      y: Math.max(pad, Math.min(y, maxY)),
      chat,
    };
  };

  /* ---------- render: unauthenticated ---------- */
  if (!authed) {
    const expired = otpSent && otpTTL === 0;
    return (
      <div className="admin-login-shell">
        <div className="admin-auth-card">
          <div className="admin-notice">
            <b>Office Use Only</b>
            <br />
            This Admin panel is restricted to AV Traders Agri Clinic
            office staff. <br />
            Farmers: please use the{' '}
            <a href="/farmers" className="clinic-link">
              Clinic section
            </a>{' '}
            for chat and messages.
          </div>
          <h1 className="title">Admin Login</h1>

          {(!otpSent || expired) && (
            <form onSubmit={startLogin} className="form">
              <label>Email</label>
              <div className="input-wrap">
                <input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin email"
                  autoComplete="username"
                />
              </div>
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) =>
                    setLoginPassword(e.target.value)
                  }
                  placeholder="•••••"
                  autoComplete="current-password"
                />
              </div>
              {loginMsg && <div className="err">{loginMsg}</div>}
              <button
                className="btn primary"
                disabled={busy || !loginEmail || !loginPassword}
              >
                {busy ? 'Sending OTP…' : 'Login'}
              </button>
              <div className="hint">
                OTP is mandatory for every login and valid for 1
                minute.
              </div>
            </form>
          )}

          {otpSent && !expired && (
            <form onSubmit={verifyOtp} className="form">
              <label>Email</label>
              <div className="input-wrap">
                <input value={loginEmail} disabled />
              </div>
              <label>Enter OTP</label>
              <div className="input-wrap">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                  placeholder="6-digit code"
                  autoFocus
                />
              </div>
              <div className="hint">
                Code sent to your email. Expires in{' '}
                <b>00:{String(otpTTL).padStart(2, '0')}</b>.{' '}
                <button
                  type="button"
                  className="link"
                  onClick={startLogin}
                  disabled={busy}
                >
                  Resend OTP
                </button>
              </div>
              {loginMsg && <div className="err">{loginMsg}</div>}
              <button
                className="btn info"
                disabled={busy || otpCode.length !== 6}
              >
                {busy ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ---------- render: authenticated ---------- */

  const displayName = sel?.name
    ? String(sel.name).toUpperCase()
    : sel
    ? 'UNKNOWN'
    : 'AV AGRO SUPPORT';
  const headerInitials = sel?.name
    ? sel.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('') || 'U'
    : 'AV';

  return (
    <div className="admin-overlay">
      {/* Upload overlay with circular percentage (for all media) */}
      {uploading && (
        <div className="upload-overlay">
          <div className="upload-dialog">
            <div className="upload-ring">
              <div className="upload-spinner" />
              <div className="upload-percent">
                {uploadProgress}%
              </div>
            </div>
            <div className="upload-text">Uploading media…</div>
            <div className="upload-sub">Please keep this tab open</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="topbar green">
        <div className="left">
          <button
            className="icon-btn ghost"
            title="Back"
            onClick={() => {
              if (isNarrow && sel) setSel(null);
              else window.location.href = '/';
            }}
          >
            <Icon.Back />
          </button>

          <button
            type="button"
            className="avatar avatar-btn"
            title={sel ? 'View farmer profile' : 'AV Agro Support'}
            onClick={sel ? () => showProfileFor(sel) : undefined}
            style={{ cursor: sel ? 'pointer' : 'default' }}
          >
            {headerInitials}
          </button>

          <div className="meta">
            <div className="title">{displayName}</div>
            <div className="sub">
              {sel ? 'Chat' : 'AV Agro Support'}
            </div>
          </div>
        </div>

        <div className="right">
          <button
            className="icon-btn ghost"
            title="Quotation"
            onClick={() => setPanel('quote')}
          >
            <Icon.Rupee />
          </button>

          <button
            className="icon-btn ghost"
            title="VRL / LR"
            onClick={() => setPanel('lr')}
          >
            <Icon.Box />
          </button>

          {/* ⭐ ANNOUNCEMENT BUTTON */}
          <button
            className="icon-btn ghost"
            title="Announcements"
            onClick={() => setPanel('announcement')}
          >
            <Icon.Announcement />
          </button>

          <button
            className="icon-btn ghost"
            title="Logout"
            onClick={logoutNow}
          >
            <Icon.Power />
          </button>
        </div>
      </header>

      {/* 2-column layout */}
      <div
        className={
          'cols ' +
          (isNarrow && sel
            ? 'only-thread'
            : isNarrow
            ? 'only-list'
            : '')
        }
      >
        {/* left list */}
        <aside className="list">
          <div className="list-head">
            <div className="tabs">
              {['ALL', 'UNREAD', 'READ', 'SENT'].map((t) => (
                <button
                  key={t}
                  className={
                    'chip ' + (statusFilter === t ? 'active' : '')
                  }
                  onClick={() => setStatusFilter(t)}
                >
                  {t}
                  {t !== 'ALL' && (
                    <>
                      {' '}
                      (
                      {
                        chats.filter((c) => c.status === t)
                          .length
                      }
                      )
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="search">
              <Icon.Search />
              <input
                placeholder="Search name / mobile / text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn ghost refresh" onClick={loadChats}>
                Refresh
              </button>
            </div>
          </div>
          <div className="list-inner">
            {filtered().map((c) => {
              const active = sel && sel.id === c.id;
              const initials = (c.name || 'U')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join('');
              const onRowContext = (e) => {
                e.preventDefault();
                setListMenu(
                  posListMenu(e.clientX, e.clientY, c),
                );
              };
              let lpTimer = null;
              const onTouchStart = (e) => {
                const t = e.touches?.[0];
                lpTimer = setTimeout(
                  () =>
                    setListMenu(
                      posListMenu(t.clientX, t.clientY, c),
                    ),
                  550,
                );
              };
              const onTouchEnd = () => {
                if (lpTimer) clearTimeout(lpTimer);
              };

              return (
                <div
                  key={c.id}
                  className={'row ' + (active ? 'active' : '')}
                  onClick={() => {
                    setSel(c);
                    clearSelection();
                  }}
                  onContextMenu={onRowContext}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <button
                    type="button"
                    className="avatar avatar-btn"
                    title="View farmer profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      showProfileFor(c);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {initials || 'U'}
                  </button>
                  <div className="meta">
                    <div className="line1">
                      <div className="name">{c.name || '—'}</div>
                      {c.unread_count > 0 && (
                        <span className="badge">
                          {c.unread_count > 99
                            ? '99+'
                            : c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="line2">
                      {c.last_message || 'No messages yet'}
                    </div>
                    <div className="line3">
                      +91 {c.mobile} • {c.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* thread */}
        <section className="thread">
          <div className="thread-body" ref={chatBodyRef}>
            {!sel && (
              <div className="empty">
                <div className="title">Admin Chat</div>
                <div className="sub">
                  Select a conversation to get started.
                </div>
              </div>
            )}

            {sel &&
              thread.map((m, i) => {
                const prev = thread[i - 1];
                const showDay =
                  i === 0 ||
                  !sameDay(prev?.created_at, m.created_at);
                const mine = m.sender_role === 'admin';
                const meta = parseMeta(m);
                const spr = meta?.spray;

                const fileUrlMsg = m.file_path
                  ? buildMediaUrl(m.file_path)
                  : null;

                const isSelected = selectedIds.has(m.id);
                const isAudio =
                  !!fileUrlMsg &&
                  m.mime_type &&
                  (m.mime_type.startsWith('audio/') ||
                    m.mime_type.includes('webm') ||
                    m.mime_type.includes('ogg'));
                const isImage =
                  !!fileUrlMsg &&
                  m.mime_type &&
                  m.mime_type.startsWith('image/');
                const isVideo =
                  !!fileUrlMsg &&
                  m.mime_type &&
                  m.mime_type.startsWith('video/');
                const isQuotation = isQuotationMsg(m);
                const isLR = isLRMsg(m);
                const lrPayload = isLR
                  ? getLRPayload(m)
                  : null;

                const replyId =
                  m.reply_to ||
                  m.reply_of ||
                  meta?.reply_to ||
                  meta?.reply_of ||
                  m.replyOf;
                const original = replyId
                  ? thread.find(
                      (x) =>
                        String(x.id) === String(replyId),
                    )
                  : null;

                const onTouchStart = (e) =>
                  onTouchStartMsg(m, e);
                const onTouchMove = (e) =>
                  onTouchMoveMsg(m, e);
                const onTouchEnd = onTouchEndMsg;

                return (
                  <React.Fragment key={m.id}>
                    {showDay && (
                      <div className="day">
                        <span>{dayLabel(m.created_at)}</span>
                      </div>
                    )}

                    <div
                      ref={(el) => {
                        if (el) messageRefs.current[m.id] = el;
                      }}
                      className={
                        'msg ' +
                        (mine ? 'me' : 'them') +
                        (isSelected ? ' selected' : '')
                      }
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      <div className="bubble">
                        <div
                          className={
                            'hover-actions ' + (mine ? 'me' : '')
                          }
                        >
                          <button
                            className="ha-btn"
                            title="More"
                            onClick={(e) => {
                              e.stopPropagation();
                              posMenuFromBtn(
                                e.currentTarget,
                                m.id,
                              );
                            }}
                          >
                            <Icon.Dots />
                          </button>
                        </div>

                        {original && (
                          <div
                            className="reply-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              const el =
                                messageRefs.current[original.id];
                              if (el) {
                                el.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center',
                                });
                                el.classList.add('flash');
                                setTimeout(
                                  () =>
                                    el.classList.remove('flash'),
                                  900,
                                );
                              }
                            }}
                          >
                            <div className="rc-bar" />
                            <div className="rc-body">
                              <div className="rc-name">
                                {original.sender_role ===
                                'admin'
                                  ? 'You'
                                  : 'Farmer'}
                              </div>
                              <div className="rc-text">
                                {getMessagePreview(original)}
                              </div>
                            </div>
                          </div>
                        )}

                        {m.text && !isLR && (
                          <div
                            className="text"
                            dangerouslySetInnerHTML={{
                              __html: linkify(m.text),
                            }}
                          />
                        )}

                        {spr && (
                          <div className="spr-card">
                            <div className="spr-title">
                              Last Spray
                            </div>
                            <div className="row">
                              <b>Date:</b>
                              <span>{spr.date || '-'}</span>
                            </div>
                            <div className="row">
                              <b>Chemical:</b>
                              <span>{spr.chemical || '-'}</span>
                            </div>
                            <div className="row">
                              <b>Dosage:</b>
                              <span>{spr.dosage || '-'}</span>
                            </div>
                          </div>
                        )}

                        {isQuotation && (
                          <QuoteChip
                            m={m}
                            fileUrl={fileUrlMsg || ''}
                          />
                        )}

                        {isLR && (
                          <LRChip
                            lr={lrPayload.lrNo}
                            track={lrPayload.link}
                          />
                        )}

                        {isAudio && (
                          <div className="audio-wrap">
                            <VoiceBubble
                              src={fileUrlMsg}
                              mine={mine}
                            />
                          </div>
                        )}

                        {(isImage || isVideo) && (
                          <div
                            className={
                              'img ' +
                              (isVideo ? 'video-bubble' : '')
                            }
                            onClick={() =>
                              setViewer({
                                url: fileUrlMsg,
                                name:
                                  parseMeta(m)?.original_name ||
                                  nameFromUrlPath(fileUrlMsg),
                                type: m.mime_type || '',
                              })
                            }
                          >
                            {isImage ? (
                              <>
                                <img src={fileUrlMsg} alt="img" />
                                <AsyncImageCaption
                                  m={m}
                                  fileUrl={fileUrlMsg}
                                />
                              </>
                            ) : (
                              <>
                                <video
                                  className="chat-video"
                                  src={fileUrlMsg}
                                  controls
                                />
                                <AsyncImageCaption
                                  m={m}
                                  fileUrl={fileUrlMsg}
                                />
                              </>
                            )}
                          </div>
                        )}

                        {fileUrlMsg &&
                          !isImage &&
                          !isAudio &&
                          !isQuotation &&
                          !isLR &&
                          !isVideo && (
                            <AsyncFileCard
                              m={m}
                              fileUrl={fileUrlMsg}
                            />
                          )}

                        <div className="time">
                          {new Date(m.created_at).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
          </div>

          {sel && showDown && (
            <button
              className="down-fab"
              title="Jump to latest"
              onClick={scrollToBottom}
            >
              <Icon.Down />
            </button>
          )}

          {/* PREVIEW OVERLAY (for single doc / file sending) */}
          {preview && (
            <div
              className="preview-overlay"
              onClick={() => {
                if (preview?.url) URL.revokeObjectURL(preview.url);
                setPreview(null);
              }}
            >
              <div
                className="preview"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="preview-head">
                  <div
                    className="p-title"
                    title={preview.name || 'Attachment'}
                  >
                    {preview.name || 'Attachment'}
                  </div>
                </div>
                <div className="preview-body">
                  {preview.type?.startsWith('image/') ? (
                    <img
                      className="p-image"
                      src={preview.url}
                      alt="preview"
                    />
                  ) : isPdfType(preview.type) ? (
                    <embed
                      className="p-pdf"
                      src={preview.url}
                      type="application/pdf"
                    />
                  ) : (
                    <div className="p-other">
                      <div className="p-file-chip">
                        <div className="p-file-ico">
                          {(
                            preview.name?.split('.').pop() ||
                            'FILE'
                          )
                            .toUpperCase()
                            .slice(0, 8)}
                        </div>
                        <div className="p-file-main">
                          <div
                            className="p-file-name"
                            title={preview.name || 'Attachment'}
                          >
                            {preview.name || 'Attachment'}
                          </div>
                          <div className="p-file-sub">
                            Tap Send to share or attach again to
                            replace
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="preview-actions">
                  <button
                    className="icon-btn danger"
                    onClick={() => {
                      if (preview?.url) URL.revokeObjectURL(preview.url);
                      setPreview(null);
                      setFile(null);
                      setFileName('');
                      setFileUrl('');
                    }}
                    title="Delete"
                  >
                    <Icon.Trash />
                  </button>
                  <button
                    className="btn primary"
                    onClick={async () => {
                      await sendMessage();
                      if (preview?.url) URL.revokeObjectURL(preview.url);
                      setPreview(null);
                    }}
                  >
                    <Icon.Send /> Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEDIA PREVIEW OVERLAY (multi photos/videos before sending) */}
          {mediaPreviewOpen && mediaFiles.length > 0 && (
            <div
              className="media-preview-overlay"
              onClick={() => setMediaPreviewOpen(false)}
            >
              <div
                className="media-preview"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="media-preview-head">
                  <div className="mp-title">
                    {mediaFiles.length} file
                    {mediaFiles.length > 1 ? 's' : ''} selected
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => setMediaPreviewOpen(false)}
                  >
                    <Icon.Close />
                  </button>
                </div>

                <div className="media-preview-body">
                  {(() => {
                    const current =
                      mediaFiles[activeMediaIndex] ||
                      mediaFiles[0];
                    if (!current) return null;
                    const isImg =
                      current.type?.startsWith('image/');
                    const isVid =
                      current.type?.startsWith('video/');
                    return (
                      <div className="media-main">
                        {isImg && (
                          <img
                            src={current.url}
                            alt="preview"
                            className="media-main-img"
                          />
                        )}
                        {isVid && (
                          <video
                            src={current.url}
                            className="media-main-video"
                            controls
                            autoPlay
                          />
                        )}
                      </div>
                    );
                  })()}

                  <div className="media-strip">
                    {mediaFiles.map((mf, idx) => {
                      const isActive = idx === activeMediaIndex;
                      const isImg = mf.type?.startsWith('image/');
                      const isVid = mf.type?.startsWith('video/');
                      return (
                        <div
                          key={idx}
                          className={
                            'media-thumb' + (isActive ? ' active' : '')
                          }
                          title={mf.file?.name || 'media'}
                          onClick={() => setActiveMediaIndex(idx)}
                        >
                          {isImg && (
                            <img
                              src={mf.url}
                              alt="thumb"
                              className="media-thumb-img"
                            />
                          )}
                          {isVid && (
                            <div className="media-thumb-video">
                              <video src={mf.url} />
                              <div className="media-thumb-badge">
                                <Icon.Play width={16} height={16} />
                              </div>
                            </div>
                          )}

                          {/* X button on each thumb */}
                          <button
                            type="button"
                            className="media-thumb-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaFiles((prev) => {
                                if (!prev.length) return prev;

                                const next = [...prev];
                                const [removed] = next.splice(idx, 1);
                                if (removed?.url) {
                                  URL.revokeObjectURL(removed.url);
                                }

                                // fix active index after delete
                                setActiveMediaIndex((cur) => {
                                  if (!next.length) return 0;
                                  if (cur > idx) return cur - 1;
                                  if (cur >= next.length) return next.length - 1;
                                  return cur;
                                });

                                return next;
                              });
                            }}
                          >
                            <Icon.Close width={18} height={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="media-preview-actions">
                  <button
                    className="icon-btn danger"
                    onClick={() => {
                      clearMediaSelection();
                      setMediaPreviewOpen(false);
                    }}
                    title="Clear all"
                  >
                    <Icon.Trash />
                  </button>

                  {/* + button to add more files from big preview */}
<button
  className="icon-btn media-add-btn"
  title="Add more"
  onClick={() => fileInputRef.current?.click()}
>
  +
</button>


                  <button
                    className="btn primary"
                    onClick={sendMediaBatch}
                  >
                    <Icon.Send /> Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEWER OVERLAY (tap image / video in chat AND from inline thumbs) */}
          {viewer && (
            <div
              className="viewer-overlay"
              onClick={() => setViewer(null)}
            >
              <div
                className="viewer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="viewer-head">
                  <button
                    className="icon-btn viewer-btn"
                    aria-label="Back"
                    onClick={() => setViewer(null)}
                  >
                    <Icon.Back />
                  </button>
                  <div
                    className="viewer-title"
                    title={viewer.name || 'Media'}
                  >
                    {viewer.name || 'Media'}
                  </div>
                  <button
                    className="icon-btn viewer-btn"
                    aria-label="Close"
                    onClick={() => setViewer(null)}
                  >
                    <Icon.Close />
                  </button>
                </div>
                <div className="viewer-body">
                  {viewer.type?.startsWith('video/') ? (
                    <video
                      className="viewer-video"
                      src={viewer.url}
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      className="viewer-image"
                      src={viewer.url}
                      alt="full"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* composer */}
          {sel && (
            <>
              {replyTo && (
                <div className="reply-preview">
                  <div className="rp-left">
                    <div className="rp-title">Replying</div>
                    <div className="rp-snippet">
                      {replyTo.snippet}
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => setReplyTo(null)}
                    title="Cancel"
                  >
                    <Icon.Close />
                  </button>
                </div>
              )}

              {audioDraft && (
                <div className="voice-draft">
                  <button
                    className="icon-btn"
                    title="Delete"
                    onClick={discardAudioDraft}
                  >
                    <Icon.Trash />
                  </button>
                  <audio
                    ref={voiceRef}
                    src={audioDraft.url}
                    onTimeUpdate={() =>
                      setVoiceCur(
                        voiceRef.current?.currentTime || 0,
                      )
                    }
                    onEnded={() => setVoicePlaying(false)}
                    preload="metadata"
                  />
                  <button
                    className="icon-btn"
                    title={voicePlaying ? 'Pause' : 'Play'}
                    onClick={() => {
                      const a = voiceRef.current;
                      if (!a) return;
                      if (a.paused) {
                        a.play();
                        setVoicePlaying(true);
                      } else {
                        a.pause();
                        setVoicePlaying(false);
                      }
                    }}
                  >
                    {voicePlaying ? (
                      <Icon.Pause />
                    ) : (
                      <Icon.Play />
                    )}
                  </button>
                  <div className="vd-time">
                    {String(
                      Math.floor((voiceCur || 0) / 60),
                    ).padStart(2, '0')}
                    :
                    {String(
                      Math.round((voiceCur || 0) % 60),
                    ).padStart(2, '0')}
                  </div>
                  <div className="vd-wave">
                    <div
                      className="vd-prog"
                      style={{
                        width: `${Math.min(
                          100,
                          (voiceCur /
                            (audioDraft?.duration || 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <button
                    className="send-btn"
                    title="Send"
                    onClick={sendAudioDraft}
                  >
                    <Icon.Send />
                  </button>
                </div>
              )}

              {recording && (
                <div className="recording-bar">
                  <div className="rec-dot" />
                  <div className="rec-time">
                    {String(
                      Math.floor(recSec / 60),
                    ).padStart(2, '0')}
                    :
                    {String(recSec % 60).padStart(2, '0')}
                  </div>
                </div>
              )}

              {/* INLINE MEDIA STRIP: small thumbnails + "+" tile */}
              {mediaFiles.length > 0 && (
                <div className="media-inline-strip">
                  {mediaFiles.map((mf, idx) => {
                    const isImg = mf.type?.startsWith('image/');
                    const isVid = mf.type?.startsWith('video/');
                    return (
                      <div
                        key={idx}
                        className="media-inline-thumb"
                        title={mf.file?.name || 'media'}
                        onClick={() => {
                          setActiveMediaIndex(idx);
                          setMediaPreviewOpen(true);
                        }}
                      >
                        {isImg && (
                          <img
                            src={mf.url}
                            alt="thumb"
                            className="media-inline-img"
                          />
                        )}
                        {isVid && (
                          <div className="media-inline-video">
                            <video src={mf.url} />
                            <span className="media-inline-badge">
                              <Icon.Play width={14} height={14} />
                            </span>
                          </div>
                        )}

                        {/* X button to remove this single media */}
                        <button
                          type="button"
                          className="media-inline-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaFiles((prev) => {
                              if (!prev.length) return prev;
                              const next = [...prev];
                              const [removed] = next.splice(idx, 1);
                              if (removed?.url) URL.revokeObjectURL(removed.url);

                              // fix active index when removing
                              setActiveMediaIndex((cur) => {
                                if (!next.length) return 0;
                                if (cur > idx) return cur - 1;
                                if (cur >= next.length) return next.length - 1;
                                return cur;
                              });

                              return next;
                            });
                          }}
                        >
                          <Icon.Close width={18} height={18} />
                        </button>
                      </div>
                    );
                  })}

                  {mediaFiles.length < MAX_MEDIA_FILES && (
                    <button
                      type="button"
                      className="media-inline-thumb add"
                      onClick={() => fileInputRef.current?.click()}
                      title="Add more"
                    >
                      +
                    </button>
                  )}
                </div>
              )}

              <div className="composer">
                {/* Camera input (multi image/video) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture={isMobileUA() ? 'environment' : undefined}
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const picked = Array.from(
                      e.target.files || [],
                    );
                    if (!picked.length) return;

                    setMediaFiles((prev) => {
                      const existing = [...prev];
                      const next = [...existing];
                      for (const f of picked) {
                        if (next.length >= MAX_MEDIA_FILES)
                          break;
                        const url =
                          URL.createObjectURL(f);
                        next.push({
                          file: f,
                          url,
                          type: f.type || '',
                        });
                      }
                      return next;
                    });
                    setActiveMediaIndex(0);
                    setMediaPreviewOpen(true);
                    e.target.value = '';
                  }}
                />

                {/* General file input (multi image/video + single doc) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const picked = Array.from(
                      e.target.files || [],
                    );
                    if (!picked.length) return;

                    const media = [];
                    let firstDoc = null;

                    picked.forEach((f) => {
                      if (
                        f.type.startsWith('image/') ||
                        f.type.startsWith('video/')
                      ) {
                        media.push(f);
                      } else if (!firstDoc) {
                        firstDoc = f;
                      }
                    });

                    if (media.length) {
                      setMediaFiles((prev) => {
                        const existing = [...prev];
                        const next = [...existing];
                        for (const f of media) {
                          if (
                            next.length >=
                            MAX_MEDIA_FILES
                          )
                            break;
                          const url =
                            URL.createObjectURL(f);
                          next.push({
                            file: f,
                            url,
                            type: f.type || '',
                          });
                        }
                        return next;
                      });
                      setActiveMediaIndex(0);
                      setMediaPreviewOpen(true);
                    }

                    if (firstDoc) {
                      if (fileUrl)
                        URL.revokeObjectURL(fileUrl);
                      setFile(firstDoc);
                      setFileName(firstDoc.name);
                      const url =
                        URL.createObjectURL(firstDoc);
                      setFileUrl(
                        firstDoc.type.startsWith(
                          'image/',
                        )
                          ? url
                          : '',
                      );
                      setPreview({
                        url,
                        type: firstDoc.type || '',
                        name: firstDoc.name,
                        blob: firstDoc,
                      });
                    }

                    e.target.value = '';
                  }}
                />

                <button
                  className="c-icon"
                  title="Camera"
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                >
                  <Icon.Cam />
                </button>
                <button
                  className="c-icon"
                  title="Attach"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Icon.Clip />
                </button>

                <textarea
                  ref={taRef}
                  className="ta"
                  placeholder={
                    replyTo
                      ? `Replying… ${replyTo.snippet}`
                      : blocked
                      ? 'User is blocked'
                      : 'Type a message'
                  }
                  rows={1}
                  value={text}
                  onChange={onTextChange}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      if (!showSend) return;
                      if (mediaFiles.length > 0) {
                        setMediaPreviewOpen(true);
                      } else {
                        sendMessage();
                      }
                    }
                  }}
                  disabled={blocked}
                  onFocus={scrollToBottomSoon}
                />

                {showSend ? (
                  <button
                    className="send"
                    onClick={() => {
                      if (mediaFiles.length > 0) {
                        setMediaPreviewOpen(true);
                      } else {
                        sendMessage();
                      }
                    }}
                    disabled={
                      (!text &&
                        !file &&
                        !mediaFiles.length) ||
                      blocked
                    }
                  >
                    <Icon.Send />
                  </button>
                ) : (
                  <button
                    className={
                      'mic ' + (recording ? 'rec' : '')
                    }
                    title={recording ? 'Stop' : 'Voice'}
                    disabled={blocked}
                    onClick={async () => {
                      if (!recording) await start();
                      else await stopToDraft();
                    }}
                  >
                    {recording ? (
                      <Icon.Stop />
                    ) : (
                      <Icon.Mic />
                    )}
                  </button>
                )}
              </div>

              {fileName && !recording && (
                <div className="file-hint">
                  📎 {fileName}
                </div>
              )}
              {mediaFiles.length > 0 && !recording && (
                <div className="file-hint">
                  📷 {mediaFiles.length} media selected
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* MESSAGE CONTEXT MENU */}
      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={() =>
          setMenu((m) => ({ ...m, open: false }))
        }
        onDeleteMe={async () => {
          await deleteOneMe(menu.msgId);
          setMenu((m) => ({ ...m, open: false }));
        }}
        onDeleteAll={async () => {
          await deleteOneEveryone(menu.msgId);
          setMenu((m) => ({ ...m, open: false }));
        }}
        onReply={() => {
          setReplyFromId(menu.msgId);
          setMenu((m) => ({ ...m, open: false }));
        }}
      />

      {/* MOBILE ACTION SHEET */}
      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDeleteMe={async () => {
          setSheetOpen(false);
          const [first] = Array.from(selectedIds);
          if (first) await deleteOneMe(first);
        }}
        onDeleteAll={async () => {
          setSheetOpen(false);
          const [first] = Array.from(selectedIds);
          if (first) await deleteOneEveryone(first);
        }}
        onReply={() => {
          setSheetOpen(false);
          const [first] = Array.from(selectedIds);
          if (first) setReplyFromId(first);
        }}
      />

      {/* CHAT LIST CONTEXT MENU */}
      {listMenu.open && (
        <>
          <div
            className="ctx"
            style={{
              top: listMenu.y,
              left: listMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={() => {
                clearChatMeById(listMenu.chat.id);
                setListMenu((m) => ({
                  ...m,
                  open: false,
                }));
              }}
            >
              Clear messages (for me)
            </button>
            <button
              onClick={() => {
                deleteChatMeById(listMenu.chat.id);
                setListMenu((m) => ({
                  ...m,
                  open: false,
                }));
              }}
            >
              Delete chat (for me)
            </button>
            <button
              className="light"
              onClick={() =>
                setListMenu((m) => ({
                  ...m,
                  open: false,
                }))
              }
            >
              Cancel
            </button>
          </div>
          <div
            className="ctx-backdrop"
            onClick={() =>
              setListMenu((m) => ({ ...m, open: false }))
            }
          />
        </>
      )}

      {/* Slide-overs (Quotation / LR / Announcements) */}
      <div
        className={`slideover ${
          panel !== 'none' ? 'open' : ''
        }`}
        onClick={(e) => {
          if (e.target.classList.contains('slideover'))
            setPanel('none');
        }}
      >
        <div className="slideover-inner">
          <div className="slideover-head">
            <div className="title">
              {panel === 'quote'
                ? 'Quotation'
                : panel === 'lr'
                ? 'Dispatch (VRL/LR)'
                : panel === 'announcement'
                ? 'Announcements'
                : ''}
            </div>

            <button
              className="icon-btn"
              onClick={() => setPanel('none')}
            >
              <Icon.Close />
            </button>
          </div>
          <div className="slideover-body">
            {panel === 'quote' &&
              (sel ? (
                <>
                  <label>Quotation Amount (₹)</label>
                  <input
                    className="input"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value.replace(/[^\d.]/g, ''),
                      )
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
                      const f =
                        e.target.files?.[0];
                      if (!f) return;
                      if (fileUrl)
                        URL.revokeObjectURL(fileUrl);
                      setFile(f);
                      setFileName(f.name);
                      setFileUrl('');
                    }}
                  />
                  {fileName && (
                    <div className="file-hint">
                      📎 {fileName}
                    </div>
                  )}
                  <button
                    className="btn primary"
                    style={{ marginTop: 10 }}
                    onClick={uploadQuote}
                    disabled={!file}
                  >
                    Upload Quotation
                  </button>
                  <div
                    className="muted"
                    style={{ marginTop: 8 }}
                  >
                    This will also appear inside the
                    chat as <b>Quotation</b> with
                    amount and file name (with an{' '}
                    <b>Open</b> button).
                  </div>
                </>
              ) : (
                <p className="muted">
                  Select a chat to send a
                  quotation.
                </p>
              ))}

            {panel === 'lr' &&
              (sel ? (
                <>
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
                      onChange={(e) =>
                        setLr(e.target.value)
                      }
                      placeholder="e.g., VRL123456"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="icon-btn ghost"
                      title="Copy LR"
                      onClick={async () => {
                        await copyText(lr || '');
                        if (lr) alert('LR number copied');
                      }}
                      disabled={!lr}
                    >
                      <Icon.Copy />
                    </button>
                  </div>

                  <label style={{ marginTop: 10 }}>
                    Tracking Link
                  </label>
                  <input
                    className="input"
                    value={track}
                    onChange={(e) =>
                      setTrack(e.target.value)
                    }
                    placeholder={DEFAULT_TRACK_LINK}
                  />
                                    <button
                    className="btn info"
                    style={{ marginTop: 10 }}
                    onClick={sendLR}
                    disabled={!lr}
                  >
                    Send LR &amp; Mark Sent
                  </button>

                  <div className="muted" style={{ marginTop: 8 }}>
                    This will send LR details in chat and mark this chat as{' '}
                    <b>Sent</b> so you can track dispatched orders quickly.
                  </div>
                </>
              ) : (
                <p className="muted">
                  Select a chat to send LR and tracking details.
                </p>
              ))}

            {panel === 'announcement' && (
              <form
                className="ann-form"
                onSubmit={saveAnnouncement}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <label>Announcement Text</label>
                <textarea
                  className="input"
                  rows={4}
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Short announcement to show at top (e.g. offers, holidays, important notes)…"
                />

                <button
                  type="submit"
                  className="btn primary"
                  disabled={annSaving || !annBody.trim()}
                >
                  {annSaving ? 'Saving…' : 'Post Announcement'}
                </button>

                {annSaveMsg && (
                  <div className="hint" style={{ marginTop: 4 }}>
                    {annSaveMsg}
                  </div>
                )}

                <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                  Tip: Keep the text short so that it scrolls nicely on both
                  mobile and laptop views.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FARMER PROFILE OVERLAY */}
      {profileOpen && (
        <div
          className="profile-overlay"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="profile-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-head">
              <div className="title">Farmer Profile</div>
              <button
                className="icon-btn"
                onClick={() => setProfileOpen(false)}
              >
                <Icon.Close />
              </button>
            </div>

            <div className="profile-body">
              {profileLoading && (
                <div className="muted">Loading profile…</div>
              )}

              {!profileLoading && profileData && (
                <>
                  <div className="profile-row">
                    <span className="label">Full Name</span>
                    <span className="value">
                      {profileData.full_name || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Mobile</span>
                    <span className="value">
                      {profileData.mobile || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">WhatsApp</span>
                    <span className="value">
                      {profileData.whatsapp || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Village</span>
                    <span className="value">
                      {profileData.village || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Taluk</span>
                    <span className="value">
                      {profileData.taluk || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">District</span>
                    <span className="value">
                      {profileData.district || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Pin Code</span>
                    <span className="value">
                      {profileData.pincode || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Land Size</span>
                    <span className="value">
                      {profileData.land_size || '—'}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Crops</span>
                    <span className="value">
                      {profileData.crops_text || '—'}
                    </span>
                  </div>
                </>
              )}

              {!profileLoading && !profileData && (
                <div className="muted">
                  No profile details available for this farmer.
                </div>
              )}

              {profileError && (
                <div className="err" style={{ marginTop: 8 }}>
                  {profileError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

