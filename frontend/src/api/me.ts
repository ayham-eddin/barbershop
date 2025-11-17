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
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
};

export const getMe = async () => {
  const { data } = await api.get<{ user: MeUser }>('/api/auth/me');
  return data.user;
}

/** Allow nulls from UI state (e.g. coming from MeUser), we’ll prune them before sending */
export type UpdateMePayload = Partial<{
  name: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}>;

/** Remove keys with null/undefined so backend only receives provided fields */
export const pruneNulls = <T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) {
      out[k] = v;
    }
  }
  return out;
};


export const updateMe = async (payload: UpdateMePayload) => {
  const wire = pruneNulls(payload);
  const { data } = await api.patch<{ user: MeUser }>('/api/auth/me', wire);
  return data.user;
}

