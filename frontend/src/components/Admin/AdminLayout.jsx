// src/components/Admin/AdminLayout.jsx
// Shared layout for every page under /admin/*. Renders the sidebar,
// the header bar, and an <Outlet /> so nested admin routes can mount
// their own content while keeping chrome consistent.

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { io } from 'socket.io-client';
import { resolveApiOrigin } from '@/lib/endpoint';
import toast from '../../lib/toast.js';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';
import './Admin.css';

const DARK_MODE_KEY = 'admin-dark-mode';

function getInitialDark() {
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  } catch { return false; }
}

export default function AdminLayout() {
  const [dark, setDark] = useState(getInitialDark);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === DARK_MODE_KEY) setDark(e.newValue === 'true');
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* ---------- real-time toast notifications ---------- */
  useEffect(() => {
    const ORIGIN = resolveApiOrigin();
    const s = io(ORIGIN, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });

    const onNewMessage = () => {
      toast.info('New message received', { duration: 4000 });
    };
    const onQuotesChanged = () => {
      toast.info('Quotation updated', { duration: 4000 });
    };
    const onStatusChanged = () => {
      toast.info('Chat status changed', { duration: 4000 });
    };

    s.on('chat:new_message', onNewMessage);
    s.on('quotes:changed', onQuotesChanged);
    s.on('chat:status', onStatusChanged);

    return () => {
      s.off('chat:new_message', onNewMessage);
      s.off('quotes:changed', onQuotesChanged);
      s.off('chat:status', onStatusChanged);
      s.close();
    };
  }, []);

  return (
    <div className="admin-layout" data-admin-dark={dark ? 'true' : 'false'}>
      <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div
        className={`admin-sidebar-overlay${mobileOpen ? ' is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div className="admin-main">
        <AdminHeader onMenuToggle={() => setMobileOpen((s) => !s)} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
