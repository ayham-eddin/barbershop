import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';

// --- Mocks ---

const mockedGetMe = jest.fn();
const mockedGetMyBookings = jest.fn();

jest.mock('../api/me', () => ({
  getMe: () => mockedGetMe(),
}));

jest.mock('../api/bookings', () => ({
  getMyBookings: () => mockedGetMyBookings(),
  cancelBooking: jest.fn(),
  rescheduleMyBooking: jest.fn(),
}));

const baseUser = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  warning_count: 0,
  last_warning_at: null,
  is_online_booking_blocked: false,
  block_reason: null,
  phone: null,
  address: null,
  avatarUrl: null,
};

const renderWithClient = async () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  );
};

describe('DashboardPage warning banners', () => {
  beforeEach(() => {
    mockedGetMyBookings.mockResolvedValue([]);
  });

  it('shows block banner when user is blocked for online booking', async () => {
    mockedGetMe.mockResolvedValue({
      ...baseUser,
      is_online_booking_blocked: true,
      warning_count: 3,
    });

    await renderWithClient();

    await waitFor(() => {
      expect(
        screen.getByText(/online booking is restricted/i),
      ).toBeInTheDocument();
    });
  });

  it('shows warning banner when user has warnings but is not blocked', async () => {
    mockedGetMe.mockResolvedValue({
      ...baseUser,
      is_online_booking_blocked: false,
      warning_count: 2,
    });

    await renderWithClient();

    await waitFor(() => {
      expect(
        screen.getByText(/you have 2 warnings/i),
      ).toBeInTheDocument();
    });
  });

  it('shows no banner when user has no warnings and is not blocked', async () => {
    mockedGetMe.mockResolvedValue({
      ...baseUser,
      is_online_booking_blocked: false,
      warning_count: 0,
    });

    await renderWithClient();

    // We just assert that the "My Bookings" heading appears
    // and no warning text is rendered.
    await waitFor(() => {
      expect(
        screen.getByText(/my bookings/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/online booking is restricted/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/you have/i),
    ).not.toBeInTheDocument();
  });
});
