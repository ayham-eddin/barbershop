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

export const listTimeOff = async (params: { barberId?: string } = {}) => {
   const { data } = await api.get<{ timeoff: TimeOff[] }>('/api/admin/timeoff', {
    params: params.barberId ? { barberId: params.barberId } : undefined,
  });
  return data.timeoff; 
}

export const createTimeOff = async (
  payload: {
    barberId: string;
    start: string; // ISO
    end: string;   // ISO
    reason?: string;
}) => {
   const { data } = await api.post<{ timeoff: TimeOff }>('/api/admin/timeoff', payload);
  return data.timeoff; 
}

export const deleteTimeOff = async (id: string) => {
   const { data } = await api.delete<{ deleted: TimeOff }>(`/api/admin/timeoff/${id}`);
  return data.deleted; 
}
