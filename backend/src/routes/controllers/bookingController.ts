import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Appointment, type AppointmentDoc } from '@src/models/Appointment';
import { Barber } from '@src/models/Barber';
import { User } from '@src/models/User';
import { hasOverlap } from '@src/services/bookingOverlap';
import type { AdminUpdateBookingBody } from '@src/routes/validators/bookingAdminSchemas';

/** Helpers */
function toIdString(id: unknown): string {
  if (typeof id === 'string') return id;
  try {
    return (id as Types.ObjectId).toHexString();
  } catch {
    return String(id);
  }
}

function isValidObjectIdMaybeString(id: unknown): boolean {
  try {
    const s = toIdString(id);
    return Types.ObjectId.isValid(s);
  } catch {
    return false;
  }
}

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
  const role = req.user?.role;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  // Block admins from public booking
  if (role === 'admin') {
    res.status(403).json({ error: 'Admins cannot create bookings' });
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

  // 🔁 use shared overlap check
  const overlap = await hasOverlap({
    barberId: barberObjId,
    startsAt: starts,
    endsAt: ends,
  });
  if (overlap) {
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

/** POST /api/bookings/:id/cancel (auth required, owner only) */
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
  if (!Types.ObjectId.isValid(bookingId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

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
 * Pagination + filters
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

  const filter: Record<string, unknown> = {};

  // status
  const status = (req.query.status as string | undefined)?.toLowerCase();
  if (status && ['booked', 'cancelled', 'completed'].includes(status)) {
    filter.status = status;
  }

  // barber
  const barberId = req.query.barberId as string | undefined;
  if (barberId && Types.ObjectId.isValid(barberId)) {
    filter.barberId = new Types.ObjectId(barberId);
  }

  // date range
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  if (dateFrom || dateTo) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom) {
      const d = new Date(`${dateFrom}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) range.$gte = d;
    }
    if (dateTo) {
      const d = new Date(`${dateTo}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) range.$lte = d;
    }
    if (range.$gte || range.$lte) filter.startsAt = range;
  }

  // q: search user by name/email
  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const usersMatched = await User.find({
      $or: [{ name: rx }, { email: rx }],
    })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (!usersMatched.length) {
      res.json({
        bookings: [],
        items: [],
        page,
        limit,
        total: 0,
        pages: 1,
      });
      return;
    }

    const userIdList = usersMatched.map((u) => {
      const s = toIdString(u._id);
      return new Types.ObjectId(s);
    });
    filter.userId = { $in: userIdList };
  }

  // query DB
  const [bookingsRaw, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean<AppointmentDoc[]>()
      .exec(),
    Appointment.countDocuments(filter).exec(),
  ]);

  // Build enrichment maps with safe id strings
  const userIdStrings = Array.from(
    new Set(bookingsRaw.map((b) => toIdString(b.userId))),
  ).filter(isValidObjectIdMaybeString);

  const barberIdStrings = Array.from(
    new Set(bookingsRaw.map((b) => toIdString(b.barberId))),
  ).filter(isValidObjectIdMaybeString);

  const [users, barbers] = await Promise.all([
    userIdStrings.length
      ? User.find({ _id: { $in: userIdStrings } })
        .select({ name: 1, email: 1 })
        .lean()
        .exec()
      : Promise.resolve(
          [] as { _id: Types.ObjectId; name?: string; email?: string }[],
      ),
    barberIdStrings.length
      ? Barber.find({ _id: { $in: barberIdStrings } })
        .select({ name: 1 })
        .lean()
        .exec()
      : Promise.resolve([] as { _id: Types.ObjectId; name?: string }[]),
  ]);

  const userMap = new Map<
    string,
    { id: string; name?: string; email?: string }
  >();
  users.forEach((u) => {
    const id = toIdString(u._id);
    userMap.set(id, { id, name: u.name, email: u.email });
  });

  const barberMap = new Map<string, { id: string; name?: string }>();
  barbers.forEach((b) => {
    const id = toIdString(b._id);
    barberMap.set(id, { id, name: b.name });
  });

  const bookings = bookingsRaw.map((b) => {
    const uid = toIdString(b.userId);
    const bid = toIdString(b.barberId);
    const user = userMap.get(uid) ?? { id: uid };
    const barber = barberMap.get(bid) ?? { id: bid };
    return { ...b, user, barber };
  });

  const pages = Math.max(1, Math.ceil(total / limit));
  res.json({ bookings, items: bookings, page, limit, total, pages });
}

/** POST /api/bookings/admin/:id/cancel (admin only) */
export async function adminCancelBooking(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const bookingId = req.params.id;
  if (!Types.ObjectId.isValid(bookingId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: new Types.ObjectId(bookingId), status: 'booked' },
    { $set: { status: 'cancelled' } },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res
      .status(404)
      .json({ error: 'Booking not found or not cancellable' });
  } else {
    res.json({ booking: updated });
  }
}

/** POST /api/bookings/admin/:id/complete (admin only) */
export async function adminCompleteBooking(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const bookingId = req.params.id;
  if (!Types.ObjectId.isValid(bookingId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: new Types.ObjectId(bookingId), status: 'booked' },
    { $set: { status: 'completed' } },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res
      .status(404)
      .json({ error: 'Booking not found or not completable' });
  } else {
    res.json({ booking: updated });
  }
}

/** PATCH /api/bookings/admin/:id (admin only) */
export async function adminUpdateBooking(
  req: AuthRequest<AdminUpdateBookingBody, { id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const _id = new Types.ObjectId(id);
  const curr = await Appointment.findById(_id).lean<AppointmentDoc | null>().exec();
  if (!curr) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  // Start with current values
  const next = {
    barberId: new Types.ObjectId(curr.barberId as unknown as string),
    serviceName: curr.serviceName,
    durationMin: curr.durationMin,
    startsAt: new Date(curr.startsAt),
    endsAt: new Date(curr.endsAt),
    status: curr.status,
    notes: curr.notes,
  };

  // Apply incoming changes
  if (req.body.barberId) {
    if (!Types.ObjectId.isValid(req.body.barberId)) {
      res.status(400).json({ error: 'Invalid barberId' });
      return;
    }
    next.barberId = new Types.ObjectId(req.body.barberId);
  }

  if (req.body.startsAt) {
    const s = new Date(req.body.startsAt);
    if (Number.isNaN(s.getTime())) {
      res.status(400).json({ error: 'Invalid startsAt (ISO expected)' });
      return;
    }
    next.startsAt = s;
  }

  if (typeof req.body.durationMin === 'number') {
    const d = req.body.durationMin;
    if (!Number.isFinite(d) || d < 5 || d > 480) {
      res.status(400).json({ error: 'Invalid durationMin (5..480)' });
      return;
    }
    next.durationMin = d;
  }

  if (typeof req.body.serviceName === 'string') {
    next.serviceName = req.body.serviceName;
  }

  // recompute endsAt if needed
  next.endsAt = new Date(next.startsAt.getTime() + next.durationMin * 60_000);

  // status transition rules
  if (req.body.status) {
    const target = req.body.status;
    if (curr.status === 'booked') {
      // can go to cancelled or completed (or stay booked)
      if (!['booked', 'cancelled', 'completed'].includes(target)) {
        res.status(400).json({ error: 'Invalid status transition' });
        return;
      }
    } else {
      // from cancelled/completed allow only to booked (if you want to revive),
      // or same state. Adjust as you prefer.
      if (!['booked', curr.status].includes(target)) {
        res.status(400).json({ error: 'Invalid status transition' });
        return;
      }
    }
    next.status = target;
  }

  if (typeof req.body.notes === 'string') {
    next.notes = req.body.notes;
  }

  // If time/barber/duration changed and target is 'booked', check overlap
  const timeOrBarberChanged =
    next.startsAt.getTime() !== new Date(curr.startsAt).getTime() ||
    next.endsAt.getTime() !== new Date(curr.endsAt).getTime() ||
    toIdString(next.barberId) !== toIdString(curr.barberId);

  if (next.status === 'booked' && timeOrBarberChanged) {
    const conflict = await hasOverlap({
      barberId: next.barberId,
      startsAt: next.startsAt,
      endsAt: next.endsAt,
      excludeId: _id, // exclude self when editing
    });
    if (conflict) {
      res.status(409).json({ error: 'Time slot not available' });
      return;
    }
  }

  // Persist
  const updated = await Appointment.findByIdAndUpdate(
    _id,
    {
      $set: {
        barberId: next.barberId,
        serviceName: next.serviceName,
        durationMin: next.durationMin,
        startsAt: next.startsAt,
        endsAt: next.endsAt,
        status: next.status,
        notes: next.notes,
      },
    },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res.status(404).json({ error: 'Booking not found after update' });
    return;
  }

  res.json({ booking: updated });
}
