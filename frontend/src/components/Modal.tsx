// src/components/Modal.tsx
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Accessible modal dialog:
 * - ESC to close
 * - Click backdrop to close
 * - Focus is trapped inside dialog
 * - Background scroll disabled while open
 * - Restores previously focused element on close
 */
export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Save/restore previously focused element
  useLayoutEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement;
    } else if (lastActiveRef.current) {
      lastActiveRef.current.focus?.();
      lastActiveRef.current = null;
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // rudimentary focus trap
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Move initial focus into the dialog
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    // Prefer first focusable, otherwise focus the dialog container
    const focusable = root.querySelector<HTMLElement>(
      'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? root).focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  const titleId = title ? 'modal-title' : undefined;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200 outline-none"
        tabIndex={-1}
      >
        {title && (
          <div className="px-5 py-3 border-b border-neutral-200">
            <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        <div className="px-5 py-3 border-t border-neutral-200 flex justify-end gap-2">
          {footer ?? (
            <button
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
