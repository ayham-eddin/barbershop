import { render, screen } from '@testing-library/react';
import {
  BookingsSkeleton,
  ErrorBox,
  NoBookingsCard,
} from '../components/booking/BookingsStates';

describe('BookingsStates components', () => {
  it('BookingsSkeleton renders 4 skeleton items', () => {
    const { container } = render(<BookingsSkeleton />);
    const skeletons = container.querySelectorAll(
      '.h-24.rounded-xl.bg-neutral-200',
    );
    expect(skeletons.length).toBe(4);
  });

  it('ErrorBox renders provided text', () => {
    render(<ErrorBox text="Oops" />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('NoBookingsCard renders CTA link', () => {
    render(<NoBookingsCard />);
    expect(screen.getByText('No bookings yet.')).toBeInTheDocument();

    const link = screen.getByRole('link', {
      name: /Book your first appointment/i,
    });
    expect(link).toHaveAttribute('href', '/book');
  });
});
