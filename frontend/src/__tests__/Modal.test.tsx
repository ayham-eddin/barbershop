import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../components/Modal';

describe('Modal component', () => {
  it('does not render anything when open=false', () => {
    const { queryByRole } = render(
      <Modal open={false} onClose={() => {}}>
        <p>Hidden content</p>
      </Modal>,
    );

    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders dialog, title, children and default Close button when open=true', () => {
    const handleClose = jest.fn();

    render(
      <Modal open title="Test Modal" onClose={handleClose}>
        <p>Body content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop', () => {
    const handleClose = jest.fn();

    const { container } = render(
      <Modal open title="Has backdrop" onClose={handleClose}>
        <button type="button">Focusable</button>
      </Modal>,
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();

    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = jest.fn();

    render(
      <Modal open title="Escape test" onClose={handleClose}>
        <button type="button">Focusable</button>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('locks and restores body scroll when opened/closed', () => {
    const handleClose = jest.fn();

    const { rerender } = render(
      <Modal open title="Scroll lock" onClose={handleClose}>
        <p>Body</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} title="Scroll lock" onClose={handleClose}>
        <p>Body</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('');
  });
});
