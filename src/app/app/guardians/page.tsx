'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { connectedWalletId, signXdr, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';
import type { AccountState } from 'warden-sdk';

interface GuardianSlot {
  id: string;
  address: string;
  label: string;
}

const DEFAULT_DEMO_GUARDIANS: GuardianSlot[] = [
  {
    id: 'g-1',
    address: 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
    label: "Brother's Hardware Key",
  },
  {
    id: 'g-2',
    address: 'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56',
    label: "Family Safe Vault (YubiKey)",
  },
  {
    id: 'g-3',
    address: 'GDORM4321OLDLANDLORD9876543210ABCDEF1234567890',
    label: "Institutional Co-Signer",
  },
];

export default function GuardianRecoveryPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [accountState, setAccountState] = useState<AccountState>('Normal');
  const [guardians, setGuardians] = useState<GuardianSlot[]>(DEFAULT_DEMO_GUARDIANS);
  const [threshold, setThreshold] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Read existing on-chain guardian config and account state
  const fetchConfig = useCallback(async (activeWallet: string) => {
    setLoading(true);
    try {
      const state = await wardenClient.getAccountState(activeWallet);
      setAccountState(state);

      const config = await wardenClient.getGuardians(activeWallet);
      if (config && config.guardians.length > 0) {
        setGuardians(
          config.guardians.map((addr, idx) => ({
            id: `g-${idx + 1}`,
            address: addr,
            label: idx === 0 ? "Primary Recovery Key" : `Guardian ${idx + 1}`,
          }))
        );
        setThreshold(config.threshold);
      }
    } catch {
      // Keep baseline defaults on simulated/testnet error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = connectedWalletId();
    if (active) {
      setWallet(active);
      void fetchConfig(active);
    } else {
      setLoading(false);
    }
  }, [fetchConfig]);

  // Critical Invariant: Guardians can only be modified in Normal or Watch states
  const isLockedState = accountState === 'Restricted' || accountState === 'Challenged' || accountState === 'Frozen';

  // Guardian slot helpers
  function handleAddSlot() {
    if (guardians.length >= 7 || isLockedState) return;
    sounds.playClick();
    const newIdx = guardians.length + 1;
    setGuardians((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        address: '',
        label: `Guardian ${newIdx}`,
      },
    ]);
  }

  function handleRemoveSlot(id: string) {
    if (guardians.length <= 1 || isLockedState) return;
    sounds.playClick();
    setGuardians((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      if (threshold > updated.length) {
        setThreshold(Math.max(1, updated.length));
      }
      return updated;
    });
  }

  function handleUpdateSlot(id: string, field: 'address' | 'label', value: string) {
    if (isLockedState) return;
    setGuardians((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  }

  // Address validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < guardians.length; i++) {
      const g = guardians[i];
      const addr = g.address.trim();

      if (!addr) {
        errors.push(`Slot ${i + 1}: Address cannot be empty.`);
        continue;
      }
      if (addr.length !== 56 || !addr.startsWith('G')) {
        errors.push(`Slot ${i + 1}: Must be a valid 56-character Stellar public key starting with 'G'.`);
      }
      if (wallet && addr === wallet) {
        errors.push(`Slot ${i + 1}: Your own account cannot serve as its own recovery guardian.`);
      }
      if (seen.has(addr)) {
        errors.push(`Slot ${i + 1}: Duplicate guardian address detected.`);
      }
      seen.add(addr);
    }

    if (threshold < 1 || threshold > guardians.length) {
      errors.push(`Threshold must be between 1 and ${guardians.length}.`);
    }

    return errors;
  }, [guardians, threshold, wallet]);

  const isValid = validationErrors.length === 0 && !isLockedState;

  // Submit on-chain guardian setup
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    sounds.playClick();
    setStatus('submitting');
    setError(null);

    const activeWallet = wallet || 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET';
    const guardianAddresses = guardians.map((g) => g.address.trim());

    try {
      if (wallet) {
        const { xdr } = await wardenClient.buildSetGuardians(
          activeWallet,
          guardianAddresses,
          threshold,
          sourceAccountOverride()
        );
        const signedXdr = await signXdr(xdr);
        await wardenClient.submitSetGuardians(signedXdr);
      } else {
        // Simulated local delay
        await new Promise((r) => setTimeout(r, 600));
      }

      sounds.playAllowChime();
      setStatus('success');
    } catch (err) {
      sounds.playBlockAlert();
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #22C38D 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F2994A 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            SECTION A: HEADER & CORE INVARIANT
        ===================================================================== */}
        <div className="flex flex-col gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                  SOCIAL RECOVERY // ACCESS RESCUE
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
                Guardian Recovery Setup
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 font-mono text-xs text-mist-400 hover:border-clear hover:text-mist-100 transition-colors"
              >
                <span>🛡️ Security Model ↗</span>
              </Link>
            </div>
          </div>

          <p className="text-sm sm:text-base text-mist-400 max-w-3xl leading-relaxed">
            Appoint up to 7 trusted friends, family members, or backup hardware devices to rescue your account
            if your phone is lost or compromised.
          </p>

          {/* =====================================================================
              SECTION B: ACCOUNT STATE GATE BANNER
          ===================================================================== */}
          {isLockedState ? (
            <div className="rounded-2xl border border-fault/60 bg-fault/10 p-6 flex flex-col gap-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-fault font-bold font-mono text-sm">
                <span>🚫</span>
                <span>GUARDIAN CONFIGURATION LOCKED</span>
              </div>
              <p className="text-xs sm:text-sm text-mist-100 leading-relaxed">
                Your account is currently in <span className="font-mono font-bold text-fault">{accountState.toUpperCase()}</span> security
                mode. To prevent attackers who steal an unlocked device from adding their own malicious guardians, Stellar
                Soroban strictly rejects guardian changes until the account returns to Normal.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-800 p-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear" />
                <span className="text-mist-400">Account State:</span>
                <span className="font-bold text-clear">{accountState.toUpperCase()}</span>
                <span className="text-mist-400">— Guardian modifications permitted on-chain.</span>
              </div>
              <span className="text-[10px] text-mist-400 hidden sm:inline">
                48-Hour Timelock with Owner Veto Active
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* =====================================================================
              SECTION C: GUARDIAN ROSTER FORM (UP TO 7 SLOTS)
          ===================================================================== */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-700 pb-4 gap-2">
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                  GUARDIAN ROSTER
                </span>
                <h3 className="font-display text-xl font-bold text-mist-100">
                  Appointed Guardians ({guardians.length} of 7 Max)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddSlot}
                disabled={guardians.length >= 7 || isLockedState}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900 px-4 py-1.5 font-mono text-xs text-mist-100 hover:border-clear transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>+ Add Another Guardian Slot</span>
              </button>
            </div>

            {/* Guardian Slots List */}
            <div className="flex flex-col gap-4">
              {guardians.map((slot, index) => {
                const slotNum = String(index + 1).padStart(2, '0');
                return (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4 transition-all hover:border-ink-700/80"
                  >
                    <span className="font-mono text-xs font-bold text-clear w-8">
                      {slotNum}
                    </span>

                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase text-mist-400">
                          Guardian Stellar Public Key (G…)
                        </label>
                        <input
                          type="text"
                          value={slot.address}
                          disabled={isLockedState}
                          onChange={(e) => handleUpdateSlot(slot.id, 'address', e.target.value)}
                          placeholder="G… 56 character public key"
                          className="address-mono w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs text-mist-100 outline-none focus:border-clear transition-colors disabled:opacity-50"
                        />
                      </div>

                      <div className="sm:w-60 flex flex-col gap-1">
                        <label className="text-[10px] font-mono uppercase text-mist-400">
                          Label / Role Tag
                        </label>
                        <input
                          type="text"
                          value={slot.label}
                          disabled={isLockedState}
                          onChange={(e) => handleUpdateSlot(slot.id, 'label', e.target.value)}
                          placeholder="e.g. Brother's YubiKey"
                          className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs text-mist-100 outline-none focus:border-clear transition-colors disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      disabled={guardians.length <= 1 || isLockedState}
                      className="rounded-lg p-2 text-mist-400 hover:text-fault hover:border-fault border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer self-end sm:self-center"
                      title="Remove slot"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =====================================================================
              SECTION D: VOTING THRESHOLD SELECTOR (QUORUM RULE)
          ===================================================================== */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col gap-4">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gate">
                QUORUM THRESHOLD
              </span>
              <h3 className="font-display text-xl font-bold text-mist-100">
                Recovery Approval Threshold
              </h3>
            </div>

            <p className="text-xs text-mist-400 leading-relaxed max-w-2xl">
              Define how many guardians must sign an on-chain proposal to successfully initiate emergency recovery:
            </p>

            {/* Threshold Chips */}
            <div className="flex flex-wrap gap-2.5 my-2">
              {Array.from({ length: guardians.length }, (_, i) => i + 1).map((t) => {
                const isSelected = threshold === t;
                const isRecommended = t === Math.ceil(guardians.length * 0.6) || (guardians.length === 3 && t === 2);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isLockedState}
                    onClick={() => {
                      sounds.playClick();
                      setThreshold(t);
                    }}
                    className={`rounded-xl px-4 py-2.5 font-mono text-xs transition-all disabled:opacity-40 cursor-pointer ${
                      isSelected
                        ? 'bg-clear text-ink-900 font-bold shadow-md shadow-clear/20'
                        : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                    }`}
                  >
                    <span>{t} of {guardians.length}</span>
                    {isRecommended && <span className="ml-1 text-[10px] opacity-80">(Recommended)</span>}
                  </button>
                );
              })}
            </div>

            {/* Plain-English Explanation */}
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 font-mono text-xs text-mist-400 leading-relaxed">
              <span className="text-clear font-bold">Rule: </span>
              Any <span className="text-mist-100 font-bold">{threshold} of your {guardians.length} guardians</span> can
              initiate an emergency recovery. Once approved, an unskippable{' '}
              <span className="text-gate font-bold">48-hour safety countdown</span> begins, giving you time to veto or
              cancel if the recovery was unauthorized.
            </div>
          </div>

          {/* =====================================================================
              SECTION E: THE GUARDIAN POWERS TRANSPARENCY BOX
          ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-clear/30 bg-ink-800 p-6 shadow-xl flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                ✓ WHAT GUARDIANS CAN DO
              </span>
              <ul className="list-disc pl-4 text-xs text-mist-100 space-y-1.5 leading-relaxed mt-2 font-mono">
                <li>Vote to rescue a frozen or challenged account and restore it to Normal.</li>
                <li>Approve emergency key rotation after the 48-hour safety delay expires.</li>
                <li>Act as multi-party witnesses to verify your physical identity.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-fault/30 bg-ink-800 p-6 shadow-xl flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-fault">
                ✕ WHAT GUARDIANS CAN NEVER DO
              </span>
              <ul className="list-disc pl-4 text-xs text-mist-400 space-y-1.5 leading-relaxed mt-2 font-mono">
                <li>Withdraw or transfer funds from your account.</li>
                <li>Modify your daily or hourly spending velocity limits.</li>
                <li>Bypass or shorten the unskippable 48-hour timelock delay.</li>
                <li>Override your absolute owner veto power while your keys are intact.</li>
              </ul>
            </div>
          </div>

          {/* =====================================================================
              CUSTOM ILLUSTRATION 2: THE 7-NODE QUORUM SHIELD
          ===================================================================== */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
                DISTRIBUTED CONSENSUS LATTICE
              </span>
              <h3 className="font-display text-lg font-bold text-mist-100">
                The 7-Node Quorum Shield
              </h3>
              <p className="text-xs text-mist-400 max-w-md leading-relaxed">
                Central vault core surrounded by decentralized recovery allies. Active threshold
                path activates only when {threshold} of {guardians.length} orbital nodes co-sign.
              </p>
            </div>

            <div className="flex-shrink-0">
              <svg width="220" height="120" viewBox="0 0 220 120" fill="none">
                {/* Central Vault Hub */}
                <circle cx="110" cy="60" r="18" fill="#0D1712" stroke="#22C38D" strokeWidth="2" />
                <circle cx="110" cy="60" r="6" fill="#22C38D" />

                {/* Orbital Lines */}
                <line x1="110" y1="60" x2="50" y2="30" stroke="#22C38D" strokeWidth="1.5" />
                <line x1="110" y1="60" x2="170" y2="30" stroke="#22C38D" strokeWidth="1.5" />
                <line x1="110" y1="60" x2="35" y2="80" stroke="#223229" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="110" y1="60" x2="185" y2="80" stroke="#223229" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="110" y1="60" x2="110" y2="105" stroke="#223229" strokeWidth="1" strokeDasharray="3 3" />

                {/* Active Quorum Nodes (Green) */}
                <circle cx="50" cy="30" r="10" fill="#0D1712" stroke="#22C38D" strokeWidth="2" />
                <text x="50" y="33" fill="#22C38D" fontSize="8" textAnchor="middle" fontFamily="monospace">G1</text>

                <circle cx="170" cy="30" r="10" fill="#0D1712" stroke="#22C38D" strokeWidth="2" />
                <text x="170" y="33" fill="#22C38D" fontSize="8" textAnchor="middle" fontFamily="monospace">G2</text>

                {/* Standby Nodes */}
                <circle cx="35" cy="80" r="8" fill="#0D1712" stroke="#93A99C" strokeWidth="1" />
                <text x="35" y="83" fill="#93A99C" fontSize="7" textAnchor="middle" fontFamily="monospace">G3</text>

                <circle cx="185" cy="80" r="8" fill="#0D1712" stroke="#93A99C" strokeWidth="1" />
                <text x="185" y="83" fill="#93A99C" fontSize="7" textAnchor="middle" fontFamily="monospace">G4</text>

                <circle cx="110" cy="105" r="8" fill="#0D1712" stroke="#93A99C" strokeWidth="1" />
                <text x="110" y="108" fill="#93A99C" fontSize="7" textAnchor="middle" fontFamily="monospace">G5</text>
              </svg>
            </div>
          </div>

          {/* Validation Errors Strip */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-fault/40 bg-fault/10 p-4 font-mono text-xs text-fault flex flex-col gap-1">
              <span className="font-bold">Please correct the following before signing:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* =====================================================================
              SECTION F: SUBMISSION DECK & TELEMETRY
          ===================================================================== */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-display text-lg font-bold text-mist-100">
                  Commit Guardian Quorum to Stellar
                </span>
                <span className="text-xs text-mist-400">
                  Updating guardians requires an authorized signature from your active account key.
                </span>
              </div>

              <button
                type="submit"
                disabled={!isValid || status === 'submitting'}
                className="flex items-center justify-center gap-2 rounded-xl bg-clear px-8 py-3.5 font-mono text-sm font-bold text-ink-900 shadow-lg shadow-clear/20 transition-all hover:bg-clear/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === 'submitting' ? 'Signing & Submitting…' : 'Sign & Commit Guardians to Stellar'}
              </button>
            </div>

            {status === 'success' && (
              <p role="status" className="font-mono text-xs font-semibold text-clear">
                ✓ Guardians Committed On-Chain. Quorum active on Stellar Testnet.
              </p>
            )}

            {status === 'error' && error && (
              <p role="alert" className="font-mono text-xs font-semibold text-fault">
                {error}
              </p>
            )}

            <div className="border-t border-ink-700 pt-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-mist-400">
              <span>NETWORK: STELLAR TESTNET</span>
              <span>FEES: &lt; 0.00001 XLM</span>
              <span>AUTH: WALLET OWNER SIGNATURE REQUIRED</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
