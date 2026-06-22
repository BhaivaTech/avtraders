// src/components/LinkifyText.jsx
// Renders text with clickable URLs, WITHOUT using dangerouslySetInnerHTML.
// Links open in a new tab with noopener/noreferrer.

import React from 'react';

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

export default function LinkifyText({ text = '', className }) {
  if (!text) return null;

  const parts = text.split(URL_RE);
  const matches = text.match(URL_RE) || [];

  const out = [];
  parts.forEach((part, i) => {
    if (part) out.push(<span key={`t-${i}`}>{part}</span>);
    const m = matches[i];
    if (m) {
      const href = m.startsWith('www.') ? `http://${m}` : m;
      out.push(
        <a
          key={`a-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={(e) => e.stopPropagation()}
        >
          {m}
        </a>
      );
    }
  });

  return <span className={className}>{out}</span>;
}
