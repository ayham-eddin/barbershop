import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';

import * as meApi from '../api/me';
import * as bookingsApi from '../api/bookings';

// Mock notify (used inside DashboardPage)
jest.mock('../lib/notify', () => ({
  notify: {
    success: jest.fn(),
    apiError: jest.fn(),
  },
}));

jest.mock('../api/me');
jest.mock('../api/bookings');

const mockedGetMe = meApi.getMe as jest.MockedFunction<typeof meApi.getMe>;
const mockedGetMyBookings = bookingsApi.getMyBookings as jest.MockedFunction<
  typeof bookingsApi.getMyBookings
>;
const mockedCancelBooking = bookingsApi.cancelBooking as jest.MockedFunction<
  typeof bookingsApi.cancelBooking
>;

// Helper to render with React Query provider
const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // v5 uses gcTime instead of cacheTime
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bookings list when data is loaded', async () => {
    mockedGetMe.mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      warning_count: 0,
      last_warning_at: null,
      is_online_booking_blocked: false,
      block_reason: null,
      phone: null,
      address: null,
      avatarUrl: null,
    });

    mockedGetMyBookings.mockResolvedValue([
      {
        _id: 'b1',
        userId: 'u1',
        barberId: 'barber1',
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // future
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'booked',
        notes: 'Short on the sides',
        barber: { id: 'barber1', name: 'John' },
      },
    ]);

    renderWithClient(<DashboardPage />);

    // Heading always present
    expect(
      await screen.findByText('My Bookings'),
    ).toBeInTheDocument();

    // Booking card rendered
    expect(
      await screen.findByText(/Haircut/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Short on the sides/i),
    ).toBeInTheDocument();
  });

  it('calls cancelBooking when Cancel is clicked', async () => {
    mockedGetMe.mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      warning_count: 0,
      last_warning_at: null,
      is_online_booking_blocked: false,
      block_reason: null,
      phone: null,
      address: null,
      avatarUrl: null,
    });

    const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    mockedGetMyBookings.mockResolvedValue([
      {
        _id: 'b1',
        userId: 'u1',
        barberId: 'barber1',
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt: futureStart,
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'booked',
        notes: '',
        barber: { id: 'barber1', name: 'John' },
      },
    ]);

    mockedCancelBooking.mockResolvedValue({
      _id: 'b1',
      userId: 'u1',
      barberId: 'barber1',
      serviceName: 'Haircut',
      durationMin: 30,
      startsAt: futureStart,
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'cancelled',
      notes: '',
      barber: { id: 'barber1', name: 'John' },
    });

    renderWithClient(<DashboardPage />);

    // Wait until booking appears
    const cancelButton = await screen.findByRole('button', {
      name: /cancel/i,
    });

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedCancelBooking).toHaveBeenCalledWith('b1');
    });
  });
});
