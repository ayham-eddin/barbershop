// src/routes/adminServiceRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import { validateBody, validateParams } from '@src/middleware/validate';

import { Service, type ServiceDoc } from '@src/models/Service';
import { Barber } from '@src/models/Barber';

const r = Router();

/* ───────────────────────── Zod Schemas ───────────────────────── */

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const createSchema = z.object({
  name: z.string().min(2).max(100),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const idParams = z.object({ id: objectId });

/* ─────────────────────────── Routes ──────────────────────────── */

// GET /api/admin/services  (list all services)
r.get(
  '/',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const services = await Service.find().sort({ name: 1 })
      .lean<ServiceDoc[]>().exec();
    return res.json({ services });
  },
);

// POST /api/admin/services  (create)
r.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createSchema),
  async (req: Request, res: Response) => {
    const { name, durationMin, price } =
      req.body as z.infer<typeof createSchema>;
    const exists = await Service.exists({ name }).exec();
    if (exists) {
      return res.status(409).json({ error: 'Service name already exists' });
    }
    const svc = await Service.create({ name, durationMin, price });
    return res.status(201).json({ service: svc });
  },
);

// PATCH /api/admin/services/:id  (update)
r.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  validateBody(updateSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const updates = req.body as z.infer<typeof updateSchema>;

    const updated = await Service.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: updates },
      { new: true },
    ).lean<ServiceDoc | null>().exec();

    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }
    return res.json({ service: updated });
  },
);

// DELETE /api/admin/services/:id  (delete)
// also pulls it from any Barber.services arrays to keep data consistent
r.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const _id = new Types.ObjectId(id);

    const deleted = await Service.findByIdAndDelete(_id)
      .lean<ServiceDoc | null>().exec();

    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Clean up references on barbers (ignore result)
    await Barber.updateMany(
      { services: _id },
      { $pull: { services: _id } },
    ).exec();

    return res.json({ deleted });
  },
);

export default r;
