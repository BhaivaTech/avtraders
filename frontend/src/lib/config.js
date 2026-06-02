// src/lib/config.js
// Single source of truth for all business contact & app constants.
// All values come from .env (VITE_ prefix required by Vite).

export const SITE_TITLE    = import.meta.env.VITE_SITE_TITLE    || 'AV Traders Agri Clinic';
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '';    // e.g. +919886371630
export const WHATSAPP_URL  = import.meta.env.VITE_WHATSAPP_URL  || '';    // e.g. https://wa.me/919886371630
export const WHATSAPP_CHANNEL_URL = import.meta.env.VITE_WHATSAPP_CHANNEL_URL || ''; // community channel
export const SITE_URL      = import.meta.env.VITE_SITE_URL      || '';    // e.g. https://www.avtradersagriclinic.com
export const MAPS_LINK     = import.meta.env.VITE_MAPS_LINK     || '';    // Google Maps short link
export const MAPS_ADDRESS  = import.meta.env.VITE_MAPS_ADDRESS  || '';    // Full address string for embed query
export const UPI_ID        = import.meta.env.VITE_UPI_ID        || '';
export const UPI_NAME      = import.meta.env.VITE_UPI_NAME      || '';

// Admin (frontend-side guard — server still enforces the real auth)
export const ADMIN_EMAIL_ALLOWED = import.meta.env.VITE_ADMIN_EMAIL || '';
