// src/middleware/validate.ts
import type { RequestHandler } from 'express';
import { type ZodTypeAny } from 'zod';

/**
 * Validate req.body against a Zod schema.
 * Controllers should type their body as z.infer<typeof schema>,
 * so we don't need to reassign req.body here (avoids unsafe assignments).
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        error: 'Validation error',
        details,
      });
    }
    return next();
  };
}

/**
 * Validate req.params against a Zod schema.
 * Controllers should type their params as z.infer<typeof schema>.
 */
export function validateParams<T extends ZodTypeAny>(
  schema: T,
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        error: 'Validation error',
        details,
      });
    }
    return next();
  };
}
