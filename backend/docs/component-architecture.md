# Component Architecture

## Overview

Monolithic controller files have been split into focused, single-responsibility modules. This improves code organization, testability, and developer experience.

## Dealer Controller Split

### Before

```
src/controllers/
└── dealerController.js    # 320 lines, 5 concerns mixed together
```

**Problems:**
- Hard to find specific functionality
- Merge conflicts when multiple developers work on dealer features
- Testing requires mocking everything
- Unclear boundaries between concerns

### After

```
src/controllers/
├── dealer/                 # Split modules
│   ├── auth.js            # OTP send/verify, JWT signing (80 lines)
│   ├── register.js        # Dealer registration (120 lines)
│   ├── pricelist.js       # Price list & downloads (70 lines)
│   └── index.js           # Barrel exports + rate limiter
└── dealerController.js    # Re-export shim (backward compatible)
```

---

## Module Breakdown

### auth.js — Authentication

**Responsibilities:**
- OTP generation and sending via MSG91
- OTP verification
- JWT token signing
- Dealer lookup by phone

**Exports:**
```javascript
export async function sendOtp(req, res) { ... }
export async function verifyOtp(req, res) { ... }
export function signDealerJwt(payload) { ... }
export const sendOtpLimiter;  // Rate limiter
```

**Dependencies:**
- `crypto` — OTP generation
- `jsonwebtoken` — JWT signing
- `../../services/msg91.js` — WhatsApp OTP
- `../../models/dealerModel.js` — Database queries
- `../../utils/helpers.js` — `normalizePhone10()`

---

### register.js — Registration

**Responsibilities:**
- Dealer registration form processing
- Document upload handling
- GST validation
- Email notification to admin
- Audit trail logging

**Exports:**
```javascript
export async function register(req, res) { ... }
```

**Dependencies:**
- `fs` — File operations for document cleanup
- `nodemailer` — Email notifications
- `../../models/dealerModel.js` — Database queries
- `../../utils/helpers.js` — Validation helpers

---

### pricelist.js — Price List Management

**Responsibilities:**
- Active price list lookup
- Secure download token generation
- File download serving
- Token expiration checks

**Exports:**
```javascript
export async function getPricelist(req, res) { ... }
export async function downloadPricelist(req, res) { ... }
```

**Dependencies:**
- `crypto` — Token generation
- `fs` — File access checks
- `../../models/dealerModel.js` — Database queries

---

### index.js — Barrel Exports

**Purpose:** Re-exports all dealer controller functions for convenient importing.

```javascript
// Re-exports from split modules
export { sendOtp, verifyOtp, signDealerJwt } from './auth.js';
export { register } from './register.js';
export { getPricelist, downloadPricelist } from './pricelist.js';

// Rate limiter (previously in dealerController.js)
export const sendOtpLimiter = rateLimit({ ... });
```

---

## Backward Compatibility

The original `dealerController.js` is preserved as a thin re-export shim:

```javascript
// src/controllers/dealerController.js
// ⚠️  DEPRECATED: Kept for backward compatibility.

export { sendOtp, verifyOtp, sendOtpLimiter, signDealerJwt } from './dealer/index.js';
export { register } from './dealer/register.js';
export { getPricelist, downloadPricelist } from './dealer/pricelist.js';
export { normalizePhone10 } from '../utils/helpers.js';
```

### Migration Path

**Old imports (still work):**
```javascript
import { sendOtp, register } from '../controllers/dealerController.js';
```

**New imports (recommended):**
```javascript
import { sendOtp } from '../controllers/dealer/auth.js';
import { register } from '../controllers/dealer/register.js';
// OR
import { sendOtp, register } from '../controllers/dealer/index.js';
```

---

## Route Integration

### Updated dealer.js Route

```javascript
// src/routes/dealer.js

// Import from split modules
import { sendOtp, verifyOtp, sendOtpLimiter } from '../controllers/dealer/index.js';
import { register } from '../controllers/dealer/register.js';
import { getPricelist, downloadPricelist } from '../controllers/dealer/pricelist.js';

// Apply Zod validation
import { validateBody } from '../middlewares/validate.js';
import { dealerSendOtpSchema, dealerVerifyOtpSchema } from '../validations/schemas.js';

router.post('/send-otp', sendOtpLimiter, validateBody(dealerSendOtpSchema), sendOtp);
router.post('/verify-otp', otpVerifyLimiter(), validateBody(dealerVerifyOtpSchema), verifyOtp);
router.post('/register', authDealer, dealerDocUpload.fields([...]), register);
router.get('/pricelist', authDealer, getPricelist);
router.get('/pricelist/download', downloadPricelist);
```

---

## Benefits

### Developer Experience

| Aspect | Before | After |
|--------|--------|-------|
| Find registration code | Scan 320-line file | Open `register.js` |
| Understand scope | Read entire file | Module name tells you |
| Merge conflicts | Frequent | Rare (different files) |
| Code review | Overwhelming | Focused PRs |

### Testing

```javascript
// Before: Mock everything
jest.mock('../models/dealerModel.js');
jest.mock('../services/msg91.js');
jest.mock('nodemailer');
// Test a 320-line function with many branches

// After: Test focused modules
import { sendOtp } from '../controllers/dealer/auth.js';
// Only mock what auth.js uses
// Test a focused 80-line function
```

### Maintainability

- **Single Responsibility**: Each module has one clear purpose
- **Dependency Clarity**: Imports show exactly what each module needs
- **Reusability**: Modules can be imported independently
- **Refactoring**: Easier to modify one concern without affecting others

---

## Guidelines for Splitting Controllers

### When to Split

- Controller exceeds **200-300 lines**
- Multiple distinct **concerns** (auth, CRUD, reports, etc.)
- Different **team members** frequently edit the same file
- **Testing** requires extensive mocking

### How to Split

1. **Identify concerns** — Group related functions
2. **Create directory** — `src/controllers/<name>/`
3. **Extract modules** — Move related functions to separate files
4. **Create barrel** — `index.js` re-exports everything
5. **Update routes** — Import from new location
6. **Preserve old file** — Re-export for backward compatibility
7. **Document** — Add README.md in the directory (optional)

### Naming Conventions

```
src/controllers/<feature>/
├── auth.js        # Authentication functions
├── crud.js        # Create/Read/Update/Delete
├── reports.js     # Reporting endpoints
├── index.js       # Barrel exports
└── README.md      # Module documentation (optional)
```

---

## Future Improvements

### Recommended Splits

Other controllers that could benefit from splitting:

| Controller | Lines | Suggested Split |
|------------|-------|-----------------|
| `chatController.js` | ~250 | `messages.js`, `threads.js`, `admin.js` |
| `paymentController.js` | ~200 | `create.js`, `webhook.js`, `status.js` |
| `quotationController.js` | ~150 | `upload.js`, `payments.js` |

### Microservice Readiness

Split controllers prepare the codebase for potential microservice extraction:

```
Current:                    Future (optional):
├── dealer/auth.js    →    ├── auth-service/
├── dealer/register.js     ├── dealer-service/
└── dealer/pricelist.js    └── price-service/
```

---

## Anti-Patterns to Avoid

### ❌ Circular Dependencies

```javascript
// BAD: auth.js imports from register.js AND register.js imports from auth.js
```

### ❌ Too Many Small Files

```javascript
// BAD: One function per file
controllers/dealer/
├── sendOtp.js
├── verifyOtp.js
├── signJwt.js
└── ... (20 more files)
```

### ❌ Losing Context

```javascript
// BAD: Shared state across modules without clear ownership
let dealerState = {};  // Who owns this?
```

### ✅ Good Pattern

```javascript
// GOOD: Clear ownership, explicit dependencies
// auth.js owns OTP state via dealerModel.js
// register.js reads dealer state via dealerModel.js
// No shared mutable state between modules
```
