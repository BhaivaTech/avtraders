// src/components/ErrorBoundary.jsx
// Catches render errors in any child component tree and shows a friendly
// fallback instead of a blank screen.
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

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
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Something went wrong</h2>
        <p style={{ color: '#64748b', maxWidth: 420, margin: 0 }}>
          An unexpected error occurred. Please refresh the page or go back to the home page.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre style={{
            textAlign: 'left',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#991b1b',
            maxWidth: 640,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.toString()}
          </pre>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }
}
