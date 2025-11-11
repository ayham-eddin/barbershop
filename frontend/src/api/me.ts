import api from './client';

export type MeUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  warning_count: number;
  last_warning_at: string | null;
  is_online_booking_blocked: boolean;
  block_reason: string | null;
};

export async function getMe() {
  const { data } = await api.get<{ user: MeUser }>('/api/auth/me');
  return data.user;
}
