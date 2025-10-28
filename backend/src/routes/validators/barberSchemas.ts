import { z } from 'zod';

export const serviceItem = z.object({
  name: z.string().min(2).max(60),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0),
});

export const workingBlock = z.object({
  day: z.union([
    z.literal(0), z.literal(1), z.literal(2),
    z.literal(3), z.literal(4), z.literal(5), z.literal(6),
  ]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const createBarberSchema = z.object({
  name: z.string().min(2),
  specialties: z.array(z.string()).default([]),
  services: z.array(serviceItem).default([]),
  workingHours: z.array(workingBlock).default([]),
  active: z.boolean().default(true),
});

export type CreateBarberBody = z.infer<typeof createBarberSchema>;

export const updateBarberSchema =
  createBarberSchema.partial();

export type UpdateBarberBody = z.infer<typeof updateBarberSchema>;
