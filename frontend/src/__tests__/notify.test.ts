import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { messageFromError, notify } from '../lib/notify';

jest.mock('react-hot-toast', () => {
  const success = jest.fn();
  const error = jest.fn();

  return {
    __esModule: true,
    default: {
      success,
      error,
    },
  };
});

const mockedToast = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

type ApiErrorData = { error?: string; message?: string };

describe('messageFromError', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the string when error is a plain string', () => {
    const msg = messageFromError('oops');
    expect(msg).toBe('oops');
  });

  it('returns the message when error is an Error instance', () => {
    const err = new Error('boom');
    const msg = messageFromError(err);
    expect(msg).toBe('boom');
  });

  it('prefers Axios response.data.error', () => {
    const axiosErr = {
      response: {
        data: { error: 'Bad request' },
      },
      message: 'Something else',
    } as AxiosError<ApiErrorData>;

    const msg = messageFromError(axiosErr);
    expect(msg).toBe('Bad request');
  });

  it('falls back to Axios response.data.message', () => {
    const axiosErr = {
      response: {
        data: { message: 'Backend message' },
      },
      message: 'Something else',
    } as AxiosError<ApiErrorData>;

    const msg = messageFromError(axiosErr);
    expect(msg).toBe('Backend message');
  });

  it('falls back to AxiosError.message when no response payload', () => {
    const axiosErr = {
      message: 'Network error',
    } as AxiosError<ApiErrorData>;

    const msg = messageFromError(axiosErr);
    expect(msg).toBe('Network error');
  });

  it('returns generic "Request failed" when nothing else is available', () => {
    const msg = messageFromError({});
    expect(msg).toBe('Request failed');
  });
});

describe('notify helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('notify.success delegates to toast.success', () => {
    notify.success('All good');
    expect(mockedToast.success).toHaveBeenCalledTimes(1);
    expect(mockedToast.success).toHaveBeenCalledWith('All good');
  });

  it('notify.error delegates to toast.error', () => {
    notify.error('Something went wrong');
    expect(mockedToast.error).toHaveBeenCalledTimes(1);
    expect(mockedToast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('notify.apiError uses messageFromError result', () => {
    const axiosErr = {
      response: {
        data: { error: 'Invalid data' },
      },
    } as AxiosError<ApiErrorData>;

    notify.apiError(axiosErr, 'Fallback');

    expect(mockedToast.error).toHaveBeenCalledTimes(1);
    expect(mockedToast.error).toHaveBeenCalledWith('Invalid data');
  });

  it('notify.apiError still shows something when error has no details', () => {
    notify.apiError({}, 'Fallback message');

    expect(mockedToast.error).toHaveBeenCalledTimes(1);
    const arg = mockedToast.error.mock.calls[0][0] as string;
    // Either the generic "Request failed" or the fallback – but never empty
    expect(arg.length).toBeGreaterThan(0);
  });
});
