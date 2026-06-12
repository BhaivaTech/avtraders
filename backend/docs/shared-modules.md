# Shared Modules

## Overview

Duplicated code has been extracted into shared utility modules to improve maintainability, reduce bugs, and ensure consistency across the codebase.

## New Shared Modules

### 1. helpers.js — Core Utilities

**Location:** `src/utils/helpers.js`

A comprehensive collection of 25+ utility functions extracted from multiple controllers.

#### Phone/Mobile Helpers

```javascript
import { normalizePhone10, normalizePhone10Safe, toMsisdn91 } from '../utils/helpers.js';

// Normalize any phone format to 10 digits (throws on invalid)
const mobile = normalizePhone10('+919876543210');  // → '9876543210'
const mobile = normalizePhone10('09876543210');     // → '9876543210'

// Safe version (returns empty string instead of throwing)
const mobile = normalizePhone10Safe('invalid');    // → ''

// E.164 format without '+'
const msisdn = toMsisdn91('9876543210');           // → '919876543210'
```

#### Session Helpers

```javascript
import { getSessionUserId, getSessionMobile, canViewMobile, populateFarmerSession } from '../utils/helpers.js';

// Get logged-in user ID (checks multiple session shapes)
const userId = getSessionUserId(req);  // → number or null

// Get logged-in user's mobile
const mobile = getSessionMobile(req);  // → '9876543210' or ''

// Check if user can view data for a given mobile
if (canViewMobile(req, targetMobile)) {
  // Allow access
}

// Populate session after authentication (consistent shape)
populateFarmerSession(req, user);
```

#### Payment Helpers

```javascript
import { toPaise, makeMerchantOrderId, parseMeta, resolveState } from '../utils/helpers.js';

// Convert INR to paise
const paise = toPaise(500);  // → 50000

// Generate unique merchant order ID
const orderId = makeMerchantOrderId(42);  // → 'AV1718123456789_42'

// Safely parse JSON
const meta = parseMeta(row.meta);  // → {} if parsing fails

// Resolve PhonePe state to canonical status
const status = resolveState('COMPLETED');  // → 'success'
const status = resolveState('FAILED');     // → 'failed'
const status = resolveState('PENDING');    // → 'pending'
```

#### String Helpers

```javascript
import { stripLeadingSlash, trimOrNull, trimOrUndefined } from '../utils/helpers.js';

stripLeadingSlash('/uploads/file.jpg');  // → 'uploads/file.jpg'
trimOrNull('  hello  ');                 // → 'hello'
trimOrNull('   ');                       // → null
trimOrUndefined('');                     // → undefined
```

#### Response Helpers

```javascript
import { okResponse, errorResponse } from '../utils/helpers.js';

// Success response
okResponse(res, { user: userData });
// → { ok: true, user: {...} }

// Error response
errorResponse(res, 404, 'User not found');
// → { ok: false, message: 'User not found' }

errorResponse(res, 400, 'Invalid input', { field: 'email' });
// → { ok: false, message: 'Invalid input', field: 'email' }
```

#### Crypto Helpers

```javascript
import { randomHex, randomInt, sha256, timingSafeEqual } from '../utils/helpers.js';

// Secure random hex string
const token = randomHex(32);  // 64-char hex string

// Secure random integer
const otp = randomInt(100000, 1000000);  // 6-digit number

// SHA-256 hash
const hash = sha256('data');

// Constant-time comparison (prevents timing attacks)
if (timingSafeEqual(input, expected)) {
  // Match!
}
```

#### Date Helpers

```javascript
import { toSqlDatetime, isExpired } from '../utils/helpers.js';

// Format for MySQL DATETIME
const dt = toSqlDatetime();  // → '2024-06-12 14:30:00'

// Check if expired
if (isExpired(token.expires_at)) {
  // Token has expired
}
```

---

### 2. rateLimiter.js — Rate Limiter Factory

**Location:** `src/middlewares/rateLimiter.js`

Pre-configured rate limiter factories to eliminate duplicated configurations.

#### Available Limiters

| Factory | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `otpSendLimiter()` | 1 hour | 3 | OTP send endpoints |
| `otpVerifyLimiter()` | 15 min | 5 | OTP verify endpoints |
| `loginLimiter()` | 15 min | 10 | User login |
| `adminLoginLimiter()` | 15 min | 5 | Admin login (stricter) |
| `apiLimiter()` | 15 min | 100 | General API |
| `strictLimiter()` | 15 min | 3 | Sensitive operations |

#### Usage

```javascript
// Before (duplicated in every route file)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { ok: false, message: 'Too many OTP requests...' },
  standardHeaders: true,
  legacyHeaders: false,
});

// After (import and use)
import { otpSendLimiter } from '../middlewares/rateLimiter.js';

router.post('/send-otp', otpSendLimiter(), controller);
```

#### Custom Configuration

```javascript
// Override defaults if needed
const customLimiter = rateLimit({
  ...otpSendLimiter(),
  max: 5,  // Increase limit
  windowMs: 30 * 60 * 1000,  // 30 minutes
});
```

---

## Migration Guide

### Updating Existing Code

#### Old Pattern (Before)

```javascript
// controllers/dealerController.js
export function normalizePhone10(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length > 10) return d.slice(-10);
  return d;
}
```

#### New Pattern (After)

```javascript
// controllers/dealerController.js (or any controller)
import { normalizePhone10 } from '../utils/helpers.js';

// Use directly — no need to redefine
const phone = normalizePhone10(req.body.phone);
```

### Session Population

#### Old Pattern (Before)

```javascript
// Duplicated in authController.js
req.session.farmer = { id: user.id, mobile: user.mobile, role: user.role, name: user.name, address: user.address };
req.session.mobile = user.mobile;
req.session.user = { id: user.id, mobile: user.mobile, role: user.role };
```

#### New Pattern (After)

```javascript
import { populateFarmerSession } from '../utils/helpers.js';

// Single function call — consistent shape everywhere
populateFarmerSession(req, user);
```

### Rate Limiters

#### Old Pattern (Before)

```javascript
// Duplicated in auth.js, admin.js, dealer.js
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { ok: false, message: 'Too many OTP requests. Try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### New Pattern (After)

```javascript
import { otpSendLimiter } from '../middlewares/rateLimiter.js';

router.post('/send-otp', otpSendLimiter(), controller);
```

---

## Benefits

### Before Extraction

- **12+ duplicate rate limiter configs** across route files
- **3+ copies** of `normalizePhone10()` function
- **Inconsistent** session population logic
- **Scattered** utility functions

### After Extraction

- **Single source of truth** for each utility
- **Consistent behavior** across all endpoints
- **Easier testing** — test utilities once
- **Better discoverability** — clear module boundaries

---

## Adding New Shared Utilities

### Step 1: Choose the Right Module

| Utility Type | Location |
|--------------|----------|
| General-purpose helper | `src/utils/helpers.js` |
| Rate limiter | `src/middlewares/rateLimiter.js` |
| Validation schema | `src/validations/schemas.js` |
| Database helper | `src/models/` (in relevant model) |

### Step 2: Add the Function

```javascript
// src/utils/helpers.js

/**
 * Brief description of what the function does.
 *
 * @param {string} input - Description
 * @returns {string} Description
 * @throws {Error} When to throw
 */
export function myNewHelper(input) {
  // Implementation
}
```

### Step 3: Update Documentation

Add the function to this document with usage examples.

### Step 4: Update Existing Code

Replace duplicate implementations with imports from the shared module.

---

## Code Style

### Naming Conventions

- **camelCase** for functions and variables
- **Descriptive names** — `normalizePhone10` not `norm`
- **Safe variants** — `normalizePhone10Safe` for non-throwing versions

### Documentation

All exported functions should have JSDoc comments:

```javascript
/**
 * Normalize any phone input to a 10-digit Indian mobile number.
 * Handles: +91xxxxxxxxxx, 91xxxxxxxxxx, 0xxxxxxxxxx, xxxxxxxxxx
 *
 * @param {string} raw - Raw phone input
 * @returns {string} 10-digit mobile number
 * @throws {Error} If result is not exactly 10 digits
 */
export function normalizePhone10(raw) {
  // ...
}
```

### Error Handling

Shared utilities should:
- **Throw meaningful errors** with descriptive messages
- **Provide safe alternatives** when throwing is undesirable
- **Log errors** when appropriate using the logger module
