// src/components/Seo.jsx
// Per-page <title>, meta description, canonical, OpenGraph, Twitter card,
// and (optional) JSON-LD. Built on react-helmet-async.
//
// Usage:
//   <Seo pageKey="clinic" />
//   <Seo title="…" description="…" canonical="/foo" jsonLd={{...}} />

import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'AV Traders Agri Clinic';
const DEFAULT_DESCRIPTION =
  'AV Traders Agri Clinic — agronomy advice, crop protection, and dealer distribution in Karnataka.';
const DEFAULT_OG_IMAGE = '/1234.png';

// Static metadata for known pages. Anything not listed here falls
// back to the title from the prop and the site-wide defaults.
const PAGE_META = {
  home: {
    title: `${SITE_NAME} — Agronomy, Crops & Dealer Network`,
    description:
      'Talk to an agronomist, browse the farmer’s guide, and find your nearest AV Traders dealer in Karnataka.',
  },
  clinic: {
    title: `Agri Clinic — ${SITE_NAME}`,
    description:
      'Get crop-protection advice from the AV Traders agronomy team. Share photos and chat with an expert.',
  },
  distribution: {
    title: `Distribution — ${SITE_NAME}`,
    description: 'Become an AV Traders dealer. Insured distribution of crop-protection products across Karnataka.',
  },
  farmers: {
    title: `Farmer Chat — ${SITE_NAME}`,
    description: 'Chat with our agronomy team, request quotations, and track your crop-protection advice.',
  },
  dealers: {
    title: `Dealer Portal — ${SITE_NAME}`,
    description: 'Dealer login, registration, document upload, and price-list downloads.',
  },
  admin: {
    title: `Admin — ${SITE_NAME}`,
    description: 'AV Traders admin panel.',
    noindex: true,
  },
  about: {
    title: `About — ${SITE_NAME}`,
    description: 'The story behind AV Traders Agri Clinic and our team of agronomists.',
  },
  contact: {
    title: `Contact — ${SITE_NAME}`,
    description: 'Call, WhatsApp, or visit the AV Traders office.',
  },
  guide: {
    title: `Farmer’s Guide — ${SITE_NAME}`,
    description: 'Pest and disease management guides for Karnataka crops.',
  },
  products: {
    title: `Products — ${SITE_NAME}`,
    description: 'Insecticides, fungicides, and crop-protection products distributed by AV Traders.',
  },
  checkout: {
    title: `Checkout — ${SITE_NAME}`,
    noindex: true,
  },
  'farmers/profile': {
    title: `Farmer Profile — ${SITE_NAME}`,
    noindex: true,
  },
  'admin/announcements': {
    title: `Announcements — ${SITE_NAME} Admin`,
    noindex: true,
  },
  notfound: {
    title: `Page not found — ${SITE_NAME}`,
    description: 'The page you’re looking for does not exist.',
    noindex: true,
  },
};

function resolvePageMeta(pageKey) {
  if (!pageKey) return null;
  return PAGE_META[pageKey] || null;
}

export default function Seo({
  pageKey,
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
  lang,
}) {
  const meta = resolvePageMeta(pageKey);
  const finalTitle = title || meta?.title || SITE_NAME;
  const finalDescription = description || meta?.description || DEFAULT_DESCRIPTION;
  const finalNoindex = noindex || meta?.noindex || false;
  const finalCanonical =
    canonical ||
    (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '');

  return (
    <Helmet prioritizeSeoTags>
      <html lang={lang || 'en'} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalNoindex && <meta name="robots" content="noindex, nofollow" />}
      {finalCanonical && <link rel="canonical" href={finalCanonical} />}

      {/* OpenGraph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={ogImage} />
      {finalCanonical && <meta property="og:url" content={finalCanonical} />}
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
