import { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Service, type ServiceDoc } from '@src/models/Service';
import type {
  CreateServiceBody,
  UpdateServiceBody,
} from '@src/routes/validators/serviceSchemas';

/** -------------------------------
 *  Public: GET /api/services
 *  (Used by clients / booking UI)
 * --------------------------------*/
export async function listServices(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  const services = await Service.find().sort({ name: 1 })
    .lean<ServiceDoc[]>().exec();
  res.json({ services });
}

/** -------------------------------
 *  Admin: GET /api/admin/services
 * --------------------------------*/
export async function adminListServices(
  _req: Request,
  res: Response,
): Promise<void> {
  const services = await Service.find().sort({ name: 1 })
    .lean<ServiceDoc[]>().exec();
  res.json({ services });
}

/** -------------------------------
 *  Admin: POST /api/admin/services
 * --------------------------------*/
export async function adminCreateService(
  req: Request<unknown, unknown, CreateServiceBody>,
  res: Response,
): Promise<void> {
  const { name, durationMin, price } = req.body;
  const created = await Service.create({ name, durationMin, price });
  res.status(201).json({ service: created });
}

/** -------------------------------
 *  Admin: PATCH /api/admin/services/:id
 * --------------------------------*/
export async function adminUpdateService(
  req: Request<{ id: string }, unknown, UpdateServiceBody>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const update: Partial<UpdateServiceBody> = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.durationMin !== undefined) {
    update.durationMin = req.body.durationMin;
  }
  if (req.body.price !== undefined) update.price = req.body.price;

  const updated = await Service.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: update },
    { new: true },
  ).lean<ServiceDoc | null>().exec();

  if (!updated) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  res.json({ service: updated });
}

/** -------------------------------
 *  Admin: DELETE /api/admin/services/:id
 * --------------------------------*/
export async function adminDeleteService(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const deleted = await Service.findByIdAndDelete(
    new Types.ObjectId(id),
  ).lean<ServiceDoc | null>().exec();

  if (!deleted) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  res.status(204).send();
}
