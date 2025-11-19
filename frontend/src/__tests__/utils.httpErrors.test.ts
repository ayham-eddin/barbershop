import { extractErrorMessage } from '../utils/httpErrors';
import type { AxiosError } from 'axios';

describe('utils/httpErrors', () => {
  it('returns string directly if error is string', () => {
    expect(extractErrorMessage('Boom', 'fallback')).toBe('Boom');
  });

  it('uses response.data.error when available', () => {
    const err = {
      response: { data: { error: 'Specific error' } },
      message: 'Original',
    } as AxiosError<{ error?: string; message?: string }>;

    expect(extractErrorMessage(err, 'fallback')).toBe('Specific error');
  });

  it('falls back to response.data.message, then err.message, then fallback', () => {
    const errWithMessage = {
      response: { data: { message: 'From message' } },
      message: 'ignored',
    } as AxiosError<{ error?: string; message?: string }>;

    expect(extractErrorMessage(errWithMessage, 'fallback')).toBe('From message');

    const errOnlyMessage = {
      response: { data: {} },
      message: 'From error.message',
    } as AxiosError<{ error?: string; message?: string }>;

    expect(extractErrorMessage(errOnlyMessage, 'fallback')).toBe(
      'From error.message',
    );

    expect(extractErrorMessage(123, 'fallback')).toBe('fallback');
  });
});
