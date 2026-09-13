
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectFreighterWallet, connectedWalletId } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';

import Link from 'next/link';

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
      router.push(policy ? '/app' : '/policy');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('closed the modal') ||
        (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === -1)
      ) {
        // Voluntary dismissal
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }

  if (walletId) {
    return (
      <Link
        href="/app"
        className="address-mono inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/80 px-3 py-1.5 text-xs text-mist-100 hover:border-clear transition-colors shadow-sm"
        title="Open Security Command Center"
      >
        <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
        <span>{walletId.slice(0, 4)}…{walletId.slice(-4)}</span>
      </Link>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-full bg-clear px-4 py-1.5 text-xs font-bold text-ink-900 transition-opacity hover:opacity-90 disabled:opacity-50 shadow-sm cursor-pointer"
      >
        {connecting ? 'Connecting…' : 'Connect Freighter'}
      </button>
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-2 w-56 text-right text-xs text-fault font-mono">
          {error}
        </p>
      )}
    </div>
  );
}
