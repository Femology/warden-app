'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectWallet, connectedWalletId, createWallet } from '@/lib/passkeyWallet';
import { wardenClient } from '@/lib/wardenClient';

type Status = 'idle' | 'checking' | 'connecting' | 'creating' | 'error';

export function ConnectWallet() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setWalletId(connectedWalletId());
  }, []);

  async function afterConnect(contractId: string) {
    setWalletId(contractId);
    const policy = await wardenClient.getPolicy(contractId);
    // A wallet with no policy yet should never land on the transfer page
    // first -- route it to policy setup as onboarding.
    router.push(policy ? '/transfer' : '/policy');
  }

  async function handleConnect() {
    setStatus('connecting');
    setError(null);
    try {
      const contractId = await connectWallet();
      if (!contractId) {
        throw new Error('No passkey wallet found on this device yet.');
      }
      await afterConnect(contractId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreate() {
    setStatus('creating');
    setError(null);
    try {
      const userName = `warden-${Date.now()}`;
      const contractId = await createWallet('Warden', userName);
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

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConnect}
          disabled={status === 'connecting' || status === 'creating'}
          className="rounded-md bg-edge px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'connecting' ? 'Connecting…' : 'Connect wallet'}
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={status === 'connecting' || status === 'creating'}
          className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 transition-colors hover:border-edge disabled:opacity-50"
        >
          {status === 'creating' ? 'Creating…' : 'Create wallet'}
        </button>
      </div>
      {status === 'error' && error && (
        <p role="alert" className="text-sm text-fault">
          {error}
        </p>
      )}
    </div>
  );
}
