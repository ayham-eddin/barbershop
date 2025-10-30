// src/routes/barberRoutes.ts
import { Router } from 'express';
import { z } from 'zod';

import {
  listBarbers,
  getBarber,
  getBarberSlots,
} from './controllers/barberController';

import { validateParams, validateQuery } from '@src/middleware/validate';

// 24-hex ObjectId checker
const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// GET /:id
const idParamSchema = z.object({
  id: objectId,
});

// GET /:id/slots?date=YYYY-MM-DD&duration=30[&step=15]
const slotsQuerySchema = z.object({
  date: z.string().min(1, 'date is required'), // expect "YYYY-MM-DD" (UTC day)
  duration: z.coerce.number().int().positive(),
  // optional override (defaults to 15 in service)
  step: z.coerce.number()
    .int()
    .positive()
    .optional(),
});

const router = Router();

router.get('/', listBarbers);

router.get('/:id', validateParams(idParamSchema), getBarber);

router.get(
  '/:id/slots',
  validateParams(idParamSchema),
  validateQuery(slotsQuerySchema),
  getBarberSlots,
);

export default router;
