// src/components/Admin/AdminHeader.jsx
// Top bar inside the admin layout — search, notifications, and the admin
// user menu. Also houses the dark-mode toggle for the admin panel.

import React, { useState, useEffect } from 'react';

const DARK_MODE_KEY = 'admin-dark-mode';

function getInitialDark() {
  try { return localStorage.getItem(DARK_MODE_KEY) === 'true'; } catch { return false; }
}

function saveDark(v) {
  try { localStorage.setItem(DARK_MODE_KEY, String(v)); } catch {}
  window.dispatchEvent(new StorageEvent('storage', { key: DARK_MODE_KEY, newValue: String(v) }));
}

function IconMoon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function IconSun({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function IconMenu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default function AdminHeader({ onMenuToggle }) {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    function onStorage(e) { if (e.key === DARK_MODE_KEY) setDark(e.newValue === 'true'); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    saveDark(next);
  }

  return (
    <header className="admin-header">
      <div className="admin-header-title">Admin</div>
      <div className="admin-header-actions">
        <button
          className="admin-header-btn admin-header-menu-btn"
          title="Menu"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <IconMenu />
        </button>
        <button
          className="admin-header-btn"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggle}
          aria-label="Toggle dark mode"
        >
          {dark ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
