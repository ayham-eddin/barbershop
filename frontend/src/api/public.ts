import api from './client';

export type Service = { _id: string; name: string; durationMin: number; price: number };
export type Barber  = {
  _id: string;
  name: string;
  services?: Service[] | string[]; // seed may embed service objects or just ids
  workingHours?: Array<{ day: number; start: string; end: string }>;
};

// -------- Public endpoints --------
export const getServices = async (): Promise<Service[]>  => {
   const { data } = await api.get<{ services: Service[] }>('/api/services');
  return data.services; 
}

export const getBarbers = async (): Promise<Barber[]>  => {
   const { data } = await api.get<{ barbers: Barber[] }>('/api/barbers');
  return data.barbers; 
}

// -------- Admin endpoints --------
export const adminGetServices = async (): Promise<Service[]> => {
   const { data } = await api.get<{ services: Service[] }>('/api/admin/services');
  return data.services; 
}

export const adminCreateService = async (
  payload: {
  name: string;
  durationMin: number;
  price: number;
}) => {
   const { data } = await api.post<{ service: Service }>('/api/admin/services', payload);
  return data.service; 
}

export const adminUpdateService = async (id: string, payload: Partial<Service>) => {
   const { data } = await api.patch<{ service: Service }>(`/api/admin/services/${id}`, payload);
  return data.service; 
}

export const adminDeleteService = async (id: string) => {
  await api.delete(`/api/admin/services/${id}`); 
}
