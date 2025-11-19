import { render, screen } from '@testing-library/react';
import BookingSummaryDetails from '../components/booking/BookingSummaryDetails';

const formatTime = (iso: string) => `TIME-${iso}`;

describe('BookingSummaryDetails', () => {
  const barbers = [
    { _id: 'b1', name: 'Barber One' },
    { _id: 'b2', name: 'Barber Two' },
  ];

  it('renders all main summary fields', () => {
    render(
      <BookingSummaryDetails
        barbers={barbers}
        barberId="b1"
        serviceName="Haircut"
        durationMin={30}
        date="2025-01-01"
        selectedSlot="2025-01-01T10:00:00.000Z"
        price={25}
        notes=""
        formatTime={formatTime}
      />,
    );

    expect(screen.getByText('Barber')).toBeInTheDocument();
    expect(screen.getByText('Barber One')).toBeInTheDocument();
    expect(
      screen.getByText(/Haircut \(30 min\)/),
    ).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('€25')).toBeInTheDocument();
    expect(screen.getByText(/TIME-2025-01-01T10:00:00.000Z/)).toBeInTheDocument();
  });

  it('renders notes row only when notes are non-empty', () => {
    const { rerender } = render(
      <BookingSummaryDetails
        barbers={barbers}
        barberId="b1"
        serviceName="Haircut"
        durationMin={30}
        date="2025-01-01"
        selectedSlot={null}
        price={25}
        notes=""
        formatTime={formatTime}
      />,
    );

    expect(screen.queryByText('Notes')).not.toBeInTheDocument();

    rerender(
      <BookingSummaryDetails
        barbers={barbers}
        barberId="b1"
        serviceName="Haircut"
        durationMin={30}
        date="2025-01-01"
        selectedSlot={null}
        price={25}
        notes="Some long note"
        formatTime={formatTime}
      />,
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Some long note')).toBeInTheDocument();
  });
});
