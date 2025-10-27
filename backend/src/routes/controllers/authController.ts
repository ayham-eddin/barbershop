import { Request, Response } from 'express';
import { User, type UserDoc } from '@src/models/User';
import { hashPassword, verifyPassword, createToken } from '@src/utils/auth';
import type { RegisterBody, LoginBody } from '../validators/authSchemas';

// POST /auth/register
export async function register(
  req: Request<unknown, unknown, RegisterBody>,
  res: Response,
) {
  const { name, email, password } = req.body;

  const exists = await User.exists({ email });
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

  const token = createToken({ sub: user._id.toString(), role: user.role });

  return res.status(201).json({
    user: {
      id: user._id.toString(),
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

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid login' });
  }

  const token = createToken({ sub: user._id.toString(), role: user.role });

  return res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
}
