import { Response, NextFunction } from 'express';
import { AuthRequest } from './requireAuth';

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const role = req.user?.role;

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  return next();
}
