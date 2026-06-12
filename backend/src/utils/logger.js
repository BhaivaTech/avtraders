// src/utils/logger.js
// Structured logging with Pino. Replaces all console.log/console.error calls.
//
// Usage:
//   import log from '../utils/logger.js';
//   log.info({ chat_id: 42 }, 'message sent');
//   log.error({ err, paymentId }, 'payment failed');

import pino from 'pino';

const prod = (process.env.NODE_ENV || '').trim() === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (prod ? 'info' : 'debug'),
  // Pretty-print in dev, JSON in production
  transport: prod
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
  // Redact sensitive fields automatically
  redact: {
    paths: [
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
    ],
    censor: '[REDACTED]',
  },
  // Serialise errors automatically
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  base: { service: 'avtraders-backend' },
});

export default logger;

/**
 * Create a child logger with request context.
 * Use in middleware to tag all logs with request-id, user-id, etc.
 */
export function requestLogger(req) {
  return logger.child({
    reqId: req.id || req.headers?.['x-request-id'],
    ip: req.ip,
    userId: req.session?.farmer?.id || req.session?.admin || req.dealerAuth?.dealer_id,
  });
}
