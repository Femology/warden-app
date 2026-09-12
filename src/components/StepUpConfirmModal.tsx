'use client';

import { useEffect, useRef, useState } from 'react';
import { fallbackExplanation } from 'warden-sdk';
import type { ExplanationInput, ExplanationResult, StepUpReason } from 'warden-sdk';

const REASON_COPY: Record<StepUpReason, string> = {
  AmountExceeded: 'This amount is above your no-confirmation limit.',
  NewRecipient:
    "You haven't sent to this recipient before, or it's been long enough that we're treating it like a new one.",
  VelocityExceeded: 'This would put you over your daily limit.',
  HourlyVelocityExceeded: 'This would put you over your hourly limit.',
  FlaggedRecipient: 'This recipient has been flagged and always requires confirmation.',
};

interface StepUpConfirmModalProps {
  reason: StepUpReason;
  amount: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StepUpConfirmModal({ reason, amount, onConfirm, onCancel }: StepUpConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Phase 18 -- "Explain this". Sends ONLY the reason code and amount (the
  // exact facts already public in this step-up decision) to the server
  // route, which is the only place that ever touches the model API key.
  // If the route is unreachable at all (not just a bad response -- the
  // route itself already falls back for that), fallbackExplanation() runs
  // client-side too, since it's pure, secret-free logic re-exported from
  // warden-sdk for exactly this reason.
  async function handleExplain() {
    setExplaining(true);
    const input: ExplanationInput = { eventType: 'stepup_required', reason, amount };
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('explain route failed');
      const result = (await response.json()) as ExplanationResult;
      setExplanation(result);
    } catch {
      setExplanation({ ...fallbackExplanation(input), source: 'fallback' });
    } finally {
      setExplaining(false);
    }
  }

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

        {explanation ? (
          <div className="flex flex-col gap-3 rounded-md border border-ink-700 bg-ink-900 p-4">
            <p className="text-sm text-mist-100">{explanation.summary}</p>
            {explanation.factors.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-mist-400">
                {explanation.factors.map((factor, index) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            )}
            {explanation.nextSteps.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-mist-400">What you can do</span>
                <ul className="flex flex-col gap-1 text-sm text-mist-400">
                  {explanation.nextSteps.map((step, index) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}
            <span className="text-xs text-mist-400">
              {explanation.source === 'llm' ? 'AI-generated, grounded in this event only' : 'Standard explanation'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleExplain}
            disabled={explaining}
            className="self-start text-sm text-mist-400 underline decoration-dotted hover:text-mist-100 disabled:opacity-50"
          >
            {explaining ? 'Explaining…' : 'Explain this'}
          </button>
        )}

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
