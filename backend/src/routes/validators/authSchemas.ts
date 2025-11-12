import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginBody = z.infer<typeof loginSchema>;

/** Profile updates (all optional) */
export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(5).max(30).optional(),
  address: z.string().min(3).max(200).optional(),
  avatarUrl: z.string().url().max(300).optional(),
});
export type UpdateMeBody = z.infer<typeof updateMeSchema>;
