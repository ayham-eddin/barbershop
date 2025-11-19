import apiClient from '../api/client';
import {
  getAvailability,
  createBooking,
  getMyBookings,
  cancelBooking,
  rescheduleMyBooking,
  adminCancelBooking,
  adminCompleteBooking,
  adminMarkNoShow,
  adminUnblockUser,
  adminBlockUser,
  adminClearWarning,
  isBlockedError,
  isWeeklyLimitError,
} from '../api/bookings';
import type { AxiosError } from 'axios';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
};

describe('api/bookings basic CRUD', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.patch.mockReset();
  });

  it('getAvailability calls correct endpoint and returns slots', async () => {
    const slots = [{ start: 's', end: 'e' }];
    mockClient.get.mockResolvedValue({ data: { slots } });

    const result = await getAvailability({
      barberId: 'b1',
      date: '2025-01-01',
      durationMin: 30,
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      '/api/bookings/availability',
      {
        params: { barberId: 'b1', date: '2025-01-01', durationMin: 30 },
      },
    );
    expect(result).toEqual(slots);
  });

  it('createBooking posts booking and returns booking', async () => {
    const booking = { _id: '1' };
    mockClient.post.mockResolvedValue({ data: { booking } });

    const result = await createBooking({
      barberId: 'b1',
      serviceName: 'Cut',
      durationMin: 30,
      startsAt: 'iso',
    });

    expect(mockClient.post).toHaveBeenCalledWith('/api/bookings', {
      barberId: 'b1',
      serviceName: 'Cut',
      durationMin: 30,
      startsAt: 'iso',
    });
    expect(result).toEqual(booking);
  });

  it('getMyBookings returns bookings array', async () => {
    const bookings = [{ _id: '1' }];
    mockClient.get.mockResolvedValue({ data: { bookings } });

    const result = await getMyBookings();
    expect(mockClient.get).toHaveBeenCalledWith('/api/bookings/me');
    expect(result).toEqual(bookings);
  });

  it('cancelBooking posts to cancel endpoint', async () => {
    const booking = { _id: '1' };
    mockClient.post.mockResolvedValue({ data: { booking } });

    const result = await cancelBooking('1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/bookings/1/cancel',
      {},
    );
    expect(result).toEqual(booking);
  });

  it('rescheduleMyBooking patches booking', async () => {
    const booking = { _id: '1' };
    mockClient.patch.mockResolvedValue({ data: { booking } });

    const patch = { startsAt: 'iso', durationMin: 45 };
    const result = await rescheduleMyBooking('1', patch);
    expect(mockClient.patch).toHaveBeenCalledWith(
      '/api/bookings/1',
      patch,
    );
    expect(result).toEqual(booking);
  });

  it('adminCancelBooking / adminCompleteBooking / adminMarkNoShow', async () => {
    const booking = { _id: '1' };
    mockClient.post.mockResolvedValue({ data: { booking } });

    await adminCancelBooking('1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/bookings/admin/1/cancel',
      {},
    );

    await adminCompleteBooking('1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/bookings/admin/1/complete',
      {},
    );

    await adminMarkNoShow('1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/bookings/admin/1/no-show',
      {},
    );
  });

  it('adminUnblockUser / adminBlockUser / adminClearWarning', async () => {
    mockClient.post.mockResolvedValue({ data: { user: { _id: 'u1' } } });

    await adminUnblockUser('u1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/users/u1/unblock',
      {},
    );

    await adminBlockUser('u1', 'reason');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/users/u1/block',
      { reason: 'reason' },
    );

    await adminBlockUser('u1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/users/u1/block',
      {},
    );

    await adminClearWarning('u1');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/users/u1/clear-warning',
      {},
    );
  });
});

describe('api/bookings helpers', () => {
  it('isBlockedError detects blocked messages', async () => {
    const err = {
      response: { data: { error: 'Online booking restricted due to no-shows' } },
      message: '',
    } as AxiosError<{ error?: string }>;

    await expect(isBlockedError(err)).resolves.toBe(true);
  });

  it('isWeeklyLimitError detects weekly limit messages', async () => {
    const err = {
      response: {
        data: { error: 'You can only have one active booking within 7 days' },
      },
      message: '',
    } as AxiosError<{ error?: string }>;

    await expect(isWeeklyLimitError(err)).resolves.toBe(true);
  });

  it('helpers return false for unrelated errors', async () => {
    const err = {
      response: { data: { error: 'Some other error' } },
      message: '',
    } as AxiosError<{ error?: string }>;

    await expect(isBlockedError(err)).resolves.toBe(false);
    await expect(isWeeklyLimitError(err)).resolves.toBe(false);
  });
});
