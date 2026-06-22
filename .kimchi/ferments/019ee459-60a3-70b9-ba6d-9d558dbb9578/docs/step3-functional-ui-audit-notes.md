# Phase 2 Step 3 — Functional UI Flows Audit Findings & Fixes

## Approach
A comprehensive manual audit of every UI flow was attempted via subagent, but it exceeded the wall-clock time limit (10 min). A targeted manual audit was performed instead, focusing on high-impact functional areas: form submission race conditions, socket event handling, and critical user flows.

## Issues Found & Fixed

### 1. Double-submission in Quotation/LR Upload (HIGH)
**File:** `src/pages/admin/AdminQuotations.jsx`

**Issue:** `uploadQuote()` and `sendLR()` had no `busy` guard. An admin could double-click the "Upload Quotation" or "Send LR" button, triggering two parallel API requests. This could create duplicate quotations or LR messages in the chat.

**Fix:**
- Added `const [busy, setBusy] = useState(false)`
- Both functions now early-return if `busy` is true
- `setBusy(true)` at start, `setBusy(false)` in `finally`
- Buttons disabled when `busy`
- Button labels change to "Uploading…" / "Sending…" when busy

### 2. Socket Listener Cleanup Bugs — Shared Socket Corruption (HIGH)
**Files:** `src/pages/Farmers.jsx`, `src/pages/Admin.jsx`, `src/pages/admin/AdminChat.jsx`

**Issue:** In all 3 chat components, the socket cleanup code used:
```js
s.off('chat:deleted');
s.off('user:blocked');
```
Without passing a handler reference, `.off(eventName)` removes **ALL** listeners for that event on the shared socket instance. This means:
- Farmer page unmounting → removes AdminChat's `chat:deleted` listener
- AdminChat unmounting → removes Farmer page's `user:blocked` listener
- This causes silent functional failures where events stop being handled

**Fix:** Extracted inline arrow function handlers into named constants before registering them, then passed the same references to `.off()`:
```js
const onDeleted = (p) => { ... };
s.on('chat:deleted', onDeleted);
// cleanup:
s.off('chat:deleted', onDeleted);
```
Applied to:
- `chat:deleted` handler in Farmers.jsx, Admin.jsx, AdminChat.jsx
- `chat:status` handler in Farmers.jsx, Admin.jsx, AdminChat.jsx
- `user:blocked` handler in Admin.jsx, AdminChat.jsx

## Areas Audited But No Critical Issues Found

### Farmer Chat Flow (Farmers.jsx)
- `sendMessageNow()` has `sending` + `uploading` guards — no double-submission
- File attachment limits enforced (max 15, max 50MB each)
- Optimistic UI with rollback on error
- `URL.revokeObjectURL` called on cleanup

### Admin Chat Flow (AdminChat.jsx)
- `sendMessage()` has `uploading` guard
- `sendMediaBatch()` has `uploading` guard
- Socket reconnection handled

### Payment Flow (PaymentResult.jsx, Checkout.jsx)
- Status polling has proper cleanup (`timerRef`, `mounted` flag)
- Exponential backoff schedule for polling
- Polling stops on success/failure

### Dealer Auth Flow (Dealers.jsx)
- Already fixed in Step 2 (JWT persistence, 401 handling)

## Deferred / Medium-Low Priority

1. **38 `alert()` calls** across the frontend block the main thread and break UX on mobile. These should be gradually replaced with `toast.error()` / `toast.success()`.
2. **AdminQuotations `loadChats` error handling** already resets to `[]` and shows toast — acceptable.
3. **No dedicated loading state for single text messages** in AdminChat.jsx — `uploading` only covers file uploads. Text-only messages have no visual "sending" indicator.
4. **Mobile tap delay** and gesture handlers in chat could benefit from better touch-action CSS.
5. **Comprehensive E2E testing** of all flows (file upload with 15 files, voice record on iOS, PhonePe redirect on real device) deferred to manual QA.
