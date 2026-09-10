'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connectedWalletId } from '@/lib/passkeyWallet';
import { TransferForm } from '@/components/TransferForm';

export default function TransferPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);

  useEffect(() => {
    setWallet(connectedWalletId());
  }, []);

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-20">
      <h1 className="font-display text-3xl font-semibold text-mist-100">Send</h1>
      <TransferForm wallet={wallet} />
    </main>
  );
}
