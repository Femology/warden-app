'use client';

import { useState, type FormEvent } from 'react';
import type { StepUpReason } from 'warden-sdk';
import { wardenClient } from '@/lib/wardenClient';
import { signXdr, signXdrFor, sourceAccountOverride } from '@/lib/wallet';
import { buildTransfer, submitTransfer, tokenAssembledFromXdr } from '@/lib/tokenClient';
import { StepUpConfirmModal } from './StepUpConfirmModal';

type Status = 'idle' | 'evaluating' | 'awaiting-confirmation' | 'paying' | 'success' | 'error';

interface TransferFormProps {
  wallet: string;
}

export function TransferForm({ wallet }: TransferFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stepUpReason, setStepUpReason] = useState<StepUpReason | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function executePayment() {
    setStatus('paying');
    try {
      const { xdr } = await buildTransfer(wallet, recipient, amount);
      const signedXdr = await signXdrFor(xdr, tokenAssembledFromXdr);
      const hash = await submitTransfer(signedXdr);
      setTxHash(hash);
      setStatus('success');
      setStepUpReason(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      setStepUpReason(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('evaluating');
    setError(null);
    setTxHash(null);
    try {
      const { xdr } = await wardenClient.buildEvaluate(
        wallet,
        recipient,
        amount,
        sourceAccountOverride(),
      );
      const signedXdr = await signXdr(xdr);
      const decision = await wardenClient.submitEvaluate(signedXdr);

      if (decision.type === 'Allow') {
        await executePayment();
      } else {
        // Do not touch payment state here -- if the user cancels, nothing
        // has happened yet. Only the confirm button in the modal proceeds.
        setStepUpReason(decision.reason);
        setStatus('awaiting-confirmation');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleCancelStepUp() {
    // Full abort: no payment, no partial state change.
    setStepUpReason(null);
    setStatus('idle');
  }

  const busy = status === 'evaluating' || status === 'paying';

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="recipient" className="text-sm font-medium text-mist-100">
            Recipient
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="G… or C… address"
            required
            className="address-mono rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-mist-100 outline-none focus-visible:border-edge"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="text-sm font-medium text-mist-100">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className="tabular-amount rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5 text-mist-100 outline-none focus-visible:border-edge"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !recipient || !amount}
          className="self-start rounded-md bg-edge px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'evaluating'
            ? 'Checking…'
            : status === 'paying'
              ? 'Sending…'
              : 'Send'}
        </button>
      </form>

      {status === 'success' && txHash && (
        <p role="status" className="text-sm text-clear">
          Sent.{' '}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View on Stellar Expert
          </a>
        </p>
      )}
      {status === 'error' && error && (
        <p role="alert" className="text-sm text-fault">
          {error}
        </p>
      )}

      {status === 'awaiting-confirmation' && stepUpReason && (
        <StepUpConfirmModal
          reason={stepUpReason}
          onConfirm={executePayment}
          onCancel={handleCancelStepUp}
        />
      )}
    </div>
  );
}
