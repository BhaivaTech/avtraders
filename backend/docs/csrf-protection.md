# CSRF Protection

## Overview

Cross-Site Request Forgery (CSRF) protection is implemented using the **Double-Submit Cookie** pattern. This stateless approach works well with Single Page Applications (SPAs) and mobile clients.

## How It Works

```
┌─────────────┐         ┌─────────────┐
│   Frontend   │         │   Backend   │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │  1. GET /api/csrf-token
       │──────────────────────>│
       │                       │
       │  2. Set-Cookie: csrf_secret (HttpOnly)
       │     Response: { csrf_token: "abc123..." }
       │<──────────────────────│
       │                       │
       │  3. POST /api/auth/send-otp
       │     Cookie: csrf_secret
       │     Header: X-CSRF-Token: abc123...
       │──────────────────────>│
       │                       │
       │  4. Verify cookie HMAC matches header
       │     ✓ → Process request
       │     ✗ → 403 Forbidden
       │<──────────────────────│
```

### Security Properties

1. **HttpOnly Cookie**: The `csrf_secret` cookie cannot be read by JavaScript
2. **HMAC Verification**: The token is an HMAC of the secret, verified server-side
3. **Constant-Time Comparison**: Prevents timing attacks using `crypto.timingSafeEqual()`
4. **SameSite=Strict**: Cookie only sent with same-site requests
5. **Attacker Cannot Forge**: A different-origin attacker cannot read or set HttpOnly cookies

## Implementation

### Server-Side

```javascript
// src/middlewares/csrf.js

// Set CSRF cookie on all requests
app.use(csrfCookieSetter);

// Token endpoint for frontend
app.get("/api/csrf-token", csrfTokenEndpoint);

// Protect state-changing routes
app.use("/api", csrfProtect);
```

### Frontend Integration

The frontend `api.js` automatically handles CSRF tokens:

```javascript
// src/lib/api.js

// 1. Fetches token on first state-changing request
// 2. Attaches X-CSRF-Token header to all POST/PUT/PATCH/DELETE
// 3. Auto-retries on 403 csrf_token_invalid (refreshes token)
```

## Exempt Paths

These paths bypass CSRF protection (webhooks, health checks):

```javascript
const EXEMPT_PATHS = [
  '/api/phonepe/callback',
  '/api/payment/webhook',
  '/api/health',
];
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CSRF_DISABLED` | `0` | Set to `1` to disable CSRF checks |

### Disabling for Testing

```bash
# In .env (NEVER do this in production)
CSRF_DISABLED=1
```

## API Reference

### GET /api/csrf-token

Returns a CSRF token for the frontend to use.

**Response:**
```json
{
  "ok": true,
  "csrf_token": "a1b2c3d4e5f6..."
}
```

**Headers Set:**
```
Set-Cookie: csrf_secret=<hex>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

## Troubleshooting

### 403 csrf_token_missing

**Cause:** Frontend is not sending the `X-CSRF-Token` header.

**Fix:**
1. Ensure frontend calls `GET /api/csrf-token` first
2. Check that cookies are enabled (`withCredentials: true`)
3. Verify CORS allows `X-CSRF-Token` header

### 403 csrf_token_invalid

**Cause:** Token doesn't match the cookie secret.

**Fix:**
1. Frontend should automatically retry (handled by interceptor)
2. If persistent, clear cookies and refresh
3. Check for cookie domain mismatches

### Token Not Set on Some Requests

**Cause:** Cookie might be blocked by browser settings.

**Fix:**
1. Ensure `SameSite` and `Secure` flags match your deployment
2. For cross-origin requests, ensure proper CORS configuration
3. Check browser console for cookie warnings

## Security Considerations

### Why Double-Submit Cookies?

| Pattern | Pros | Cons |
|---------|------|------|
| **Synchronizer Token** | Most secure | Requires server state |
| **Double-Submit Cookie** | Stateless, scalable | Requires HTTPS in production |
| **Custom Header** | Simple | Only works for AJAX |

We chose Double-Submit because:
- No server-side session storage needed for tokens
- Works with SPAs and mobile apps
- Simple to implement and debug
- Secure enough with HTTPS (which we use in production)

### Production Checklist

- [ ] HTTPS is enabled (required for `Secure` cookie flag)
- [ ] `COOKIE_DOMAIN` is set correctly
- [ ] CORS allows `X-CSRF-Token` header
- [ ] Frontend handles 403 responses gracefully
