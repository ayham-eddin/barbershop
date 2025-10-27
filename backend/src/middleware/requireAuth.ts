import { Request, Response, NextFunction } from 'express';
import { verifyToken, type AuthTokenPayload } from '@src/utils/auth';

export interface AuthUser {
  sub: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  // use optional chaining (cleaner) + early return
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7).trim();

  try {
    const payload: AuthTokenPayload = verifyToken(token);
    // narrow to what we store on req
    req.user = { sub: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
