import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';
import {
  getMyBookings as getMyBookingsApi,
  cancelBooking as cancelBookingApi,
  rescheduleMyBooking as rescheduleMyBookingApi,
  type Booking,
} from '../api/bookings';
import { getMe as getMeApi } from '../api/me';

// Mock notify to avoid real toasts
jest.mock('../lib/notify', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn(),
    apiError: jest.fn(),
  },
}));

// Mock bookings API
jest.mock('../api/bookings', () => {
  const actual = jest.requireActual('../api/bookings');
  return {
    ...actual,
    getMyBookings: jest.fn(),
    cancelBooking: jest.fn(),
    rescheduleMyBooking: jest.fn(),
  };
});

// Mock me API
jest.mock('../api/me', () => {
  const actual = jest.requireActual('../api/me');
  return {
    ...actual,
    getMe: jest.fn(),
  };
});

const mockedGetMyBookings = getMyBookingsApi as jest.MockedFunction<
  typeof getMyBookingsApi
>;
const mockedCancelBooking = cancelBookingApi as jest.MockedFunction<
  typeof cancelBookingApi
>;
const mockedRescheduleMyBooking =
  rescheduleMyBookingApi as jest.MockedFunction<
    typeof rescheduleMyBookingApi
  >;
const mockedGetMe = getMeApi as jest.MockedFunction<typeof getMeApi>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const makeFutureBooking = (): Booking => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // We only need the fields that DashboardPage and BookingCard actually touch
  const booking = {
    _id: 'booking-1',
    startsAt: future,
    status: 'booked',
    serviceName: 'Haircut',
    durationMin: 30,
    barberId: 'barber-1',
    barber: { id: 'barber-1', name: 'Ali Barber' },
    notes: 'please fade',
  } as unknown as Booking;

  return booking;
};

describe('DashboardPage actions (cancel & reschedule)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: user is not blocked and has no warnings
    mockedGetMe.mockResolvedValue({} as never);

    // Default: no bookings – individual tests override
    mockedGetMyBookings.mockResolvedValue([] as never);
  });

  it('cancels a booking when clicking Cancel', async () => {
    const booking = makeFutureBooking();

    mockedGetMyBookings.mockResolvedValueOnce([booking] as Booking[]);
    mockedCancelBooking.mockResolvedValueOnce(undefined as never);

    const wrapper = createWrapper();

    render(<DashboardPage />, { wrapper });

    // Wait until the booking appears
    await waitFor(() => {
      expect(screen.getByText(/Haircut/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedCancelBooking).toHaveBeenCalledTimes(1);
      expect(mockedCancelBooking).toHaveBeenCalledWith('booking-1');
    });
  });

  it('opens reschedule modal and calls rescheduleMyBooking on save', async () => {
    const booking = makeFutureBooking();

    mockedGetMyBookings.mockResolvedValueOnce([booking] as Booking[]);
    mockedRescheduleMyBooking.mockResolvedValueOnce(booking);

    const wrapper = createWrapper();

    render(<DashboardPage />, { wrapper });

    // Wait until the booking appears
    await waitFor(() => {
      expect(screen.getByText(/Haircut/i)).toBeInTheDocument();
    });

    // Open reschedule modal
    const rescheduleButton = screen.getByRole('button', {
      name: /reschedule/i,
    });
    fireEvent.click(rescheduleButton);

    // TimeField label defaults to "Starts at"
    const datetimeInput = await screen.findByLabelText(/starts at/i);

    // Change to a new local datetime value
    fireEvent.change(datetimeInput, {
      target: { value: '2030-01-01T10:00' },
    });

    // Save changes (button in Modal footer)
    const saveButton = screen.getByRole('button', {
      name: /save changes/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedRescheduleMyBooking).toHaveBeenCalledTimes(1);
      expect(mockedRescheduleMyBooking).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({
          startsAt: expect.any(String),
        }),
      );
    });
  });
});
