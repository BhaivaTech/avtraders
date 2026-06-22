// src/components/RequireAdmin.jsx
// Redirects to home page if admin is not authenticated.
// Wraps every route that requires admin privileges.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function isAdminAuthed() {
  try {
    return !!localStorage.getItem('adminAuth');
  } catch {
    return false;
  }
}

export default function RequireAdmin({ children }) {
  const location = useLocation();
  return isAdminAuthed()
    ? children
    : <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
}
