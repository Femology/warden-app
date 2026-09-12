'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectFreighterWallet, connectedWalletId } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';

/**
 * A compact, single-purpose Freighter button for the persistent nav shell --
 * distinct from ConnectWallet.tsx, which also offers the passkey (beta) path
 * and is meant for a dedicated connect surface, not a tight header slot.
 */
export function HeaderConnectButton() {
  const router = useRouter();
  const [walletId, setWalletId] = useState<string | undefined>(undefined);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWalletId(connectedWalletId());
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectFreighterWallet();
      setWalletId(address);
      const policy = await wardenClient.getPolicy(address);
      router.push(policy ? '/transfer' : '/policy');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  if (walletId) {
    return (
      <span className="address-mono rounded-full border border-ink-700 px-3 py-1.5 text-sm text-mist-400">
        {walletId.slice(0, 4)}…{walletId.slice(-4)}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-full bg-edge px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {connecting ? 'Connecting…' : 'Connect Freighter'}
      </button>
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-2 w-56 text-right text-xs text-fault">
          {error}
        </p>
      )}
    </div>
  );
}
