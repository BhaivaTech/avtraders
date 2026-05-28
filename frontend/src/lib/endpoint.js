// src/lib/endpoint.js

// dev fallback (not used on prod)
const DEV_FALLBACK =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5100";

function isLocalHost() {
  try {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
  } catch {
    return true;
  }
}

// Base origin (no /api). On prod we always use same-origin.
export function resolveApiBase() {
  try {
    const { origin, hostname } = window.location;
    if (!isLocalHost() && /avtradersagriclinic\.com$/i.test(hostname)) return origin;
  } catch {}
  return DEV_FALLBACK;
}

export function resolveApiOrigin() {
  try {
    const b = new URL(resolveApiBase());
    return `${b.protocol}//${b.host}`;
  } catch {
    const b = resolveApiBase();
    return b.replace(/\/api\/?$/, "");
  }
}

// Build media URL safely on our origin
export function buildMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  // strip any leading/trailing quotes
  let v = String(pathOrUrl).trim().replace(/^['"]+|['"]+$/g, "");

  // If it's a bare filename (no http, no starting slash), route via /uploads/
  if (!/^https?:\/\//i.test(v) && !v.startsWith("/")) {
    v = "/uploads/" + v;
  }

  try {
    const origin = resolveApiOrigin();
    const base = new URL(origin);
    const u = new URL(v, base); // resolves relative to our origin
    // Force our origin even if DB has foreign origin
    if (u.origin !== base.origin) return base.origin + u.pathname + u.search + u.hash;
    return u.toString();
  } catch {
    const base = String(resolveApiOrigin()).replace(/\/$/, "");
    const p = v.startsWith("/") ? v : `/${v}`;
    return `${base}${p}`;
  }
}
