// src/routes/adminBarberRoutes.ts
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import { validateBody, validateParams } from '@src/middleware/validate';

import { Barber, type BarberDoc, type WorkingHour } from '@src/models/Barber';
import { Appointment, type AppointmentDoc } from '@src/models/Appointment';
import { User } from '@src/models/User';

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

// services are just Service IDs for admin
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
    return m ?? def;
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

// PATCH /api/admin/barbers/:id  (update barber + detect affected bookings)
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

    const toSet: Partial<BarberDoc> & { services?: Types.ObjectId[] } = {};

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

    // Save updated barber first
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

    /* ------------------------------------------------------------------
       If working hours were updated, detect affected future bookings
    ------------------------------------------------------------------ */
    type PopulatedAppointment = AppointmentDoc & {
      userId?: { name?: string; email?: string } | Types.ObjectId;
    };

    let affectedBookings: {
      id: string;
      startsAt: Date;
      durationMin: number;
      userName: string | null;
      userEmail: string | null;
    }[] = [];

    if (Array.isArray(updates.workingHours)) {
      const newHours = updates.workingHours as WorkingHour[];

      // Get all future booked/rescheduled appointments for this barber
      const futureBookingsRaw = await Appointment.find({
        barberId: _id,
        status: { $in: ['booked', 'rescheduled'] },
        startsAt: { $gte: new Date() },
      })
        .populate({ path: 'userId', select: 'name email' })
        .lean()
        .exec();

      const futureBookings =
        futureBookingsRaw as unknown as PopulatedAppointment[];

      const isInsideHours = (dt: Date): boolean => {
        const day = dt.getDay(); // 0..6
        const wh = newHours.find((h) => h.day === day);
        if (!wh) return false;

        const [sh, sm] = wh.start.split(':').map(Number);
        const [eh, em] = wh.end.split(':').map(Number);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const dtMinutes = dt.getHours() * 60 + dt.getMinutes();

        return dtMinutes >= startMinutes && dtMinutes < endMinutes;
      };

      const invalid = futureBookings.filter((b) => {
        const start = new Date(b.startsAt);
        return !isInsideHours(start);
      });

      affectedBookings = invalid.map((b) => {
        let user: { name?: string; email?: string } | undefined;

        if (b.userId && typeof b.userId === 'object' && 'name' in b.userId) {
          user = b.userId as { name?: string; email?: string };
        }

        return {
          id: b._id.toString(),
          startsAt: b.startsAt,
          durationMin: b.durationMin,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null,
        };
      });
    }

    return res.json({
      barber: updated,
      affectedBookings,
    });
  },
);

// DELETE /api/admin/barbers/:id  (safe delete with future booking list)
r.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validateParams(idParams),
  async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const _id = new Types.ObjectId(id);

    // Load barber first (for name + existence check)
    const barber = await Barber.findById(_id)
      .lean<BarberDoc | null>()
      .exec();

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    const now = new Date();

    type PopulatedAppointmentLean = AppointmentDoc & {
      userId?:
        | Types.ObjectId
        | {
            _id: Types.ObjectId;
            name?: string;
            email?: string;
          };
    };

    const futureAppointmentsRaw = await Appointment.find({
      barberId: _id,
      status: { $in: ['booked', 'rescheduled'] },
      startsAt: { $gte: now },
    })
      .populate({
        path: 'userId',
        model: User,
        select: 'name email',
      })
      .sort({ startsAt: 1 })
      .limit(20)
      .lean()
      .exec();

    const futureAppointments =
      futureAppointmentsRaw as unknown as PopulatedAppointmentLean[];

    if (futureAppointments.length > 0) {
      const bookings = futureAppointments.map((appt) => {
        let user: { name?: string; email?: string } | undefined;

        if (
          appt.userId &&
          typeof appt.userId === 'object' &&
          '_id' in appt.userId
        ) {
          user = appt.userId as { name?: string; email?: string };
        }

        return {
          id: String(appt._id),
          startsAt: appt.startsAt,
          serviceName: appt.serviceName,
          userName: user?.name ?? undefined,
          userEmail: user?.email ?? undefined,
        };
      });

      return res.status(409).json({
        error:
          'Cannot delete barber with active future bookings.' + 
          'Set them inactive or reassign/cancel bookings first.',
        conflict_type: 'future_bookings',
        barberId: String(barber._id),
        barberName: barber.name,
        bookings,
      });
    }

    // No future bookings → safe to delete
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
