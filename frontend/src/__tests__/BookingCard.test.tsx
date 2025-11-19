import { render, screen, fireEvent } from '@testing-library/react';
import BookingCard from '../components/booking/BookingCard';
import type { Booking } from '../api/bookings';

const baseBooking: Booking = {
  _id: 'b1',
  userId: 'u1',
  barberId: 'barber-1',
  serviceName: 'Haircut',
  durationMin: 30,
  startsAt: '2999-01-01T10:00:00.000Z',
  endsAt: '2999-01-01T10:30:00.000Z',
  status: 'booked',
  notes: 'Please fade sides.',
};

describe('BookingCard', () => {
  it('renders service info, date and note', () => {
    render(
      <BookingCard
        booking={baseBooking}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
        cancelling={false}
        canReschedule={true}
      />,
    );

    expect(
      screen.getByText(/Haircut/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/30 min/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Note:/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please fade sides./),
    ).toBeInTheDocument();
  });

  it('calls onReschedule when Reschedule clicked', () => {
    const onReschedule = jest.fn();
    render(
      <BookingCard
        booking={baseBooking}
        onCancel={jest.fn()}
        onReschedule={onReschedule}
        cancelling={false}
        canReschedule={true}
      />,
    );

    fireEvent.click(screen.getByText('Reschedule'));
    expect(onReschedule).toHaveBeenCalledTimes(1);
  });

  it('disables Cancel button for past booking', () => {
    const pastBooking: Booking = {
      ...baseBooking,
      startsAt: '2000-01-01T10:00:00.000Z',
      endsAt: '2000-01-01T10:30:00.000Z',
    };

    render(
      <BookingCard
        booking={pastBooking}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
        cancelling={false}
        canReschedule={false}
      />,
    );

    const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
    expect(cancelButton.disabled).toBe(true);
  });

  it('shows spinner and text when cancelling', () => {
    render(
      <BookingCard
        booking={baseBooking}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
        cancelling={true}
        canReschedule={true}
      />,
    );

    expect(
      screen.getByText('Cancelling…'),
    ).toBeInTheDocument();
  });
});
