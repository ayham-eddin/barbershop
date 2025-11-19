// src/api/client.ts
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

type EnvLike = { VITE_API_URL?: string };

const readEnvBase = (): string | undefined => {
  try {
    if (typeof process !== 'undefined') {
      const env = (process as { env?: EnvLike }).env;
      const value = env?.VITE_API_URL;
      if (typeof value === 'string') {
        return value;
      }
    }
  } catch {
    // ignore in browser / non-Node envs
  }
  return undefined;
};

export const computeBaseURL = (
  rawEnv: string | undefined = readEnvBase(),
): string => {
  if (!rawEnv) return '';

  const trimmed = rawEnv.trim();
  if (!trimmed) return '';

  const localhostRegex = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i;
  if (localhostRegex.test(trimmed)) {
    // For local development we let the browser hit the same origin
    return '';
  }

  return trimmed.replace(/\/+$/, '');
};

const baseURL = computeBaseURL();

/**
 * Request interceptor: attach Authorization header when token exists.
 */
export const attachAuthToken = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const cfg = config;

  try {
    const token =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('token')
        : null;

    if (token) {
      // Ensure headers object exists
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore localStorage issues
  }

  return cfg;
};

export const normalizeAxiosError = (
  err: AxiosError<{ error?: string; message?: string }>,
): Promise<never> => {
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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('role');
      }
    } catch {
      // ignore localStorage issues
    }

    if (
      typeof window !== 'undefined' &&
      window.location &&
      !window.location.pathname.includes('/login')
    ) {
      try {
        setTimeout(() => {
          try {
            window.location.href = '/login';
          } catch {
            // ignore navigation errors (tests, non-browser envs)
          }
        }, 200);
      } catch {
        // ignore setTimeout/window issues in weird envs
      }
    }
  }

  const msg =
    err.response.data?.error ||
    err.response.data?.message ||
    err.message ||
    'Request failed';

  err.message = typeof msg === 'string' ? msg : 'Request failed';

  // Re-throw the original AxiosError so callers can read `err.response.data`
  return Promise.reject(err);
};

// -----------------------------------------------------------------------------
// Axios instance configured with the helpers above
// -----------------------------------------------------------------------------

const api = axios.create({
  baseURL,
  withCredentials: false,
});

// ✅ Attach token from localStorage on every request
api.interceptors.request.use(attachAuthToken);

// ✅ Normalize errors & auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) =>
    normalizeAxiosError(
      err as AxiosError<{ error?: string; message?: string }>,
    ),
);

export default api;
