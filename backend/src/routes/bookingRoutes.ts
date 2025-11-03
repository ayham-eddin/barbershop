import { Router } from 'express';
import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import {
  myBookings,
  createBooking,
  cancelBooking,
  adminAllBookings,
  adminCancelBooking,
  adminCompleteBooking,
} from './controllers/bookingController';
import { getAvailableSlots } from '@src/services/scheduling';
import { validateBody, validateParams } from '@src/middleware/validate';
import {
  createBookingSchema,
  cancelBookingSchema,
} from './validators/bookingSchemas';

const router = Router();

/** 🧍 User routes (auth required) */
router.get('/me', requireAuth, myBookings);
router.post('/', requireAuth, validateBody(createBookingSchema), createBooking);
router.post(
  '/:id/cancel',
  requireAuth,
  validateParams(cancelBookingSchema),
  cancelBooking,
);

/** 🧑‍💼 Admin view + actions */
router.get('/admin/all', requireAuth, requireAdmin, adminAllBookings);
router.post(
  '/admin/:id/cancel',
  requireAuth,
  requireAdmin,
  validateParams(cancelBookingSchema),
  adminCancelBooking,
);
router.post(
  '/admin/:id/complete',
  requireAuth,
  requireAdmin,
  validateParams(cancelBookingSchema),
  adminCompleteBooking,
);

/** 📅 Public availability check (no auth required) */
router.get('/availability', async (req, res) => {
  const { barberId, date, durationMin } = req.query;

  if (
    typeof barberId !== 'string' ||
    typeof date !== 'string' ||
    typeof durationMin !== 'string'
  ) {
    return res.status(400).json({ error: 'Bad query' });
  }

  const slots = await getAvailableSlots(
    barberId,
    date,
    Number(durationMin),
  );

  return res.json({ slots });
});

export default router;
