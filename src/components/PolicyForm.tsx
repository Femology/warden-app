'use client';

import { useState, type FormEvent } from 'react';
import { wardenClient } from '@/lib/wardenClient';
import { signWithPasskey } from '@/lib/passkeyWallet';
import { CONFIG } from '@/lib/config';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface PolicyFormProps {
  wallet: string;
  onSaved?: () => void;
}

export function PolicyForm({ wallet, onSaved }: PolicyFormProps) {
  const [maxNoStepUp, setMaxNoStepUp] = useState('150');
  const [dailyVelocityCap, setDailyVelocityCap] = useState('500');
  const [newRecipientRequiresStepUp, setNewRecipientRequiresStepUp] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Mirrors the contract's own InvalidPolicyParams rule client-side, so the
  // user gets instant feedback instead of a failed on-chain call.
  const capBelowMax =
    maxNoStepUp !== '' &&
    dailyVelocityCap !== '' &&
    Number(dailyVelocityCap) < Number(maxNoStepUp);
  const negativeMax = maxNoStepUp !== '' && Number(maxNoStepUp) < 0;
  const isInvalid = capBelowMax || negativeMax;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isInvalid) return;

    setStatus('submitting');
    setError(null);
    try {
      const { xdr } = await wardenClient.buildSetPolicy(
        wallet,
        {
          version: 1,
          maxAmountNoStepUp: maxNoStepUp,
          dailyVelocityCap,
          newRecipientRequiresStepUp,
          trustedRecipients: [],
        },
        CONFIG.deployerPublicKey,
      );
      const signedXdr = await signWithPasskey(xdr);
      await wardenClient.submitSetPolicy(signedXdr);
      setStatus('success');
      onSaved?.();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="maxNoStepUp" className="text-sm font-medium text-mist-100">
          Amount before step-up
        </label>
        <input
          id="maxNoStepUp"
          type="number"
          inputMode="decimal"
          value={maxNoStepUp}
          onChange={(event) => setMaxNoStepUp(event.target.value)}
          className="tabular-amount rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5 text-mist-100 outline-none focus-visible:border-edge"
        />
        <p className="text-sm text-mist-400">
          Transfers under this amount go through with just your usual passkey confirmation.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dailyVelocityCap" className="text-sm font-medium text-mist-100">
          Daily limit
        </label>
        <input
          id="dailyVelocityCap"
          type="number"
          inputMode="decimal"
          value={dailyVelocityCap}
          onChange={(event) => setDailyVelocityCap(event.target.value)}
          aria-invalid={capBelowMax}
          className="tabular-amount rounded-md border bg-ink-800 px-4 py-2.5 text-mist-100 outline-none focus-visible:border-edge"
          style={{ borderColor: capBelowMax ? 'var(--color-fault)' : 'var(--color-ink-700)' }}
        />
        {capBelowMax && (
          <p role="alert" className="text-sm text-fault">
            Your daily limit can&apos;t be less than your no-confirmation amount.
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 text-sm text-mist-100">
        <input
          type="checkbox"
          checked={newRecipientRequiresStepUp}
          onChange={(event) => setNewRecipientRequiresStepUp(event.target.checked)}
          className="h-4 w-4 accent-edge"
        />
        Ask for confirmation the first time I send to a new recipient
      </label>

      <button
        type="submit"
        disabled={isInvalid || status === 'submitting'}
        className="self-start rounded-md bg-edge px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Setting limits…' : 'Set limits'}
      </button>

      {status === 'success' && (
        <p role="status" className="text-sm text-clear">
          Limits set.
        </p>
      )}
      {status === 'error' && error && (
        <p role="alert" className="text-sm text-fault">
          {error}
        </p>
      )}
    </form>
  );
}
