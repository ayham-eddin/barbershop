// src/api/adminServices.ts
import api from './client';

export type Service = {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
};

export type AdminListResponse = { services: Service[] };

export async function adminListServices(): Promise<AdminListResponse> {
  const res = await api.get('/api/admin/services');
  return res.data as AdminListResponse;
}

export async function adminCreateService(payload: {
  name: string;
  durationMin: number;
  price: number;
}): Promise<{ service: Service }> {
  const res = await api.post('/api/admin/services', payload);
  return res.data as { service: Service };
}

export async function adminUpdateService(
  id: string,
  patch: Partial<Pick<Service, 'name' | 'durationMin' | 'price'>>
): Promise<{ service: Service }> {
  const res = await api.patch(`/api/admin/services/${id}`, patch);
  return res.data as { service: Service };
}

export async function adminDeleteService(id: string): Promise<{ deleted: Service }> {
  const res = await api.delete(`/api/admin/services/${id}`);
  return res.data as { deleted: Service };
}
