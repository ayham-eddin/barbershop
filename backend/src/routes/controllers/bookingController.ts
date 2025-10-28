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

  const {
    barberId,
    serviceName,
    durationMin,
    startsAt,
    notes,
  } = req.body;

  const starts = new Date(startsAt);
  const dur = durationMin;
  const ends = new Date(starts.getTime() + dur * 60_000);

  // Use countDocuments (typed number) instead of exists (loosely typed)
  const overlap = await Appointment.countDocuments({
    barberId: new Types.ObjectId(barberId),
    status: 'booked',
    startsAt: { $lt: ends },
    endsAt: { $gt: starts },
  }).exec();

  if (overlap > 0) {
    res.status(409).json({ error: 'Time slot not available' });
    return;
  }

  const appt = await Appointment.create({
    userId: new Types.ObjectId(userId),
    barberId: new Types.ObjectId(barberId),
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
