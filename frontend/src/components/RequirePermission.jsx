// src/components/RequirePermission.jsx
// Route-level guard that checks the current admin's role permission.
// Renders a 403 "Access Denied" page if the role doesn't have access.
//
// Usage in App.jsx:
//   <Route path="/admin/payments" element={
//     <RequirePermission permission="payments"><AdminPayments /></RequirePermission>
//   } />

import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';

export default function RequirePermission({ permission, children }) {
  const { loading, hasPermission, role } = useAdminAuth();

  if (loading) return null;

  if (!hasPermission(permission)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ fontSize: '64px', lineHeight: 1 }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Access Denied</h2>
        <p style={{ color: 'var(--admin-text-muted, #6b7280)', margin: 0, maxWidth: 360 }}>
          Your role <strong>{role || 'unknown'}</strong> does not have permission
          to access this page. Contact a superadmin if you need access.
        </p>
      </div>
    );
  }

  return children;
}
