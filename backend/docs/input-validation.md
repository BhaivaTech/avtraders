# Input Validation (Zod)

## Overview

All API endpoints now validate incoming data using [Zod](https://zod.dev), a TypeScript-first schema validation library. This prevents invalid data from reaching business logic and provides clear error messages to clients.

## Architecture

```
Request → Route → validateBody(schema) → Controller → Response
                    ↓ (invalid)
                 400 { details: {...} }
```

### Files

| File | Purpose |
|------|---------|
| `src/validations/schemas.js` | All Zod schemas |
| `src/middlewares/validate.js` | Express middleware factory |

## Usage

### Basic Usage in Routes

```javascript
// src/routes/auth.js
import { validateBody } from '../middlewares/validate.js';
import { sendOtpSchema } from '../validations/schemas.js';

router.post('/send-otp',
  otpSendLimiter(),
  validateBody(sendOtpSchema),  // ← Validates req.body
  sendOtp
);
```

### Schema Definition

```javascript
// src/validations/schemas.js
import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile: z.string()
    .transform(v => String(v || '').replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10}$/, 'Must be 10 digits')),
});
```

### Validation Middleware

```javascript
// src/middlewares/validate.js

/**
 * @param {ZodSchema} schema - Zod schema
 * @param {'body'|'params'|'query'} source - What to validate
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'Invalid input',
        details: result.error.flatten().fieldErrors,
      });
    }

    // Replace with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
}

// Shorthand helpers
export const validateBody = (schema) => validate(schema, 'body');
export const validateParams = (schema) => validate(schema, 'params');
export const validateQuery = (schema) => validate(schema, 'query');
```

## Schema Reference

### Auth Schemas

#### sendOtpSchema
```javascript
z.object({
  mobile: z.string()           // "9876543210" or "+919876543210"
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10}$/)),
})
```

#### verifyOtpSchema
```javascript
z.object({
  mobile: mobileSchema,        // 10-digit string
  code: z.string().regex(/^\d{6}$/),  // 6-digit OTP
  name: z.string().max(120).optional(),
  address: z.string().max(500).optional(),
})
```

#### loginSchema
```javascript
z.object({
  mobile: mobileSchema,
})
```

### Chat Schemas

#### postMessageSchema
```javascript
z.object({
  mobile: mobileSchema,
  sender_role: z.enum(['farmer', 'admin', 'dealer', 'system']).default('farmer'),
  text: z.string().max(10_000).optional().nullable(),
  reply_to: z.number().int().positive().optional().nullable(),
  last_spray_date: z.string().max(20).optional().nullable(),
  last_chemical: z.string().max(120).optional().nullable(),
  last_dosage: z.string().max(60).optional().nullable(),
  audio_duration: z.number().positive().optional().nullable(),
  original_name: z.string().max(255).optional().nullable(),
})
```

#### chatStatusSchema
```javascript
z.object({
  chat_id: z.number().int().positive(),
  status: z.enum(['UNREAD', 'READ', 'SENT']),
})
```

#### sendLRSchema
```javascript
z.object({
  chat_id: z.number().int().positive(),
  lr_number: z.string().min(1).max(50),
  tracking_link: z.string().url().max(500).optional().or(z.literal('')),
})
```

### Payment Schemas

#### createPaymentSchema
```javascript
z.object({
  chat_id: z.number().int().positive(),
  amount: z.number().positive().max(10_00_000),
  mode: z.enum(['REDIRECT', 'IFRAME']).default('REDIRECT'),
  quotation_id: z.number().int().positive().optional().nullable(),
})
```

### Dealer Schemas

#### dealerSendOtpSchema
```javascript
z.object({
  phone: mobileSchema,
})
```

#### dealerVerifyOtpSchema
```javascript
z.object({
  phone: mobileSchema,
  otp: z.string().regex(/^\d{6}$/),
})
```

#### dealerRegisterSchema
```javascript
z.object({
  phone: mobileSchema,
  dealer_name: z.string().min(1).max(120),
  firm_name: z.string().min(1).max(180),
  email: z.string().email().optional().or(z.literal('')),
  gst: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  village_post: z.string().min(1).max(160),
  taluk: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  pincode: z.string().regex(/^\d{6}$/),
  confirm_true: z.literal('true'),
})
```

### Announcement Schemas

#### postAnnouncementSchema
```javascript
z.object({
  type: z.enum(['UPDATE', 'ALERT', 'INFO', 'PROMO']).default('UPDATE'),
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(1).max(5000),
  link_url: z.string().url().optional().or(z.literal('')),
})
```

### Farmer Profile Schemas

#### saveFarmerProfileSchema
```javascript
z.object({
  full_name: z.string().min(1).max(120),
  whatsapp: z.string().max(15).optional().nullable(),
  village: z.string().min(1).max(120),
  taluk: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  pincode: z.string().regex(/^\d{6}$/),
  land_size: z.string().max(60).optional().nullable(),
  crops_text: z.string().max(2000).optional().nullable(),
})
```

## Error Response Format

### Validation Error

```json
{
  "ok": false,
  "error": "validation_error",
  "message": "Invalid input",
  "details": {
    "mobile": ["Must be a valid 10-digit mobile number"],
    "code": ["OTP must be a 6-digit number"]
  }
}
```

### Field-Level Errors

Each field can have multiple error messages:

```json
{
  "details": {
    "email": ["Invalid email format"],
    "pincode": ["Invalid pincode"],
    "gst": ["Invalid GST number format"]
  }
}
```

## Creating Custom Schemas

### Reusable Primitives

```javascript
import { z } from 'zod';

// Mobile number (with normalization)
export const mobileSchema = z.string()
  .transform(v => String(v || '').replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10}$/));

// OTP code
export const otpCodeSchema = z.string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

// Amount in INR
export const amountSchema = z.union([z.string(), z.number()])
  .transform(v => Number(v))
  .pipe(z.number().positive().max(10_00_000));

// GST number
export const gstSchema = z.string()
  .trim()
  .toUpperCase()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);
```

### Composing Schemas

```javascript
// Base user schema
const baseUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
});

// Extended schema for registration
const registerSchema = baseUserSchema.extend({
  password: z.string().min(8).max(100),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});
```

### Custom Validators

```javascript
// Indian phone number with country code
const indianPhoneSchema = z.string()
  .transform(v => v.replace(/\D/g, ''))
  .refine(v => {
    if (v.length === 10) return true;
    if (v.length === 12 && v.startsWith('91')) return true;
    return false;
  }, 'Must be a valid Indian phone number')
  .transform(v => v.length === 12 ? v.slice(2) : v);
```

## Adding Validation to New Endpoints

### Step 1: Define Schema

```javascript
// src/validations/schemas.js
export const myNewSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().int().positive(),
});
```

### Step 2: Apply to Route

```javascript
// src/routes/myRoute.js
import { validateBody } from '../middlewares/validate.js';
import { myNewSchema } from '../validations/schemas.js';

router.post('/my-endpoint', validateBody(myNewSchema), myController);
```

### Step 3: Access Validated Data

```javascript
// src/controllers/myController.js
export async function myController(req, res) {
  // req.body is already validated and transformed
  const { field1, field2 } = req.body;

  // Safe to use without further validation
  // ...
}
```

## Best Practices

1. **Validate early** — Apply validation in routes, not controllers
2. **Transform at the boundary** — Use `.transform()` for data normalization
3. **Use strict types** — Prefer `z.number()` over `z.any()`
4. **Provide clear messages** — Custom error messages help frontend developers
5. **Compose schemas** — Reuse primitives across related endpoints
6. **Document schemas** — Keep this reference updated when adding new schemas

## Zod Resources

- [Zod Documentation](https://zod.dev)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [Zod vs Joi vs Yup](https://zod.dev/?id=comparison)
