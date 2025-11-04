// src/routes/validators/bookingAdminSchemas.ts
import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

/** /api/bookings/admin/:id */
export const adminBookingIdParams = z.object({
  id: objectId,
});

/**
 * PATCH /api/bookings/admin/:id
 * All fields optional; at least one required.
 */
export const adminUpdateBookingSchema = z
  .object({
    startsAt: z.string().datetime().optional(), // ISO
    barberId: objectId.optional(),
    serviceName: z.string().min(1).max(100).optional(),
    durationMin: z.number().int().min(5).max(480).optional(),
    status: z.enum(['booked', 'cancelled', 'completed']).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type AdminUpdateBookingBody = z.infer<typeof adminUpdateBookingSchema>;
