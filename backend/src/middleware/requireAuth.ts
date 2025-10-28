import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@src/utils/auth';

export interface AuthUser {
  sub: string;
  role?: string;
}

/**
 * A typed Request that carries `user` set by the JWT middleware.
 * B = body, P = route params, Q = query
 */
export interface AuthRequest<
  B = unknown,
  P = Record<string, string>,
  Q = Record<string, unknown>
> extends Request<P, unknown, B, Q> {
  user?: AuthUser;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { sub: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
