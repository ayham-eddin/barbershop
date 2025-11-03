import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Appointment, type AppointmentDoc } from '@src/models/Appointment';
import { Barber } from '@src/models/Barber';
import { User } from '@src/models/User';

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

/**
 * GET /api/bookings/admin/all (admin only)
 * Pagination via ?page=&limit=
 */
export async function adminAllBookings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const rawPage = (req.query.page as string) ?? '1';
  const rawLimit = (req.query.limit as string) ?? '10';

  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1);
  const limit = Math.max(1, Math.min(100, Number.parseInt(rawLimit, 10) || 10));
  const skip = (page - 1) * limit;

  const [bookingsRaw, total] = await Promise.all([
    Appointment.find()
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean<AppointmentDoc[]>()
      .exec(),
    Appointment.countDocuments().exec(),
  ]);

  const userIds = Array.from(
    new Set(
      bookingsRaw
        .map((b) => String(b.userId))
        .filter((id) => Types.ObjectId.isValid(id)),
    ),
  ).map((id) => new Types.ObjectId(id));

  const barberIds = Array.from(
    new Set(
      bookingsRaw
        .map((b) => String(b.barberId))
        .filter((id) => Types.ObjectId.isValid(id)),
    ),
  ).map((id) => new Types.ObjectId(id));

  const [users, barbers] = await Promise.all([
    userIds.length
      ? User.find({ _id: { $in: userIds } })
        .select({ name: 1, email: 1 })
        .lean()
        .exec()
      : Promise.resolve([] as { _id: Types.ObjectId; name?: string; email?: string }[]),
    barberIds.length
      ? Barber.find({ _id: { $in: barberIds } })
        .select({ name: 1 })
        .lean()
        .exec()
      : Promise.resolve([] as { _id: Types.ObjectId; name?: string }[]),
  ]);

  const userMap = new Map<string, { id: string; name?: string; email?: string }>();
  users.forEach((u) => {
    const id =
      typeof u._id === 'string'
        ? u._id
        : (u._id as Types.ObjectId).toHexString();
    userMap.set(id, { id, name: u.name, email: u.email });
  });

  const barberMap = new Map<string, { id: string; name?: string }>();
  barbers.forEach((b) => {
    const id =
      typeof b._id === 'string'
        ? b._id
        : (b._id as Types.ObjectId).toHexString();
    barberMap.set(id, { id, name: b.name });
  });

  const bookings = bookingsRaw.map((b) => {
    const uid = String(b.userId);
    const bid = String(b.barberId);
    const user = userMap.get(uid) ?? { id: uid };
    const barber = barberMap.get(bid) ?? { id: bid };
    return {
      ...b,
      user,
      barber,
    };
  });

  const pages = Math.max(1, Math.ceil(total / limit));
  res.json({ bookings, items: bookings, page, limit, total, pages });
}
