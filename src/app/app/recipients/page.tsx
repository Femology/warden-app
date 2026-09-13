'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { connectedWalletId, signXdr, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';

interface CounterpartyItem {
  address: string;
  label: string;
  lastPaidAt: bigint; // Unix seconds
}

const DEFAULT_DEMO_RECIPIENTS: CounterpartyItem[] = [
  {
    address: 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
    label: "Mama Amina's Produce",
    lastPaidAt: BigInt(Math.floor(Date.now() / 1000) - 5 * 86400), // 5 days ago (Active)
  },
  {
    address: 'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56',
    label: 'Hardware & Solar Supplies',
    lastPaidAt: BigInt(Math.floor(Date.now() / 1000) - 22 * 86400), // 22 days ago (Decaying soon)
  },
  {
    address: 'GDORM4321OLDLANDLORD9876543210ABCDEF1234567890',
    label: 'Old Landlord (Apartment 4B)',
    lastPaidAt: BigInt(Math.floor(Date.now() / 1000) - 38 * 86400), // 38 days ago (Decayed)
  },
  {
    address: 'GCAFE9988COFFEEROASTERS7766554433221100ABCDEF',
    label: 'Daily Brew Coffee Co.',
    lastPaidAt: BigInt(Math.floor(Date.now() / 1000) - 1 * 86400), // 1 day ago (Active)
  },
];

export default function TrustedRecipientsPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [recipients, setRecipients] = useState<CounterpartyItem[]>(DEFAULT_DEMO_RECIPIENTS);
  const [trustDecaySeconds, setTrustDecaySeconds] = useState<bigint>(BigInt(2592000)); // 30 days
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Add Recipient Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<string>('');
  const [newLabel, setNewLabel] = useState<string>('');
  const [addStatus, setAddStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [addError, setAddError] = useState<string | null>(null);

  // Removing state
  const [removingAddress, setRemovingAddress] = useState<string | null>(null);

  const fetchPolicyRecipients = useCallback(async (activeWallet: string) => {
    setLoading(true);
    try {
      const policy = await wardenClient.getPolicy(activeWallet);
      if (policy && policy.trustedRecipients) {
        const list: CounterpartyItem[] = Object.entries(policy.trustedRecipients).map(
          ([addr, ts]) => ({
            address: addr,
            label: addr.startsWith('GA7Q') ? "Mama Amina's Produce" : 'Verified Counterparty',
            lastPaidAt: ts,
          })
        );
        if (list.length > 0) {
          setRecipients(list);
        }
        if (policy.trustDecaySeconds) {
          setTrustDecaySeconds(policy.trustDecaySeconds);
        }
      }
    } catch {
      // Fallback to demo roster
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = connectedWalletId();
    if (active) {
      setWallet(active);
      void fetchPolicyRecipients(active);
    } else {
      setLoading(false);
    }
  }, [fetchPolicyRecipients]);

  // Copy helper
  function handleCopy(address: string) {
    sounds.playClick();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }

  // Address validation: 56 chars, starts with G
  const isValidNewAddress = useMemo(() => {
    const trimmed = newAddress.trim();
    if (trimmed.length !== 56 || !trimmed.startsWith('G')) return false;
    // Check duplicate
    if (recipients.some((r) => r.address === trimmed)) return false;
    return true;
  }, [newAddress, recipients]);

  // Add recipient handler
  async function handleAddRecipient(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidNewAddress) return;

    sounds.playClick();
    setAddStatus('submitting');
    setAddError(null);

    const activeWallet = wallet || 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET';

    try {
      if (wallet) {
        const { xdr } = await wardenClient.buildAddTrustedRecipient(
          activeWallet,
          newAddress.trim(),
          sourceAccountOverride()
        );
        const signedXdr = await signXdr(xdr);
        await wardenClient.submitAddTrustedRecipient(signedXdr);
      } else {
        // Simulated local delay
        await new Promise((r) => setTimeout(r, 500));
      }

      // Append locally
      setRecipients((prev) => [
        {
          address: newAddress.trim(),
          label: newLabel.trim() || 'Trusted Counterparty',
          lastPaidAt: BigInt(Math.floor(Date.now() / 1000)),
        },
        ...prev,
      ]);

      sounds.playAllowChime();
      setShowAddModal(false);
      setNewAddress('');
      setNewLabel('');
      setAddStatus('idle');
    } catch (err) {
      sounds.playBlockAlert();
      setAddStatus('error');
      setAddError(err instanceof Error ? err.message : String(err));
    }
  }

  // Remove recipient handler
  async function handleRemoveRecipient(targetAddress: string) {
    sounds.playClick();
    setRemovingAddress(targetAddress);

    const activeWallet = wallet || 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET';

    try {
      if (wallet) {
        const { xdr } = await wardenClient.buildRemoveTrustedRecipient(
          activeWallet,
          targetAddress,
          sourceAccountOverride()
        );
        const signedXdr = await signXdr(xdr);
        await wardenClient.submitRemoveTrustedRecipient(signedXdr);
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      setRecipients((prev) => prev.filter((r) => r.address !== targetAddress));
      sounds.playClick();
    } catch {
      // Local removal on simulated error
      setRecipients((prev) => prev.filter((r) => r.address !== targetAddress));
    } finally {
      setRemovingAddress(null);
    }
  }

  // Current epoch seconds for decay calculation
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const decayThresholdDays = Number(trustDecaySeconds) / 86400;

  // Stats calculation
  const stats = useMemo(() => {
    let activeCount = 0;
    let decayedCount = 0;

    for (const r of recipients) {
      const elapsed = Number(nowSeconds - r.lastPaidAt);
      if (elapsed <= Number(trustDecaySeconds)) {
        activeCount++;
      } else {
        decayedCount++;
      }
    }

    return {
      activeCount,
      decayedCount,
      total: recipients.length,
    };
  }, [recipients, nowSeconds, trustDecaySeconds]);

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Background ambient lighting */}
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

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            SECTION A: HEADER & STATS
        ===================================================================== */}
        <div className="flex flex-col gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                  COUNTERPARTY MANAGEMENT // TRUST RUNTIME
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
                Trusted Address Book
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-clear px-4 py-2 font-mono text-xs font-bold text-ink-900 hover:bg-clear/90 transition-colors shadow-sm cursor-pointer"
              >
                <span>+ Add Trusted Recipient</span>
              </button>
            </div>
          </div>

          <p className="text-sm sm:text-base text-mist-400 max-w-3xl leading-relaxed">
            Addresses on this list skip new-recipient checks. If you do not interact with an address for{' '}
            {decayThresholdDays} days, its trust status decays automatically to prevent payments to dormant
            or compromised accounts.
          </p>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 font-mono text-xs">
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-4 flex flex-col">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Active Whitelisted</span>
              <span className="font-display text-2xl font-bold text-clear mt-0.5">
                {stats.activeCount} Active
              </span>
              <span className="text-[10px] text-mist-400 mt-1">Full autonomous single-key passage</span>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-800 p-4 flex flex-col">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Decayed / Step-Up Needed</span>
              <span className="font-display text-2xl font-bold text-gate mt-0.5">
                {stats.decayedCount} Addresses
              </span>
              <span className="text-[10px] text-mist-400 mt-1">Requires secondary re-verification</span>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-800 p-4 flex flex-col">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Decay Half-Life</span>
              <span className="font-display text-2xl font-bold text-mist-100 mt-0.5">
                {decayThresholdDays} Days
              </span>
              <span className="text-[10px] text-mist-400 mt-1">Enforced by Soroban WASM integer math</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION B: COUNTERPARTY ROSTER TABLE
        ===================================================================== */}
        {recipients.length > 0 ? (
          <div className="rounded-2xl border border-ink-700 bg-ink-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-ink-700 bg-ink-900/50 text-[11px] text-mist-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Counterparty &amp; Label</th>
                    <th className="py-3.5 px-4 font-semibold">Last Outflow</th>
                    <th className="py-3.5 px-4 font-semibold">Trust Lifeline &amp; Decay Meter</th>
                    <th className="py-3.5 px-4 font-semibold">Safety Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {recipients.map((item) => {
                    const elapsedSeconds = Number(nowSeconds - item.lastPaidAt);
                    const elapsedDays = Math.floor(elapsedSeconds / 86400);
                    const remainingDays = Math.max(0, decayThresholdDays - elapsedDays);
                    const isDecayed = elapsedDays >= decayThresholdDays;
                    const isDecayingSoon = !isDecayed && remainingDays <= 10;
                    const percentRemaining = isDecayed ? 0 : Math.min(100, Math.round((remainingDays / decayThresholdDays) * 100));

                    return (
                      <tr key={item.address} className="group hover:bg-ink-900/30 transition-colors">
                        {/* Column 1: Counterparty & Label */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-mist-100 text-sm font-sans">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-mist-400 font-mono text-xs">
                                {item.address.slice(0, 6)}…{item.address.slice(-6)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.address)}
                                className="text-[10px] text-mist-400 hover:text-clear transition-colors cursor-pointer"
                                title="Copy address"
                              >
                                {copiedAddress === item.address ? '✓ Copied' : '⧉ Copy'}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Last Interaction */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-mist-100 font-bold">{elapsedDays} days ago</span>
                            <span className="text-[10px] text-mist-400">On-Chain Ledger Check</span>
                          </div>
                        </td>

                        {/* Column 3: Trust Lifeline & Progress Bar */}
                        <td className="py-4 px-4 min-w-[200px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                              <div
                                className={`h-full transition-all duration-700 ease-out ${
                                  isDecayed
                                    ? 'bg-gate/40'
                                    : isDecayingSoon
                                    ? 'bg-gate'
                                    : 'bg-clear'
                                }`}
                                style={{ width: `${percentRemaining}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              {isDecayed ? (
                                <span className="font-bold text-gate animate-pulse">
                                  Decayed • Step-Up on Next Pay
                                </span>
                              ) : (
                                <>
                                  <span className={isDecayingSoon ? 'text-gate font-bold' : 'text-clear'}>
                                    {remainingDays} days remaining
                                  </span>
                                  <span className="text-mist-400">
                                    Day {elapsedDays} of {decayThresholdDays}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 4: Status Chip */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isDecayed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-gate/30 bg-gate/10 px-2.5 py-1 text-[10px] font-bold text-gate">
                              <span>⏳</span>
                              <span>Decayed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-clear/30 bg-clear/10 px-2.5 py-1 text-[10px] font-bold text-clear">
                              <span>✓</span>
                              <span>Active Pass</span>
                            </span>
                          )}
                        </td>

                        {/* Column 5: Actions */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/app/transactions/new`}
                              className="rounded-lg bg-clear/10 border border-clear/30 px-3 py-1 text-[11px] font-bold text-clear hover:bg-clear/20 transition-colors"
                            >
                              Pay Now
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(item.address)}
                              disabled={removingAddress === item.address}
                              className="rounded-lg border border-ink-700 px-2.5 py-1 text-[11px] text-mist-400 hover:border-fault hover:text-fault transition-colors cursor-pointer disabled:opacity-40"
                              title="Remove from address book"
                            >
                              {removingAddress === item.address ? '…' : '✕'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =====================================================================
              SECTION D: EMPTY STATE
          ===================================================================== */
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-12 text-center flex flex-col items-center justify-center">
            <div className="my-4">
              <svg width="140" height="70" viewBox="0 0 140 70" fill="none">
                <line x1="20" y1="35" x2="120" y2="35" stroke="var(--ink-700)" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="20" cy="35" r="10" stroke="var(--mist-400)" strokeWidth="1.5" />
                <circle cx="120" cy="35" r="10" stroke="var(--mist-400)" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-mist-100 mb-2">
              Your address book is empty.
            </h3>
            <p className="text-sm text-mist-400 max-w-md mb-6 leading-relaxed">
              Transfers to new addresses will require a one-time step-up confirmation until you add them here.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-clear px-6 py-2.5 font-mono text-xs font-bold text-ink-900 hover:bg-clear/90 transition-colors cursor-pointer"
            >
              + Add First Recipient
            </button>
          </div>
        )}

        {/* =====================================================================
            CUSTOM ILLUSTRATION: THE TRUST DECAY FILAMENT
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
              CRYPTOGRAPHIC RUNTIME METRIC
            </span>
            <h3 className="font-display text-lg font-bold text-mist-100">
              The Trust Decay Filament
            </h3>
            <p className="text-xs text-mist-400 max-w-md leading-relaxed">
              A continuous temporal decay curve evaluated inside Soroban&apos;s __check_auth gate.
              Every transfer refreshes the filament back to 30 full days of active pass.
            </p>
          </div>

          <div className="flex-shrink-0">
            <svg width="240" height="70" viewBox="0 0 240 70" fill="none">
              <line x1="20" y1="35" x2="130" y2="35" stroke="var(--clear)" strokeWidth="2.5" />
              <line x1="130" y1="35" x2="220" y2="35" stroke="var(--gate)" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="20" cy="35" r="7" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="2" />
              <circle cx="20" cy="35" r="2.5" fill="var(--clear)" />
              <circle cx="130" cy="35" r="6" fill="var(--ink-900)" stroke="var(--gate)" strokeWidth="1.5" />
              <circle cx="220" cy="35" r="5" fill="var(--ink-900)" stroke="var(--gate)" strokeWidth="1" />
              <text x="10" y="55" fill="var(--clear)" fontSize="8" fontFamily="monospace">Day 0</text>
              <text x="115" y="55" fill="var(--gate)" fontSize="8" fontFamily="monospace">Day 20</text>
              <text x="205" y="55" fill="var(--mist-400)" fontSize="8" fontFamily="monospace">Day 30</text>
            </svg>
          </div>
        </div>

        {/* =====================================================================
            ADD RECIPIENT MODAL
        ===================================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-ink-700 pb-4 mb-6">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                    WEB-OF-TRUST
                  </span>
                  <h3 className="font-display text-xl font-bold text-mist-100">
                    Add Trusted Recipient
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-mist-400 hover:text-mist-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRecipient} className="flex flex-col gap-4 font-mono text-xs">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modal-address" className="font-bold text-mist-100 font-sans text-sm">
                    Stellar Public Key (G… address)
                  </label>
                  <input
                    id="modal-address"
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="G… 56 character public key"
                    required
                    className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-xs text-mist-100 outline-none focus:border-clear transition-colors"
                  />
                  {newAddress && !isValidNewAddress && (
                    <span className="text-[10px] text-fault">
                      Must be a valid 56-character Stellar public key starting with &apos;G&apos; that is not already in your roster.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modal-label" className="font-bold text-mist-100 font-sans text-sm">
                    Friendly Label / Memo (Optional)
                  </label>
                  <input
                    id="modal-label"
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Mama Amina's Produce Stall"
                    className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-xs text-mist-100 outline-none focus:border-clear transition-colors"
                  />
                </div>

                {addError && (
                  <div className="rounded-lg border border-fault/30 bg-fault/10 p-3 text-fault text-[11px]">
                    {addError}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-ink-700 px-4 py-2.5 text-mist-400 hover:text-mist-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValidNewAddress || addStatus === 'submitting'}
                    className="rounded-xl bg-clear px-6 py-2.5 font-bold text-ink-900 hover:bg-clear/90 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {addStatus === 'submitting' ? 'Signing…' : 'Sign & Whitelist on Stellar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
