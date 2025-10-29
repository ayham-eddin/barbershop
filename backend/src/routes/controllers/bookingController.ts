import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Appointment, type AppointmentDoc } from '@src/models/Appointment';

/** Body shape for creating a booking (keep in sync with zod schema). */
export interface CreateBookingBody {
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  notes?: string;
}

/** GET /api/bookings/me (auth required) */
export async function myBookings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const uid = new Types.ObjectId(userId);
  const bookings = await Appointment.find({ userId: uid })
    .sort({ startsAt: 1 })
    .lean<AppointmentDoc[]>()
    .exec();

  res.json({ bookings });
}

/** POST /api/bookings (auth required) */
export async function createBooking(
  req: AuthRequest<CreateBookingBody>,
  res: Response,
): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { barberId, serviceName, durationMin, startsAt, notes } = req.body;

  // Basic input validation (defensive, even if you use zod on the route)
  if (!Types.ObjectId.isValid(barberId)) {
    res.status(400).json({ error: 'Invalid barberId' });
    return;
  }

  const starts = new Date(startsAt);
  if (Number.isNaN(starts.getTime())) {
    res.status(400).json({ error: 'Invalid startsAt (ISO expected)' });
    return;
  }

  const dur = durationMin;
  if (!Number.isFinite(dur) || dur <= 0 || dur > 480) {
    res.status(400).json({ error: 'Invalid durationMin (1..480)' });
    return;
  }

  const ends = new Date(starts.getTime() + dur * 60_000);

  const barberObjId = new Types.ObjectId(barberId);
  const userObjId = new Types.ObjectId(userId);

  // Prevent overlaps for the same barber (typed number via countDocuments)
  const overlap = await Appointment.countDocuments({
    barberId: barberObjId,
    status: 'booked',
    startsAt: { $lt: ends },
    endsAt: { $gt: starts },
  }).exec();

  if (overlap > 0) {
    res.status(409).json({ error: 'Time slot not available' });
    return;
  }

  const appt = await Appointment.create({
    userId: userObjId,
    barberId: barberObjId,
    serviceName,
    durationMin: dur,
    startsAt: starts,
    endsAt: ends,
    notes,
    status: 'booked',
  });

  res.status(201).json({ booking: appt });
}

/** POST /api/bookings/:id/cancel (auth required) */
export async function cancelBooking(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const bookingId = req.params.id;

  const updated = await Appointment.findOneAndUpdate(
    {
      _id: new Types.ObjectId(bookingId),
      userId: new Types.ObjectId(userId),
      status: 'booked',
    },
    { $set: { status: 'cancelled' } },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  res.json({ booking: updated });
}

/** GET /api/bookings/admin/all (admin only) */
export async function adminAllBookings(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  const bookings = await Appointment.find()
    .sort({ startsAt: 1 })
    .lean<AppointmentDoc[]>()
    .exec();

  res.json({ bookings });
}
