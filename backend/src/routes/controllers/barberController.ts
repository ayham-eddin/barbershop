import { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Barber, type BarberDoc } from '@src/models/Barber';
import { getAvailableSlots } from '@src/services/scheduling';

export async function listBarbers(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  const barbers = await Barber.find()
    .populate('services')
    .lean<BarberDoc[]>().exec();
  res.json({ barbers });
}

export async function getBarber(
  req: AuthRequest<unknown, { id: string }>,
  res: Response,
): Promise<void> {
  const id = req.params.id;
  const barber = await Barber.findById(new Types.ObjectId(id))
    .populate('services')
    .lean<BarberDoc | null>().exec();

  if (!barber) {
    res.status(404).json({ error: 'Barber not found' });
    return;
  }
  res.json({ barber });
}

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

  const slots = await getAvailableSlots(id, date, duration, 15);
  res.json({ slots });
}
