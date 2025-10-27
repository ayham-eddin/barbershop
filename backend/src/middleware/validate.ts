import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parsed.error.flatten(),
      });
    }
    req.body = parsed.data;
    return next();
  };
}
