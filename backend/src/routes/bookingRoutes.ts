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
  adminUpdateBooking,
  rescheduleMyBooking,
  adminMarkNoShow,
} from './controllers/bookingController';
import { getAvailableSlots } from '@src/services/scheduling';
import { validateBody, validateParams } from '@src/middleware/validate';
import {
  createBookingSchema,
  cancelBookingSchema,
  adminUpdateBookingSchema,
} from './validators/bookingSchemas';
import { adminBookingIdParams } from './validators/bookingAdminSchemas';

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

// Reschedule own booking (startsAt and/or durationMin)
router.patch(
  '/:id',
  requireAuth,
  validateParams(cancelBookingSchema), // validates :id
  rescheduleMyBooking,
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

router.patch(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  validateParams(cancelBookingSchema), // validates :id
  validateBody(adminUpdateBookingSchema),
  adminUpdateBooking,
);

// Mark no-show
router.post(
  '/admin/:id/no-show',
  requireAuth,
  requireAdmin,
  validateParams(adminBookingIdParams),
  adminMarkNoShow,
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
