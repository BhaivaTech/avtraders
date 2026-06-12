// src/middlewares/validate.js
// Generic Express middleware factory that validates req.body / req.params / req.query
// against Zod schemas.
//
// Usage:
//   router.post('/send-otp', validate(sendOtpSchema, 'body'), controller);
//   router.get('/thread/:chatId', validate(getThreadSchema, 'params'), controller);

import logger from '../utils/logger.js';

/**
 * Create an Express middleware that validates the specified request part
 * against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema  - Zod schema to validate against
 * @param {'body'|'params'|'query'} source  - Which part of req to validate (default: 'body')
 * @param {{ stripUnknown?: boolean }} opts  - Options
 */
export function validate(schema, source = 'body', opts = {}) {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const flat = result.error.flatten();
      logger.debug(
        { source, errors: flat.fieldErrors },
        'Validation failed'
      );
      return res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'Invalid input',
        details: flat.fieldErrors,
      });
    }

    // Replace req[source] with the parsed (and transformed) data
    req[source] = result.data;
    return next();
  };
}

/**
 * Shorthand: validate body only.
 */
export function validateBody(schema) {
  return validate(schema, 'body');
}

/**
 * Shorthand: validate params only.
 */
export function validateParams(schema) {
  return validate(schema, 'params');
}

/**
 * Shorthand: validate query only.
 */
export function validateQuery(schema) {
  return validate(schema, 'query');
}
