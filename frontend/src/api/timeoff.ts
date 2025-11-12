// frontend/src/api/timeoff.ts
import api from './client';

export type TimeOff = {
  _id: string;
  barberId: string;
  start: string;   // ISO
  end: string;     // ISO
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function listTimeOff(params: { barberId?: string } = {}) {
  const { data } = await api.get<{ timeoff: TimeOff[] }>('/api/admin/timeoff', {
    params: params.barberId ? { barberId: params.barberId } : undefined,
  });
  return data.timeoff;
}

export async function createTimeOff(payload: {
  barberId: string;
  start: string; // ISO
  end: string;   // ISO
  reason?: string;
}) {
  const { data } = await api.post<{ timeoff: TimeOff }>('/api/admin/timeoff', payload);
  return data.timeoff;
}

export async function deleteTimeOff(id: string) {
  const { data } = await api.delete<{ deleted: TimeOff }>(`/api/admin/timeoff/${id}`);
  return data.deleted;
}
