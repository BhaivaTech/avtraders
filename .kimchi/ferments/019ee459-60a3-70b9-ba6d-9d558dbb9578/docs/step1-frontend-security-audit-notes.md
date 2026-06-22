# Phase 2 Step 1 — Frontend Security Audit Findings & Fixes

## 1. Route Guards — ADDED

### Issue
All routes were public. Any visitor could navigate to:
- `/admin/dashboard`, `/admin/inbox`, etc. — no auth required
- `/farmers/profile` — no auth required (though it showed a "please login" message, the page still rendered)

### Fixes Applied
- Created `src/components/RequireAdmin.jsx` — checks `localStorage.getItem('adminAuth')`, redirects to `/` if missing.
- Created `src/components/RequireFarmer.jsx` — checks `localStorage.getItem('farmerAuth')`, redirects to `/farmers` if missing.
- Updated `src/App.jsx`:
  - Wrapped `/admin/announcements` and `/admin` (AdminLayout) with `<RequireAdmin>`
  - Wrapped `/farmers/profile` with `<RequireFarmer>`

### Deferrals
- The legacy monolithic `Admin.jsx` page (with built-in login) is NOT in the route table; the new modular admin has no dedicated login route. A future refactor should carve out the login UI from `Admin.jsx` into a separate `/admin/login` route. For now, unauthenticated users hitting `/admin` are redirected to `/` (home).
- Client-side route guards can be bypassed by a determined user, but the backend already rejects unauthorized API calls with 401.

## 2. dangerouslySetInnerHTML XSS Risk — FIXED

### Issue
dangerouslySetInnerHTML was used in 3 chat pages to render linkified text:
- `src/pages/Farmers.jsx` (line ~2003)
- `src/pages/Admin.jsx` (line ~2402)
- `src/pages/admin/AdminChat.jsx` (line ~2016)

Though the existing `linkify()` function did HTML-escape characters before injecting anchor tags, the pattern is fragile — any accidental removal of `esc()` or change to the regex would create an XSS hole.

### Fixes Applied
- Created `src/components/LinkifyText.jsx` — a React component that splits text by URL regex and renders plain strings as React text nodes and URLs as `<a>` elements. Zero use of dangerouslySetInnerHTML.
- Replaced all 3 dangerouslySetInnerHTML usages with `<LinkifyText text={m.text} />`.
- Removed the 3 inline `linkify()` functions from those files.

## 3. Environment Variable Exposure — NO ISSUE

Searched `src/` for `import.meta.env` usage:
- `VITE_API_URL`, `VITE_API_BASE_URL`, `VITE_DEALER_LOGIN_MODE` — public config, safe
- `VITE_SITE_TITLE`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_URL`, `VITE_SITE_URL`, `VITE_MAPS_LINK`, `VITE_MAPS_ADDRESS`, `VITE_UPI_ID`, `VITE_UPI_NAME` — public marketing/contact data, safe
- `VITE_ADMIN_EMAIL` — the allowed admin email address. Not a secret key, just a config value. **MEDIUM**: exposes the admin email to any visitor. This is a minor info-disclosure. The backend uses its own `ADMIN_EMAIL` env for actual validation; this is just UI.

**No immediate fix needed.** If desired, the email could be moved to a backend endpoint that returns it only to admins, but this is not a critical vulnerability.

## 4. Google Translate Widget — RISK ACCEPTED

The `LanguageSwitch.jsx` component dynamically injects Google's translation script (`https://translate.google.com/translate_a/element.js`).

### Risk
- **CSP violation** — the widget loads a third-party script that could be compromised by Google or MITM (though Google serves it over HTTPS).
- **Privacy** — page content is sent to Google's servers.
- **DOM manipulation** — the widget mutates the DOM outside React's control, which could cause React reconciliation issues.

### Mitigations already in place
- The widget is hidden via CSS (`display:none !important`).
- A MutationObserver actively suppresses Google UI elements.

### Decision
The app uses react-i18next with local JSON translations (`i18n.js`) for the language switcher UI, but falls back to Google Translate for dynamic content (chat messages, etc.). Full removal of Google Translate would require significant investment in a custom translation backend or manual translations. **Deferred to a future hardening phase.**
