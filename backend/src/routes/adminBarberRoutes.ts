// src/routes/adminBarberRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import { validateBody, validateParams } from '@src/middleware/validate';

import { Barber, type BarberDoc, type WorkingHour } from '@src/models/Barber';
import { Appointment } from '@src/models/Appointment';

const r = Router();

/* ───────────────────────── Zod Schemas ───────────────────────── */

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const idParams = z.object({ id: objectId });

const workingBlock = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'start must be HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'end must be HH:MM'),
});

const serviceIds = z.array(objectId).default([]);

/**
 * NOTE: For admin we keep `services` as an array of Service IDs.
 * Public endpoints can still populate them as needed.
 */
const createSchema = z.object({
  name: z.string().min(2).max(100),
  specialties: z.array(z.string()).default([]),
  workingHours: z.array(workingBlock).default([]),
  services: serviceIds.optional(),
  active: z.boolean().default(true),
});

const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/* ─────────────────────────── Helpers ──────────────────────────── */

function normalizeError(e: unknown): string {
  const def = 'Request failed';
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: string }).message;
    return m ?? def; // use nullish coalescing for ESLint rule
  }
  return def;
}

/* ─────────────────────────── Routes ──────────────────────────── */

// GET /api/admin/barbers  (list all barbers, active & inactive)
r.get(
  '/',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const barbers = await Barber.find()
      .sort({ name: 1 })
      .populate('services')
      .lean<BarberDoc[]>()
      .exec();

    return res.json({ barbers });
  },
);

// POST /api/admin/barbers  (create barber)
r.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createSchema),
  async (req: Request, res: Response) => {
    const body = req.body as z.infer<typeof createSchema>;

    try {
      const barber = await Barber.create({
        name: body.name.trim(),
        specialties: body.specialties,
        workingHours: body.workingHours as WorkingHour[],
        services: (body.services ?? []).map((id) => new Types.ObjectId(id)),
        active: body.active,
      });

      // For admin responses, return services populated so UI/tests see full objects
      const populated = await barber.populate('services');

      return res.status(201).json({ barber: populated });
    } catch (e) {
      return res.status(400).json({ error: normalizeError(e) });
    }
  },
);

// PATCH /api/admin/barbers/:id  (update barber)
r.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  validateBody(updateSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const updates = req.body as z.infer<typeof updateSchema>;
    const _id = new Types.ObjectId(id);

    const toSet: Partial<BarberDoc> & {
      services?: Types.ObjectId[];
    } = {};

    if (typeof updates.name === 'string') {
      toSet.name = updates.name.trim();
    }
    if (Array.isArray(updates.specialties)) {
      toSet.specialties = updates.specialties;
    }
    if (Array.isArray(updates.workingHours)) {
      toSet.workingHours = updates.workingHours as WorkingHour[];
    }
    if (Array.isArray(updates.services)) {
      toSet.services = updates.services.map((sid) => new Types.ObjectId(sid));
    }
    if (typeof updates.active === 'boolean') {
      toSet.active = updates.active;
    }

    const updated = await Barber.findByIdAndUpdate(
      _id,
      { $set: toSet },
      { new: true },
    )
      .populate('services')
      .lean<BarberDoc | null>()
      .exec();

    if (!updated) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    return res.json({ barber: updated });
  },
);

// DELETE /api/admin/barbers/:id  (safe delete with future booking check)
r.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const _id = new Types.ObjectId(id);

    // Check for future booked/rescheduled appointments
    const now = new Date();
    const hasFutureBookings = await Appointment.exists({
      barberId: _id,
      status: { $in: ['booked', 'rescheduled'] },
      startsAt: { $gte: now },
    }).exec();

    if (hasFutureBookings) {
      return res.status(409).json({
        error:
          'Cannot delete barber with active future bookings. ' +
          'Set them inactive or reassign/cancel bookings first.',
      });
    }

    const deleted = await Barber.findByIdAndDelete(_id)
      .lean<BarberDoc | null>()
      .exec();

    if (!deleted) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    return res.json({ deleted });
  },
);

export default r;
