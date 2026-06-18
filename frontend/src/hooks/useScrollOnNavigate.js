// src/hooks/useScrollOnNavigate.js
// Tiny scroll-restoration helper for apps using the legacy
// <BrowserRouter> (not a data router). It remembers the scroll
// position of every pathname the user leaves, and restores it
// when they come back via the browser's back/forward buttons.
// Forward navigations always start at the top.
//
// Why not <ScrollRestoration /> from react-router-dom?
//   In v6.4+ that component requires a *data* router
//   (createBrowserRouter + RouterProvider). Switching to a data
//   router is a bigger refactor; this hook is a 25-line drop-in
//   that gives the same UX on BrowserRouter.

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'avtraders_scroll_v1';
const MAX_KEYS = 50;

function readStore() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    const keys = Object.keys(store);
    if (keys.length > MAX_KEYS) {
      // Drop the oldest entries so the store doesn't grow forever.
      keys
        .sort((a, b) => store[a].savedAt - store[b].savedAt)
        .slice(0, keys.length - MAX_KEYS)
        .forEach((k) => delete store[k]);
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* sessionStorage may be blocked; fall through silently */
  }
}

export default function useScrollOnNavigate() {
  const location = useLocation();
  const navType = useNavigationType(); // PUSH | POP | REPLACE

  // Save the *outgoing* pathname's scroll position whenever the
  // route changes (i.e. the user is about to navigate away).
  useEffect(() => {
    const store = readStore();
    return () => {
      store[location.pathname] = {
        y: window.scrollY,
        savedAt: Date.now(),
      };
      writeStore(store);
    };
  }, [location.pathname]);

  // Restore or reset on the new pathname.
  useEffect(() => {
    const store = readStore();
    const saved = store[location.pathname];
    if (navType === 'POP' && saved && Number.isFinite(saved.y)) {
      // Back/forward → restore the saved position.
      window.scrollTo(0, saved.y);
    } else if (navType !== 'REPLACE') {
      // Fresh navigation → scroll to the top.
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);
}
