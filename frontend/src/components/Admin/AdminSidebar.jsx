// src/components/Admin/AdminSidebar.jsx
// Left-hand navigation rail for the admin panel. Lists links to every
// sub-page (dashboard, inbox, quotations, payments, tracking, users,
// analytics, settings) and renders the active state via NavLink.
//
// Placeholder — the full nav, icons, and role-based visibility will
// be filled in during a later step of the Admin restructure ferment.

import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard'  },
  { to: '/admin/inbox',      label: 'Inbox'      },
  { to: '/admin/quotations', label: 'Quotations' },
  { to: '/admin/payments',   label: 'Payments'   },
  { to: '/admin/tracking',   label: 'Tracking'   },
  { to: '/admin/users',      label: 'Users'      },
  { to: '/admin/analytics',  label: 'Analytics'  },
  { to: '/admin/settings',   label: 'Settings'   },
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <aside className={`admin-sidebar${open ? ' is-open' : ''}`} aria-label="Admin navigation">
      <div className="admin-sidebar-brand">AV Traders Admin</div>
      <nav className="admin-sidebar-nav" onClick={onClose}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `admin-sidebar-link${isActive ? ' is-active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
