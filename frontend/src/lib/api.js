// src/lib/api.js
import axios from "axios";

/** In dev use 5100; in prod use same-origin (Apache proxies /api to Node) */
function resolveApiBaseURL() {
  if (import.meta.env?.DEV) return "http://localhost:5100";
  if (import.meta.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
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
let csrfRequest = null;

/** Fetch one shared token request so concurrent writes use the same cookie. */
async function fetchCsrfToken() {
  if (!csrfRequest) {
    csrfRequest = axios.get(`${resolveApiBaseURL()}/api/csrf-token`, {
      withCredentials: true,
      timeout: 20000,
      headers: { "Cache-Control": "no-cache" },
    }).then((resp) => {
      const token = resp.data?.csrf_token;
      if (!token) throw new Error("Could not obtain a CSRF token. Refresh and try again.");
      csrfToken = token;
      return token;
    }).finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
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

// Refresh missing or expired CSRF credentials and retry once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 403 &&
      ["csrf_token_invalid", "csrf_token_missing"].includes(error.response?.data?.error) &&
      originalRequest && !originalRequest._csrfRetried
    ) {
      originalRequest._csrfRetried = true;
      csrfToken = null;
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
