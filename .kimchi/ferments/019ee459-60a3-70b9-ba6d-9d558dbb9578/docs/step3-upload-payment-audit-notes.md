# Phase 1 Step 3 — File Upload & Payment Security Audit Findings

## File Upload Security

**Result: NO critical issues found.**

### Upload Middleware (`src/middlewares/upload.js`)
- **MIME whitelist** ✓ — Each upload type (chat, quotes, dealer docs, announcements) has a strict Map of allowed MIMEs. No extension-based guessing.
- **Secure filenames** ✓ — `crypto.randomUUID()` with extension derived from MIME whitelist (not user input). No path traversal possible.
- **Size limits** ✓ — Chat 20MB, quotes 15MB, dealer docs 8MB (max 2 files), announcements 5MB.
- **File count limits** ✓ — Dealer docs limited to 2 files.

### Static File Serving
- Public `express.static` serves `/uploads` (chat images, quotes, announcements) without authentication.
- Files use UUID names so not guessable, but anyone with the URL can access them permanently (immutable cache headers).
- **Finding: MEDIUM** — Uploaded files lack access controls. Not fixed in this session due to scope/complexity — would require authenticated file-serving routes.
- Dealer docs are stored in `uploads_private/` (separate from `uploads/`) and are NOT served by the static middleware ✓

## Payment Security

### PhonePe Webhook (`POST /api/payment/webhook`)
- **Signature verification** ✓ — HMAC-SHA256 with salt key; raw body preserved via `express.raw()`.
- **Salt index check** ✓ — Validates against configured `PHONEPE_SALT_INDEX`.
- **Amount integrity** ✓ — Compares webhook amount against stored amount in paise.
- **JSON parsing safety** ✓ — Try-catch around JSON.parse.
- **Idempotent response** ✓ — Returns 200 on errors (prevents webhook retries from cascading).

### PhonePe Debug Config (`GET /api/payment/debug/config`)
- Route protected by `ensureAdminSession` ✓.
- `configPreview()` exposes `env`, `isProd`, `clientId`, `clientVersion` — does NOT expose `clientSecret` ✓.

### Critical Fix: Payment Status Endpoint
**Issue (CRITICAL):** `GET /api/payment/status/:paymentId` had **no authentication middleware**. Any unauthenticated user could enumerate payment IDs and view payment status, amount, transaction ID, and associated chat metadata (including customer name/phone via admin payments endpoint).

**Fix applied:**
1. Added `requireFarmerOrAdminSession` middleware to the route.
2. Created `getPaymentWithOwner()` model function (joins payments → chats for ownership verification).
3. Created `assertPaymentAccess()` controller helper: admin bypasses, farmer must match `chat.user_id`.
4. Applied ownership checks to both `GET /api/payment/status/:paymentId` and `GET /api/payment/iframe-token`.

### Fixes Summary
| File | Change |
|---|---|
| `src/routes/payment.js` | Added `requireFarmerOrAdminSession` to `/status/:paymentId` |
| `src/models/paymentModel.js` | Added `getPaymentWithOwner()`; added `chat_id` to `getPaymentById` |
| `src/controllers/paymentController.js` | Added `assertPaymentAccess()` helper; applied ownership checks to `getPaymentStatus` and `iframeToken` |

All modified files pass `node --check`.
