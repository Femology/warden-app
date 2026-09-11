'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connectedWalletId } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { VelocityGauge } from '@/components/VelocityGauge';
import type { Policy, VelocityWindow } from 'warden-sdk';

export default function VelocityPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [velocity, setVelocity] = useState<VelocityWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletId = connectedWalletId();
    setWallet(walletId);
    if (!walletId) {
      setLoading(false);
      return;
    }
    Promise.all([wardenClient.getPolicy(walletId), wardenClient.getVelocity(walletId)])
      .then(([currentPolicy, currentVelocity]) => {
        setPolicy(currentPolicy);
        setVelocity(currentVelocity);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (!wallet) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-20">
        <p className="text-mist-100">
          Connect a wallet first from the{' '}
          <Link href="/" className="text-mist-100 underline decoration-edge underline-offset-2 hover:text-edge">
            home page
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-20">
      <h1 className="font-display text-3xl font-semibold text-mist-100">Today&apos;s velocity</h1>
      {loading ? (
        <p className="text-mist-400">Loading…</p>
      ) : error ? (
        <p role="alert" className="text-fault">
          {error}
        </p>
      ) : !policy ? (
        <p className="text-mist-400">
          No policy set yet.{' '}
          <Link href="/policy" className="text-mist-100 underline decoration-edge underline-offset-2 hover:text-edge">
            Set one up
          </Link>
          .
        </p>
      ) : velocity ? (
        <VelocityGauge velocity={velocity} dailyVelocityCap={policy.dailyVelocityCap} />
      ) : null}
    </main>
  );
}
