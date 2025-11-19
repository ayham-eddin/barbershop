
import { render, screen, fireEvent } from '@testing-library/react';
import TimeField from '../components/TimeField';

describe('TimeField component', () => {
  it('renders with default label and required flag', () => {
    const handleChange = jest.fn();

    render(
      <TimeField
        value=""
        onChange={handleChange}
        required
      />,
    );

    const input = screen.getByLabelText('Starts at') as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.required).toBe(true);
  });

  it('calls onChange with an ISO string when user changes the value', () => {
    const handleChange = jest.fn();

    render(
      <TimeField
        value=""
        onChange={handleChange}
        label="Custom label"
      />,
    );

    const input = screen.getByLabelText('Custom label') as HTMLInputElement;

    const localValue = '2025-01-01T10:30';
    fireEvent.change(input, { target: { value: localValue } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const iso = handleChange.mock.calls[0][0] as string;

    expect(iso).not.toBe('');
    expect(new Date(iso).toString()).not.toBe('Invalid Date');
  });

  it('normalizes ISO value back to the same local datetime for display', () => {
    const handleChange = jest.fn();

    const { rerender } = render(
      <TimeField
        value=""
        onChange={handleChange}
        label="Datetime"
      />,
    );

    const input = screen.getByLabelText('Datetime') as HTMLInputElement;

    const localValue = '2025-01-01T10:30';
    fireEvent.change(input, { target: { value: localValue } });

    const iso = handleChange.mock.calls[0][0] as string;

    rerender(
      <TimeField
        value={iso}
        onChange={handleChange}
        label="Datetime"
      />,
    );

    const updatedInput = screen.getByLabelText('Datetime') as HTMLInputElement;
    expect(updatedInput.value).toBe(localValue);
  });
});
