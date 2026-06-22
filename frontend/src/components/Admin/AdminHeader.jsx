// src/components/Admin/AdminHeader.jsx
// Top bar inside the admin layout — search, notifications, and the admin user menu.

import React from 'react';

function IconMenu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default function AdminHeader({ onMenuToggle }) {
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
      </div>
    </header>
  );
}
