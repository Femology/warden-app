'use client';

import { useState, type FormEvent } from 'react';
import { wardenClient } from '@/lib/wardenClient';
import { signXdr, sourceAccountOverride } from '@/lib/wallet';

type ActionStatus = 'idle' | 'submitting' | 'error';

interface TrustedRecipientsListProps {
  wallet: string;
  // address -> last_paid_at (unix seconds). A recipient can still be in this
  // map after it's decayed out of trust (trust_decay_seconds elapsed since
  // last_paid_at) -- the contract keeps the entry, it just stops counting as
  // trusted for the new-recipient check until another payment refreshes it.
  recipients: Record<string, bigint>;
  trustDecaySeconds: bigint;
  onChanged?: () => void;
}

function isActivelyTrusted(lastPaidAt: bigint, trustDecaySeconds: bigint): boolean {
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  return nowSeconds - lastPaidAt <= trustDecaySeconds;
}

export function TrustedRecipientsList({
  wallet,
  recipients,
  trustDecaySeconds,
  onChanged,
}: TrustedRecipientsListProps) {
  const [newRecipient, setNewRecipient] = useState('');
  const [addStatus, setAddStatus] = useState<ActionStatus>('idle');
  const [addError, setAddError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newRecipient) return;

    setAddStatus('submitting');
    setAddError(null);
    try {
      const { xdr } = await wardenClient.buildAddTrustedRecipient(
        wallet,
        newRecipient,
        sourceAccountOverride(),
      );
      const signedXdr = await signXdr(xdr);
      await wardenClient.submitAddTrustedRecipient(signedXdr);
      setNewRecipient('');
      setAddStatus('idle');
      onChanged?.();
    } catch (err) {
      setAddStatus('error');
      setAddError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRemove(recipient: string) {
    setRemovingId(recipient);
    setRemoveError(null);
    try {
      const { xdr } = await wardenClient.buildRemoveTrustedRecipient(
        wallet,
        recipient,
        sourceAccountOverride(),
      );
      const signedXdr = await signXdr(xdr);
      await wardenClient.submitRemoveTrustedRecipient(signedXdr);
      onChanged?.();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : String(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-mist-100">Trusted recipients</h2>

      {Object.keys(recipients).length === 0 ? (
        <p className="text-sm text-mist-400">
          No trusted recipients yet. Add one below so transfers to them skip the new-recipient
          confirmation.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {Object.entries(recipients).map(([recipient, lastPaidAt]) => {
            const trusted = isActivelyTrusted(lastPaidAt, trustDecaySeconds);
            return (
              <li
                key={recipient}
                className="flex items-center justify-between gap-3 rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="address-mono text-sm text-mist-100">
                    {recipient.slice(0, 6)}…{recipient.slice(-6)}
                  </span>
                  <span className="text-xs" style={{ color: trusted ? 'var(--color-clear)' : 'var(--color-gate)' }}>
                    {trusted
                      ? `Last paid ${new Date(Number(lastPaidAt) * 1000).toLocaleDateString()}`
                      : 'Trust decayed — next transfer will need confirmation'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(recipient)}
                  disabled={removingId === recipient}
                  className="text-sm text-mist-400 underline decoration-dotted hover:text-fault disabled:opacity-50"
                >
                  {removingId === recipient ? 'Removing…' : 'Remove'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {removeError && (
        <p role="alert" className="text-sm text-fault">
          {removeError}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-3">
        <label htmlFor="newRecipient" className="sr-only">
          New trusted recipient address
        </label>
        <input
          id="newRecipient"
          type="text"
          placeholder="G… or C… address"
          value={newRecipient}
          onChange={(event) => setNewRecipient(event.target.value)}
          className="address-mono flex-1 rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-mist-100 outline-none focus-visible:border-edge"
        />
        <button
          type="submit"
          disabled={!newRecipient || addStatus === 'submitting'}
          className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 transition-colors hover:border-edge disabled:opacity-50"
        >
          {addStatus === 'submitting' ? 'Adding…' : 'Add'}
        </button>
      </form>
      {addStatus === 'error' && addError && (
        <p role="alert" className="text-sm text-fault">
          {addError}
        </p>
      )}
    </div>
  );
}
