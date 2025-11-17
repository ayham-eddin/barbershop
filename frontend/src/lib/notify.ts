import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

type ApiErrorData = { error?: string; message?: string };

export const messageFromError = (err: unknown): string => {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;

  // Axios-style error payloads
  const ax = err as AxiosError<ApiErrorData>;
  const payloadMsg = ax.response?.data?.error || ax.response?.data?.message;
  if (payloadMsg) return payloadMsg;
  if (ax.message) return ax.message;

  return 'Request failed';
}

export const notify = {
  success(msg: string) {
    toast.success(msg);
  },
  error(msg: string) {
    toast.error(msg);
  },
  apiError(err: unknown, fallback = 'Something went wrong') {
    toast.error(messageFromError(err) || fallback);
  },
};
