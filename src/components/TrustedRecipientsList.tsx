'use client';

import { useState, type FormEvent } from 'react';
import { wardenClient } from '@/lib/wardenClient';
import { signWithPasskey } from '@/lib/passkeyWallet';
import { CONFIG } from '@/lib/config';

type ActionStatus = 'idle' | 'submitting' | 'error';

interface TrustedRecipientsListProps {
  wallet: string;
  recipients: string[];
  onChanged?: () => void;
}

export function TrustedRecipientsList({ wallet, recipients, onChanged }: TrustedRecipientsListProps) {
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
        CONFIG.deployerPublicKey,
      );
      const signedXdr = await signWithPasskey(xdr);
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
        CONFIG.deployerPublicKey,
      );
      const signedXdr = await signWithPasskey(xdr);
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

      {recipients.length === 0 ? (
        <p className="text-sm text-mist-400">
          No trusted recipients yet. Add one below so transfers to them skip the new-recipient
          confirmation.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recipients.map((recipient) => (
            <li
              key={recipient}
              className="flex items-center justify-between gap-3 rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5"
            >
              <span className="address-mono text-sm text-mist-100">
                {recipient.slice(0, 6)}…{recipient.slice(-6)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(recipient)}
                disabled={removingId === recipient}
                className="text-sm text-mist-400 underline decoration-dotted hover:text-fault disabled:opacity-50"
              >
                {removingId === recipient ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
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
