// src/pages/admin/AdminInbox.jsx
// Customer / farmer inbox — mounts the extracted AdminChat component.
// This page sits inside AdminLayout so the sidebar + header chrome is
// always visible while the chat list and thread fill the main area.

import React from 'react';
import AdminChat from './AdminChat.jsx';

export default function AdminInbox() {
  return (
    <div className="admin-page" data-admin-page="inbox">
      <AdminChat />
    </div>
  );
}
