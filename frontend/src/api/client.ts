import axios, { AxiosError } from 'axios';

const envBase = import.meta.env.VITE_API_URL as string | undefined;

const isRemoteBase =
  envBase &&
  !/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(envBase);

const baseURL = isRemoteBase ? envBase.trim().replace(/\/+$/, '') : '';

const api = axios.create({
  baseURL,
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
