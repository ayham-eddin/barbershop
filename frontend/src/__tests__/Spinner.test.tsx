import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Spinner from '../components/Spinner';

describe('Spinner', () => {
  it('renders with default size and accessibility attributes', () => {
    // use React once to satisfy TS
    expect(React).toBeDefined();

    render(<Spinner />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-live', 'polite');

    const svg = status.querySelector('svg');
    expect(svg).not.toBeNull();
    if (svg) {
      expect(svg).toHaveAttribute('width', '16px');
      expect(svg).toHaveAttribute('height', '16px');
    }

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('respects custom size, className and aria-label', () => {
    const label = 'Saving data';
    render(<Spinner size={24} className="text-red-500" aria-label={label} />);

    const status = screen.getByRole('status', { name: label });
    expect(status).toBeInTheDocument();
    expect(status.className).toContain('text-red-500');

    const svg = status.querySelector('svg');
    expect(svg).not.toBeNull();
    if (svg) {
      expect(svg).toHaveAttribute('width', '24px');
      expect(svg).toHaveAttribute('height', '24px');
    }
  });
});
