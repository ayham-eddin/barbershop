import { z } from 'zod';

export const createBookingSchema = z.object({
  barberId: z.string().min(1),
  serviceName: z.string().min(1),
  durationMin: z.number().int().positive(),
  startsAt: z.string().datetime(), // ISO
  notes: z.string().max(500).optional(),
});
export type CreateBookingBody = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  id: z.string().min(1),
});
export type CancelBookingParams = z.infer<typeof cancelBookingSchema>;
