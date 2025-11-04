import { z } from 'zod';
import { Types } from 'mongoose';

export const createBookingSchema = z.object({
  barberId: z.string().min(1),
  serviceName: z.string().min(1),
  durationMin: z.number().int().positive(),
  startsAt: z.string().datetime(), // ISO
  notes: z.string().max(500).optional(),
});

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export type CreateBookingBody = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  id: z.string().min(1),
});
export type CancelBookingParams = z.infer<typeof cancelBookingSchema>;

export const adminUpdateBookingSchema = z.object({
  startsAt: z.string().datetime().optional(),         // ISO string
  durationMin: z.number().int().min(5).max(480).optional(),
  barberId: objectId.optional(),
  serviceName: z.string().min(2).max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});