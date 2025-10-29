import { z } from 'zod';

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createServiceSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().nonnegative(), // use basic number; treat as EUR
});
export type CreateServiceBody = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  price: z.number().nonnegative().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);
export type UpdateServiceBody = z.infer<typeof updateServiceSchema>;
