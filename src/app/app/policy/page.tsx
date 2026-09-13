'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { connectedWalletId, connectFreighterWallet } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { PolicyForm } from '@/components/PolicyForm';
import { TrustedRecipientsList } from '@/components/TrustedRecipientsList';
import { sounds } from '@/lib/soundEngine';
import type { Policy } from 'warden-sdk';

export default function AppPolicyPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);

  const refreshPolicy = useCallback(async (walletId: string) => {
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
    const active = connectedWalletId();
    if (active) {
      setWallet(active);
      setIsDemoMode(false);
      void refreshPolicy(active);
    } else {
      setLoading(false);
      // Default to demo mode if no wallet is connected so visitor can explore immediately
      setIsDemoMode(true);
    }
  }, [refreshPolicy]);

  async function handleConnectWallet() {
    sounds.playClick();
    setConnecting(true);
    try {
      const addr = await connectFreighterWallet();
      setWallet(addr);
      setIsDemoMode(false);
      sounds.playAllowChime();
      void refreshPolicy(addr);
    } catch {
      // Connect cancelled
    } finally {
      setConnecting(false);
    }
  }

  function toggleDemoMode() {
    sounds.playClick();
    setIsDemoMode((prev) => !prev);
  }

  const effectiveWallet = wallet || (isDemoMode ? 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET' : undefined);

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-8 sm:py-10">
        {/* =====================================================================
            HEADER & STATE STRIP
        ===================================================================== */}
        <div className="flex flex-col gap-4 border-b border-ink-700 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                  POLICY MANAGEMENT // PROTOCOL V1.0.0
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
                Configure Spending Boundaries
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 font-mono text-xs text-mist-400 hover:border-clear hover:text-mist-100 transition-colors"
              >
                <span>← Command Center</span>
              </Link>
            </div>
          </div>

          <p className="text-sm sm:text-base text-mist-400 max-w-3xl leading-relaxed">
            Define your on-chain rules. Payments within these boundaries clear instantly in seconds;
            payments exceeding them require an explicit second confirmation.
          </p>

          {/* Active Status Banner */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${wallet ? 'bg-clear' : 'bg-gate'}`} />
                <span className="text-mist-400">Target Account:</span>
                <span className="font-bold text-mist-100">
                  {wallet
                    ? `${wallet.slice(0, 6)}…${wallet.slice(-6)}`
                    : isDemoMode
                    ? 'Simulated Sandbox Account'
                    : 'No Wallet Connected'}
                </span>
              </div>
              <span className="rounded-full bg-clear/15 px-2.5 py-0.5 text-[10px] font-bold text-clear">
                TIER: NORMAL
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!wallet && (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="rounded-full bg-clear px-3.5 py-1 text-[11px] font-bold text-ink-900 hover:bg-clear/90 transition-colors"
                >
                  {connecting ? 'Connecting…' : 'Connect Freighter'}
                </button>
              )}
              <button
                type="button"
                onClick={toggleDemoMode}
                className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-[11px] text-mist-400 hover:text-mist-100 hover:border-mist-400 transition-colors"
              >
                {isDemoMode ? 'Exit Demo' : 'Simulate Sandbox'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading or Error Banners */}
        {loading && (
          <div className="flex items-center gap-2 font-mono text-sm text-mist-400">
            <span className="h-2 w-2 rounded-full bg-clear animate-ping" />
            <span>Fetching existing on-chain policy parameters from Soroban…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-fault/40 bg-ink-800 p-4 text-xs font-mono text-fault">
            {error}
          </div>
        )}

        {/* =====================================================================
            POLICY RULEBOOK EDITOR FORM
        ===================================================================== */}
        {effectiveWallet ? (
          <div className="flex flex-col gap-12">
            <PolicyForm
              wallet={effectiveWallet}
              onSaved={() => {
                if (wallet) void refreshPolicy(wallet);
              }}
            />

            {/* Trusted Counterparties List Section */}
            <section className="flex flex-col gap-4 border-t border-ink-700 pt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                    WEB-OF-TRUST DIRECTORY
                  </span>
                  <h2 className="font-display text-2xl font-bold text-mist-100">
                    Trusted Counterparties
                  </h2>
                </div>
                <span className="font-mono text-xs text-mist-400">
                  Zero step-up applies only to active trusted peers
                </span>
              </div>

              <TrustedRecipientsList
                wallet={effectiveWallet}
                recipients={policy?.trustedRecipients ?? {}}
                trustDecaySeconds={policy?.trustDecaySeconds ?? BigInt(2592000)}
                onChanged={() => {
                  if (wallet) void refreshPolicy(wallet);
                }}
              />
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-700 bg-ink-800 p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-clear/20 flex items-center justify-center mb-4 text-2xl">
              🛡️
            </div>
            <h3 className="font-display text-xl font-bold text-mist-100 mb-2">
              Connect Your Stellar Wallet
            </h3>
            <p className="text-sm text-mist-400 max-w-md mb-6 leading-relaxed">
              Connect Freighter to load your account&apos;s live on-chain security policy, or explore the editor in simulated sandbox mode.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="rounded-xl bg-clear px-6 py-2.5 font-mono text-xs font-bold text-ink-900 hover:bg-clear/90 transition-colors"
              >
                {connecting ? 'Connecting…' : 'Connect Freighter'}
              </button>
              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className="rounded-xl border border-ink-700 bg-ink-900 px-6 py-2.5 font-mono text-xs text-mist-400 hover:text-mist-100 hover:border-mist-400 transition-colors"
              >
                Load Sandbox State
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
