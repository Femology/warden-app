'use client';

import { useEffect, useRef } from 'react';
import type { StepUpReason } from 'warden-sdk';

const REASON_COPY: Record<StepUpReason, string> = {
  AmountExceeded: 'This amount is above your no-confirmation limit.',
  NewRecipient: "You haven't sent to this recipient before.",
  VelocityExceeded: 'This would put you over your daily limit.',
};

interface StepUpConfirmModalProps {
  reason: StepUpReason;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StepUpConfirmModal({ reason, onConfirm, onCancel }: StepUpConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus-trapped, Escape-dismissible, returns focus on close -- the modal
  // deserves the most considered treatment in the product: this is the
  // moment friction appears, and it should feel intentional, never like a
  // generic dialog interrupting the user.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stepup-title"
        onClick={(event) => event.stopPropagation()}
        className="mx-4 flex w-full max-w-md flex-col gap-5 rounded-lg border p-6 shadow-xl"
        style={{ borderColor: 'var(--color-gate)', backgroundColor: 'var(--color-ink-800)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: 'var(--color-gate)' }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium" style={{ color: 'var(--color-gate)' }}>
            Step-up
          </span>
        </div>
        <h2 id="stepup-title" className="font-display text-xl font-semibold text-mist-100">
          One more confirmation
        </h2>
        <p className="text-mist-400">{REASON_COPY[reason]}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 hover:border-edge"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="rounded-md px-5 py-2.5 font-medium text-ink-900 transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-gate)' }}
          >
            Confirm and send
          </button>
        </div>
      </div>
    </div>
  );
}
