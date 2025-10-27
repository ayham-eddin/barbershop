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
