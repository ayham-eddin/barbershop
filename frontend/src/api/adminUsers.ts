import api from './client';

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  warning_count?: number;
  last_warning_at?: string | null;
  is_online_booking_blocked?: boolean;
  block_reason?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const getAdminUser = async (id: string) => {
  const { data } = await api.get<{ user: AdminUser }>(`/api/admin/users/${id}`);
  return data.user;
}

export type UpdateAdminUserPayload = Partial<{
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone: string;
  address: string;
  avatarUrl: string;
  is_online_booking_blocked: boolean;
  block_reason: string;
}>;

/** Drop undefined AND null; also drop empty strings so backend only gets real values */
const prune = <T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }

  return out;
};

export const updateAdminUser = async (id: string, patch: UpdateAdminUserPayload) => {
  const wire = prune(patch);
  const { data } = await api.patch<{ user: AdminUser }>(`/api/admin/users/${id}`, wire);
  return data.user;
}

