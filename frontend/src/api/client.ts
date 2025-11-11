// frontend/src/api/client.ts
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: false,
});

// ✅ Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore localStorage issues
  }
  return config;
});

// ✅ Normalize errors & auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string }>) => {
    if (!err.response) {
      return Promise.reject(
        new Error('Server unavailable. Please try again later.')
      );
    }

    const status = err.response.status;

    // Handle unauthorized requests globally
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      } catch {
        // ignore
      }

      // Redirect to login page if not already there
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 200);
      }
    }

    const msg =
      err.response.data?.error ||
      err.response.data?.message ||
      err.message ||
      'Request failed';

    return Promise.reject(new Error(msg));
  }
);

export default api;
