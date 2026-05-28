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
  headers: { "Content-Type": "application/json" },
});

/** Prefix /api for relative URLs (don’t double it; leave absolute URLs alone) */
api.interceptors.request.use((config) => {
  const url = config.url || "";
  if (/^https?:\/\//i.test(url)) return config; // absolute → untouched
  if (url.startsWith("/api/")) return config;
  const withLeading = url.startsWith("/") ? url : `/${url}`;
  config.url = `/api${withLeading}`;
  return config;
});

export default api;
