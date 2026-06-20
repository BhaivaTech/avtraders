// src/hooks/useTheme.js
// Tiny theme controller. Reads localStorage, falls back to the user's
// OS-level prefers-color-scheme, exposes {theme, setTheme, toggle}.
// Setting <html data-theme="…"> drives all CSS variable lookups in
// styles.css.

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'site_theme';

function readInitial() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage may be blocked */
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  // Hint native form controls (input/textarea/select) to render in the
  // right color scheme — needed for things like autofill, scrollbars.
  document.documentElement.style.colorScheme = theme;
}

export default function useTheme() {
  const [theme, setThemeState] = useState(readInitial);

  // Apply on mount and whenever it changes.
  useEffect(() => {
    applyTheme(theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
}
