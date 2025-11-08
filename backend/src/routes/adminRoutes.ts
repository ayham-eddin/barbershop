// src/routes/adminRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '@src/middleware/validate';

import { User } from '@src/models/User';
import { TimeOff } from '@src/models/TimeOff';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { AuditLog } from '@src/models/AuditLog';

const admin = Router();

/* ───────────────────────── Zod Schemas ───────────────────────── */

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' });

const timeOffBodySchema = z.object({
  barberId: objectId,
  start: isoDate,
  end: isoDate,
  reason: z.string().max(200).optional(),
});

const timeOffQuerySchema = z.object({
  barberId: objectId.optional(),
});

const timeOffParamsSchema = z.object({
  id: objectId,
});

/* ─────────────────────────── Routes ──────────────────────────── */

// GET /api/admin/users  (admin only)
admin.get(
  '/users',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const users = await User.find({}, { passwordHash: 0 }).lean().exec();
    return res.json({ users });
  },
);

// POST /api/admin/timeoff  (create time-off block)
admin.post(
  '/timeoff',
  requireAuth,
  requireAdmin,
  validateBody(timeOffBodySchema),
  async (req: Request, res: Response) => {
    const body = req.body as z.infer<typeof timeOffBodySchema>;
    const { barberId, start, end, reason } = body;

    const doc = await TimeOff.create({
      barberId: new Types.ObjectId(barberId),
      start: new Date(start),
      end: new Date(end),
      reason,
    });

    return res.status(201).json({ timeoff: doc });
  },
);

// GET /api/admin/timeoff?barberId=...  (list time-off; optional filter)
admin.get(
  '/timeoff',
  requireAuth,
  requireAdmin,
  validateQuery(timeOffQuerySchema),
  async (req: Request, res: Response) => {
    const { barberId } = req.query as z.infer<typeof timeOffQuerySchema>;

    const filter =
      barberId != null
        ? { barberId: new Types.ObjectId(barberId) }
        : {};

    const items = await TimeOff.find(filter).sort({ start: 1 }).lean().exec();
    return res.json({ timeoff: items });
  },
);

// DELETE /api/admin/timeoff/:id  (remove a time-off block)
admin.delete(
  '/timeoff/:id',
  requireAuth,
  requireAdmin,
  validateParams(timeOffParamsSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof timeOffParamsSchema>;

    const deleted = await TimeOff.findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();

    if (!deleted) {
      return res.status(404).json({ error: 'Time-off not found' });
    }
    return res.json({ deleted });
  },
);

// POST /api/admin/users/:id/unblock  (unblock a user)
admin.post(
  '/users/:id/unblock',
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: objectId })),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const _id = new Types.ObjectId(id);

    const user = await User.findById(_id).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = {
      is_online_booking_blocked: user.is_online_booking_blocked,
      block_reason: user.block_reason,
      warning_count: user.warning_count,
    };

    user.is_online_booking_blocked = false;
    user.block_reason = undefined;
    await user.save();

    const actorSub = req.user?.sub ?? '';
    const actorId = Types.ObjectId.isValid(actorSub)
      ? new Types.ObjectId(actorSub)
      : null;

    await AuditLog.create({
      actorId,
      action: 'user.unblock',
      entityType: 'user',
      entityId: user._id,
      before,
      after: {
        is_online_booking_blocked: user.is_online_booking_blocked,
        block_reason: user.block_reason,
        warning_count: user.warning_count,
      },
    });

    return res.json({
      user: { _id: user._id, is_online_booking_blocked: false },
    });
  },
);

export default admin;
