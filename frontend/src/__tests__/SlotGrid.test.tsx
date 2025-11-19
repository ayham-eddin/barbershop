import { render, screen, fireEvent } from '@testing-library/react';
import SlotGrid from '../components/booking/SlotGrid';

const formatTime = (iso: string) => iso.slice(11, 16); // HH:mm

describe('SlotGrid', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <SlotGrid
        slots={[]}
        selectedSlot={null}
        loading={true}
        onSelect={jest.fn()}
        formatTime={formatTime}
      />,
    );

    const skeletons = container.querySelectorAll(
      '.h-10.rounded-lg.bg-neutral-200',
    );
    expect(skeletons.length).toBe(6);
  });

  it('shows helper text when no slots and not loading', () => {
    render(
      <SlotGrid
        slots={[]}
        selectedSlot={null}
        loading={false}
        onSelect={jest.fn()}
        formatTime={formatTime}
      />,
    );

    expect(
      screen.getByText(/Choose options above, then tap/i),
    ).toBeInTheDocument();
  });

  it('renders slots and calls onSelect', () => {
    const slots = [
      { start: '2025-01-01T10:00:00.000Z', end: '2025-01-01T10:30:00.000Z' },
      { start: '2025-01-01T11:00:00.000Z', end: '2025-01-01T11:30:00.000Z' },
    ];
    const onSelect = jest.fn();

    render(
      <SlotGrid
        slots={slots}
        selectedSlot={slots[0].start}
        loading={false}
        onSelect={onSelect}
        formatTime={formatTime}
      />,
    );

    const firstBtn = screen.getByText('10:00');
    const secondBtn = screen.getByText('11:00');

    expect(firstBtn).toBeInTheDocument();
    expect(secondBtn).toBeInTheDocument();

    fireEvent.click(secondBtn);
    expect(onSelect).toHaveBeenCalledWith(slots[1].start);
  });
});
