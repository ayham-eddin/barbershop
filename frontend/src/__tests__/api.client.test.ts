import { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  computeBaseURL,
  attachAuthToken,
  normalizeAxiosError,
} from '../api/client';

describe('api/client helpers', () => {
  beforeEach(() => {
    // Clean localStorage between tests
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('computeBaseURL', () => {
    it('returns empty string when env is undefined or empty', () => {
      expect(computeBaseURL(undefined)).toBe('');
      expect(computeBaseURL('')).toBe('');
      expect(computeBaseURL('   ')).toBe('');
    });

    it('returns empty string for localhost URLs', () => {
      expect(computeBaseURL('http://localhost:3000')).toBe('');
      expect(computeBaseURL('https://127.0.0.1:4000')).toBe('');
    });

    it('trims trailing slashes for remote URLs', () => {
      expect(computeBaseURL('https://api.example.com/')).toBe(
        'https://api.example.com'
      );
      expect(computeBaseURL('  https://foo.bar////  ')).toBe(
        'https://foo.bar'
      );
    });
  });

  describe('attachAuthToken', () => {
    const makeConfig = (): InternalAxiosRequestConfig => {
      // minimal shape needed for our interceptor
      return {
        headers: {},
        method: 'get',
        url: '/',
      } as InternalAxiosRequestConfig;
    };

    it('does nothing when no token is in localStorage', () => {
      const config = makeConfig();
      const result = attachAuthToken(config);

      expect(result.headers).toBeDefined();
      const headers = result.headers as Record<string, unknown>;
      expect(headers.Authorization).toBeUndefined();
    });

    it('adds Authorization header when token exists', () => {
      window.localStorage.setItem('token', 'test-token-123');

      const config = makeConfig();
      const result = attachAuthToken(config);

      expect(result.headers).toBeDefined();
      const headers = result.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer test-token-123');
    });
  });

  describe('normalizeAxiosError', () => {
    const dummyConfig: InternalAxiosRequestConfig = {
      headers: {},
      method: 'get',
      url: '/',
    } as InternalAxiosRequestConfig;

    const makeAxiosError = (
      overrides: Partial<
        AxiosError<{ error?: string; message?: string }>
      > = {}
    ): AxiosError<{ error?: string; message?: string }> => {
      return {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Original message',
        config: dummyConfig,
        toJSON: () => ({}),
        ...overrides,
      } as AxiosError<{ error?: string; message?: string }>;
    };

    it('wraps network errors (no response) with a friendly message', async () => {
      const error = makeAxiosError({ response: undefined });

      await expect(normalizeAxiosError(error)).rejects.toThrow(
        'Server unavailable. Please try again later.'
      );
    });

    it('clears token and role and updates message on 401', async () => {
      window.localStorage.setItem('token', 'tok');
      window.localStorage.setItem('role', 'user');

      const error = makeAxiosError({
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: dummyConfig,
          data: { error: 'Not authorized' },
        },
      });

      await expect(normalizeAxiosError(error)).rejects.toMatchObject({
        message: 'Not authorized',
      });

      expect(window.localStorage.getItem('token')).toBeNull();
      expect(window.localStorage.getItem('role')).toBeNull();

      // Let the redirect timeout run (we don't assert on href, just ensure no crash)
      jest.runAllTimers();
    });

    it('uses response.message when present for non-401 errors', async () => {
      const error = makeAxiosError({
        response: {
          status: 500,
          statusText: 'Server error',
          headers: {},
          config: dummyConfig,
          data: { message: 'Something broke' },
        },
      });

      await expect(normalizeAxiosError(error)).rejects.toMatchObject({
        message: 'Something broke',
      });
    });

    it('falls back to existing error.message when no data error/message', async () => {
      const error = makeAxiosError({
        message: 'Low level failure',
        response: {
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: dummyConfig,
          data: {},
        },
      });

      await expect(normalizeAxiosError(error)).rejects.toMatchObject({
        message: 'Low level failure',
      });
    });
  });
});
