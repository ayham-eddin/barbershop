// backend/src/routes/adminRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '@src/middleware/validate';

import { User } from '@src/models/User';
import { TimeOff } from '@src/models/TimeOff';
import { AuditLog } from '@src/models/AuditLog';

const admin = Router();

/* ───────────────────────── Helpers ───────────────────────── */

const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

// Treat empty string as “not provided”
const emptyToUndef = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() === '' ? undefined : (v as string | undefined);

/* ───────────────────────── Zod Schemas ───────────────────────── */

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' });

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

const blockParamsSchema = z.object({ id: objectId });
const blockBodySchema = z.object({
  reason: z.string().max(300).optional(),
});

const clearWarnParamsSchema = z.object({ id: objectId });

// Admin user read/patch
const userParamsSchema = z.object({ id: objectId });

const userPatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  phone: z.string().max(100).optional(),          
  address: z.string().max(300).optional(),        
  avatarUrl: z.union([z.string().url(), z.literal('')]).optional(), 
  is_online_booking_blocked: z.boolean().optional(),
  block_reason: z.string().max(300).optional(),  
});

/* ─────────────────────────── Routes ──────────────────────────── */

// GET /api/admin/users
admin.get(
  '/users',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const users = await User.find({}, { passwordHash: 0 }).lean().exec();
    return res.json({ users });
  },
);

// GET /api/admin/users/:id
admin.get(
  '/users/:id',
  requireAuth,
  requireAdmin,
  validateParams(userParamsSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof userParamsSchema>;
    const user = await User.findById(toObjectId(id), { passwordHash: 0 }).lean().exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  },
);

// PATCH /api/admin/users/:id
admin.patch(
  '/users/:id',
  requireAuth,
  requireAdmin,
  validateParams(userParamsSchema),
  validateBody(userPatchSchema),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as z.infer<typeof userParamsSchema>;
    const patch = req.body as z.infer<typeof userPatchSchema>;
    const _id = toObjectId(id);

    const user = await User.findById(_id).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Snapshot BEFORE
    const before = {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      address: user.address ?? null,
      avatarUrl: user.avatarUrl ?? null,
      is_online_booking_blocked: user.is_online_booking_blocked,
      block_reason: user.block_reason ?? null,
    };

    // Apply patch (without any-casts)
    if (patch.name !== undefined) user.name = patch.name;
    if (patch.email !== undefined) user.email = patch.email;
    if (patch.role !== undefined) user.role = patch.role;

    if ('phone' in patch) user.phone = emptyToUndef(patch.phone);
    if ('address' in patch) user.address = emptyToUndef(patch.address);
    if ('avatarUrl' in patch) user.avatarUrl = emptyToUndef(patch.avatarUrl);

    if (patch.is_online_booking_blocked !== undefined) {
      user.is_online_booking_blocked = patch.is_online_booking_blocked;
      if (!patch.is_online_booking_blocked) {
        user.block_reason = undefined;
      }
    }
    if ('block_reason' in patch) {
      user.block_reason = emptyToUndef(patch.block_reason);
    }

    await user.save();

    // Actor for audit
    const actorSub = req.user?.sub ?? '';
    const actorId = Types.ObjectId.isValid(actorSub) ? new Types.ObjectId(actorSub) : null;

    await AuditLog.create({
      actorId,
      action: 'user.update',
      entityType: 'user',
      entityId: user._id,
      before,
      after: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone ?? null,
        address: user.address ?? null,
        avatarUrl: user.avatarUrl ?? null,
        is_online_booking_blocked: user.is_online_booking_blocked,
        block_reason: user.block_reason ?? null,
      },
    });

    // Build safe response (without passwordHash)
    const out = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      address: user.address ?? null,
      avatarUrl: user.avatarUrl ?? null,
      is_online_booking_blocked: user.is_online_booking_blocked,
      block_reason: user.block_reason ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ user: out });
  },
);

// POST /api/admin/timeoff
admin.post(
  '/timeoff',
  requireAuth,
  requireAdmin,
  validateBody(timeOffBodySchema),
  async (req: Request, res: Response) => {
    const body = req.body as z.infer<typeof timeOffBodySchema>;
    const doc = await TimeOff.create({
      barberId: toObjectId(body.barberId),
      start: new Date(body.start),
      end: new Date(body.end),
      reason: body.reason,
    });
    return res.status(201).json({ timeoff: doc });
  },
);

// GET /api/admin/timeoff
admin.get(
  '/timeoff',
  requireAuth,
  requireAdmin,
  validateQuery(timeOffQuerySchema),
  async (req: Request, res: Response) => {
    const { barberId } = req.query as z.infer<typeof timeOffQuerySchema>;
    const filter = barberId ? { barberId: toObjectId(barberId) } : {};
    const items = await TimeOff.find(filter).sort({ start: 1 }).lean().exec();
    return res.json({ timeoff: items });
  },
);

// DELETE /api/admin/timeoff/:id
admin.delete(
  '/timeoff/:id',
  requireAuth,
  requireAdmin,
  validateParams(timeOffParamsSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof timeOffParamsSchema>;
    const deleted = await TimeOff.findByIdAndDelete(toObjectId(id)).lean().exec();
    if (!deleted) return res.status(404).json({ error: 'Time-off not found' });
    return res.json({ deleted });
  },
);

// POST /api/admin/users/:id/unblock
admin.post(
  '/users/:id/unblock',
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: objectId })),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const user = await User.findById(toObjectId(id)).exec();
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
    const actorId = Types.ObjectId.isValid(actorSub) ? new Types.ObjectId(actorSub) : null;

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

    return res.json({ user: { _id: user._id, is_online_booking_blocked: false } });
  },
);

// POST /api/admin/users/:id/block
admin.post(
  '/users/:id/block',
  requireAuth,
  requireAdmin,
  validateParams(blockParamsSchema),
  validateBody(blockBodySchema),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as z.infer<typeof blockParamsSchema>;
    const { reason } = req.body as z.infer<typeof blockBodySchema>;

    const user = await User.findById(toObjectId(id)).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = {
      is_online_booking_blocked: user.is_online_booking_blocked,
      block_reason: user.block_reason,
      warning_count: user.warning_count,
    };

    user.is_online_booking_blocked = true;
    user.block_reason = emptyToUndef(reason) ?? '';
    await user.save();

    const actorSub = req.user?.sub ?? '';
    const actorId = Types.ObjectId.isValid(actorSub) ? new Types.ObjectId(actorSub) : null;

    await AuditLog.create({
      actorId,
      action: 'user.block',
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
      user: {
        _id: user._id,
        is_online_booking_blocked: true,
        block_reason: user.block_reason ?? '',
      },
    });
  },
);

// POST /api/admin/users/:id/clear-warning
admin.post(
  '/users/:id/clear-warning',
  requireAuth,
  requireAdmin,
  validateParams(clearWarnParamsSchema),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as z.infer<typeof clearWarnParamsSchema>;
    const user = await User.findById(toObjectId(id)).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = {
      warning_count: user.warning_count,
      last_warning_at: user.last_warning_at,
    };

    user.warning_count = Math.max(0, (user.warning_count ?? 0) - 1);
    if (user.warning_count === 0) user.last_warning_at = undefined;
    await user.save();

    const actorSub = req.user?.sub ?? '';
    const actorId = Types.ObjectId.isValid(actorSub) ? new Types.ObjectId(actorSub) : null;

    await AuditLog.create({
      actorId,
      action: 'user.warning.clearOne',
      entityType: 'user',
      entityId: user._id,
      before,
      after: {
        warning_count: user.warning_count,
        last_warning_at: user.last_warning_at,
      },
    });

    return res.json({ user: { _id: user._id, warning_count: user.warning_count } });
  },
);

export default admin;
