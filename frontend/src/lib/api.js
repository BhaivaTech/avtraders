// src/lib/api.js
import axios from "axios";

/** In dev use 5100; in prod use same-origin (Apache proxies /api to Node) */
function resolveApiBaseURL() {
  if (import.meta.env?.DEV) return "http://localhost:5100";
  if (import.meta.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}`;
  }
  return "http://localhost:5100";
}

export const api = axios.create({
  baseURL: resolveApiBaseURL(),
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

/** Prefix /api for relative URLs (don't double it; leave absolute URLs alone) */
api.interceptors.request.use((config) => {
  const url = config.url || "";
  if (/^https?:\/\//i.test(url)) return config; // absolute → untouched
  if (url.startsWith("/api/")) return config;
  const withLeading = url.startsWith("/") ? url : `/${url}`;
  config.url = `/api${withLeading}`;
  return config;
});

/* ------------------------------------------------------------------ */
/*  CSRF Token Management                                                */
/* ------------------------------------------------------------------ */

let csrfToken = null;

/**
 * Read the csrf_secret cookie value (not HttpOnly, used for double-submit).
 * The actual HttpOnly cookie is set by the server; this reads the
 * non-HttpOnly companion cookie if present, or fetches a fresh token.
 */
function getCsrfCookie() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_secret=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Fetch a fresh CSRF token from the server.
 */
async function fetchCsrfToken() {
  try {
    const resp = await axios.get(`${resolveApiBaseURL()}/api/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = resp.data?.csrf_token || null;
    return csrfToken;
  } catch {
    return null;
  }
}

/**
 * Ensure we have a valid CSRF token (fetch if missing).
 */
async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  return fetchCsrfToken();
}

// Add CSRF token to all state-changing requests
api.interceptors.request.use(async (config) => {
  const method = (config.method || "").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      config.headers["X-CSRF-Token"] = token;
    }
  }
  return config;
});

// On 403 (CSRF mismatch), refresh the token and retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "csrf_token_invalid" &&
      !originalRequest._csrfRetried
    ) {
      originalRequest._csrfRetried = true;
      await fetchCsrfToken();
      if (csrfToken) {
        originalRequest.headers["X-CSRF-Token"] = csrfToken;
      }
      return api(originalRequest);
    }

    // Global 401 handler: clear auth state and notify UI
    if (error.response?.status === 401 && !originalRequest._authCleared) {
      originalRequest._authCleared = true;
      try {
        const path = window.location.pathname;
        if (path.startsWith('/dealers')) {
          localStorage.removeItem('dealerAuth');
        } else if (path.startsWith('/admin')) {
          localStorage.removeItem('adminAuth');
        } else if (path.startsWith('/farmers')) {
          localStorage.removeItem('farmerAuth');
        } else {
          // Fallback: clear all auth keys when role is ambiguous
          localStorage.removeItem('farmerAuth');
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('dealerAuth');
        }
        window.dispatchEvent(new CustomEvent('auth:401', {
          detail: { url: originalRequest.url, path },
        }));
      } catch {}
    }

    return Promise.reject(error);
  }
);

export default api;
