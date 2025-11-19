// src/api/client.ts
import axios, { AxiosError } from 'axios';


const readViteEnvBase = (): string | undefined => {
  try {
    const meta = (0, eval)('import.meta') as {
      env?: { VITE_API_URL?: string };
    };
    return meta?.env?.VITE_API_URL;
  } catch {
    return undefined;
  }
};

/**
 * Fallback for non-Vite environments (tests, Node scripts).
 */
const readNodeEnvBase = (): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.VITE_API_URL || process.env.API_URL;
    }
  } catch {
    // ignore
  }
  return undefined;
};

const envBase = readViteEnvBase() ?? readNodeEnvBase();

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
    // No response at all -> network / server offline
    if (!err.response) {
      return Promise.reject(
        new Error('Server unavailable. Please try again later.'),
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

    // 👇 IMPORTANT: keep the AxiosError object (with response + data),
    // just make sure `.message` is something nice.
    const msg =
      err.response.data?.error ||
      err.response.data?.message ||
      err.message ||
      'Request failed';

    err.message = msg;

    // Re-throw the original AxiosError so callers can read `err.response.data`
    return Promise.reject(err);
  },
);

export default api;
