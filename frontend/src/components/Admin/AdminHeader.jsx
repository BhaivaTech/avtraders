// src/components/Admin/AdminHeader.jsx
// Top bar inside the admin layout — menu toggle, page title, and role/name badge.

import React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';

const ROLE_COLORS = {
  superadmin: { bg: '#8b5cf622', border: '#8b5cf644', text: '#7c3aed' },
  manager:    { bg: '#3b82f622', border: '#3b82f644', text: '#1d4ed8' },
  support:    { bg: '#10b98122', border: '#10b98144', text: '#047857' },
  finance:    { bg: '#f59e0b22', border: '#f59e0b44', text: '#b45309' },
};

function IconMenu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default function AdminHeader({ onMenuToggle }) {
  const { name, role, loading } = useAdminAuth();
  const colors = ROLE_COLORS[role] || ROLE_COLORS.support;

  return (
    <header className="admin-header">
      <div className="admin-header-title">Admin</div>
      <div className="admin-header-actions">
        {/* Role + name badge */}
        {!loading && role && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            marginRight: '8px',
          }}>
            {name && (
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--admin-text, #111)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {name}
              </span>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: colors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {role}
            </span>
          </div>
        )}
        <button
          className="admin-header-btn admin-header-menu-btn"
          title="Menu"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <IconMenu />
        </button>
      </div>
    </header>
  );
}
