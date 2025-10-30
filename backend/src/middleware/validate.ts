import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { type ZodTypeAny } from 'zod';

/**
 * Generic Zod validation middleware.
 * It validates the requested source ('body' | 'params' | 'query')
 * and forwards on success. It does NOT mutate req.body/params/query,
 * which avoids Express 5 read-only getter errors.
 */
export function validate<T extends ZodTypeAny>(
  schema: T,
  source: 'body' | 'params' | 'query' = 'body',
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data: unknown =
      source === 'body'   ? req.body   :
        source === 'params' ? req.params :
          req.query;

    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation error', details });
      return;
    }

    // Do NOT assign back to req.body/params/query (read-only in Express 5)
    // If you want access to parsed data, you can read it again in the controller
    // with a type assertion since it is now guaranteed valid by this middleware.
    next();
  };
}

export default validate;

// Convenience helpers (just call validate with the right source)
export const validateBody = <
  T extends ZodTypeAny
>(schema: T): RequestHandler =>
    validate(schema, 'body');

export const validateParams = <
  T extends ZodTypeAny
>(schema: T): RequestHandler =>
    validate(schema, 'params');

export const validateQuery = <
  T extends ZodTypeAny
>(schema: T): RequestHandler =>
    validate(schema, 'query');
