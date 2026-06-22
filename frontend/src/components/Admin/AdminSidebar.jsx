// src/components/Admin/AdminSidebar.jsx
// Left-hand navigation rail for the admin panel.
// Nav items are filtered based on the current admin's role via useAdminAuth().

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';

/* ── inline nav icons ── */
const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
  ),
  inbox: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
  quotations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  ),
  tracking: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
};

/**
 * Each nav item declares the permission it requires.
 * null means "no permission required" (visible to all roles).
 */
const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: icons.dashboard,  permission: null },
  { to: '/admin/inbox',      label: 'Inbox',      icon: icons.inbox,      permission: 'chats' },
  { to: '/admin/quotations', label: 'Quotations', icon: icons.quotations, permission: 'quotations' },
  { to: '/admin/payments',   label: 'Payments',   icon: icons.payments,   permission: 'payments' },
  { to: '/admin/tracking',   label: 'Tracking',   icon: icons.tracking,   permission: 'chats' },
  { to: '/admin/users',      label: 'Users',      icon: icons.users,      permission: 'users' },
  { to: '/admin/analytics',  label: 'Analytics',  icon: icons.analytics,  permission: 'analytics' },
  { to: '/admin/settings',   label: 'Settings',   icon: icons.settings,   permission: null },
];

const ROLE_COLORS = {
  superadmin: '#8b5cf6',
  manager:    '#3b82f6',
  support:    '#10b981',
  finance:    '#f59e0b',
};

export default function AdminSidebar({ open, onClose }) {
  const { role, name, hasPermission, loading } = useAdminAuth();

  const visibleItems = loading
    ? NAV_ITEMS // show all while loading to prevent layout shift
    : NAV_ITEMS.filter(({ permission }) =>
        permission === null || hasPermission(permission)
      );

  return (
    <aside className={`admin-sidebar${open ? ' is-open' : ''}`} aria-label="Admin navigation">
      <div className="admin-sidebar-brand">AV Traders Admin</div>

      {/* Role identity pill */}
      {!loading && role && (
        <div className="admin-sidebar-role-pill" style={{
          margin: '0 16px 12px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: `${ROLE_COLORS[role] || '#6b7280'}22`,
          border: `1px solid ${ROLE_COLORS[role] || '#6b7280'}44`,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: ROLE_COLORS[role] || '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {role}
          </span>
          {name && (
            <span style={{ fontSize: '13px', color: 'var(--admin-text, #111)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
          )}
        </div>
      )}

      <nav className="admin-sidebar-nav" onClick={onClose}>
        {visibleItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `admin-sidebar-link${isActive ? ' is-active' : ''}`
            }
          >
            {icon}
            <span className="admin-sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
