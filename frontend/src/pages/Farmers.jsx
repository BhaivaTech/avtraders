// src/pages/Farmers.jsx
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { socket as sharedSocket } from '../lib/socket.js';
import { useRecorder } from '../lib/useRecorder.js';
import './Farmers.css';

/* ---------------- Ping + title flash ---------------- */
const ping = typeof Audio !== 'undefined' ? new Audio('/ping.mp3') : null;
let titleTimer = null;
function startTitleFlash() {
  if (titleTimer) return;
  const base = document.title || 'AV Agro Support';
  let flip = false;
  titleTimer = setInterval(() => {
    document.title = flip ? 'New message…' : base;
    flip = !flip;
  }, 1000);
}
function stopTitleFlash() {
  if (titleTimer) {
    clearInterval(titleTimer);
    titleTimer = null;
  }
}

/* ---------------- Icons ---------------- */
const Icon = {
  Send: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
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
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path
        d="M9 4l1.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h4L9 4zM12 17a4 4 0 100-8 4 4 0 000 8z"
        fill="currentColor"
      />
    </svg>
  ),
  Clip: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
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
  Rupee: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path
        d="M6 6h11M6 10h11M6 6c0 3 2 5 6 5H9l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Flask: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path
        d="M9 2h6M10 2v5l-5 9a4 4 0 003.46 6h6.08A4 4 0 0018 16l-4-9V2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Power: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path
        d="M12 2v10M6.5 5a8 8 0 1011 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  Dots: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M16 1H8a2 2 0 00-2 2v10h2V3h8V1zm3 4H10a2 2 0 00-2 2v14a2 2 0 002 2h9a2 2 0 002-2V7a2 2 0 00-2-2z"
        fill="currentColor"
      />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path
        d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.33 0-6 1.34-6 3v1a1 1 0 001 1h10a1 1 0 001-1v-1c0-1.66-2.67-3-6-3z"
        fill="currentColor"
      />
    </svg>
  ),
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/* -------- helpers -------- */
function safeDecode(s = '') {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function nameFromUrlPath(url = '') {
  try {
    const u = new URL(url, API_BASE);
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
  return typeof m.meta === 'string' ? JSON.parse(m.meta || '{}') : m.meta || {};
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
const qFileName = (q, url) => q?.original_name || nameFromUrlPath(url);

/* ------ File cards (image + docs) ------ */
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
      <div className={`doc-icon ${ext === 'PDF' ? 'pdf' : ''}`}>{ext || 'FILE'}</div>
      <div className="doc-main">
        <div className="doc-title" title={shown}>
          {shown}
        </div>
        <div className="doc-meta">Tap to open</div>
      </div>
      <a className="doc-open" href={fileUrl} target="_blank" rel="noreferrer" download={shown}>
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

/* ------ Voice bubble ------ */
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
      ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
      : '0:00';

  return (
    <div className={'vmsg ' + (mine ? 'me' : 'them')}>
      <button
        className={'v-play ' + (mine ? 'me' : '')}
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div className="v-wave" onClick={seek}>
        <div className="v-dots" />
        <div className="v-knob" style={{ left: `${pct}%` }} />
      </div>
      <div className="v-time">{playing ? fmt(cur) : fmt(dur)}</div>
      <audio ref={aRef} preload="metadata" src={src} />
    </div>
  );
}

/* ------ ActionSheet & Context menu ------ */
function ContextMenu({ open, x, y, onClose, onDeleteMe, onDeleteAll, onReply }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const pad = 8;
    const rect = el.getBoundingClientRect();
    const dx = Math.max(0, x + rect.width + pad - window.innerWidth);
    const dy = Math.max(0, y + rect.height + pad - window.innerHeight);
    el.style.left = `${Math.max(pad, x - dx)}px`;
    el.style.top = `${Math.max(pad, y - dy)}px`;
  }, [open, x, y]);

  if (!open) return null;
  return (
    <div className="ctx-overlay" onClick={onClose}>
      <div
        ref={ref}
        className="ctx"
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
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
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

/* ================== LR helpers (copy + track) ================== */
function parseLRFromText(t = '') {
  const lrMatch = t.match(/LR\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
  const linkMatch = t.match(/Track\s*[:\-]?\s*(https?:\/\/\S+)/i);
  const lrNo = (lrMatch?.[1] || '').trim();
  const link = (linkMatch?.[1] || 'http://www.vrlgroup.in/track_consignment.aspx').trim();
  return { lrNo, link, ok: !!lrNo };
}
function isLRMsg(m) {
  return !!(m?.text && parseLRFromText(m.text).ok);
}
function getLRPayload(m) {
  if (!m?.text) return { lrNo: '', link: '' };
  const { lrNo, link, ok } = parseLRFromText(m.text);
  return ok ? { lrNo, link } : { lrNo: '', link: '' };
}
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
function LRChip({ lrNo, link }) {
  return (
    <div className="lr-chip">
      <div className="lr-left">
        <div className="lr-title">LR Number</div>
        <div className="lr-no">{lrNo || '-'}</div>
      </div>
      <div className="lr-actions">
        <button
          className="icon-btn"
          title="Copy LR"
          onClick={async () => {
            if (lrNo) {
              await copyText(lrNo);
              alert('LR number copied');
            }
          }}
          disabled={!lrNo}
        >
          <Icon.Copy />
        </button>
        <a className="btn tiny" href={link} target="_blank" rel="noreferrer">
          Track
        </a>
      </div>
    </div>
  );
}

/* ================== Main ================== */
export default function Farmers() {
  /* -------- responsive flag -------- */
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onR = () => setIsPhone(window.innerWidth < 640);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  /* -------- Auth state -------- */
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState('mobile');
  const [exists, setExists] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [logged, setLogged] = useState(false);

  // New: first-time farmer profile draft
  const [profileDraft, setProfileDraft] = useState({
    full_name: '',
    whatsapp: '',
    village: '',
    taluk: '',
    district: '',
    pincode: '',
    land_size: '',
    crops_text: '',
  });

  /* -------- Compose -------- */
  const [message, setMessage] = useState('');
  // Multiple attachments (images / videos / docs), max 15
  const [attachments, setAttachments] = useState([]); // [{ file, url, type, name }]
  const [lastDate, setLastDate] = useState('');
  const [lastChem, setLastChem] = useState('');
  const [lastDose, setLastDose] = useState('');

  const [replyTo, setReplyTo] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [thread, setThread] = useState([]);

  const [quotes, setQuotes] = useState([]);
  const [quotesLoaded, setQuotesLoaded] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [panel, setPanel] = useState('none');
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, msgId: null });
  const [sheetOpen, setSheetOpen] = useState(false);

  const voiceRef = useRef(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceCur, setVoiceCur] = useState(0);
  const [audioDraft, setAudioDraft] = useState(null);

  // Preview of a selected attachment (for full-screen preview)
  const [preview, setPreview] = useState(null); // { url, type, name, index }

  const isPdfType = (t) =>
    !!t && (t === 'application/pdf' || /pdf/i.test(t));

  const [showDown, setShowDown] = useState(false);
  const [showUp, setShowUp] = useState(false);

  const chatBodyRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const taRef = useRef(null);
  const messageRefs = useRef({});
  const swipeRef = useRef({});

  const pinnedRef = useRef(true);

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

  // Reset badge when the Farmers page is visible (load/return to tab)
  useEffect(() => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      window.location.pathname.startsWith('/farmers')
    ) {
      try {
        localStorage.setItem('farmerNotifCount', '0');
      } catch {}
    }
  }, []);

  // Also reset when new messages render while user is looking at Farmers
  useEffect(() => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      try {
        localStorage.setItem('farmerNotifCount', '0');
      } catch {}
    }
  }, [thread.length]);

  const socketRef = useRef(null);
  const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);
  const isMobileUA = () =>
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

  /* -------- upload animation state -------- */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* -------- FULLSCREEN overlay + body lock -------- */
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
      // cleanup object URLs when leaving page
      attachments.forEach((att) => {
        if (att.url) URL.revokeObjectURL(att.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- scroll helpers ----- */
  const isNearBottom = (el, pad = 120) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < pad;
  };
  const isNearTop = (el, pad = 20) => (el ? el.scrollTop <= pad : true);

  const scrollToBottom = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 1000;
  };
  const scrollToTop = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToBottomSoon = () => {
    requestAnimationFrame(scrollToBottom);
  };

  // Only scroll if user is pinned to bottom
  const maybeScrollToBottom = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    if (pinnedRef.current) scrollToBottomSoon();
  };

  const fmtTime = (s = 0) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(
      Math.round(s % 60)
    ).padStart(2, '0')}`;
  const isSameDay = (a, b) => {
    const d1 = new Date(a);
    const d2 = new Date(b);
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
    const within7 = (date) =>
      (start(now) - start(date)) / (24 * 60 * 60 * 1000) < 7;
    if (isSameDay(d, now)) return 'Today';
    if (isSameDay(d, dd(1))) return 'Yesterday';
    if (within7(d)) return d.toLocaleDateString(undefined, {
      weekday: 'long',
    });
    const z = (n) => String(n).padStart(2, '0');
    return `${z(d.getDate())}-${z(d.getMonth() + 1)}-${d.getFullYear()}`;
  };
  const linkify = (text = '') => {
    const esc = (s) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
      );
    const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    return esc(text).replace(re, (m) => {
      const href = m.startsWith('www.') ? `http://${m}` : m;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${m}</a>`;
    });
  };

  /* -------- login persistence -------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('farmerAuth') || 'null');
    if (!saved?.mobile) return;
    (async () => {
      try {
        const m = saved.mobile;
        // Verify session is still valid before marking as logged in
        const meRes = await api.get('/auth/me', { withCredentials: true });
        if (!meRes.data?.ok || !meRes.data?.farmer?.id) {
          localStorage.removeItem('farmerAuth');
          return;
        }

        // Check if user was blocked since last session
        const exRes = await api.get(`/auth/exists/${m}`, { withCredentials: true });
        const userRow = exRes?.data?.user || null;
        if (userRow?.blocked) {
          setBlocked(true);
          setExists(true);
          setLogged(false);
          localStorage.removeItem('farmerAuth');
          try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch {}
          alert('Your account has been blocked from messaging.');
          return;
        }

        setMobile(m);
        setLogged(true);
        setBlocked(false);
        setExists(true);
        await Promise.all([refreshLatestContext(m), loadQuotes(m)]);
      } catch (_) {
        localStorage.removeItem('farmerAuth');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sockets
  useEffect(() => {
    const s = sharedSocket;
    socketRef.current = s;

    const refreshIf = async (p) => {
      if (p.chat_id === chatId) {
        await refreshThread(false);
        maybeScrollToBottom();
        await loadQuotes(norm(mobile));
      }
    };

    const onNew = async (p) => {
      if (p.chat_id !== chatId) return;
      try {
        if (ping) {
          ping.currentTime = 0;
          await ping.play();
        }
      } catch {}
      if (navigator.vibrate) navigator.vibrate(80);

      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/farmers') &&
        document.visibilityState === 'visible'
      ) {
        // On chat screen & visible → clear badge
        try {
          localStorage.setItem('farmerNotifCount', '0');
        } catch {}
      } else {
        // Not on chat (or tab hidden) → increment badge count
        try {
          const raw = localStorage.getItem('farmerNotifCount') || '0';
          const prev = parseInt(raw, 10) || 0;
          const next = Math.min(999, prev + 1);
          localStorage.setItem('farmerNotifCount', String(next));
        } catch {}
        startTitleFlash();
      }

      await refreshThread(false);
      maybeScrollToBottom();
    };

    s.on('chat:new_message', onNew);
    s.on('chat:delete', refreshIf);
    s.on('chat:cleared', refreshIf);
    s.on('chat:deleted', (p) => {
      if (p.chat_id === chatId) {
        setThread([]);
        setChatId(null);
      }
    });
    
    s.on('chat:status', (p) => {
      if (p.chat_id === chatId && p.status === 'READ') {
        setThread(prev => prev.map(m => m.sender_role === 'farmer' ? { ...m, is_read: 1 } : m));
      }
    });

    const onQuotesChanged = async () => {
      if (!mobile) return;
      await loadQuotes(norm(mobile));
    };
    s.on('quotes:changed', onQuotesChanged);

    const onCE = (e) => console.warn('[socket] connect_error', e?.message || e);
    s.on('connect_error', onCE);
    s.on('error', onCE);

    return () => {
      s.off('chat:new_message', onNew);
      s.off('chat:delete', refreshIf);
      s.off('chat:cleared', refreshIf);
      s.off('chat:deleted');
      s.off('chat:status');
      s.off('quotes:changed', onQuotesChanged);
      s.off('connect_error', onCE);
      s.off('error', onCE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, mobile]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') stopTitleFlash();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  useEffect(() => {
    if (logged) scrollToBottomSoon();
  }, [logged]);

  useEffect(() => {
    if (thread?.length) maybeScrollToBottom();
  }, [thread.length]);

  // Track pinned state + show Up/Down FABs (fix: re-attach after login)
  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = isNearBottom(el, 20);
      pinnedRef.current = nearBottom;
      setShowDown(!nearBottom);
      setShowUp(!isNearTop(el, 20));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [logged]);

  /* ---------- keep the header badge cleared when we are here ---------- */
  useEffect(() => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      try {
        localStorage.setItem('farmerNotifCount', '0');
      } catch {}
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        try {
          localStorage.setItem('farmerNotifCount', '0');
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  useEffect(() => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      try {
        localStorage.setItem('farmerNotifCount', '0');
      } catch {}
    }
  }, [thread.length]);

  /* -------- API helpers -------- */
  async function refreshLatestContext(mobile10) {
    try {
      const lr = await api.get(`/quotes/latest-by-mobile/${mobile10}`, {
        withCredentials: true,
      });
      setChatId(lr?.data?.chat_id || null);
      if (lr?.data?.chat_id) await refreshThreadById(lr.data.chat_id, false);
    } catch {
      setChatId(null);
    }
  }
  async function loadQuotes(mobile10) {
    setQuotesLoaded(false);
    try {
      const r = await api.get(`/quotes/list-by-mobile/${mobile10}`, {
        withCredentials: true,
      });
      setQuotes(Array.isArray(r?.data) ? r.data : []);
    } catch {
      setQuotes([]);
    }
    setQuotesLoaded(true);
  }
  async function refreshThreadById(id, smooth = true) {
    const r = await api.get(`/chat/thread/${id}`, { withCredentials: true });
    setThread(r.data);
    if (smooth) scrollToBottomSoon();
  }
  async function refreshThread(smooth = true) {
    if (chatId) return refreshThreadById(chatId, smooth);
  }

  /* -------------------- PHONEPE: create payment + redirect -------------------- */
  async function startPhonePePayment({ chat_id, amount, quotation_id }) {
    try {
      const cid = chat_id || chatId;
      if (!cid) {
        alert('Chat not found. Please send a message once.');
        return;
      }

      const amt = Number(amount);
      if (!amt || amt <= 0) {
        alert('Invalid amount');
        return;
      }

      // 👉 send quotation_id also
      const res = await api.post(
        '/payment/create',
        { chat_id: cid, amount: amt, mode: 'REDIRECT', quotation_id },
        { withCredentials: true }
      );

      const data = res?.data || {};
      const url = data.redirectUrl || data.checkoutUrl;

      if (data.ok && url) {
        window.location.href = url;
        return;
      }

      console.error('phonepe create unexpected response:', data);
      alert(data.error || 'Could not start payment. Please try again.');
    } catch (err) {
      console.error('phonepe create error', err);
      if (import.meta.env.DEV) console.log('[Farmers] phonepe error response data:', err?.response?.data);

      const server = err?.response?.data || {};
      const msg =
        server.detail?.message ||
        (typeof server.detail === 'string' ? server.detail : null) ||
        server.error ||
        err?.message ||
        'Failed to start payment';

      alert(msg);
    }
  }

  /* -------- Helper: validate profile for new farmers -------- */
  function validateProfileDraft(mobile10) {
    const f = profileDraft;
    if (!f.full_name.trim()) {
      alert('Enter your full name');
      return false;
    }
    const w = norm(f.whatsapp || mobile10);
    if (w.length !== 10) {
      alert('Enter a valid WhatsApp number');
      return false;
    }
    if (!f.village.trim()) {
      alert('Enter your village');
      return false;
    }
    if (!f.taluk.trim()) {
      alert('Enter your taluk');
      return false;
    }
    if (!f.district.trim()) {
      alert('Enter your district');
      return false;
    }
    if (!f.pincode.trim() || f.pincode.trim().length < 5) {
      alert('Enter a valid pin code');
      return false;
    }
    return true;
  }
  // Save profile immediately after first login for new farmers
  async function saveProfileAfterLogin(mobile10) {
    // if somehow draft is empty, skip
    if (!profileDraft.full_name.trim()) return;

    try {
      await api.post(
        '/farmers/profile/save',
        {
          full_name: profileDraft.full_name.trim(),
          whatsapp: norm(profileDraft.whatsapp || mobile10),
          village: profileDraft.village.trim(),
          taluk: profileDraft.taluk.trim(),
          district: profileDraft.district.trim(),
          pincode: profileDraft.pincode.trim(),
          land_size: profileDraft.land_size.trim() || null,
          crops_text: profileDraft.crops_text.trim() || null,
        },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Failed to save farmer profile on first login', err);
      // we don’t block login if this fails – farmer can edit in Profile page later
    }
  }

  /* -------- Auth actions -------- */
  async function sendOtp() {
    const m = norm(mobile);
    if (m.length !== 10) {
      alert('Enter a valid 10-digit mobile');
      return;
    }
    try {
      const ex = await api.get(`/auth/exists/${m}`, { withCredentials: true });
      const userRow = ex?.data?.user || null;
      const existsNow = !!userRow;
      setExists(existsNow);
      setBlocked(!!userRow?.blocked);
      if (userRow?.blocked) {
        alert('You are blocked from messaging.');
        return;
      }

      // NEW: if farmer does not exist → go to details form first
      if (!existsNow) {
        setProfileDraft((prev) => ({
          ...prev,
          whatsapp: prev.whatsapp || m,
        }));
        setStep('details');
        return;
      }

      // Existing farmer → normal OTP flow
      const r = await api.post(
        '/auth/send-otp',
        { mobile: m },
        { withCredentials: true }
      );
      alert(r?.data?.message || 'OTP sent');
      setStep('otp');
    } catch (e) {
      console.error('[Farmers] sendOtp failed:', e);
      alert(e?.response?.data?.message || 'Failed to send OTP');
    }
  }

  // New: called from "details" step for first-time farmers
  async function sendOtpWithDetails() {
    const m = norm(mobile);
    if (m.length !== 10) {
      alert('Enter a valid 10-digit mobile');
      return;
    }
    if (!validateProfileDraft(m)) return;

    try {
      const r = await api.post(
        '/auth/send-otp',
        { mobile: m },
        { withCredentials: true }
      );
      alert(r?.data?.message || 'OTP sent');
      setStep('otp');
    } catch (e) {
      console.error('[Farmers] sendOtpWithDetails failed:', e);
      alert(e?.response?.data?.message || 'Failed to send OTP');
    }
  }

  function goBackToMobile() {
    setStep('mobile');
    setOtp('');
  }

   async function verifyOtp() {
    const m = norm(mobile);
    if (!otp.trim()) {
      alert('Enter the OTP');
      return;
    }

    const payload = { mobile: m, code: otp, role: 'farmer' };

    try {
      // 1) verify OTP (creates session via verifyOtp controller)
      await api.post('/auth/verify-otp', payload, { withCredentials: true });

      // 2) If this was a NEW number (exists === false)
      //    save the details they entered into farmer_profiles + users
      if (!exists) {
        await saveProfileAfterLogin(m);
      }

      // 3) Load chat context to confirm session is valid
      await Promise.all([refreshLatestContext(m), loadQuotes(m)]);

      // 4) Only persist auth AFTER session is confirmed working
      localStorage.setItem('farmerAuth', JSON.stringify({ mobile: m }));
      setLogged(true);
    } catch (e) {
      console.error('[Farmers] verifyOtp failed:', e);
      alert(e?.response?.data?.message || 'OTP verification failed');
    }
  }


  async function handleLogout() {
    if (!confirm('Do you want to logout?')) return;
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem('farmerAuth');
    setLogged(false);
    setStep('mobile');
    setOtp('');
    setThread([]);
    setChatId(null);
    setQuotes([]);
    setQuotesLoaded(false);
    setSelectedIds(new Set());
    setAttachments((prev) => {
      prev.forEach((att) => att.url && URL.revokeObjectURL(att.url));
      return [];
    });
  }

  /* -------- Attachments helpers (multi-file) -------- */
  function onPickFiles(fileList) {
    if (!fileList || !fileList.length) return;
    setAttachments((prev) => {
      const filesArr = Array.from(fileList);
      const remaining = Math.max(0, 15 - prev.length);
      if (remaining <= 0) {
        alert('You can attach up to 15 files per batch.');
        return prev;
      }
      const selected = filesArr.slice(0, remaining).filter((f) => {
        // Frontend size guard ~40MB
        if (f.size && f.size > 40 * 1024 * 1024) {
          alert(`${f.name} is larger than 40 MB and was skipped.`);
          return false;
        }
        return true;
      });
      const mapped = selected.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        type: f.type || '',
        name: f.name || 'file',
      }));
      return [...prev, ...mapped];
    });
  }

  function removeAttachment(index) {
    setAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
    setPreview((p) => {
      if (!p) return p;
      if (p.index === index) return null;
      return p;
    });
  }

  function clearAttachments() {
    setAttachments((prev) => {
      prev.forEach((att) => att.url && URL.revokeObjectURL(att.url));
      return [];
    });
    setPreview(null);
  }

  /* -------- Compose -------- */
  function canSend() {
    if (blocked) return false;
    return (
      (message?.trim()?.length > 0) ||
      attachments.length > 0 ||
      lastDate ||
      lastChem ||
      lastDose
    );
  }
  function onTextChange(e) {
    const v = e.target.value;
    setMessage(v);
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      const max = 220;
      ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
    }
    scrollToBottomSoon();
  }

  /* send text/file(s) now – supports up to 15 attachments (one API call per file) */
  async function sendMessageNow() {
    if (!canSend() || uploading) return;
    const mobile10 = norm(mobile);
    if (mobile10.length !== 10) {
      alert('Invalid mobile. Please login again.');
      return;
    }

    const total = attachments.length;
    const hasFiles = total > 0;

    try {
      if (hasFiles) {
        setUploading(true);
        setUploadProgress(0);
      }

      // If no files: just send one text/spray message
      if (!hasFiles) {
        const fd = new FormData();
        fd.append('mobile', mobile10);
        fd.append('sender_role', 'farmer');
        fd.append('text', message);
        fd.append('last_spray_date', lastDate);
        fd.append('last_chemical', lastChem);
        fd.append('last_dosage', lastDose);
        if (replyTo?.id) fd.append('reply_to', replyTo.id);

        const r = await api.post('/chat/message', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        const newId = r?.data?.message?.chat_id || null;
        if (!chatId && newId) {
          setChatId(newId);
          await refreshThreadById(newId, true);
        } else {
          await refreshThread(true);
        }
      } else {
        // With files: first message carries text + spray + first file
        for (let i = 0; i < total; i++) {
          const att = attachments[i];
          const fd = new FormData();
          fd.append('mobile', mobile10);
          fd.append('sender_role', 'farmer');
          fd.append('text', i === 0 ? message : '');
          fd.append('last_spray_date', i === 0 ? lastDate : '');
          fd.append('last_chemical', i === 0 ? lastChem : '');
          fd.append('last_dosage', i === 0 ? lastDose : '');
          if (replyTo?.id && i === 0) fd.append('reply_to', replyTo.id);
          fd.append('file', att.file);
          fd.append('original_name', att.name || att.file.name || 'file');

          const r = await api.post('/chat/message', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
            onUploadProgress: (evt) => {
              if (!evt.total) return;
              const single = evt.loaded / evt.total;
              const overall = Math.round(((i + single) / total) * 100);
              setUploadProgress(overall);
            },
          });

          const newId = r?.data?.message?.chat_id || null;
          if (!chatId && newId) {
            setChatId(newId);
          }
        }
        await refreshThread(true);
      }

      // Reset compose
      setMessage('');
      if (taRef.current) taRef.current.style.height = '44px';
      setLastDate('');
      setLastChem('');
      setLastDose('');
      setReplyTo(null);
      clearAttachments();
      scrollToBottomSoon();
    } catch (err) {
      if (err?.response?.status === 403) {
        setBlocked(true);
        alert(
          err?.response?.data?.message || 'You are blocked from messaging.'
        );
      } else {
        alert(err?.response?.data?.message || 'Failed to send message');
      }
    } finally {
      if (hasFiles) {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  }

  async function stopRecordingToDraft() {
    const rec = await stop();
    if (rec?.blob) {
      const url = URL.createObjectURL(rec.blob);
      setAudioDraft({
        blob: rec.blob,
        url,
        duration: Math.max(1, Math.round(rec.duration || 0)),
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

  async function sendAudioDraftNow() {
    if (!audioDraft) return;
    const fd = new FormData();
    fd.append('mobile', norm(mobile));
    fd.append('sender_role', 'farmer');
    fd.append('text', '');
    if (replyTo?.id) fd.append('reply_to', replyTo.id);
    fd.append(
      'file',
      new File([audioDraft.blob], `voice-${Date.now()}.webm`, {
        type: audioDraft.mime,
      })
    );
    fd.append(
      'audio_duration',
      Math.max(1, Math.round(audioDraft.duration || 0))
    );
    try {
      const r = await api.post('/chat/message', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const newId = r?.data?.message?.chat_id || null;
      if (!chatId && newId) {
        setChatId(newId);
        await refreshThreadById(newId, true);
      } else {
        await refreshThread(true);
      }

      discardAudioDraft();
      setReplyTo(null);
      scrollToBottomSoon();
    } catch {
      alert('Failed to send voice note');
    }
  }

  /* ----- selection & delete ----- */
  function toggleSelect(id) {
    setSelectMode(true);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      if (n.size === 0) setSelectMode(false);
      return n;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
    setSelectMode(false);
  }
  function setReplyFromId(id) {
    const m = thread.find((x) => String(x.id) === String(id));
    if (!m) return;
    setReplyTo({ id, snippet: getMessagePreview(m) });
  }
  async function deleteSelectedMe() {
    if (selectedIds.size === 0) return;
    if (!confirm('Delete selected message(s) for you?')) return;
    for (const id of Array.from(selectedIds)) {
      try {
        await api.delete(
          `/chat/message/${id}?role=farmer&mode=me`,
          { withCredentials: true }
        );
      } catch {}
    }
    clearSelection();
    await refreshThread(false).then(maybeScrollToBottom);
  }
  async function deleteSelectedEveryone() {
    if (selectedIds.size === 0) return;
    if (!confirm('Delete selected message(s) for everyone?')) return;
    const ids = Array.from(selectedIds);
    const mine = thread
      .filter((m) => ids.includes(m.id) && m.sender_role === 'farmer')
      .map((m) => m.id);
    const skipped = ids.length - mine.length;
    if (mine.length === 0) {
      alert('You can only delete your own messages for everyone.');
      return;
    }
    for (const id of mine) {
      try {
        await api.delete(
          `/chat/message/${id}?role=farmer&mode=everyone`,
          { withCredentials: true }
        );
      } catch {}
    }
    if (skipped > 0)
      alert(`${skipped} message(s) were not yours and were skipped.`);
    clearSelection();
    await refreshThread(false).then(maybeScrollToBottom);
    await loadQuotes(norm(mobile));
  }

  /* -------- Spray -------- */
  async function sendSprayDetailsNow() {
    if (!lastDate && !lastChem && !lastDose) {
      alert('Add at least one field.');
      return;
    }
    const fd = new FormData();
    fd.append('mobile', norm(mobile));
    fd.append('sender_role', 'farmer');
    fd.append('text', '');
    fd.append('last_spray_date', lastDate);
    fd.append('last_chemical', lastChem);
    fd.append('last_dosage', lastDose);
    try {
      const r = await api.post('/chat/message', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const newId = r?.data?.message?.chat_id || null;
      if (!chatId && newId) {
        setChatId(newId);
        await refreshThreadById(newId, true);
      } else {
        await refreshThread(true);
      }

      setLastDate('');
      setLastChem('');
      setLastDose('');
      setPanel('none');
      scrollToBottomSoon();
    } catch {
      alert('Failed to send spray details');
    }
  }

  const getMessagePreview = (m) => {
    if (!m) return '';
    const meta = parseMeta(m);
    const fileUrl = m.file_path
      ? m.file_path.startsWith('http')
        ? m.file_path
        : `${API_BASE}${m.file_path}`
      : null;
    const isAudio =
      !!fileUrl &&
      m.mime_type &&
      (m.mime_type.startsWith('audio/') ||
        m.mime_type.includes('webm') ||
        m.mime_type.includes('ogg'));
    const isImage =
      !!fileUrl && m.mime_type && m.mime_type.startsWith('image/');
    const isPdf = fileUrl && m.mime_type === 'application/pdf';
    const isQuotation =
      meta?.amount !== undefined ||
      m.message_type === 'quote' ||
      m.message_type === 'quotation';

    if (m.text) return m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text;
    if (isImage) return 'Photo';
    if (isPdf) return meta.original_name || nameFromUrlPath(fileUrl);
    if (isAudio) return 'Voice message';
    if (isQuotation) return `Quotation ₹${meta?.amount ?? ''}`;
    if (meta?.spray) return 'Spray details';
    return 'Message';
  };

  // viewer for already-sent media
  const [viewer, setViewer] = useState(null); // { url, name, kind: 'image' | 'video' }

  const quotesCount = quotes?.length || 0;
  const badgeText = quotesCount > 99 ? '99+' : String(quotesCount);
  const showBadge = quotesLoaded && quotesCount > 0;

  const goBackFromChat = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/clinic';
  };
  /* --------- back handling for media overlays (simplified) --------- */
  const overlayBackRef = useRef(false);

  // Track when any overlay (preview/viewer) is open
  useEffect(() => {
    overlayBackRef.current = !!preview || !!viewer;
  }, [preview, viewer]);

  // Handle browser back button
  useEffect(() => {
    const onPop = () => {
      if (overlayBackRef.current) {
        // If popup is open, just close it
        overlayBackRef.current = false;
        setPreview(null);
        setViewer(null);
      } else {
        // No popup → go back to home/clinic
        goBackFromChat();
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const closePreview = () => {
    overlayBackRef.current = false;
    setPreview(null);
  };

  const closeViewer = () => {
    overlayBackRef.current = false;
    setViewer(null);
  };
  // When opening image/video/doc overlay, push a dummy history entry
  // so that the FIRST back press only closes the overlay (stays on chat).
  const pushOverlayHistory = () => {
    try {
      if (typeof window !== 'undefined') {
        window.history.pushState({ overlay: true }, '', window.location.href);
      }
    } catch (e) {
      // ignore
    }
  };

  const openPreviewOverlay = (att, index) => {
    pushOverlayHistory();
    setPreview({ ...att, index });
  };

  const openViewerOverlay = (payload) => {
    pushOverlayHistory();
    setViewer(payload);
  };

  return (
    <div className="chat-overlay">
      <section className="stage">
        {/* Header */}
        <header className={`topbar green ${selectMode ? 'selecting' : ''}`}>
          {!selectMode ? (
            <>
              <div className="left">
                <button
                  className="icon-btn ghost"
                  title="Back to Clinic"
                  onClick={goBackFromChat}
                  aria-label="Back"
                >
                  <Icon.Back />
                </button>
                <div className="avatar">AV</div>
                <div className="meta">
                  <div className="title">AV Agro Support</div>
                  <div className="sub">
                    {logged ? `+91 ${norm(mobile)}` : 'Not logged in'}
                  </div>
                </div>
              </div>
              <div className="right">
                {logged && (
                  <>
                    {/* Profile button */}
                    <button
                      className="icon-btn ghost"
                      title="My Profile"
                      onClick={() => {
                        window.location.href = '/farmers/profile';
                      }}
                      aria-label="My Profile"
                    >
                      <Icon.User />
                    </button>

                    {/* Last Spray */}
                    <button
                      className="icon-btn ghost"
                      title="Last Spray"
                      onClick={() => setPanel('spray')}
                    >
                      <Icon.Flask />
                    </button>
                    {/* Rupee + Logout buttons removed as requested */}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="left">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setSelectMode(false);
                  }}
                >
                  <Icon.Close />
                </button>
                <div className="sel-count">{selectedIds.size} selected</div>
              </div>
              <div className="right">
                <button
                  className="chip"
                  onClick={() => {
                    if (isMobileUA()) setSheetOpen(true);
                    else deleteSelectedMe();
                  }}
                >
                  <Icon.Trash /> Delete
                </button>
                <button
                  className="chip danger"
                  onClick={deleteSelectedEveryone}
                >
                  Delete for everyone
                </button>
              </div>
            </>
          )}
        </header>

        <main className="body">
          {!logged ? (
            <div className="auth-card">
              <h3>Welcome</h3>
              {step === 'mobile' && (
                <>
                  <label>Mobile</label>
                  <input
                    className="input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit number"
                  />
                  <div className="auth-actions">
                    <button className="btn primary" onClick={sendOtp}>
                      Send OTP
                    </button>
                  </div>
                </>
              )}

              {step === 'details' && (
                <>
                  <div className="auth-row" style={{ display: 'flex', marginBottom: 8 }}>
                    <button className="btn ghost" onClick={goBackToMobile}>
                      ← Back
                    </button>
                    <div style={{ flex: 1 }} />
                  </div>
                  <p className="muted" style={{ marginBottom: 8 }}>
                    Please fill your details once. You can edit them later in Profile.
                  </p>

                  <label>Full Name *</label>
                  <input
                    className="input"
                    value={profileDraft.full_name}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Your name"
                  />

                  <label>WhatsApp Number *</label>
                  <input
                    className="input"
                    value={profileDraft.whatsapp}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    placeholder="10-digit WhatsApp number"
                  />

                  <label>Village *</label>
                  <input
                    className="input"
                    value={profileDraft.village}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        village: e.target.value,
                      }))
                    }
                    placeholder="Village"
                  />

                  <label>Taluk *</label>
                  <input
                    className="input"
                    value={profileDraft.taluk}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        taluk: e.target.value,
                      }))
                    }
                    placeholder="Taluk"
                  />

                  <label>District *</label>
                  <input
                    className="input"
                    value={profileDraft.district}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        district: e.target.value,
                      }))
                    }
                    placeholder="District"
                  />

                  <label>Pin Code *</label>
                  <input
                    className="input"
                    value={profileDraft.pincode}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        pincode: e.target.value,
                      }))
                    }
                    placeholder="Pincode"
                  />

                  <label>Land Size (optional)</label>
                  <input
                    className="input"
                    value={profileDraft.land_size}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        land_size: e.target.value,
                      }))
                    }
                    placeholder="e.g. 2 acres"
                  />

                  <label>Crops they grow (optional)</label>
                  <input
                    className="input"
                    value={profileDraft.crops_text}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        crops_text: e.target.value,
                      }))
                    }
                    placeholder="Freely type crops"
                  />

                  <div className="auth-actions">
                    <button className="btn primary" onClick={sendOtpWithDetails}>
                      Save &amp; Get OTP
                    </button>
                  </div>
                </>
              )}

              {step === 'otp' && (
                <>
                  <div className="auth-row">
                    <button className="btn ghost" onClick={goBackToMobile}>
                      ← Back
                    </button>
                    <div style={{ flex: 1 }} />
                  </div>

                  {/* Profile details moved to FarmerProfile page */}

                  <label>OTP</label>
                  <input
                    className="input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6 digits"
                  />
                  <div className="auth-actions">
                    <button className="btn ghost" onClick={goBackToMobile}>
                      Change Number
                    </button>
                    <button className="btn primary" onClick={verifyOtp}>
                      Verify &amp; Login
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {blocked && (
                <div className="banner danger">
                  You are blocked from sending messages.
                </div>
              )}

              <div
                className="thread"
                ref={chatBodyRef}
                onContextMenu={(e) => e.preventDefault()}
              >
                {thread.map((m, i) => {
                  const prev = thread[i - 1];
                  const showDay =
                    i === 0 || !isSameDay(prev?.created_at, m.created_at);
                  const mine = m.sender_role === 'farmer';
                  const meta = parseMeta(m);
                  const spr = meta?.spray;

                  const fileUrl = m.file_path
                    ? m.file_path.startsWith('http')
                      ? m.file_path
                      : `${API_BASE}${m.file_path}`
                    : null;
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
                  const isQuotation =
                    meta?.amount !== undefined ||
                    m.message_type === 'quote' ||
                    m.message_type === 'quotation';

                  const replyId =
                    m.reply_to ||
                    m.reply_of ||
                    meta?.reply_to ||
                    meta?.reply_of ||
                    m.replyOf;
                  const original = replyId
                    ? thread.find((x) => String(x.id) === String(replyId))
                    : null;

                  const onTouchStart = (e) => {
                    const t = e.touches?.[0] || e.changedTouches?.[0];
                    swipeRef.current = {
                      x: t?.clientX || 0,
                      y: t?.clientY || 0,
                      at: Date.now(),
                      moved: false,
                      id: m.id,
                    };
                    e.currentTarget.dataset.ts = Date.now();
                  };
                  const onTouchMove = (e) => {
                    const t = e.touches?.[0];
                    if (!t) return;
                    const sx = swipeRef.current.x || 0;
                    const dx = t.clientX - sx;
                    if (dx > 44 && !swipeRef.current.moved) {
                      swipeRef.current.moved = true;
                      setReplyFromId(m.id);
                    }
                  };
                  const onTouchEnd = (e) => {
                    const start = Number(e.currentTarget.dataset.ts || 0);
                    if (Date.now() - start > 450) {
                      setSelectedIds((prev) =>
                        new Set(prev).add(m.id)
                      );
                      setSheetOpen(true);
                    }
                  };

                  const lrType = isLRMsg(m);
                  const lrPayload = lrType ? getLRPayload(m) : null;

                  return (
                    <React.Fragment key={m.id}>
                      {showDay && (
                        <div className="day-sep">
                          <span>{dayLabel(m.created_at)}</span>
                        </div>
                      )}
                      <div
                        id={`m-${m.id}`}
                        ref={(el) => {
                          if (el) messageRefs.current[m.id] = el;
                        }}
                        className={
                          'msg ' +
                          (mine ? 'me' : 'them') +
                          (selectedIds.has(m.id) ? ' selected' : '')
                        }
                        onClick={() => {
                          if (!selectMode) return;
                          toggleSelect(m.id);
                        }}
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
                                const r =
                                  e.currentTarget.getBoundingClientRect();
                                setMenu({
                                  open: true,
                                  x: r.right,
                                  y: r.bottom,
                                  msgId: m.id,
                                });
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
                                    () => el.classList.remove('flash'),
                                    1000
                                  );
                                }
                              }}
                            >
                              <div className="rc-bar" />
                              <div className="rc-body">
                                <div className="rc-name">
                                  {original.sender_role === 'farmer'
                                    ? 'You'
                                    : 'AV Agro Support'}
                                </div>
                                <div className="rc-text">
                                  {getMessagePreview(original)}
                                </div>
                              </div>
                            </div>
                          )}

                          {m.text && !lrType && (
                            <div
                              className="text"
                              dangerouslySetInnerHTML={{
                                __html: linkify(m.text),
                              }}
                            />
                          )}

                          {lrType && <LRChip {...lrPayload} />}

                          {spr && (
                            <div className="spr-card">
                              <div className="spr-title">Last Spray</div>
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

                          {isQuotation && (() => {
                            // treat any of these as "paid"
                            const paid =
                              meta?.payment_status === 'COMPLETED' ||
                              meta?.payment_status === 'PAID' ||
                              meta?.payment_state === 'COMPLETED' ||
                              !!meta?.paid_at;

                            return (
                              <div className="quote-chip">
                                <div className="q-details">
                                  <div className="q-title">Quotation</div>

                                  {meta?.amount != null && (
                                    <div className="q-amt">₹{meta.amount}</div>
                                  )}

                                  {fileUrl && (
                                    <div className="q-file-row">
                                      <div
                                        className="q-file"
                                        title={meta?.original_name || nameFromUrlPath(fileUrl)}
                                      >
                                        {meta?.original_name || nameFromUrlPath(fileUrl)}
                                      </div>
                                      <a
                                        className="btn tiny"
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Open
                                      </a>
                                    </div>
                                  )}

                                  {/* PAY button or PAID tag */}
                                  {meta?.amount != null && (
                                    paid ? (
                                      <div className="paid-pill">PAID</div>
                                    ) : (
                                      <button
                                        className="pay-big-btn"
                                        onClick={() =>
                                          startPhonePePayment({
                                            chat_id: m.chat_id || chatId,
                                            amount: meta.amount,
                                            // 👇 use whichever field actually holds the quotation id in meta
                                            quotation_id: meta.quotation_id || meta.quote_id || meta.id
                                          })
                                        }
                                      >
                                        PAY
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {fileUrl && isImage && (
                            <div
                              className="img"
                             onClick={() =>
  openViewerOverlay({
    url: fileUrl,
    name:
      parseMeta(m)?.original_name ||
      nameFromUrlPath(fileUrl),
    kind: 'image',
  })
}

                              role="button"
                              style={{ cursor: 'zoom-in' }}
                            >
                              <img
                                src={fileUrl}
                                alt="attachment"
                                loading="lazy"
                                onLoad={maybeScrollToBottom}
                              />
                              <AsyncImageCaption m={m} fileUrl={fileUrl} />
                            </div>
                          )}

                          {fileUrl && isVideo && (
                            <div
                              className="video-bubble"
                              role="button"
                              style={{ cursor: 'zoom-in' }}
                              onClick={() =>
  openViewerOverlay({
    url: fileUrl,
    name:
      parseMeta(m)?.original_name ||
      nameFromUrlPath(fileUrl),
    kind: 'video',
  })
}

                            >
                              <video
                                src={fileUrl}
                                preload="metadata"
                                className="chat-video"
                                muted
                              />
                            </div>
                          )}

                          {fileUrl &&
                            isAudio && (
                              <VoiceBubble src={fileUrl} mine={mine} />
                            )}

                          {fileUrl &&
                            !(
                              (m.mime_type || '').startsWith('image/') ||
                              (m.mime_type || '').startsWith('audio/') ||
                              (m.mime_type || '').startsWith('video/')
                            ) &&
                            !(parseMeta(m)?.amount !== undefined) && (
                              <AsyncFileCard m={m} fileUrl={fileUrl} />
                            )}

                          <div className="time">
                            {new Date(m.created_at).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {showDown && (
                <button
                  className="down-fab"
                  title="Jump to latest"
                  onClick={scrollToBottom}
                >
                  <Icon.Down />
                </button>
              )}

              {showUp && (
                <button
                  className="up-fab"
                  title="Jump to top"
                  onClick={scrollToTop}
                  style={{ transform: 'rotate(180deg)' }}
                >
                  <Icon.Down />
                </button>
              )}

              {replyTo && (
                <div className="reply-preview">
                  <div className="rp-left">
                    <div className="rp-title">Replying</div>
                    <div className="rp-snippet">{replyTo.snippet}</div>
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
                      setVoiceCur(voiceRef.current?.currentTime || 0)
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
                    {voicePlaying ? <Icon.Pause /> : <Icon.Play />}
                  </button>
                  <div className="vd-time">{fmtTime(voiceCur)}</div>
                  <div className="vd-wave">
                    <div
                      className="vd-prog"
                      style={{
                        width: `${Math.min(
                          100,
                          (voiceCur / (audioDraft?.duration || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <button
                    className="send-btn"
                    title="Send"
                    onClick={sendAudioDraftNow}
                  >
                    <Icon.Send />
                  </button>
                </div>
              )}

              {recording && (
                <div className="recording-bar">
                  <div className="rec-dot" />
                  <div className="rec-time">{fmtTime(recSec)}</div>
                </div>
              )}

              {/* Selected attachments thumbnails (images / videos / docs) */}
              {attachments.length > 0 && !recording && (
                <div className="attach-strip">
                  {attachments.map((att, idx) => {
                    const isImg = att.type.startsWith('image/');
                    const isVid = att.type.startsWith('video/');
                    const ext = (att.name.split('.').pop() || 'FILE').toUpperCase();
                    return (
                      <div
                        key={idx}
                        className="attach-item"
                         onClick={() => openPreviewOverlay(att, idx)}
                      >
                        {isImg ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="attach-thumb"
                          />
                        ) : isVid ? (
                          <div className="attach-thumb video">
                            <Icon.Play />
                          </div>
                        ) : (
                          <div className="attach-doc-label">{ext}</div>
                        )}
                        <button
                          type="button"
                          className="attach-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachment(idx);
                          }}
                        >
                          <Icon.Close />
                        </button>
                      </div>
                    );
                  })}
                  {attachments.length < 15 && (
                    <button
                      type="button"
                      className="attach-item attach-plus"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>+</span>
                    </button>
                  )}
                </div>
              )}

              <div className="composer">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture={isMobileUA() ? 'environment' : undefined}
                  style={{ display: 'none' }}
                  onChange={(e) => onPickFiles(e.target.files)}
                  disabled={blocked}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,application/*,text/plain"
                  style={{ display: 'none' }}
                  onChange={(e) => onPickFiles(e.target.files)}
                  disabled={blocked}
                />
                <button
                  className="icon-btn"
                  title="Camera"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={blocked}
                >
                  <Icon.Camera />
                </button>
                <button
                  className="icon-btn"
                  title="Attach"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={blocked}
                >
                  <Icon.Clip />
                </button>
                <textarea
                  ref={taRef}
                  className="input flex ta"
                  placeholder={
                    blocked
                      ? 'You are blocked'
                      : replyTo
                      ? `Replying… ${replyTo.snippet}`
                      : 'Type a message'
                  }
                  rows={1}
                  value={message}
                  onChange={onTextChange}
                  disabled={blocked}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageNow();
                    }
                  }}
                  onFocus={scrollToBottomSoon}
                />
                {canSend() ? (
                  <button
                    className="send-btn"
                    title="Send"
                    onClick={sendMessageNow}
                    disabled={!canSend()}
                  >
                    <Icon.Send />
                  </button>
                ) : (
                  <button
                    className={'icon-btn ' + (recording ? 'rec' : '')}
                    title={recording ? 'Stop' : 'Voice message'}
                    onClick={async () => {
                      if (blocked) return;
                      if (!recording) await start();
                      else await stopRecordingToDraft();
                    }}
                    disabled={blocked || !!audioDraft}
                  >
                    {recording ? <Icon.Stop /> : <Icon.Mic />}
                  </button>
                )}
              </div>

              {/* Context + Action sheet */}
              <ContextMenu
                open={menu.open}
                x={menu.x}
                y={menu.y}
                onClose={() =>
                  setMenu({ open: false, x: 0, y: 0, msgId: null })
                }
                onDeleteMe={async () => {
                  setMenu({ open: false, x: 0, y: 0, msgId: null });
                  setSelectedIds(new Set([menu.msgId]));
                  await deleteSelectedMe();
                }}
                onDeleteAll={async () => {
                  setMenu({ open: false, x: 0, y: 0, msgId: null });
                  setSelectedIds(new Set([menu.msgId]));
                  await deleteSelectedEveryone();
                }}
                onReply={() => {
                  setMenu({ open: false, x: 0, y: 0, msgId: null });
                  setReplyFromId(menu.msgId);
                }}
              />

              <ActionSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onDeleteMe={async () => {
                  setSheetOpen(false);
                  await deleteSelectedMe();
                }}
                onDeleteAll={async () => {
                  setSheetOpen(false);
                  await deleteSelectedEveryone();
                }}
                onReply={() => {
                  setSheetOpen(false);
                  const [first] = Array.from(selectedIds);
                  if (first) setReplyFromId(first);
                }}
              />

              {/* Attachment preview overlay (image / video / pdf / other) */}
              {preview && (
                <div
                  className="preview-overlay"
                  onClick={closePreview}
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
                      {preview.type?.startsWith('video/') ? (
                        <video
                          className="p-video"
                          src={preview.url}
                          controls
                          preload="metadata"
                        />
                      ) : preview.type?.startsWith('image/') ? (
                        <img
                          className="p-image"
                          src={preview.url}
                          alt="preview"
                        />
                      ) : isPdfType(preview.type) ? (
                        isPhone ? (
                          <div className="p-other">
                            <div className="doc-card" style={{ width: '100%' }}>
                              <div className="doc-icon">PDF</div>
                              <div className="doc-main">
                                <div className="doc-title">
                                  {preview.name || 'Document.pdf'}
                                </div>
                                <div className="doc-meta">
                                  Tap Send to share or attach again to
                                  replace
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <embed
                            className="p-pdf"
                            src={preview.url}
                            type="application/pdf"
                          />
                        )
                      ) : (
                        <div className="p-other">
                          <div className="doc-card" style={{ width: '100%' }}>
                            <div className="doc-icon">
                              {(
                                preview.name?.split('.').pop() || 'FILE'
                              ).toUpperCase()}
                            </div>
                            <div className="doc-main">
                              <div className="doc-title">
                                {preview.name || 'Attachment'}
                              </div>
                              <div className="doc-meta">
                                Preview not available
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
                          if (typeof preview.index === 'number') {
                            removeAttachment(preview.index);
                          }
                          closePreview();
                        }}
                      >
                        <Icon.Trash />
                      </button>
                      <button
                        className="btn primary"
                        onClick={() => {
                          closePreview();
                          sendMessageNow();
                        }}
                      >
                        <Icon.Send /> Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Full-screen media viewer (for already-sent images/videos) */}
              {viewer && (
                <div
                  className="viewer-overlay"
                  onClick={closeViewer}
                >
                  <div
                    className="viewer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="viewer-head">
                      <button
                        className="icon-btn viewer-btn"
                        aria-label="Back"
                        onClick={closeViewer}
                      >
                        <Icon.Back />
                      </button>
                      <div
                        className="viewer-title"
                        title={viewer.name || (viewer.kind === 'video' ? 'Video' : 'Photo')}
                      >
                        {viewer.name || (viewer.kind === 'video' ? 'Video' : 'Photo')}
                      </div>
                      <button
                        className="icon-btn viewer-btn"
                        aria-label="Close"
                        onClick={closeViewer}
                      >
                        <Icon.Close />
                      </button>
                    </div>
                    <div className="viewer-body">
                      {viewer.kind === 'video' ? (
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

              {/* Upload animation overlay */}
              {uploading && (
                <div className="upload-overlay">
                  <div className="upload-inner">
                    <div className="spinner" />
                    <div className="upload-text">
                      Uploading… {uploadProgress}%
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </section>

      {/* Slide-overs */}
      <div
        className={`slideover ${panel !== 'none' ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('slideover')) setPanel('none');
        }}
      >
        <div className="slideover-inner">
          <div className="slideover-head">
            <div className="title">
              {panel === 'quote' ? 'Quotations' : 'Last Spray Details'}
            </div>
            <button
              className="icon-btn"
              onClick={() => setPanel('none')}
            >
              <Icon.Close />
            </button>
          </div>
          <div className="slideover-body">
            {panel === 'quote' && (
              <>
                {!quotesLoaded && <div className="muted">Loading…</div>}
                {quotesLoaded && quotes.length === 0 && (
                  <div className="muted">No quotations yet.</div>
                )}
                {quotesLoaded && quotes.length > 0 && (
                  <div className="quote-list">
                    {quotes.map((q, i) => {
                      const url = q?.file_path?.startsWith('http')
                        ? q.file_path
                        : `${API_BASE}${q?.file_path || ''}`;
                      const fname = qFileName(q, url);
                      return (
                        <div
                          key={q.id || i}
                          className="quote-row"
                        >
                          <div className="qnum">#{i + 1}</div>
                          <div className="qinfo">
                            <div className="qtitle">
                              Quotation #{i + 1}
                            </div>
                            <div className="qfile-row">
                              <div className="qfile" title={fname}>
                                {fname}
                              </div>
                              {url && (
                                <a
                                  className="btn tiny"
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open
                                </a>
                              )}
                            </div>
                            {q.amount != null && (
                              <div className="qamt">₹{q.amount}</div>
                            )}
                          </div>
                          <div className="qactions">
                            <button
                              className="btn"
                              onClick={() =>
                                startPhonePePayment({
                                  chat_id: q.chat_id || chatId,
                                  amount: q.amount,
                                })
                              }
                            >
                              Pay now
                            </button>
                            <button
                              title="Remove from list"
                              className="icon-btn danger"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    'Remove this quotation from the list? (This will not delete chat messages)'
                                  )
                                )
                                  return;
                                try {
                                  await api.delete(`/quotes/${q.id}`, {
                                    withCredentials: true,
                                  });
                                  await loadQuotes(norm(mobile));
                                } catch {
                                  alert('Failed to delete quotation');
                                }
                              }}
                            >
                              <Icon.Close />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {panel === 'spray' && (
              <>
                <label>Date</label>
                <input
                  type="date"
                  className="input"
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                />
                <label>Chemical</label>
                <input
                  className="input"
                  value={lastChem}
                  onChange={(e) => setLastChem(e.target.value)}
                />
                <label>Dosage</label>
                <input
                  className="input"
                  value={lastDose}
                  onChange={(e) => setLastDose(e.target.value)}
                />
                <div className="muted" style={{ marginTop: 8 }}>
                  Send these details now or they will be attached to your next
                  message.
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    className="btn primary"
                    onClick={sendSprayDetailsNow}
                  >
                    <Icon.Send />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Styles (extended) */}
      <style>{`
/* base */
.chat-overlay{position:fixed;inset:0;background:#f6f7f8;z-index:9999;display:flex;flex-direction:column}
body.no-scroll{overflow:hidden!important}
.stage{flex:1;display:flex;flex-direction:column;min-height:0}
.topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:8px 10px}
.topbar.green{background:#3aa956;color:#fff}
.topbar .avatar{width:32px;height:32px;border-radius:50%;background:#2f8f42;color:#f0fff4;display:grid;place-items:center;font-weight:700;margin-right:8px;font-size:12px}
.topbar .title{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56vw}
@media(max-width:600px){ .topbar .title{max-width:58vw;font-size:14px} }
.topbar .sub{font-size:12px;color:#e8fbe9}
.topbar .left{display:flex;align-items:center;gap:8px}
.topbar .meta{display:flex;flex-direction:column}
.topbar .right{display:flex;align-items:center;gap:6px}
.topbar .icon-btn{ background:transparent !important; box-shadow:none }
.topbar .icon-btn:hover{ background:rgba(255,255,255,.14) }

/* red badge on icon */
.btn-badge-wrap{position:relative}
.icon-btn.badged{position:relative}
.icon-btn.badged .badge{
  position:absolute; top:-4px; right:-4px;
  min-width:18px; height:18px; padding:0 4px;
  background:#ef4444; color:#fff; border-radius:999px;
  font-size:11px; line-height:18px; text-align:center;
  box-shadow:0 0 0 2px rgba(58,169,86,.95);
}

/* body + thread */
.body{flex:1;min-height:0;display:flex;flex-direction:column}
.thread{flex:1;overflow:auto;padding:12px;-webkit-overflow-scrolling:touch;position:relative;background-image:url('/chat-bg.png');background-size:cover;background-attachment:fixed;background-position:center}
@media (max-width: 640px){ .thread{ background-attachment: scroll; } }
.composer{position:sticky;bottom:0;z-index:25;background:#fff;padding:8px;border-top:1px solid #e5e7eb;display:flex;gap:8px;align-items:flex-end}
.composer .input.ta{max-height:180px;border-radius:12px}
.icon-btn,.send-btn{border:none;background:#f3f4f6;padding:10px;border-radius:12px;display:grid;place-items:center}
.icon-btn.rec{background:#fee2e2}
.icon-btn.ghost{background:transparent;color:#f0fff4}
.icon-btn.ghost:hover{background:rgba(255,255,255,.14)}
.send-btn{background:#22c55e;color:#fff;border-radius:12px;padding:10px 12px}
.input{border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fff}
.down-fab{position:absolute;right:18px;bottom:92px;z-index:35;width:42px;height:42px;border-radius:50%;background:#22c55e;color:#fff;border:none;box-shadow:0 6px 18px rgba(0,0,0,.15);display:grid;place-items:center}
.up-fab{position:absolute;left:18px;bottom:92px;z-index:35;width:42px;height:42px;border-radius:50%;background:#22c55e;color:#fff;border:none;box-shadow:0 6px 18px rgba(0,0,0,.15);display:grid;place-items:center}

/* auth */
.auth-card{width:min(520px,92vw);margin:8vh auto;background:#fff;padding:22px 24px;border-radius:20px;box-shadow:0 8px 26px rgba(0,0,0,.06)}
.auth-card h3{margin:0 0 14px}
.auth-card .input{width:100%;margin-bottom:12px}
.auth-actions{display:flex;gap:12px;justify-content:flex-end;align-items:center;margin-top:8px}
.btn.ghost{background:#f3f4f6;color:#111827;border:none;padding:8px 14px;border-radius:10px}
.btn.primary{background:#22c55e;color:#fff;border:none;padding:8px 14px;border-radius:10px}
.btn{border:none;padding:8px 12px;border-radius:10px;background:#ecfdf5;color:#065f46}

/* media + docs */
.msg .img{border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;background:#fff;display:inline-block;max-width:100%}
.msg .img img{display:block;max-width:100%;height:auto;max-height:260px;object-fit:contain}
.img-caption{display:inline-block;margin-top:6px;font-size:12px;color:#065f46;text-decoration:none;max-width:100%;word-break:break-all}
.doc-card{display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:12px}
.doc-icon{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-weight:700;font-size:12px;color:#0f172a;background:#f1f5f9}
.doc-icon.pdf{color:#b91c1c;background:#fee2e2}
.doc-main{flex:1;min-width:0}
.doc-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-meta{font-size:12px;color:#6b7280;margin-top:2px}
.doc-open{font-weight:600;text-decoration:none;color:#065f46;padding:6px 10px;border-radius:10px;background:#ecfdf5}

/* thread msgs */
.day-sep{display:flex;justify-content:center;margin:10px 0}
.day-sep span{background:#e3f7ea;color:#14532d;padding:4px 10px;border-radius:999px;font-size:12px}
.msg{position:relative;margin:8px 0;display:flex}
.msg.me{justify-content:flex-end}
.msg .bubble{position:relative;max-width:min(86%,560px);padding:10px 12px;border-radius:16px;background:#fff;border:1px solid #e5e7eb}
.msg.me .bubble{background:#e8fbe9;border-color:#cde9cf}
.msg .text{white-space:pre-wrap;word-break:break-word}
.msg .time{font-size:11px;color:#6b7280;margin-top:6px;text-align:right}
.msg.flash .bubble{box-shadow:0 0 0 2px rgba(106,142,119,.75) inset;transition:box-shadow .8s ease}
.hover-actions{position:absolute;top:50%;transform:translateY(-50%);right:-36px;opacity:0;pointer-events:none;transition:opacity .12s ease, transform .12s ease}
.msg.me .hover-actions{ right:auto; left:-36px; }
.msg:hover .hover-actions{ opacity:1; pointer-events:auto; }
.ha-btn{width:28px;height:28px;border:none;border-radius:50%;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,.15);display:grid;place-items:center;cursor:pointer}
@media (hover:none){ .hover-actions{ display:none } }

/* quotation chip */
.quote-chip{position:relative;display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px dashed #86efac;background:#f0fdf4;border-radius:12px}
.msg.me .quote-chip{border-color:#a7f3d0;background:#ecfdf5}
.q-details{flex:1;min-width:0}
.q-title{font-weight:700}
.q-amt{font-weight:700;margin-top:2px}
.q-file-row{display:flex;align-items:center;gap:8px;margin-top:4px;min-width:0}
.q-file{font-size:12px;color:#065f46;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
.btn.tiny{font-size:12px;padding:6px 10px;background:#d1fae5;color:#065f46;border:none;border-radius:10px;white-space:nowrap}
@media (max-width:640px){ .q-file{max-width:48vw} }

/* Big red PAY button inside quotation */
.pay-big-btn{
  margin-top:8px;
  width:100%;
  padding:10px 0;
  border:none;
  border-radius:999px;
  background:#ef4444;
  color:#fff;
  font-weight:700;
  font-size:15px;
}

/* video bubble */
.video-bubble{margin-top:6px;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;background:#000}
.chat-video{display:block;max-width:100%;height:auto;max-height:260px}

/* LR + voice */
.lr-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:10px 12px;margin-top:4px}
.lr-left{min-width:0}
.lr-title{font-size:12px;color:#374151;margin-bottom:2px}
.lr-no{font-weight:800;word-break:break-all}
.lr-actions{display:flex;align-items:center;gap:8px}
.lr-chip .btn.tiny{padding:6px 10px;border-radius:10px}
.vmsg{display:flex;align-items:center;gap:8px}
.vmsg .v-play{border:none;border-radius:10px;background:#ecfdf5}
.vmsg.me .v-play{background:#d1fae5}
.v-wave{position:relative;flex:1;height:18px;background:#f3f4f6;border-radius:10px;overflow:hidden}
.v-dots::before{content:'';position:absolute;inset:0;background-image:radial-gradient(#9ca3af 1px, transparent 1px);background-size:6px 12px;opacity:.6}
.v-knob{position:absolute;top:0;bottom:0;width:2px;background:#16a34a}
.v-time{font-size:12px;color:#334155}

/* menus */
.ctx-overlay{position:fixed;inset:0;z-index:60}
.ctx{position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);overflow:hidden;min-width:240px}
.ctx-item{display:flex;gap:8px;align-items:center;width:100%;padding:12px 14px;background:#fff;border:none}
.ctx-item:hover{background:#f8fafc}
.ctx-item.danger{color:#b91c1c}
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:60;display:flex;align-items:flex-end}
.sheet{width:100%;background:#fff;border-radius:18px 18px 0 0;padding:10px}
.sheet-item{display:block;width:100%;text-align:left;padding:14px;background:#fff;border:none}
.sheet-item.danger{color:#b91c1c}
.sheet-grip{width:40px;height:4px;background:#e5e7eb;border-radius:999px;margin:0 auto 8px}

/* slide-over */
.slideover{position:fixed;inset:0;display:none;background:rgba(0,0,0,.28);z-index:70}
.slideover.open{display:block}
.slideover-inner{position:absolute;right:0;top:0;bottom:0;width:min(520px,92%);background:#fff;display:flex;flex-direction:column}
.slideover-head{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #e5e7eb}
.slideover-body{flex:1;overflow:auto;padding:12px}
.quote-list{display:flex;flex-direction:column;gap:10px}
.quote-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid #e5e7eb;background:#f9fafb}
.qnum{font-weight:700;font-size:13px;color:#4b5563}
.qinfo{flex:1;min-width:0}
.qtitle{font-weight:600;margin-bottom:4px}
.qfile-row{display:flex;align-items:center;gap:8px;margin-top:2px;min-width:0}
.qfile{font-size:12px;color:#065f46;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52vw}
.qamt{margin-top:4px;font-weight:700;color:#16a34a}
.qactions{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
@media(max-width:640px){
  .quote-row{align-items:flex-start}
  .qactions{flex-direction:row;align-items:center}
}

/* spray panel */
.spr-card{margin-top:6px;padding:10px 12px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;font-size:13px}
.spr-title{font-weight:600;margin-bottom:4px}
.spr-card .row{display:flex;gap:6px;margin-top:2px}
.spr-card .row b{min-width:70px;font-weight:600}

/* reply preview */
.reply-preview{position:sticky;bottom:64px;background:rgba(248,250,252,.96);border-top:1px solid #e5e7eb;padding:6px 10px;display:flex;align-items:center;gap:6px;z-index:24}
.rp-left{flex:1;min-width:0}
.rp-title{font-size:12px;color:#6b7280;margin-bottom:2px}
.rp-snippet{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* selection mode */
.topbar.selecting{background:#111827;color:#f9fafb}
.sel-count{font-weight:600}
.chip{border:none;border-radius:999px;padding:6px 12px;background:#e5e7eb;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.chip.danger{background:#fee2e2;color:#b91c1c}

/* preview overlay */
.preview-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:80;display:flex;align-items:center;justify-content:center;padding:10px}
.preview{width:min(640px,100%);max-height:96vh;background:#0b1120;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}
.preview-head{padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.4);color:#e5e7eb;display:flex;align-items:center}
.preview-head .p-title{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.preview-body{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;background:#020617}
.p-image{max-width:100%;max-height:80vh;object-fit:contain}
.p-video{max-width:100%;max-height:80vh}
.p-pdf{width:100%;height:80vh;border:none}
.p-other{padding:16px;width:100%}
.preview-actions{padding:10px 14px;border-top:1px solid rgba(148,163,184,.4);display:flex;justify-content:flex-end;gap:8px;background:#020617}

/* full-screen viewer */
.viewer-overlay{
  position:fixed;
  inset:0;
  background:#000;
  z-index:90;
  display:flex;
  align-items:center;
  justify-content:center;
}
.viewer{
  position:relative;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  background:#000;
}
.viewer-head{
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px;
  background:linear-gradient(to bottom,rgba(15,23,42,.9),rgba(15,23,42,.3));
  color:#e5e7eb;
  z-index:2;
}
.viewer-title{
  flex:1;
  min-width:0;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  font-size:14px;
}
.viewer-btn{
  background:transparent!important;
  color:#e5e7eb;
}
.viewer-body{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px;
}

/* Make both image + video fit nicely on laptop & mobile */
.viewer-image,
.viewer-video{
  max-width:100%;
  max-height:100%;
  width:auto;
  height:auto;
  object-fit:contain;
}

/* recording */
.recording-bar{position:fixed;bottom:64px;left:0;right:0;display:flex;justify-content:center;z-index:30}
.recording-bar .rec-dot{width:10px;height:10px;border-radius:999px;background:#ef4444;margin-right:6px;animation:pulse 1s infinite}
.recording-bar .rec-time{padding:6px 10px;border-radius:999px;background:rgba(15,23,42,.9);color:#fee2e2;font-size:12px;display:flex;align-items:center;gap:6px}
@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.5}100%{transform:scale(1);opacity:1}}

/* old attach chip no longer used for multi, but kept if needed */
/* voice draft */
.voice-draft{position:sticky;bottom:64px;z-index:26;margin:4px 8px;padding:8px 10px;border-radius:14px;background:#0f172a;color:#e5e7eb;display:flex;align-items:center;gap:6px}
.vd-time{font-size:12px;min-width:40px;text-align:center}
.vd-wave{flex:1;height:4px;background:#1e293b;border-radius:999px;overflow:hidden}
.vd-prog{height:100%;background:#22c55e}

/* banners */
.banner{padding:6px 10px;font-size:13px}
.banner.danger{background:#fef2f2;color:#991b1b;border-bottom:1px solid #fecaca}

/* slide-over inputs */
.slideover-body .input{width:100%;margin-bottom:10px}

/* misc */
.muted{font-size:13px;color:#6b7280}
.icon-btn.danger{background:#fee2e2;color:#b91c1c}
.icon-btn.danger:hover{background:#fecaca}
.btn.primary:disabled{opacity:.6}
.btn.primary svg{margin-right:4px}

/* reply card in bubble */
.reply-card{display:flex;align-items:stretch;margin-bottom:6px;border-radius:10px;background:rgba(15,23,42,.04);overflow:hidden;border:1px solid rgba(148,163,184,.4);cursor:pointer}
.rc-bar{width:4px;background:#22c55e}
.rc-body{flex:1;padding:6px 8px}
.rc-name{font-size:12px;font-weight:600;margin-bottom:2px;color:#065f46}
.rc-text{font-size:12px;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* selecting state for bubbles */
.msg.selected .bubble{box-shadow:0 0 0 2px #22c55e inset}

/* attachments strip (multi thumbnail) */
.attach-strip{
  position:sticky;
  bottom:64px;
  z-index:25;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  padding:4px 8px;
  background:rgba(248,250,252,.96);
  border-top:1px solid #e5e7eb;
}
.attach-item{
  position:relative;
  width:68px;
  height:68px;
  border-radius:12px;
  overflow:hidden;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
}
.attach-thumb{
  width:100%;
  height:100%;
  object-fit:cover;
}
.attach-thumb.video{
  display:flex;
  align-items:center;
  justify-content:center;
}
.attach-remove{
  position:absolute;
  top:2px;
  right:2px;
  width:20px;
  height:20px;
  border-radius:999px;
  border:none;
  background:rgba(15,23,42,.85);
  color:#f9fafb;
  display:grid;
  place-items:center;
  padding:0;
  font-size:10px;
}
.attach-doc-label{
  font-size:11px;
  padding:4px;
  text-align:center;
  color:#111827;
  word-break:break-all;
}

/* upload overlay */
.upload-overlay{
  position:fixed;
  inset:0;
  z-index:120;
  background:rgba(0,0,0,.35);
  display:flex;
  align-items:center;
  justify-content:center;
}
.upload-inner{
  background:#fff;
  padding:14px 18px;
  border-radius:16px;
  box-shadow:0 8px 24px rgba(0,0,0,.25);
  display:flex;
  align-items:center;
  gap:10px;
}
.spinner{
  width:22px;
  height:22px;
  border-radius:999px;
  border:3px solid #e5e7eb;
  border-top-color:#22c55e;
  animation:spin .7s linear infinite;
}
@keyframes spin{
  to{ transform:rotate(360deg); }
}
.upload-text{
  font-size:14px;
  color:#111827;
}

/* small helpers */
@media(max-width:480px){
  .auth-card{margin-top:6vh;padding:18px 16px}
  .composer{padding:6px}
}
      `}</style>
    </div>
  );
}

