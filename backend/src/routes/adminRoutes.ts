import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';

import { User } from '@src/models/User';
import { TimeOff } from '@src/models/TimeOff';

/** Simple body validator (keeps us type-safe & lint-clean) */
function validateTimeOffBody(req: Request, res: Response, next: NextFunction) {
  const {
    barberId,
    start,
    end,
    reason,
  } = (req.body as {
    barberId?: string,
    start?: string,
    end?: string,
    reason?: string,
  }) ?? {};
  if (typeof barberId !== 'string' || !Types.ObjectId.isValid(barberId)) {
    return res.status(400).json({ error: 'Invalid barberId' });
  }
  if (typeof start !== 'string' || Number.isNaN(Date.parse(start))) {
    return res.status(400).json({ error: 'Invalid start' });
  }
  if (typeof end !== 'string' || Number.isNaN(Date.parse(end))) {
    return res.status(400).json({ error: 'Invalid end' });
  }
  if (reason != null && typeof reason !== 'string') {
    return res.status(400).json({ error: 'Invalid reason' });
  }
  return next();
}

const admin = Router();

/** Admin: list users (sample) */
admin.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find({}, { password: 0 }).lean();
  return res.json({ users });
});

/** Admin: create a time-off block */
admin.post(
  '/timeoff',
  requireAuth,
  requireAdmin,
  validateTimeOffBody,
  async (req, res) => {
    const { barberId, start, end, reason } = req.body as {
      barberId: string, start: string, end: string, reason?: string,
    };

    const doc = await TimeOff.create({
      barberId: new Types.ObjectId(barberId),
      start: new Date(start),
      end: new Date(end),
      reason,
    });

    return res.status(201).json({ timeoff: doc });
  },
);

/** Admin: list time-off (optionally filter by barberId) */
admin.get('/timeoff', requireAuth, requireAdmin, async (req, res) => {
  const barberId = typeof req.query.barberId === 'string'
    ? req.query.barberId
    : undefined;

  const filter = barberId && Types.ObjectId.isValid(barberId)
    ? { barberId: new Types.ObjectId(barberId) }
    : {};

  const items = await TimeOff.find(filter).sort({ start: 1 }).lean();
  return res.json({ timeoff: items });
});

export default admin;
