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
import { updateMeSchema, type UpdateMeBody } from '../validators/authSchemas';
import type { AuthRequest } from '@src/middleware/requireAuth';

/** Extra profile fields we allow (not in the Mongoose schema typing yet) */
interface ProfileFields {
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

/** Lean shape for /auth/me reads */
type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'user' | 'admin';
  warning_count?: number;
  last_warning_at?: Date | null;
  is_online_booking_blocked?: boolean;
  block_reason?: string | null;
} & Partial<ProfileFields>;

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

// GET /auth/me
export async function getMe(req: AuthRequest, res: Response) {
  const sub = req.user?.sub ?? '';
  if (!Types.ObjectId.isValid(sub)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const me = await User.findById(new Types.ObjectId(sub))
    .lean<UserLean>()
    .exec();

  if (!me) return res.status(404).json({ error: 'User not found' });

  return res.json({
    user: {
      id: idToString(me._id),
      name: me.name,
      email: me.email,
      role: me.role,
      warning_count: me.warning_count ?? 0,
      last_warning_at: me.last_warning_at ?? null,
      is_online_booking_blocked: me.is_online_booking_blocked ?? false,
      block_reason: me.block_reason ?? null,
      phone: me.phone ?? null,
      address: me.address ?? null,
      avatarUrl: me.avatarUrl ?? null,
    },
  });
}

// PATCH /auth/me
export async function updateMe(
  req: AuthRequest,
  res: Response,
) {
  const sub = req.user?.sub ?? '';
  if (!Types.ObjectId.isValid(sub)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Validate without mutating req.body
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return res.status(400).json({ error: 'Validation error', details });
  }
  const patch: UpdateMeBody = parsed.data;

  const user = await User.findById(new Types.ObjectId(sub)).exec();
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Narrow the doc to a typed object that includes optional profile fields
  const u = user as UserDoc & Partial<ProfileFields>;

  if (patch.name !== undefined) u.name = patch.name;
  if (patch.phone !== undefined) u.phone = patch.phone;
  if (patch.address !== undefined) u.address = patch.address;
  if (patch.avatarUrl !== undefined) u.avatarUrl = patch.avatarUrl;

  await user.save();

  const out = u as UserDoc & Required<{
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  }>;

  return res.json({
    user: {
      id: idToString(out._id),
      name: out.name,
      email: out.email,
      role: out.role,
      warning_count: out.warning_count ?? 0,
      last_warning_at: out.last_warning_at ?? null,
      is_online_booking_blocked: out.is_online_booking_blocked ?? false,
      block_reason: out.block_reason ?? null,
      phone: out.phone ?? null,
      address: out.address ?? null,
      avatarUrl: out.avatarUrl ?? null,
    },
  });
}
