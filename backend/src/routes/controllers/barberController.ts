import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Barber, type BarberDoc } from '@src/models/Barber';
import { getAvailableSlots } from '@src/services/scheduling';

/**
 * List all active barbers (public)
 */
export async function listBarbers(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  const barbers = await Barber.find({ active: true })
    .populate('services')
    .lean<BarberDoc[]>()
    .exec();

  res.json({ barbers });
}

/**
 * Get a single active barber by ID
 */
export async function getBarber(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  const barber = await Barber.findOne({
    _id: new Types.ObjectId(id),
    active: true,
  })
    .populate('services')
    .lean<BarberDoc | null>()
    .exec();

  if (!barber) {
    res.status(404).json({ error: 'Barber not found' });
    return;
  }

  res.json({ barber });
}

/**
 * Get available slots for an active barber on a given date
 */
export async function getBarberSlots(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const id = req.params.id;
  const date = typeof req.query.date === 'string' ? req.query.date : '';
  const duration = Number(req.query.duration ?? 30);

  if (!date) {
    res.status(400).json({ error: 'Missing query param: date=YYYY-MM-DD' });
    return;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    res.status(400).json({ error: 'Invalid duration' });
    return;
  }

  // Check barber existence and active status
  const existsActive = await Barber.exists({
    _id: new Types.ObjectId(id),
    active: true,
  }).lean();

  if (!existsActive) {
    res.status(404).json({ error: 'Barber not found' });
    return;
  }

  const slots = await getAvailableSlots(id, date, duration, 15);
  res.json({ slots });
}
