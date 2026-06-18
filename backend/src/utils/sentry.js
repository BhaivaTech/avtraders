// src/utils/sentry.js
// Optional Sentry integration for production error tracking.
//
// To enable:
//   1. npm install @sentry/node
//   2. Set SENTRY_DSN in .env
//   3. Import and call initSentry() at the top of server.js
//
// If SENTRY_DSN is not set or @sentry/node is not installed,
// all functions are safe no-ops.

import logger from './logger.js';

let Sentry = null;
let initialized = false;

/**
 * Initialize Sentry (call once at server startup).
 * Safe to call without SENTRY_DSN — it will just log a warning.
 */
export async function initSentry() {
  const dsn = (process.env.SENTRY_DSN || '').trim();
  if (!dsn) {
    logger.info('[sentry] SENTRY_DSN not set — error tracking disabled');
    return;
  }

  try {
    // Dynamic import so the package is optional
    const sentryMod = await import('@sentry/node');
    Sentry = sentryMod;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Don't send PII (personal data)
      sendDefaultPii: false,
      // Ignore common non-errors
      ignoreErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'UNAUTHENTICATED',
      ],
      beforeSend(event) {
        // Strip sensitive data from error context
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }
        return event;
      },
    });

    initialized = true;
    logger.info('[sentry] Error tracking initialized');
  } catch (err) {
    logger.warn('[sentry] @sentry/node not installed — run: npm install @sentry/node');
  }
}

/**
 * Capture an exception and send to Sentry.
 * Safe to call without Sentry — just logs locally.
 */
export function captureException(err, context = {}) {
  logger.error({ err, ...context }, 'Unhandled error');

  if (initialized && Sentry) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(err);
    });
  }
}

/**
 * Capture a message (non-error) and send to Sentry.
 */
export function captureMessage(msg, level = 'info', context = {}) {
  logger[level]({ ...context }, msg);

  if (initialized && Sentry) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureMessage(msg, level);
    });
  }
}

/**
 * Express error handler middleware that reports to Sentry.
 * Use as the last middleware in the chain.
 */
export function sentryErrorHandler() {
  return (err, req, res, next) => {
    captureException(err, {
      method: req.method,
      path: req.path,
      userId: req.session?.farmer?.id || req.session?.admin,
    });
    next(err);
  };
}
