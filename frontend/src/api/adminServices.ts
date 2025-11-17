import api from './client';

export type Service = {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
};

export type AdminListResponse = { services: Service[] };

export const adminListServices = async (): Promise<AdminListResponse>  => {
  const res = await api.get('/api/admin/services');
  return res.data as AdminListResponse;
}

export const adminCreateService = async ( payload: {
  name: string;
  durationMin: number;
  price: number;
}): Promise<{ service: Service }> => {
  const res = await api.post('/api/admin/services', payload);
  return res.data as { service: Service };
}

export const adminUpdateService = async (
  id: string,
  patch: Partial<Pick<Service, 'name' | 'durationMin' | 'price'>>
): Promise<{ service: Service }>  => {
  const res = await api.patch(`/api/admin/services/${id}`, patch);
  return res.data as { service: Service };
}

export const adminDeleteService = async (id: string): Promise<{ deleted: Service }>  => {
  const res = await api.delete(`/api/admin/services/${id}`);
  return res.data as { deleted: Service }; 
}
