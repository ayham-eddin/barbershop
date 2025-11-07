// src/api/client.ts
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: false,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors from one place
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string }>) => {
    // No response => server unreachable / CORS / network down
    if (!err.response) {
      return Promise.reject(new Error('Server unavailable. Please try again later.'));
    }
    // Prefer backend {error} or {message}
    const msg =
      err.response.data?.error ||
      err.response.data?.message ||
      err.message ||
      'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export default api;
