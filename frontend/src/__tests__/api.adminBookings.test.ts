import apiClient from '../api/client';
import { patchAdminBooking } from '../api/adminBookings';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    patch: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  patch: jest.Mock;
};

describe('api/adminBookings', () => {
  beforeEach(() => {
    mockClient.patch.mockReset();
  });

  it('patchAdminBooking patches admin booking endpoint and unwraps booking', async () => {
    const booking = { _id: 'b1', serviceName: 'Cut' };
    mockClient.patch.mockResolvedValue({ data: { booking } });

    const res = await patchAdminBooking('b1', { notes: 'Updated' });
    expect(mockClient.patch).toHaveBeenCalledWith(
      '/api/bookings/admin/b1',
      { notes: 'Updated' },
    );
    expect(res).toEqual(booking);
  });
});
