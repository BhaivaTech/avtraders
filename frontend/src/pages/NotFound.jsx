// src/pages/NotFound.jsx
// Shown for any URL that doesn't match a route (catch-all <Route path="*">).
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64 }}>🌾</div>
      <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: '#1e293b' }}>404</h1>
      <h2 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>Page Not Found</h2>
      <p style={{ color: '#64748b', maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
        Sorry, the page you are looking for doesn't exist or may have been moved.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '10px 24px',
            background: '#0f766e',
            color: '#fff',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Go to Home
        </Link>
        <Link
          to="/contact"
          style={{
            padding: '10px 24px',
            background: '#f1f5f9',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
