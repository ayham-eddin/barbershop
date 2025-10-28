import { Router } from 'express';
import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import {
  myBookings,
  createBooking,
  cancelBooking,
  adminAllBookings,
} from './controllers/bookingController';
import { getAvailableSlots } from '@src/services/scheduling';

const router = Router();

/** user routes (auth required) */
router.get('/me', requireAuth, myBookings);
router.post('/', requireAuth, createBooking);
router.post('/:id/cancel', requireAuth, cancelBooking);

/** admin view */
router.get('/admin/all', requireAuth, requireAdmin, adminAllBookings);

/** availability (public) */
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
