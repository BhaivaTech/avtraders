// src/components/PageSkeleton.jsx
// Lightweight placeholder used by <Suspense fallback={...}/> when a lazy
// page chunk is loading. Renders a few card-shaped blocks so the layout
// does not "jump" while JS is being fetched.

import React from "react";

/**
 * Page-level skeleton. Two variants:
 *  - "default" — generic card stack (used by most public pages)
 *  - "admin"   — pre-renders the admin shell so the office team does
 *                not see a flash of "blank" on every navigation
 */
export default function PageSkeleton({ variant = "default" }) {
  if (variant === "admin") return <AdminSkeleton />;
  return <DefaultSkeleton />;
}

function DefaultSkeleton() {
  return (
    <div className="skeleton-page" role="status" aria-live="polite" aria-label="Loading page">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: "70%" }} />
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="skeleton-page skeleton-admin" role="status" aria-live="polite" aria-label="Loading admin">
      <div className="skeleton skeleton-admin-sidebar" />
      <div className="skeleton-admin-main">
        <div className="skeleton skeleton-admin-header" />
        <div className="skeleton skeleton-chat-row" />
        <div className="skeleton skeleton-chat-row" />
        <div className="skeleton skeleton-chat-row" />
        <div className="skeleton skeleton-chat-row" />
        <div className="skeleton skeleton-chat-row" />
      </div>
    </div>
  );
}
