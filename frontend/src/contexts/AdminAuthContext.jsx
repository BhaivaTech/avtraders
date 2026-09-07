// src/contexts/AdminAuthContext.jsx
// Provides the authenticated admin's profile (email, name, role, permissions)
// to every component under /admin/* via React context.
//
// Usage:
//   import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';
//   const { role, hasPermission } = useAdminAuth();

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const AdminAuthContext = createContext(null);

const DEFAULT_STATE = {
  loading: true,
  email:   null,
  name:    null,
  role:    null,
  permissions: [],
  /** Epoch ms when the fixed 12h session expires (null if unknown). */
  sessionExpiresAt: null,
};

/** Returns true if `role` has `permission`, or has the wildcard '*'. */
function checkPermission(permissions, permission) {
  if (!permissions || !permissions.length) return false;
  return permissions.includes('*') || permissions.includes(permission);
}

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    setAuth((s) => ({ ...s, loading: true }));
    try {
      const res = await api('/admin/me');
      const data = res?.data;
      if (data?.ok) {
        setAuth({
          loading:     false,
          email:       data.email       || null,
          name:        data.name        || 'Admin',
          role:        data.role        || 'superadmin',
          permissions: data.permissions || [],
          sessionExpiresAt:
            Number.isFinite(data.expires_in_ms) && data.expires_in_ms > 0
              ? Date.now() + data.expires_in_ms
              : null,
        });
      } else {
        try { localStorage.removeItem('adminAuth'); } catch {}
        setAuth({ ...DEFAULT_STATE, loading: false });
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    } catch {
      try { localStorage.removeItem('adminAuth'); } catch {}
      setAuth({ ...DEFAULT_STATE, loading: false });
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = {
    ...auth,
    hasPermission: (permission) => checkPermission(auth.permissions, permission),
    refresh,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

/**
 * Hook to access the current admin's auth state.
 * Must be used inside <AdminAuthProvider>.
 */
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
