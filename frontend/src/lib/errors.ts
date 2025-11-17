import type { AxiosError } from 'axios';

/** Build a human-friendly message from unknown/axios errors */
export const errorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;

  if (err && typeof err === 'object') {
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    const server =
      ax.response?.data?.error ||
      ax.response?.data?.message;

    if (server && typeof server === 'string') return server;
    if (ax.message) return ax.message;
  }

  return 'Request failed';
}
