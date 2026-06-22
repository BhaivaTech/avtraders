# Phase 1 Step 2 — SQL Injection & Input Validation Audit Findings

## SQL Injection

**Result: NO issues found.** All model files use parameterized `?` placeholders with `mysql2/promise` `pool.query()`:
- `userModel.js` — parameterized ✓
- `dealerModel.js` — parameterized ✓
- `chatModel.js` — parameterized; dynamic column names use whitelist (`VALID_SOFT_DELETE_COLUMNS`) ✓
- `quotationModel.js` — parameterized ✓
- `productModel.js` — parameterized ✓
- `announcementModel.js` — parameterized ✓
- `paymentModel.js` — parameterized; dynamic WHERE concatenates conditions but values are in `params` array ✓
- `dealerOrderModel.js` — parameterized; dynamic WHERE concatenates conditions but values are in `params` array ✓
- `auditModel.js` — parameterized; dynamic WHERE concatenates conditions but values are in `params` array ✓
- `authAuditModel.js` — parameterized ✓

## Input Validation

### Issues Fixed

| Route | Issue | Fix |
|---|---|---|
| `POST /api/dealer/register` | No validation schema applied (`dealerRegisterSchema` existed but unused) | Added `validateBody(dealerRegisterSchema)` to route |
| `POST /api/dealer/orders` | No validation schema; `items` array could be arbitrarily large (DoS) | Created `placeOrderSchema` (max 100 items, qty max 10,000) and applied it |
| `POST /api/phonepe/create` | No validation schema (`phonepeCreateSchema` existed but unused) | Added `validateBody(phonepeCreateSchema)` to route |
| `POST /api/translate` | No limits on `q` array length (DoS via massive Azure API calls) | Created `translateSchema` (max 50 strings, 10,000 chars each) and applied it |

### Routes Intentionally Without Zod (No User Input)
- `POST /admin/logout` — no body needed
- `POST /auth/logout` — no body needed
- `POST /dealer/logout` — no body needed
- `POST /api/payment/webhook` — raw body for signature verification
- `POST /api/quotes/mark-paid/:id` — internal webhook with `X-Internal-Secret`
- `POST /api/internal/msg91-proxy` — localhost-only proxy

All modified files pass `node --check`.
