// src/api/client.ts
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

type EnvLike = { VITE_API_URL?: string };

// -----------------------------------------------------------------------------
// Updated environment reader (supports Vite + Node)
// -----------------------------------------------------------------------------
const readEnvBase = (): string | undefined => {
  // 1) Prefer Vite env (browser / Vite build)
  try {
    const viteEnv = (import.meta as unknown as { env?: EnvLike }).env;
    const viteValue = viteEnv?.VITE_API_URL;
    if (typeof viteValue === 'string') {
      return viteValue;
    }
  } catch {
    // ignore if import.meta is not available (tests, node, SSR)
  }

  // 2) Fallback: Node/process env (tests, tooling)
  try {
    if (typeof process !== 'undefined') {
      const env = (process as { env?: EnvLike }).env;
      const value = env?.VITE_API_URL;
      if (typeof value === 'string') {
        return value;
      }
    }
  } catch {
    // ignore process env issues
  }

  return undefined;
};

// -----------------------------------------------------------------------------
// Base URL logic
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Auth token handling
// -----------------------------------------------------------------------------
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
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore localStorage issues
  }

  return cfg;
};

// -----------------------------------------------------------------------------
// Error normalization
// -----------------------------------------------------------------------------
export const normalizeAxiosError = (
  err: AxiosError<{ error?: string; message?: string }>,
): Promise<never> => {
  if (!err.response) {
    return Promise.reject(
      new Error('Server unavailable. Please try again later.'),
    );
  }

  const status = err.response.status;

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
        // ignore setTimeout/window issues
      }
    }
  }

  const msg =
    err.response.data?.error ||
    err.response.data?.message ||
    err.message ||
    'Request failed';

  err.message = typeof msg === 'string' ? msg : 'Request failed';

  return Promise.reject(err);
};

// -----------------------------------------------------------------------------
// Axios instance
// -----------------------------------------------------------------------------
const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use(attachAuthToken);
api.interceptors.response.use(
  (res) => res,
  (err) =>
    normalizeAxiosError(
      err as AxiosError<{ error?: string; message?: string }>,
    ),
);

export default api;
