import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text with underscore replaced by space', () => {
    // use React once so TS doesn’t complain about unused import
    expect(React).toBeDefined();

    render(<StatusBadge status="no_show" />);

    const badge = screen.getByText('no show');
    expect(badge).toBeInTheDocument();
  });

  it('applies the correct Tailwind classes for "booked" status', () => {
    render(<StatusBadge status="booked" />);

    const badge = screen.getByText('booked');
    const className = badge.className;

    expect(className).toContain('bg-amber-100');
    expect(className).toContain('text-amber-800');
    expect(className).toContain('border-amber-200');
  });

  it('falls back to neutral styling for unknown status', () => {
    render(<StatusBadge status="something-else" />);

    const badge = screen.getByText('something-else');
    const className = badge.className;

    expect(className).toContain('bg-neutral-100');
    expect(className).toContain('text-neutral-700');
    expect(className).toContain('border-neutral-200');
  });
});
