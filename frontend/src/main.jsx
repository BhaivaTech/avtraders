
// src/main.jsx
// React 18 entry point.
//
// Order matters here:
//   1. Inline <head> script bootstraps the theme synchronously to avoid
//      a flash of light theme on first paint.
//   2. <HelmetProvider> wraps everything so per-page <Seo/> updates work.
//   3. <Toaster/> sits above the router so error boundaries can toast.
//   4. <BrowserRouter> + <App/> come last.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import './styles.css';
import './i18n.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          // theme-aware toasts — see styles.css
          className: 'toast-base',
          success: { iconTheme: { primary: '#48a43f', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
