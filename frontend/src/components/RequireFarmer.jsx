// src/components/RequireFarmer.jsx
// Redirects to /farmers if farmer is not authenticated.
// Wraps every route that requires a logged-in farmer.

import React from 'react';
import { Navigate } from 'react-router-dom';

function isFarmerAuthed() {
  try {
    return !!localStorage.getItem('farmerAuth');
  } catch {
    return false;
  }
}

export default function RequireFarmer({ children }) {
  return isFarmerAuthed() ? children : <Navigate to="/farmers" replace />;
}
