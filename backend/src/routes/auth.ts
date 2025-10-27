import { Router } from 'express';
import { User } from '@src/models/User';
import { hashPassword, verifyPassword,
  createToken } from '@src/utils/auth';
import { registerSchema, loginSchema }
  from './validators/authSchemas';

const router = Router();

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid data' });
  }
  const { name, email, password } = parsed.data;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'email in use' });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  const token = createToken({ sub: user._id, role: user.role });
  return res.status(201).json({
    user: {
      id: user._id, name: user.name, email: user.email,
      role: user.role,
    },
    token,
  });
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid data' });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'bad credentials' });

  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ error: 'bad credentials' });

  const token = createToken({ sub: user._id, role: user.role });
  return res.json({
    user: {
      id: user._id, name: user.name, email: user.email,
      role: user.role,
    },
    token,
  });
});

export default router;
