/* eslint-disable max-len */
// src/routes/adminBarberRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import { validateBody, validateParams } from '@src/middleware/validate';

import { Barber } from '@src/models/Barber';

/* ───────────── Zod helpers ───────────── */
const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const HHmm = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Use HH:mm');

const WorkingBlock = z.object({
  day: z.union([
    z.literal(0), z.literal(1), z.literal(2),
    z.literal(3), z.literal(4), z.literal(5), z.literal(6),
  ]),
  start: HHmm,
  end: HHmm,
});

const createBarberSchema = z.object({
  name: z.string().min(1),
  specialties: z.array(z.string()).optional().default([]),
  services: z.array(objectId).optional().default([]),
  workingHours: z.array(WorkingBlock).optional().default([]),
  active: z.boolean().optional().default(true),
});

const idParams = z.object({ id: objectId });

const updateBarberSchema = z.object({
  name: z.string().min(1).optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(objectId).optional(),
  workingHours: z.array(WorkingBlock).optional(),
  active: z.boolean().optional(),
});

const adminBarbers = Router();

/* ───────────── Create ───────────── */
// POST /api/admin/barbers
adminBarbers.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createBarberSchema),
  async (req: Request, res: Response) => {
    const { name, specialties, services, workingHours, active } =
      req.body as z.infer<typeof createBarberSchema>;

    const doc = await Barber.create({
      name,
      specialties,
      services,        // schema is Types.ObjectId[] in model; Mongoose will cast strings
      workingHours,
      active,
    });

    return res.status(201).json({ barber: doc });
  },
);

/* ───────────── List ───────────── */
// GET /api/admin/barbers
adminBarbers.get(
  '/',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const barbers = await Barber.find()
      .populate('services')
      .lean()
      .exec();
    return res.json({ barbers });
  },
);

/* ───────────── Get one ───────────── */
// GET /api/admin/barbers/:id
adminBarbers.get(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;

    const barber = await Barber.findById(new Types.ObjectId(id))
      .populate('services')
      .lean()
      .exec();

    if (!barber) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ barber });
  },
);

/* ───────────── Update ───────────── */
// PATCH /api/admin/barbers/:id
adminBarbers.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  validateBody(updateBarberSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const body = req.body as z.infer<typeof updateBarberSchema>;

    // Mongoose will cast service ids (strings) to ObjectId for the array
    const updated = await Barber.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: body },
      { new: true },
    )
      .populate('services')
      .lean()
      .exec();

    if (!updated) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ barber: updated });
  },
);

/* ───────────── Delete ───────────── */
// DELETE /api/admin/barbers/:id
adminBarbers.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;

    const deleted = await Barber.findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!deleted) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ deleted });
  },
);

export default adminBarbers;
