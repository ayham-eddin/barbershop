import { Router } from 'express';
import AuthRoutes from './authRoutes';
import AdminRoutes from './adminRoutes';
import { requireAuth, AuthRequest } from '@src/middleware/requireAuth';
import { User } from '@src/models/User';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', AuthRoutes);

router.use('/admin', AdminRoutes);

// GET /api/me (requires JWT)
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await User.findById(userId)
    .select('_id name email role')
    .lean();

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
