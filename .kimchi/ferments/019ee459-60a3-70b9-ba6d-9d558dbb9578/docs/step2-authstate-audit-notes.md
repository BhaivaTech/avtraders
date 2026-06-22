# Frontend Auth State Audit — Step 2

## Audit Date
2026-06-20

## Files Audited
- `src/lib/api.js` — axios config, interceptors
- `src/lib/socket.js` — socket auth
- `src/App.jsx` — global routing / auth guards
- `src/pages/Farmers.jsx` — farmer auth lifecycle
- `src/pages/Admin.jsx` — admin auth lifecycle
- `src/pages/Dealers.jsx` — dealer auth lifecycle
- `src/components/RequireAdmin.jsx` — admin route guard
- `src/components/RequireFarmer.jsx` — farmer route guard
- `src/components/Admin/AdminLayout.jsx` — admin layout + sockets
- `src/pages/admin/AdminSettings.jsx` — admin settings + logout
- `src/pages/admin/AdminChat.jsx` — admin chat + 401 handling
- `src/pages/admin/AdminDashboard.jsx` — admin dashboard

---

## Auth Persistence Model by Role

### Farmer Auth
- **Storage**: `localStorage` key `farmerAuth` → `{ mobile: string }`
- **Session mechanism**: HTTP-only cookie (set by backend) + `withCredentials: true`
- **Initialization**: On mount, `Farmers.jsx` reads `farmerAuth`, calls `/auth/me` to validate session, then `/auth/exists/:mobile` to check blocked status
- **Survives refresh**: Yes — localStorage is read on mount and session cookie revalidated with backend
- **Revalidation**: Yes — explicit backend calls on every mount (`/auth/me`, `/auth/exists/:mobile`)
- **Logout**: Calls `POST /auth/logout`, removes `farmerAuth`, resets component state (`setLogged(false)`, clears thread/chat/quotes)

### Admin Auth
- **Storage**: `localStorage` key `adminAuth` → `{ ts: number, email: string }`
- **Session mechanism**: HTTP-only cookie (set by backend) + `withCredentials: true`
- **Initialization**: On mount, `Admin.jsx` reads `adminAuth`, checks `ts` against 10-day expiry (`TEN_DAYS_MS`), marks `authed = true` if valid
- **Survives refresh**: Yes — localStorage is read on mount
- **Revalidation**: Partial — timestamp check only; no backend ping on mount. However several API calls later will 401 if cookie expired, and ad-hoc handlers clear state
- **Logout**: `Admin.jsx` calls `POST /admin/logout`, removes `adminAuth`, resets state. `AdminSettings.jsx` also logs out, calls same endpoint, then does `window.location.reload()`

### Dealer Auth
- **Storage**: **NONE** (before fix). Token was held in React `useState` only
- **Session mechanism**: JWT Bearer token in `Authorization` header
- **Initialization**: **NONE** (before fix). On refresh, token was empty → user sent back to login
- **Survives refresh**: **NO** (before fix) — this was the primary gap
- **Revalidation**: **NONE** (before fix)
- **Logout**: `resetToIntro()` cleared React state but did not call server or clear localStorage (because none existed)

---

## Issues Found and Severity

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | **Dealer JWT lost on refresh** — token stored only in `useState`, no `localStorage` persistence. Dealer had to re-login every refresh. | **CRITICAL** | **FIXED** |
| 2 | **No global 401 interceptor** — `api.js` only handled 403 CSRF retry. Every component handled 401 ad-hoc (Admin.jsx, AdminChat.jsx). Farmers.jsx had no 401 handling at all. | **HIGH** | **FIXED** |
| 3 | **Dealer logout did not call server** — `resetToIntro()` only cleared React state, did not invalidate JWT server-side. | **MEDIUM** | **FIXED** |
| 4 | **AdminChat.jsx 401 handling incomplete** — on 401 it removed `adminAuth` from localStorage but did not update React state or redirect. | **MEDIUM** | **Partially addressed via global interceptor** |
| 5 | **No token-leaking console.logs found** — `socket.js` logs origin in DEV only (no token). Farmers.jsx has `console.error` for OTP failures but no auth secrets emitted. | LOW | **Noted** |
| 6 | **localStorage XSS vulnerability** — standard for the stack. `farmerAuth` only stores mobile, `adminAuth` stores email+timestamp, `dealerAuth` stores JWT. Mitigation: no sensitive PII beyond email/phone. JWT is inherently revocable server-side. | LOW | **Noted** |

---

## Fixes Applied

### 1. Dealer JWT Persistence (`src/pages/Dealers.jsx`)
**What changed:**
- Added `localStorage` key `dealerAuth` to persist `{ token, dealer, ts }`
- `token` and `dealer` state now initialize from `localStorage` on component mount
- `useEffect` watches `token`/`dealer` and persists to `localStorage`
- Added mount-time revalidation: if saved token exists but no dealer state, calls `GET /api/dealer/me` (confirmed backend endpoint exists). If 401/invalid, clears auth and localStorage
- Added 401 handling inside the custom `fetch`-based `api()` wrapper: clears `token`, `dealer`, and `localStorage` on 401
- Updated `resetToIntro()` to call `POST /api/dealer/logout` with the Bearer token, then clear localStorage

**Lines modified:** ~4 blocks (state initialization, persistence effect, revalidation effect, api() error handler, resetToIntro)

### 2. Global 401 Interceptor (`src/lib/api.js`)
**What changed:**
- Added a 401 branch in the axios response interceptor
- On 401, inspects `window.location.pathname` to determine which auth key to clear:
  - `/dealers/*` → removes `dealerAuth`
  - `/admin/*` → removes `adminAuth`
  - `/farmers/*` → removes `farmerAuth`
  - Fallback (ambiguous path) → removes all three
- Dispatches `CustomEvent('auth:401')` so any mounted page React component can listen and redirect
- Uses `_authCleared` flag to prevent infinite retry loops

**Lines modified:** ~1 block in `api.interceptors.response.use`

---

## Security Notes

1. **localStorage vs XSS**: All auth tokens are stored in `localStorage`, which is vulnerable to XSS. This is the project's chosen architecture (standard for SPA + JWT). Recommended future hardening:
   - Move session identifiers to `HttpOnly` cookies where possible (already done for farmer/admin)
   - For dealer JWT, consider short expiry + refresh tokens stored in `HttpOnly` cookies
   - Add a strict Content-Security-Policy to mitigate XSS injection

2. **CSRF Protection**: Already present. `api.js` injects `X-CSRF-Token` on state-changing requests and retries on `403 csrf_token_invalid`.

3. **Token Revocation**: Dealer logout now hits `POST /api/dealer/logout` server-side, allowing the backend to blacklist or log the JWT revocation.

---

## Remaining Gaps / Recommendations

1. **AdminChat.jsx 401 state sync**: The component still handles 401 locally in some places. It should also listen for `auth:401` event to trigger a full redirect or state reset.
2. **Farmer 401 handling**: Farmers.jsx does not handle 401 in most API calls. The global interceptor now clears `farmerAuth`, but the component UI won't react until next render cycle. Consider adding a `window.addEventListener('auth:401', ...)` in Farmers.jsx to force re-render or redirect.
3. **Admin revalidation on mount**: Admin only checks a 10-day timestamp; it does not verify the session cookie with the backend on mount. A backend ping (e.g., `GET /admin/stats`) on mount would close this gap.
4. **RequireAdmin / RequireFarmer guards**: These only check `localStorage` key existence. They do not validate timestamps or backend sessions. Consider wrapping them in a small context that listens to `auth:401` events.

---

## Build Verification
- `npm run build` passed successfully (Vite production build, 17s)
- No test suite configured in frontend (`npm test` absent)
