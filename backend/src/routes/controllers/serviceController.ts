import { Response } from 'express';
import type { AuthRequest } from '@src/middleware/requireAuth';
import { Service, type ServiceDoc } from '@src/models/Service';

export async function listServices(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  const services = await Service.find().sort({ name: 1 })
    .lean<ServiceDoc[]>().exec();
  res.json({ services });
}
