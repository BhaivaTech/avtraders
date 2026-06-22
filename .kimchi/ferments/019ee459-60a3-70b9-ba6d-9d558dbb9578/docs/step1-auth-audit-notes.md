# Phase 1 Step 1 — Auth & Session Security Audit Findings

## Critical Issues

### 1. JWT_SECRET hardcoded fallback `CHANGE_ME` in auth.js
**File:** `src/middlewares/auth.js:11`
Even though `env.js` validates it, a fallback to `'CHANGE_ME'` is a vulnerability. **Fix:** remove the fallback entirely.

### 2. Chat routes lack farmer/auth session enforcement
**File:** `src/routes/chat.js`
- `POST /message` — no auth (anyone can post to any farmer's chat)
- `GET /thread/:chatId` — no auth (anyone can read any chat)
- `DELETE /message/:id` — no auth (anyone can delete messages)
- `POST /clear` — no auth
- `POST /delete` — no auth

`server.js` mounts `requireAdminIfAdminRole` on `/api/chat`, but that allows non-admin requests to pass through without any session check.

**Fix:** Add a `requireFarmerOrAdminSession` middleware and apply it to all chat routes except the admin-only ones.

### 3. Quotes routes lack auth on list/get + `mark-paid` uses secret auth
**File:** `src/routes/quotes.js`
- `GET /latest-by-mobile/:mobile` — no route-level auth (controller checks session, but that's defense-in-depth gap)
- `GET /list-by-mobile/:mobile` — same
- `POST /mark-paid/:id` — uses `X-Internal-Secret` header; route itself has no middleware auth. This is acceptable IF the secret is strong, but it's a gap in middleware auth coverage.

### 4. Farmer auth/profile routes lack route-level middleware
**File:** `src/routes/auth.js`, `src/routes/farmers.js`
- `GET /api/auth/farmer-profile` — controller checks session, no route middleware
- `POST /api/auth/farmer-profile` — same
- `GET /api/auth/me` — returns public session info; should still require some auth
- `POST /api/auth/logout` — should require auth before destroying
- `GET /api/farmers/profile/me` — controller checks, no route middleware
- `POST /api/farmers/profile/save` — same

**Fix:** Add `requireFarmerOrAdminSession` middleware to these routes.

### 5. Dealer price-list download unprotected
**File:** `src/routes/dealer.js`
- `GET /api/dealer/pricelist/download` — missing `authDealer` while `GET /pricelist` has it.

**Fix:** Add `authDealer`.

## Medium Issues

### 6. Payment `POST /create` route lacks auth
**File:** `src/routes/payment.js`
- `POST /create` — anyone can create a payment order

### 7. Global API rate limiter not mounted
**File:** `src/middlewares/rateLimiter.js`
- `apiLimiter()` exists but never globally mounted in `server.js`. Non-auth routes have no rate limiting.

## Fixes Planned
1. Remove JWT_SECRET fallback in `auth.js`
2. Add `requireFarmerOrAdminSession` middleware
3. Apply auth to chat routes
4. Apply auth to farmer routes  
5. Apply auth to quotes routes
6. Fix dealer pricelist download auth
7. Add `apiLimiter` globally in `server.js`
