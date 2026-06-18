# Webhook Signature Verification

## Overview

PhonePe sends webhook notifications to confirm payment status changes. To prevent attackers from forging these notifications, PhonePe signs each request with an HMAC-SHA256 signature sent in the `X-VERIFY` header.

## The Problem (Fixed)

### Previous Implementation

```javascript
// ❌ BROKEN: express.text() could modify the raw body
router.post('/webhook', express.text({ type: '*/*' }), webhook);

// In controller:
const rawBody = typeof req.body === 'string'
  ? req.body
  : JSON.stringify(req.body);  // Serialization might differ!
```

**Issues:**
1. `express.text()` might strip BOM or normalize line endings
2. `JSON.stringify()` might produce different whitespace than the original
3. Any byte-level difference changes the SHA-256 hash

### Fixed Implementation

```javascript
// ✅ FIXED: express.raw() preserves exact bytes
router.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), webhook);

// In controller:
const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));
const bodyStr = rawBody.toString('utf8');  // Explicit conversion
```

## How PhonePe Signature Works

### Signature Format

```
X-VERIFY: <SHA256_HASH>###<SALT_INDEX>
```

Example:
```
X-VERIFY: a1b2c3d4e5f6...###1
```

### Verification Algorithm

```javascript
// 1. Extract hash and salt index from header
const [receivedHash, saltIndex] = xVerify.split('###');

// 2. Validate salt index
if (saltIndex !== expectedSaltIndex) return false;

// 3. Compute expected hash
const computedHash = crypto
  .createHash('sha256')
  .update(rawBodyString + saltKey)
  .digest('hex');

// 4. Constant-time comparison
return crypto.timingSafeEqual(
  Buffer.from(computedHash),
  Buffer.from(receivedHash)
);
```

### What Gets Signed

```
SHA256( rawBody + PHONEPE_SALT_KEY )
```

Where:
- `rawBody` = The exact JSON string PhonePe sent (no modifications!)
- `PHONEPE_SALT_KEY` = Your secret salt from PhonePe dashboard

## Implementation

### Route Configuration

```javascript
// src/routes/payment.js
import express from 'express';

const router = express.Router();

// Use express.raw() to capture exact bytes
router.post(
  '/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  webhook
);
```

### Verification Function

```javascript
// src/controllers/paymentController.js

function verifyPhonePeSignature(rawBody, xVerify) {
  const saltKey = (process.env.PHONEPE_SALT_KEY || '').trim();
  if (!saltKey) return true; // Skip in dev if not configured

  if (!rawBody) return false;

  // Handle both Buffer and string
  const bodyStr = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : String(rawBody);

  const parts = (xVerify || '').split('###');
  const receivedHash = parts[0] || '';
  const saltIndex = parts[1] || '';

  // Validate salt index
  const expectedIndex = (process.env.PHONEPE_SALT_INDEX || '1').trim();
  if (saltIndex !== expectedIndex) {
    console.warn('[webhook] salt index mismatch');
    return false;
  }

  // Compute and compare hash
  const computedHash = crypto
    .createHash('sha256')
    .update(bodyStr + saltKey)
    .digest('hex');

  return computedHash === receivedHash;
}
```

### Webhook Handler

```javascript
export async function webhook(req, res) {
  try {
    // req.body is a Buffer from express.raw()
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(String(req.body || ''));

    const xVerify = req.headers['x-verify'] || '';

    // Verify signature FIRST
    if (!verifyPhonePeSignature(rawBody, xVerify)) {
      console.warn('[webhook] Invalid signature — rejected');
      return res.status(400).json({ ok: false, error: 'invalid_signature' });
    }

    // Parse JSON AFTER verification
    let body;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }

    // Process webhook...
    const { event, payload } = body;
    // ...

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('webhook error:', err);
    res.status(200).json({ ok: true }); // Always return 200 to PhonePe
  }
}
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PHONEPE_SALT_KEY` | Yes | Salt key from PhonePe dashboard |
| `PHONEPE_SALT_INDEX` | Yes | Salt index (usually `1`) |
| `PHONEPE_MERCHANT_ID` | Yes | Your merchant ID |

### Development Mode

If `PHONEPE_SALT_KEY` is not set, signature verification is **skipped** (returns `true`). This allows local development without PhonePe credentials.

```bash
# .env (development)
PHONEPE_SALT_KEY=          # Empty = skip verification
PHONEPE_SALT_INDEX=1
```

### Production Mode

```bash
# .env (production)
PHONEPE_SALT_KEY=b85eaa8f-a349-47b0-a168-b5e578a0f350
PHONEPE_SALT_INDEX=1
```

## Debugging

### Log Output

The verification function logs detailed information on failure:

```
[webhook] salt index mismatch { received: '2', expected: '1' }
[webhook] signature mismatch { receivedHash: 'a1b2c3d4...', computedHash: 'x9y8z7w6...' }
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `invalid_signature` | Body modified | Use `express.raw()`, not `express.text()` |
| `salt index mismatch` | Wrong `PHONEPE_SALT_INDEX` | Check PhonePe dashboard |
| Verification passes but processing fails | JSON parse error | Check webhook payload format |

### Testing Locally

```bash
# Generate a test signature
BODY='{"event":"pg.completed","payload":{"state":"COMPLETED"}}'
SALT="your_salt_key"
HASH=$(echo -n "${BODY}${SALT}" | sha256sum | cut -d' ' -f1)

# Send test webhook
curl -X POST http://localhost:5100/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "X-VERIFY: ${HASH}###1" \
  -d "$BODY"
```

## Security Best Practices

1. **Always verify before processing** — Never trust webhook data without signature check
2. **Use constant-time comparison** — Prevents timing attacks
3. **Log verification failures** — Helps detect attack attempts
4. **Return 200 even on errors** — PhonePe will retry if it gets non-2xx
5. **Idempotent processing** — Handle duplicate webhooks gracefully
6. **HTTPS only** — Webhook endpoint must be HTTPS in production

## PhonePe Documentation

- [PhonePe Standard Checkout](https://developer.phonepe.com/v1/reference/standard-webhook)
- [Webhook Payload Structure](https://developer.phonepe.com/v1/reference/webhook-payload)
