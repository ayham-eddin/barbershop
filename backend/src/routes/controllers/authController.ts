import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User, type UserDoc } from '@src/models/User';
import {
  hashPassword,
  verifyPassword,
  createToken,
} from '@src/utils/auth';
import type {
  RegisterBody,
  LoginBody,
} from '../validators/authSchemas';
import type { AuthRequest } from '@src/middleware/requireAuth';

/** Normalize any mongoose _id to a safe string */
function idToString(id: unknown): string {
  if (id instanceof Types.ObjectId) return id.toHexString();
  return String(id);
}

// POST /auth/register
export async function register(
  req: Request<unknown, unknown, RegisterBody>,
  res: Response,
) {
  const { name, email, password } = req.body;

  // Make `exists` a boolean to satisfy ESLint/TS
  const exists = Boolean(await User.exists({ email }).lean());
  if (exists) {
    return res.status(409).json({ error: 'Email in use' });
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'user',
  });

  const id = idToString(user._id);
  const token = createToken({ sub: id, role: user.role });

  return res.status(201).json({
    user: {
      id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
}

// POST /auth/login
export async function login(
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
) {
  const { email, password } = req.body;

  const user: UserDoc | null = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(401).json({ error: 'Invalid login' });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid login' });
  }

  const id = idToString(user._id);
  const token = createToken({ sub: id, role: user.role });

  return res.json({
    user: {
      id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
}

/** GET /auth/me (auth required) */
export async function getMe(req: AuthRequest, res: Response) {
  const sub = req.user?.sub;
  if (!sub || !Types.ObjectId.isValid(sub)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findById(new Types.ObjectId(sub)).lean<UserDoc | null>().exec();
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({
    user: {
      id: idToString(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      warning_count: user.warning_count,
      last_warning_at: user.last_warning_at ?? null,
      is_online_booking_blocked: user.is_online_booking_blocked,
      block_reason: user.block_reason ?? null,
    },
  });
}
