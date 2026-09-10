'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { connectedWalletId } from '@/lib/passkeyWallet';
import { wardenClient } from '@/lib/wardenClient';
import { PolicyForm } from '@/components/PolicyForm';
import { TrustedRecipientsList } from '@/components/TrustedRecipientsList';
import type { Policy } from 'warden-sdk';

export default function PolicyPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (walletId: string) => {
    setLoading(true);
    setError(null);
    try {
      const current = await wardenClient.getPolicy(walletId);
      setPolicy(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const walletId = connectedWalletId();
    setWallet(walletId);
    if (walletId) {
      void refresh(walletId);
    } else {
      setLoading(false);
    }
  }, [refresh]);

  if (!wallet) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-20">
        <p className="text-mist-100">
          Connect a wallet first from the{' '}
          <Link href="/" className="text-edge underline">
            home page
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-12 px-6 py-20">
      <h1 className="font-display text-3xl font-semibold text-mist-100">Your policy</h1>

      {loading ? (
        <p className="text-mist-400">Loading current policy…</p>
      ) : error ? (
        <p role="alert" className="text-fault">
          {error}
        </p>
      ) : (
        <>
          <PolicyForm wallet={wallet} onSaved={() => refresh(wallet)} />
          {policy && (
            <TrustedRecipientsList
              wallet={wallet}
              recipients={policy.trustedRecipients}
              onChanged={() => refresh(wallet)}
            />
          )}
        </>
      )}
    </main>
  );
}
