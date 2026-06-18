// src/components/PwaInstallPrompt.jsx
// Surfaces the browser's "install this app" prompt. Listens for the
// beforeinstallprompt event, shows a small banner with an Install
// button, and remembers the user's dismissal so we don't pester them.

import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwa_install_dismissed';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return undefined;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch { /* ignore */ }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-prompt" role="dialog" aria-live="polite" aria-label="Install app">
      <span>Install AV Traders for quick access.</span>
      <div className="pwa-install-actions">
        <button type="button" className="btn" onClick={handleInstall}>Install</button>
        <button type="button" className="btn ghost" onClick={handleDismiss}>Not now</button>
      </div>
    </div>
  );
}
