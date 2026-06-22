# Phase 1 Step 4 — Functional API Behavior Audit Findings

## Chat Endpoints — CRITICAL Ownership Vulnerabilities Found & Fixed

### Issues
1. **`POST /api/chat/message`** — No mobile verification: a logged-in farmer could send messages impersonating any other farmer by providing a different `mobile` in the request body. Admin sender_role already had checks.
2. **`GET /api/chat/thread/:chatId`** — No ownership check: any authenticated farmer could read messages from any chat by sending an arbitrary `chatId`.
3. **`DELETE /api/chat/message/:id`** — No ownership check: any authenticated farmer could soft-delete messages from any chat.
4. **`POST /api/chat/clear` & `POST /api/chat/delete`** — No ownership check: any authenticated farmer could clear or delete all messages in any chat.

### Fixes Applied
- Added `sessionUserId(req)` helper to extract the farmer user ID from session.
- Added `assertOwnsChat(req, chatId)` async helper: admin bypasses; farmer must have `chats.user_id === sessionUserId`.
- Added `assertOwnsMessageChat(req, messageId)` async helper: joins messages→chats to verify chat ownership.
- **`postMessage`**: Added check `if (!req.session?.admin && sender_role !== 'admin')` → verify `req.body.mobile` matches session mobile.
- **`getThread`**: Added `await assertOwnsChat(req, chatId)` before fetching thread.
- **`deleteMessage`**: Added `await assertOwnsMessageChat(req, id)` before any delete operation.
- **`clearChat` & `deleteChat`**: Added `await assertOwnsChat(req, chat_id)` before clearing/deleting.
- All added 403/401 catch blocks in try/catch to return proper status codes.

### Files Changed
- `src/controllers/chatController.js` (ownership helpers + applied to 5 functions)

## Dealer Endpoints
- `authDealer` middleware on all dealer routes ✓
- `placeOrder` fetches live prices from DB, validates products exist ✓
- `getMyOrders` restricted to `req.dealer.id` ✓

## Farmer Endpoints
- `requireFarmerSession` on profile endpoints ✓
- `saveProfile` uses DB transaction ✓

## Payment & Quotation Endpoints
- `markPaid` uses constant-time secret comparison ✓
- `uploadQuotation` admin-only ✓
- `getLatestByMobile` / `listByMobile` use `canViewMobile()` ownership helper ✓

## Admin Endpoints
- `ensureAdminSession` on all state-changing routes ✓
- `/admin/me` has inline admin check ✓
- `/admin/logout` records audit log ✓

## CSRF & Rate Limiting
- Double-submit cookie CSRF with HMAC-SHA256 constant-time comparison ✓
- Exempt paths for webhooks ✓
- Per-IP and per-identifier rate limiters (farmer/dealer OTP, admin login, API) ✓

## Error Handling
- All controllers use try/catch ✓
- JSON response shape `{ ok, ... }` is mostly consistent ✓
- Server errors logged with `console.error` or `logger.error` ✓
