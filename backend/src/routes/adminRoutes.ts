import { Router } from 'express';
import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import { User } from '@src/models/User';

const admin = Router();

// GET /api/admin/users  (admin only)
admin.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find({}, { password: 0 }).lean();
  return res.json({ users });
});

export default admin;
