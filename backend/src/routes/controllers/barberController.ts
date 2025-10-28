import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Barber } from '@src/models/Barber';
import {
  createBarberSchema,
  updateBarberSchema,
  type CreateBarberBody,
  type UpdateBarberBody,
} from '../validators/barberSchemas';

export async function listBarbers(_req: Request, res: Response) {
  const list = await Barber.find({ active: true }).lean().exec();
  return res.json({ barbers: list });
}

export async function createBarber(
  req: Request<unknown, unknown, CreateBarberBody>,
  res: Response,
) {
  const body = createBarberSchema.parse(req.body);
  const doc = await Barber.create(body);
  return res.status(201).json({ barber: doc });
}

export async function updateBarber(
  req: Request<{ id: string }, unknown, UpdateBarberBody>,
  res: Response,
) {
  const id = new Types.ObjectId(req.params.id);
  const patch = updateBarberSchema.parse(req.body);
  const doc = await Barber.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true },
  ).exec();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json({ barber: doc });
}

export async function deleteBarber(
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = new Types.ObjectId(req.params.id);
  const r = await Barber.findByIdAndDelete(id).exec();
  if (!r) return res.status(404).json({ error: 'Not found' });
  return res.status(204).send();
}
