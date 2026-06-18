// src/components/OfflineBanner.jsx
// Displays a persistent banner when the user is offline,
// and a brief "reconnected" notice when they come back online.

import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const bannerBase = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  padding: '10px 16px',
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  transition: 'transform 0.3s ease, opacity 0.3s ease',
};

const offlineStyle = {
  ...bannerBase,
  background: '#fef2f2',
  color: '#991b1b',
  borderBottom: '2px solid #fca5a5',
};

const reconnectedStyle = {
  ...bannerBase,
  background: '#ecfdf5',
  color: '#065f46',
  borderBottom: '2px solid #6ee7b7',
};

const closeBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  padding: '0 4px',
  color: 'inherit',
  opacity: 0.7,
};

export default function OfflineBanner() {
  const { isOnline, showReconnected, dismissOfflineNotice } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div style={offlineStyle} role="alert" aria-live="assertive">
        <span>📡</span>
        <span>You're offline. Some features may not work. Check your internet connection.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div style={reconnectedStyle} role="status" aria-live="polite">
        <span>✅</span>
        <span>You're back online!</span>
        <button
          style={closeBtn}
          onClick={dismissOfflineNotice}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}
