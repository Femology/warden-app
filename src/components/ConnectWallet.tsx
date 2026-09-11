'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  connectExistingPasskeyWallet,
  connectFreighterWallet,
  connectedWalletId,
  createNewPasskeyWallet,
} from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';

type Status = 'idle' | 'connecting-freighter' | 'connecting-passkey' | 'creating-passkey' | 'error';

export function ConnectWallet() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setWalletId(connectedWalletId());
  }, []);

  async function afterConnect(address: string) {
    setWalletId(address);
    const policy = await wardenClient.getPolicy(address);
    // A wallet with no policy yet should never land on the transfer page
    // first -- route it to policy setup as onboarding.
    router.push(policy ? '/transfer' : '/policy');
  }

  async function handleConnectFreighter() {
    setStatus('connecting-freighter');
    setError(null);
    try {
      const address = await connectFreighterWallet();
      await afterConnect(address);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleConnectPasskey() {
    setStatus('connecting-passkey');
    setError(null);
    try {
      const contractId = await connectExistingPasskeyWallet();
      if (!contractId) {
        throw new Error('No passkey wallet found on this device yet.');
      }
      await afterConnect(contractId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreatePasskey() {
    setStatus('creating-passkey');
    setError(null);
    try {
      const userName = `warden-${Date.now()}`;
      const contractId = await createNewPasskeyWallet('Warden', userName);
      await afterConnect(contractId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (walletId) {
    return (
      <p className="address-mono text-sm text-mist-400">
        Connected: {walletId.slice(0, 4)}…{walletId.slice(-4)}
      </p>
    );
  }

  const busy = status !== 'idle' && status !== 'error';

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={handleConnectFreighter}
        disabled={busy}
        className="rounded-md bg-edge px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'connecting-freighter' ? 'Connecting…' : 'Connect Freighter'}
      </button>

      <details className="w-full">
        <summary className="cursor-pointer text-sm text-mist-400 hover:text-mist-100">
          Or connect with a passkey (beta)
        </summary>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConnectPasskey}
            disabled={busy}
            className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 transition-colors hover:border-edge disabled:opacity-50"
          >
            {status === 'connecting-passkey' ? 'Connecting…' : 'Connect passkey'}
          </button>
          <button
            type="button"
            onClick={handleCreatePasskey}
            disabled={busy}
            className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 transition-colors hover:border-edge disabled:opacity-50"
          >
            {status === 'creating-passkey' ? 'Creating…' : 'Create passkey wallet'}
          </button>
        </div>
      </details>

      {status === 'error' && error && (
        <p role="alert" className="text-sm text-fault">
          {error}
        </p>
      )}
    </div>
  );
}
