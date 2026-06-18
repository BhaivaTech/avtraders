# Error Logging (Pino + Sentry)

## Overview

The backend now uses **Pino** for structured JSON logging and optionally **Sentry** for production error tracking. This replaces the previous `console.log`/`console.error` and Morgan request logging.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Application                       │
├─────────────────────────────────────────────────────┤
│  logger.info()  │  logger.error()  │  logger.warn() │
└────────┬────────┴────────┬─────────┴───────┬────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Console/Stdout│ │    Sentry    │ │  Log Files   │
│   (pino-pretty) │ │  (optional)  │ │  (optional)  │
└─────────────────┘ └──────────────┘ └──────────────┘
```

## Pino Logger

### Files

| File | Purpose |
|------|---------|
| `src/utils/logger.js` | Pino logger configuration |

### Usage

```javascript
import logger from '../utils/logger.js';

// Basic logging
logger.info('Server started');
logger.warn('Deprecated API called');
logger.error('Database connection failed');

// Structured logging (with context)
logger.info({ chat_id: 42, user_id: 7 }, 'Message sent');
logger.error({ err, paymentId: 123 }, 'Payment processing failed');

// Child loggers (add persistent context)
const reqLogger = logger.child({ requestId: req.id, userId: user.id });
reqLogger.info('Processing request');
reqLogger.debug('Validation passed');
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `trace` | Very detailed debugging | SQL queries, raw data |
| `debug` | Development debugging | Validation results, state |
| `info` | Normal operations | Request completed, user action |
| `warn` | Potential issues | Deprecated API, slow query |
| `error` | Failures | Unhandled errors, timeouts |
| `fatal` | Critical failures | Database down, out of memory |

### Configuration

```bash
# .env
LOG_LEVEL=info    # Minimum level to log
NODE_ENV=production  # Affects output format
```

**Development Output (pino-pretty):**
```
14:30:45 INFO: request
    method: "POST"
    url: "/api/auth/send-otp"
    status: 200
    ms: 45
    ip: "127.0.0.1"
```

**Production Output (JSON):**
```json
{"level":30,"time":"2024-06-12T14:30:45.123Z","service":"avtraders-backend","method":"POST","url":"/api/auth/send-otp","status":200,"ms":45,"ip":"127.0.0.1","msg":"request"}
```

### Automatic Redaction

Sensitive fields are automatically redacted:

```javascript
// These fields are redacted in all logs
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'otp',
  'code',
  'otp_hash',
  'token',
  'SESSION_SECRET',
  'JWT_SECRET',
  'PHONEPE_SALT_KEY',
];

// Example output
logger.info({ password: 'secret123' });
// → {"level":30,...,"password":"[REDACTED]"}
```

### Request Logging Middleware

Replaces Morgan for HTTP request logging:

```javascript
// server.js
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
      ip: req.ip,
    }, 'request');
  });
  next();
});
```

### Error Serialization

Pino automatically serializes Error objects:

```javascript
try {
  await riskyOperation();
} catch (err) {
  logger.error({ err }, 'Operation failed');
  // Output includes: err.message, err.stack, err.code, etc.
}
```

---

## Sentry Integration (Optional)

### Setup

1. **Install the package:**
```bash
npm install @sentry/node
```

2. **Get your DSN from [sentry.io](https://sentry.io)**

3. **Add to .env:**
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

4. **Initialize in server.js:**
```javascript
import { initSentry } from './src/utils/sentry.js';

await initSentry();
```

### Files

| File | Purpose |
|------|---------|
| `src/utils/sentry.js` | Sentry wrapper (optional) |

### Usage

```javascript
import { captureException, captureMessage } from '../utils/sentry.js';

// Capture an exception with context
try {
  await riskyOperation();
} catch (err) {
  captureException(err, {
    userId: user.id,
    action: 'payment',
    orderId: 123,
  });
}

// Capture a message (non-error)
captureMessage('High memory usage detected', 'warning', {
  memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
});
```

### Error Handler Middleware

```javascript
// server.js (after all routes)
app.use(sentryErrorHandler());

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // Report to Sentry in production
  if (prod) {
    captureException(err, {
      method: req.method,
      path: req.path,
      userId: req.session?.farmer?.id,
    });
  }

  res.status(status).json({ ok: false, message });
});
```

### Sentry Configuration

```javascript
// src/utils/sentry.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Don't send personal data
  sendDefaultPii: false,

  // Ignore common non-errors
  ignoreErrors: [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'UNAUTHENTICATED',
  ],

  // Strip sensitive data
  beforeSend(event) {
    delete event.request?.cookies;
    delete event.request?.headers;
    return event;
  },
});
```

### Safe No-Op Behavior

If `@sentry/node` is not installed or `SENTRY_DSN` is not set:

```javascript
// These calls are safe no-ops — no errors thrown
captureException(err);     // Only logs locally
captureMessage('test');    // Only logs locally
initSentry();              // Logs warning, continues
```

---

## Migration Guide

### Replacing console.log

**Before:**
```javascript
console.log('[PhonePe] create error:', status, err.response?.data);
console.error('webhook error:', e?.message || e);
console.warn('[socket] rejected unauthenticated connection');
```

**After:**
```javascript
import logger from '../utils/logger.js';

logger.error({ status, detail: err.response?.data }, 'PhonePe create error');
logger.error({ err: e }, 'Webhook error');
logger.warn({ ip: socket.handshake.address }, 'Rejected unauthenticated socket');
```

### Benefits of Structured Logging

| console.log | Pino |
|-------------|------|
| `console.log('User', userId, 'logged in')` | `logger.info({ userId }, 'User logged in')` |
| Text parsing required | JSON parsing (machine-readable) |
| No log levels | Configurable levels |
| No context | Structured context |
| Can't filter | Filter by level, field, etc. |

### Log Aggregation

Pino JSON logs work well with log aggregation tools:

```bash
# Pipe to external tools
node server.js | pino-elasticsearch --node http://localhost:9200

# Or use a log shipper
node server.js > /var/log/avtraders/app.log
# Then ship with Filebeat, Fluentd, etc.
```

---

## Best Practices

### 1. Use Structured Context

```javascript
// ❌ Bad: String interpolation
logger.error(`Payment ${paymentId} failed for user ${userId}: ${err.message}`);

// ✅ Good: Structured fields
logger.error({ paymentId, userId, err }, 'Payment failed');
```

### 2. Include Error Objects

```javascript
// ❌ Bad: Only log message
logger.error(err.message);

// ✅ Good: Log full error (stack trace, code, etc.)
logger.error({ err }, 'Operation failed');
```

### 3. Use Appropriate Levels

```javascript
// ❌ Bad: Everything is info
logger.info('User not found');
logger.info('Database connected');

// ✅ Good: Use correct level
logger.warn('User not found');      // Potential issue
logger.info('Database connected');  // Normal operation
```

### 4. Add Request Context

```javascript
// Create child logger for request scope
const reqLog = logger.child({
  requestId: req.id,
  userId: req.session?.farmer?.id,
});

reqLog.info('Processing payment');
reqLog.debug({ amount: 500 }, 'Payment details');
reqLog.error({ err }, 'Payment failed');
```

### 5. Don't Log Sensitive Data

```javascript
// ❌ Bad: Log passwords
logger.info({ password: req.body.password }, 'Login attempt');

// ✅ Good: Redacted automatically, or omit
logger.info({ email: req.body.email }, 'Login attempt');
```

---

## Troubleshooting

### No Logs Appearing

**Check log level:**
```bash
# In .env
LOG_LEVEL=debug  # Show all logs
```

### JSON Hard to Read in Development

**Use pino-pretty (automatic in dev):**
```bash
NODE_ENV=development node server.js
```

**Or pipe manually:**
```bash
node server.js | npx pino-pretty
```

### Sentry Not Receiving Errors

1. Check `SENTRY_DSN` is set correctly
2. Ensure `@sentry/node` is installed
3. Check server logs for `[sentry]` initialization messages
4. Verify network connectivity to Sentry

### Performance Impact

Pino is designed for high performance:
- **10-20x faster** than Bunyan or Winston
- **Minimal overhead** for disabled log levels
- **Async flushing** doesn't block event loop

```javascript
// These are essentially no-ops when LOG_LEVEL=info
logger.trace('expensive operation');  // Not evaluated
logger.debug('expensive operation');  // Not evaluated
```

---

## Comparison with Previous Setup

| Aspect | Before (Morgan + console) | After (Pino + Sentry) |
|--------|---------------------------|----------------------|
| Format | Text | Structured JSON |
| Levels | None | 6 levels |
| Context | None | Rich structured data |
| Redaction | Manual | Automatic |
| Performance | Moderate | High |
| Error tracking | None | Sentry (optional) |
| Log aggregation | Difficult | Easy (JSON) |
| Debugging | grep + regex | JSON queries |
