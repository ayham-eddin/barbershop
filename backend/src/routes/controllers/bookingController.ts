import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Appointment, type AppointmentDoc } from '@src/models/Appointment';
import { Barber } from '@src/models/Barber';
import { User } from '@src/models/User';
import { hasOverlap } from '@src/services/scheduling';
import { berlinNowWindow7dUtc } from '@src/common/time';
import { AuditLog } from '@src/models/AuditLog';

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

  // 1) Load user's bookings
  const bookingsRaw = await Appointment.find({ userId: uid })
    .sort({ startsAt: 1 })
    .lean<AppointmentDoc[]>()
    .exec();

  // 2) Collect barber ids as strings (safe)
  const barberIdStrings = Array.from(
    new Set(bookingsRaw.map((b) => toIdString(b.barberId))),
  ).filter(isValidObjectIdMaybeString);

  // 3) Query barbers and build a map of id -> { id, name }
  interface BarberLean {
    _id: unknown; // accept unknown from lean(); normalize with toIdString
    name?: string;
  }

  let barbers: BarberLean[] = [];
  if (barberIdStrings.length) {
    barbers = await Barber.find({ _id: { $in: barberIdStrings } })
      .select({ name: 1 })
      .lean<{ _id: unknown; name?: string }[]>()
      .exec();
  }

  const barberMap = new Map<string, { id: string; name?: string }>();
  barbers.forEach((b) => {
    const id = toIdString(b._id);
    barberMap.set(id, { id, name: b.name });
  });

  // 4) Enrich bookings with barber object
  const bookings = bookingsRaw.map((b) => {
    const bid = toIdString(b.barberId);
    const barber = barberMap.get(bid) ?? { id: bid };
    return { ...b, barber };
  });

  res.json({ bookings });
}

/** Internal: enforce weekly limit and blocking (new rules) */
async function assertUserCanBookOrReschedule(userObjId: Types.ObjectId) {
  const user = await User.findById(userObjId).lean().exec();
  if (!user) {
    return { ok: false, code: 401, msg: 'Unauthorized' } as const;
  }
  if (user.is_online_booking_blocked) {
    return {
      ok: false as const,
      code: 403,
      msg:
        'Your online booking is restricted due to repeated no-shows.' + 
        'Please contact the barbershop at +49 000 0000000 or visit in person.',
    };
  }

  // Rolling 7-day window from "now" in Europe/Berlin
  const { startUtc, endUtc } = berlinNowWindow7dUtc();

  const active = await Appointment.exists({
    userId: userObjId,
    status: { $in: ['booked', 'rescheduled'] },
    startsAt: { $gte: startUtc, $lt: endUtc },
  }).exec();

  if (active) {
    return {
      ok: false as const,
      code: 409,
      msg:
        'You can only have one active booking within 7 days.' + 
        'Please reschedule your existing booking.',
    };
  }
  return { ok: true as const };
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

  const userObjId = new Types.ObjectId(userId);

  // weekly limit + blocking (Berlin window)
  const gate = await assertUserCanBookOrReschedule(userObjId);
  if (!gate.ok) {
    res.status(gate.code).json({ error: gate.msg });
    return;
  }

  const ends = new Date(starts.getTime() + dur * 60_000);
  const barberObjId = new Types.ObjectId(barberId);

  // Reuse overlap helper
  if (await hasOverlap({ barberId: barberObjId, startsAt: starts, endsAt: ends })) {
    res.status(409).json({ error: 'Time slot not available' });
    return;
  }

  const now = new Date();

  const appt = await Appointment.create({
    userId: userObjId,
    barberId: barberObjId,
    serviceName,
    durationMin: dur,
    startsAt: starts,
    endsAt: ends,
    notes,
    status: 'booked',
    original_created_at: now,
    last_modified_at: now,
  });

  await AuditLog.create({
    actorId: userObjId,
    action: 'booking.create',
    entityType: 'booking',
    entityId: appt._id,
    after: { bookingId: appt._id, startsAt: appt.startsAt, endsAt: appt.endsAt },
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
      status: { $in: ['booked', 'rescheduled'] },
    },
    { $set: { status: 'cancelled', last_modified_at: new Date() } },
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
 * Pagination + filters: status, barberId, dateFrom, dateTo, q
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
  if (status && ['booked', 'cancelled', 'completed', 'no_show', 'rescheduled'].includes(status)) {
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
        .lean<{ _id: Types.ObjectId; name?: string; email?: string }[]>()
        .exec()
      : Promise.resolve(
          [] as { _id: Types.ObjectId; name?: string; email?: string }[],
      ),
    barberIdStrings.length
      ? Barber.find({ _id: { $in: barberIdStrings } })
        .select({ name: 1 })
        .lean<{ _id: Types.ObjectId; name?: string }[]>()
        .exec()
      : Promise.resolve([] as { _id: Types.ObjectId; name?: string }[]),
  ]);

  const userMap = new Map<string, { id: string; name?: string; email?: string }>();
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
    { _id: new Types.ObjectId(bookingId), status: { $in: ['booked', 'rescheduled'] } },
    { $set: { status: 'cancelled', last_modified_at: new Date() } },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res.status(404).json({ error: 'Booking not found or not cancellable' });
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
    { _id: new Types.ObjectId(bookingId), status: { $in: ['booked', 'rescheduled'] } },
    { $set: { status: 'completed', last_modified_at: new Date() } },
    { new: true },
  )
    .lean<AppointmentDoc | null>()
    .exec();

  if (!updated) {
    res.status(404).json({ error: 'Booking not found or not completable' });
  } else {
    res.json({ booking: updated });
  }
}

/** PATCH /api/bookings/admin/:id (admin only) */
export async function adminUpdateBooking(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const _id = new Types.ObjectId(id);
  const existing = await Appointment.findById(_id).lean<AppointmentDoc | null>().exec();
  if (!existing) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  if (existing.status !== 'booked') {
    res.status(409).json({ error: 'Only booked appointments can be edited' });
    return;
  }

  // Build updates
  const patch = req.body as Partial<{
    startsAt: string;
    durationMin: number;
    barberId: string;
    serviceName: string;
    notes: string;
  }>;

  const updates: Record<string, unknown> = {};
  let startsAt = new Date(existing.startsAt);
  let durationMin = existing.durationMin;
  let barberId = new Types.ObjectId(existing.barberId as unknown as string);

  if (typeof patch.startsAt === 'string') {
    const s = new Date(patch.startsAt);
    if (Number.isNaN(s.getTime())) {
      res.status(400).json({ error: 'Invalid startsAt (ISO expected)' });
      return;
    }
    startsAt = s;
  }

  if (typeof patch.durationMin === 'number') {
    if (!Number.isFinite(patch.durationMin) || patch.durationMin <= 0 || patch.durationMin > 480) {
      res.status(400).json({ error: 'Invalid durationMin (1..480)' });
      return;
    }
    durationMin = patch.durationMin;
  }

  if (typeof patch.barberId === 'string') {
    if (!Types.ObjectId.isValid(patch.barberId)) {
      res.status(400).json({ error: 'Invalid barberId' });
      return;
    }
    barberId = new Types.ObjectId(patch.barberId);
    updates.barberId = barberId;
  }

  if (typeof patch.serviceName === 'string') {
    updates.serviceName = patch.serviceName;
  }
  if (typeof patch.notes === 'string') {
    updates.notes = patch.notes;
  }

  // derived endsAt
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
  updates.startsAt = startsAt;
  updates.endsAt = endsAt;
  updates.durationMin = durationMin;

  // Overlap check excluding current booking
  const overlap = await hasOverlap({
    barberId,
    startsAt,
    endsAt,
    excludeId: _id,
  });
  if (overlap) {
    res.status(409).json({ error: 'Time slot not available' });
    return;
  }

  const updated = await Appointment.findByIdAndUpdate(
    _id,
    { $set: { ...updates, last_modified_at: new Date() } },
    { new: true },
  ).lean<AppointmentDoc | null>().exec();

  if (!updated) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  res.json({ booking: updated });
}

/** PATCH /api/bookings/:id  (auth required) – reschedule self booking */
export async function rescheduleMyBooking(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const patch = req.body as Partial<{
    startsAt: string;
    durationMin: number;
  }>;
  if (typeof patch.startsAt !== 'string' && typeof patch.durationMin !== 'number') {
    res.status(400).json({ error: 'startsAt or durationMin required' });
    return;
  }

  const _id = new Types.ObjectId(id);
  const userObjId = new Types.ObjectId(userId);
  const existing = await Appointment.findOne({ _id, userId: userObjId }).exec();

  if (!existing) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  if (existing.status !== 'booked' && existing.status !== 'rescheduled') {
    res.status(409).json({ error: 'Only active bookings can be rescheduled' });
    return;
  }

  // block check first
  const blockedUser = await User.findById(userObjId).lean().exec();
  if (!blockedUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (blockedUser.is_online_booking_blocked) {
    res.status(403).json({
      error:
        'Your online booking is restricted due to repeated no-shows.' +
        'Please contact the barbershop at +49 000 0000000 or visit in person.',
    });
    return;
  }

  // validate inputs
  const startsAt = typeof patch.startsAt === 'string'
    ? new Date(patch.startsAt)
    : new Date(existing.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    res.status(400).json({ error: 'Invalid startsAt (ISO expected)' });
    return;
  }
  const durationMin =
    typeof patch.durationMin === 'number' ? patch.durationMin : existing.durationMin;
  if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 480) {
    res.status(400).json({ error: 'Invalid durationMin (1..480)' });
    return;
  }
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  const overlap = await hasOverlap({
    barberId: existing.barberId,
    startsAt,
    endsAt,
    excludeId: existing._id,
  });
  if (overlap) {
    res.status(409).json({ error: 'Time slot not available' });
    return;
  }

  const before = {
    startsAt: existing.startsAt,
    endsAt: existing.endsAt,
    status: existing.status,
    last_modified_at: existing.last_modified_at,
  };

  existing.startsAt = startsAt;
  existing.endsAt = endsAt;
  existing.last_modified_at = new Date();
  existing.status = 'rescheduled';
  await existing.save();

  await AuditLog.create({
    actorId: userObjId,
    action: 'booking.reschedule',
    entityType: 'booking',
    entityId: existing._id,
    before,
    after: {
      startsAt: existing.startsAt,
      endsAt: existing.endsAt,
      status: existing.status,
      last_modified_at: existing.last_modified_at,
    },
  });

  res.json({ booking: existing });
}

/** POST /api/bookings/admin/:id/no-show  (admin only) */
export async function adminMarkNoShow(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const booking = await Appointment.findById(new Types.ObjectId(id)).exec();
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    res.status(409).json({ error: 'Only active bookings can be marked no-show' });
    return;
  }

  const before = { status: booking.status };
  booking.status = 'no_show';
  booking.last_modified_at = new Date();
  await booking.save();

  // increment warning; block at 2
  const user = await User.findById(booking.userId).exec();
  if (user) {
    user.warning_count = (user.warning_count ?? 0) + 1;
    user.last_warning_at = new Date();
    if (user.warning_count >= 2) {
      user.is_online_booking_blocked = true;
      user.block_reason = 'Two no-shows';
    }
    await user.save();

    await AuditLog.create({
      actorId: new Types.ObjectId(req.user!.sub),
      action: 'booking.no_show',
      entityType: 'booking',
      entityId: booking._id,
      before,
      after: { status: 'no_show', warning_count: user.warning_count },
    });
  }

  res.json({ booking });
}
