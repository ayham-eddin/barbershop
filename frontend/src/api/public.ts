// src/api/public.ts
import api from './client';

export type Service = { _id: string; name: string; durationMin: number; price: number };
export type Barber  = {
  _id: string;
  name: string;
  services?: Service[] | string[]; // seed may embed service objects or just ids
  workingHours?: Array<{ day: number; start: string; end: string }>;
};

export async function getServices(): Promise<Service[]> {
  const { data } = await api.get<{ services: Service[] }>('/api/services');
  return data.services;
}

export async function getBarbers(): Promise<Barber[]> {
  const { data } = await api.get<{ barbers: Barber[] }>('/api/barbers');
  return data.barbers;
}
