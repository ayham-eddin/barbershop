// src/components/Modal.tsx
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200"
      >
        {title && (
          <div className="px-5 py-3 border-b border-neutral-200">
            <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
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
