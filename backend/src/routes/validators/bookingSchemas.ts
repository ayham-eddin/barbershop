// src/routes/validators/bookingSchemas.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
  barberId: z.string().min(1),
  serviceName: z.string().min(1),
  durationMin: z.number().int().positive(),
  startsAt: z.union([z.string(), z.date()]), // ISO string or Date
  notes: z.string().max(500).optional(),
});

export type CreateBookingBody = z.infer<typeof createBookingSchema>;
