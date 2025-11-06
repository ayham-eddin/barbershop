// src/api/client.ts
import axios, { type AxiosError } from 'axios';

type ApiErrorData = { error?: string; message?: string };

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: false, // switch to true if you later move to HttpOnly cookies
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Light error normalizer (no auto-toasting)
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorData>) => {
    const msg = error.response?.data?.error || error.response?.data?.message;
    if (msg) {
      // mutate the error message so callers get a clean one
      // (safe, keeps typings; no `any`)
      Object.assign(error, { message: msg });
    }
    return Promise.reject(error);
  },
);

export default api;
