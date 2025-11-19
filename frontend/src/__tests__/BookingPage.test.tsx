import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookingPage from '../pages/BookingPage';

// ---- Mocks ----

// Mock axios client used in BookingPage bootstrap (`/api/barbers`)
import apiClient from '../api/client';
jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock public services API
import { getServices } from '../api/public';
jest.mock('../api/public', () => ({
  __esModule: true,
  getServices: jest.fn(),
}));

// Mock bookings API used in BookingPage
import {
  getAvailability,
  createBooking,
  getMyBookings,
  isBlockedError,
  isWeeklyLimitError,
} from '../api/bookings';

jest.mock('../api/bookings', () => ({
  __esModule: true,
  getAvailability: jest.fn(),
  createBooking: jest.fn(),
  getMyBookings: jest.fn(),
  isBlockedError: jest.fn(),
  isWeeklyLimitError: jest.fn(),
}));

// Avoid weekend/holiday client-side blocking depending on current real date
jest.mock('../utils/closedDaysNRW', () => ({
  __esModule: true,
  isClosedDateYmd: jest.fn(() => false),
}));

// Keep real formatBerlinTime implementation – it is purely deterministic
jest.mock('../utils/datetime', () => {
  const actual = jest.requireActual('../utils/datetime');
  return {
    __esModule: true,
    ...actual,
  };
});

// Keep real router components, but stub useNavigate to a no-op
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const mockedApiGet = apiClient.get as jest.MockedFunction<
  typeof apiClient.get
>;
const mockedGetServices = getServices as jest.MockedFunction<
  typeof getServices
>;
const mockedGetMyBookings = getMyBookings as jest.MockedFunction<
  typeof getMyBookings
>;
const mockedGetAvailability = getAvailability as jest.MockedFunction<
  typeof getAvailability
>;
const mockedCreateBooking = createBooking as jest.MockedFunction<
  typeof createBooking
>;
const mockedIsBlockedError = isBlockedError as jest.MockedFunction<
  typeof isBlockedError
>;
const mockedIsWeeklyLimitError = isWeeklyLimitError as jest.MockedFunction<
  typeof isWeeklyLimitError
>;

describe('BookingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure localStorage doesn't pretend we are admin
    localStorage.removeItem('role');

    mockedApiGet.mockResolvedValue({
      data: {
        barbers: [{ _id: 'b1', name: 'Ali Barber' }],
      },
    } as unknown);

    mockedGetServices.mockResolvedValue([
      { _id: 's1', name: 'Haircut', durationMin: 30, price: 25 },
    ]);

    // No active bookings by default
    mockedGetMyBookings.mockResolvedValue([]);
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>,
    );

  it('bootstraps barbers + services and calls getAvailability on "Check availability"', async () => {
    mockedGetAvailability.mockResolvedValue([
      {
        start: '2025-11-20T10:00:00.000Z',
        end: '2025-11-20T10:30:00.000Z',
      },
    ]);

    renderPage();

    // Wait for initial bootstrap (barbers/services)
    await waitFor(() =>
      expect(mockedApiGet).toHaveBeenCalledWith('/api/barbers'),
    );
    await waitFor(() => expect(mockedGetServices).toHaveBeenCalled());

    // "Check availability" should be enabled
    const checkBtn = screen.getByRole('button', {
      name: /check availability/i,
    });
    expect(checkBtn).toBeEnabled();

    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(mockedGetAvailability).toHaveBeenCalledTimes(1);
    });

    // Called with current barber, date and duration
    const args = mockedGetAvailability.mock.calls[0][0];
    expect(args.barberId).toBe('b1');
    expect(args.durationMin).toBe(30);
    expect(typeof args.date).toBe('string');

    // After slots arrive, we show the slots section label
    expect(
      await screen.findByText(/available slots/i),
    ).toBeInTheDocument();
  });

  it('shows weekly-limit error feedback when backend rejects with weekly limit', async () => {
    mockedGetAvailability.mockResolvedValue([
      {
        start: '2025-11-21T09:00:00.000Z',
        end: '2025-11-21T09:30:00.000Z',
      },
    ]);

    // First call: createBooking rejects
    mockedCreateBooking.mockRejectedValue(new Error('limit'));
    // Not blocked, but weekly limit hit
    mockedIsBlockedError.mockResolvedValue(false);
    mockedIsWeeklyLimitError.mockResolvedValue(true);

    renderPage();

    // Wait for bootstrap
    await waitFor(() =>
      expect(mockedApiGet).toHaveBeenCalledWith('/api/barbers'),
    );
    await waitFor(() => expect(mockedGetServices).toHaveBeenCalled());

    // Load slots
    const checkBtn = screen.getByRole('button', {
      name: /check availability/i,
    });
    fireEvent.click(checkBtn);

    await waitFor(() =>
      expect(mockedGetAvailability).toHaveBeenCalledTimes(1),
    );

    // Click one of the slot buttons – they have a `title` containing an en-dash (–)
    const allButtons = screen.getAllByRole('button');
    const slotButton = allButtons.find((btn) =>
      btn.title.includes('–'),
    );
    expect(slotButton).toBeDefined();
    if (!slotButton) return;
    fireEvent.click(slotButton);

    // Confirm booking
    const confirmBtn = screen.getByRole('button', {
      name: /confirm booking/i,
    });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    // We expect the weekly-limit error text
    expect(
      await screen.findByText(
        /one active booking within 7 days/i,
      ),
    ).toBeInTheDocument();
  });
});

export {};
