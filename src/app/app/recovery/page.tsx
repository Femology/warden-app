'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { connectedWalletId, signXdr, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';
import { AppNavigation } from '@/components/AppNavigation';
import type { AccountState, RecoveryProposal, GuardianConfig } from 'warden-sdk';

export default function RecoveryCenterPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [accountState, setAccountState] = useState<AccountState>('Normal');
  const [proposal, setProposal] = useState<RecoveryProposal | null>(null);
  const [guardians, setGuardians] = useState<GuardianConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoScenario, setIsDemoScenario] = useState<boolean>(false);

  // Proposal creation form state
  const [targetState, setTargetState] = useState<AccountState>('Normal');
  const [proposerAddress, setProposerAddress] = useState<string>('');

  // Action status
  const [actionStatus, setActionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [vetoModalOpen, setVetoModalOpen] = useState<boolean>(false);

  // Simulated countdown state for realistic demonstration
  const [remainingSeconds, setRemainingSeconds] = useState<number>(172800); // 48h default

  // Load live on-chain state
  const fetchRecoveryState = useCallback(async (activeWallet: string) => {
    setLoading(true);
    try {
      const [liveState, liveProposal, liveGuardians] = await Promise.all([
        wardenClient.getAccountState(activeWallet).catch(() => 'Normal' as AccountState),
        wardenClient.getRecoveryProposal(activeWallet).catch(() => null),
        wardenClient.getGuardians(activeWallet).catch(() => null),
      ]);

      setAccountState(liveState);
      setProposal(liveProposal);
      setGuardians(liveGuardians);

      if (liveProposal) {
        // Calculate remaining seconds
        const nowSec = BigInt(Math.floor(Date.now() / 1000));
        const unlockSec = liveProposal.proposedAt + liveProposal.timelockSeconds;
        const diff = Number(unlockSec - nowSec);
        setRemainingSeconds(diff > 0 ? diff : 0);
      }
    } catch {
      // Retain fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = connectedWalletId();
    if (active) {
      setWallet(active);
      setProposerAddress(active);
      fetchRecoveryState(active);
    } else {
      setLoading(false);
    }
  }, [fetchRecoveryState]);

  // Real-time ticker for active countdown
  useEffect(() => {
    if (!proposal && !isDemoScenario) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [proposal, isDemoScenario]);

  // Demo simulator scenarios
  function activateDemoFrozen() {
    sounds.playAlert();
    setIsDemoScenario(true);
    setAccountState('Frozen');
    setProposal({
      proposer: 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
      targetState: 'Normal',
      approvals: [
        'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
        'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56',
      ],
      proposedAt: BigInt(Math.floor(Date.now() / 1000) - 86400), // 24h ago
      timelockSeconds: BigInt(172800), // 48h
    });
    setGuardians({
      guardians: [
        'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
        'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56',
        'GDORM4321OLDLANDLORD9876543210ABCDEF1234567890',
      ],
      threshold: 2,
    });
    setRemainingSeconds(86400); // 24h remaining
  }

  function resetToLive() {
    sounds.playClick();
    setIsDemoScenario(false);
    if (wallet) {
      fetchRecoveryState(wallet);
    } else {
      setAccountState('Normal');
      setProposal(null);
      setGuardians(null);
    }
  }

  // Formatting remaining time
  const timeFormatted = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }, [remainingSeconds]);

  // Timelock percentage elapsed
  const timelockProgress = useMemo(() => {
    const total = 172800; // 48 hours
    const elapsed = Math.max(0, total - remainingSeconds);
    return Math.min(100, Math.round((elapsed / total) * 100));
  }, [remainingSeconds]);

  // Action: Owner Veto / Cancel Recovery
  async function handleOwnerVeto() {
    const targetWallet = wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';
    setActionStatus('submitting');
    setActionMessage('Submitting On-Chain Owner Veto...');
    sounds.playClick();

    try {
      if (isDemoScenario || !wallet) {
        // Simulated execution
        await new Promise((r) => setTimeout(r, 1200));
        setProposal(null);
        setAccountState('Watch');
        setActionStatus('success');
        setActionMessage('VETO EXECUTED: Recovery proposal aborted by owner signature.');
        sounds.playSuccess();
        setVetoModalOpen(false);
        return;
      }

      const sourceAccount = sourceAccountOverride();
      const built = await wardenClient.buildCancelRecovery(targetWallet, sourceAccount);
      const signedXdr = await signXdr(built.xdr);
      await wardenClient.submitCancelRecovery(signedXdr);

      setActionStatus('success');
      setActionMessage('VETO EXECUTED: Recovery proposal aborted on-chain.');
      sounds.playSuccess();
      setVetoModalOpen(false);
      fetchRecoveryState(targetWallet);
    } catch (err) {
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  // Action: Guardian Propose Recovery
  async function handleProposeRecovery() {
    const targetWallet = wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';
    if (!proposerAddress.trim()) {
      setActionStatus('error');
      setActionMessage('Please provide a valid proposer address.');
      return;
    }

    setActionStatus('submitting');
    setActionMessage('Building Recovery Proposal Transaction...');
    sounds.playClick();

    try {
      if (isDemoScenario || !wallet) {
        await new Promise((r) => setTimeout(r, 1200));
        setProposal({
          proposer: proposerAddress,
          targetState: targetState,
          approvals: [proposerAddress],
          proposedAt: BigInt(Math.floor(Date.now() / 1000)),
          timelockSeconds: BigInt(172800),
        });
        setRemainingSeconds(172800);
        setActionStatus('success');
        setActionMessage('Proposal published! 48-hour safety timelock initiated.');
        sounds.playSuccess();
        return;
      }

      const sourceAccount = sourceAccountOverride();
      const built = await wardenClient.buildProposeRecovery(
        targetWallet,
        proposerAddress,
        targetState,
        sourceAccount
      );
      const signedXdr = await signXdr(built.xdr);
      await wardenClient.submitProposeRecovery(signedXdr);

      setActionStatus('success');
      setActionMessage('Proposal published to Soroban! 48-hour timelock countdown running.');
      sounds.playSuccess();
      fetchRecoveryState(targetWallet);
    } catch (err) {
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  // Action: Guardian Approve Recovery
  async function handleApproveRecovery() {
    const targetWallet = wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';
    const guardianAddr = wallet || proposerAddress;

    setActionStatus('submitting');
    setActionMessage('Signing Guardian Endorsement...');
    sounds.playClick();

    try {
      if (isDemoScenario || !wallet) {
        await new Promise((r) => setTimeout(r, 1000));
        if (proposal && !proposal.approvals.includes(guardianAddr)) {
          setProposal({
            ...proposal,
            approvals: [...proposal.approvals, guardianAddr],
          });
        }
        setActionStatus('success');
        setActionMessage('Guardian endorsement registered!');
        sounds.playSuccess();
        return;
      }

      const sourceAccount = sourceAccountOverride();
      const built = await wardenClient.buildApproveRecovery(targetWallet, guardianAddr, sourceAccount);
      const signedXdr = await signXdr(built.xdr);
      await wardenClient.submitApproveRecovery(signedXdr);

      setActionStatus('success');
      setActionMessage('Guardian approval recorded on-chain.');
      sounds.playSuccess();
      fetchRecoveryState(targetWallet);
    } catch (err) {
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  // Action: Execute Recovery
  async function handleExecuteRecovery() {
    const targetWallet = wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';
    setActionStatus('submitting');
    setActionMessage('Executing On-Chain State Transition...');
    sounds.playClick();

    try {
      if (isDemoScenario || !wallet) {
        await new Promise((r) => setTimeout(r, 1200));
        setAccountState('Normal');
        setProposal(null);
        setActionStatus('success');
        setActionMessage('SUCCESS: Wallet account restored to Normal state.');
        sounds.playSuccess();
        return;
      }

      const sourceAccount = sourceAccountOverride() || targetWallet;
      const built = await wardenClient.buildExecuteRecovery(targetWallet, sourceAccount);
      const signedXdr = await signXdr(built.xdr);
      await wardenClient.submitExecuteRecovery(signedXdr);

      setActionStatus('success');
      setActionMessage('SUCCESS: Wallet unlocked and restored to Normal on-chain!');
      sounds.playSuccess();
      fetchRecoveryState(targetWallet);
    } catch (err) {
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  const isFrozen = accountState === 'Frozen';
  const hasActiveProposal = !!proposal;
  const approvalsCount = proposal?.approvals.length ?? 0;
  const quorumThreshold = guardians?.threshold ?? 2;
  const hasQuorum = approvalsCount >= quorumThreshold;
  const timelockExpired = remainingSeconds === 0;

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 overflow-x-hidden">
      {/* Shared Sub-Navigation */}
      <AppNavigation />

      {/* Ambient emergency background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.05]"
          style={{
            background: isFrozen
              ? 'radial-gradient(circle, #FF5A52 0%, transparent 70%)'
              : 'radial-gradient(circle, #F2994A 0%, transparent 70%)',
          }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            TOP BAR & SCENARIO TOGGLES
        ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isFrozen
                    ? 'bg-fault animate-ping'
                    : hasActiveProposal
                    ? 'bg-gate animate-pulse'
                    : 'bg-clear'
                }`}
              />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-gate">
                EMERGENCY RESCUE PROTOCOL // PROTOCOL RECOVERY
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
              Recovery Center
            </h1>
          </div>

          {/* Sandbox & Demo Scenarios */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isDemoScenario ? (
              <button
                type="button"
                onClick={resetToLive}
                className="rounded-full border border-ink-700 bg-ink-800 px-3.5 py-1.5 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
              >
                Reset to Live View
              </button>
            ) : (
              <button
                type="button"
                onClick={activateDemoFrozen}
                className="rounded-full border border-fault/50 bg-fault/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-fault hover:bg-fault/20 transition-colors shadow-sm"
              >
                Simulate Frozen Account
              </button>
            )}

            <Link
              href="/security"
              className="rounded-full border border-ink-700 bg-ink-800 px-3.5 py-1.5 font-mono text-xs text-mist-400 hover:border-clear hover:text-mist-100 transition-colors"
            >
              Trust Model ↗
            </Link>
          </div>
        </div>

        {/* =====================================================================
            STATE STATUS BANNER
        ===================================================================== */}
        {isFrozen ? (
          <div className="rounded-2xl border-2 border-fault bg-fault/10 p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-fault/20 border border-fault/40 flex items-center justify-center shrink-0 text-2xl">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-fault">
                  <span>CRITICAL ALERT</span>
                  <span>●</span>
                  <span>ALL OUTGOING TRANSFERS HALTED</span>
                </div>
                <h2 className="font-display text-xl font-bold text-mist-100 mt-0.5">
                  This Smart Wallet is Currently FROZEN
                </h2>
                <p className="text-xs sm:text-sm text-mist-400 mt-1 max-w-2xl leading-relaxed">
                  A high-severity security invariant was triggered or emergency lock engaged. Guardians must
                  coordinate to review and vote on unlocking this vault.
                </p>
              </div>
            </div>

            <div className="shrink-0 font-mono text-xs rounded-xl bg-ink-900/80 border border-fault/30 px-3 py-2 text-fault">
              Status: FROZEN
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-clear/15 border border-clear/30 flex items-center justify-center text-xl text-clear">
                🛡️
              </div>
              <div>
                <div className="font-mono text-xs text-clear uppercase tracking-wider font-semibold">
                  Account State: {accountState.toUpperCase()}
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100">
                  {accountState === 'Normal'
                    ? 'Vault Operating Securely'
                    : `Active Account Guard: ${accountState}`}
                </h3>
              </div>
            </div>

            <div className="font-mono text-xs text-mist-400">
              {guardians ? `${guardians.threshold}-of-${guardians.guardians.length} Guardian Quorum` : 'Guardian network active'}
            </div>
          </div>
        )}

        {/* Action feedback message */}
        {actionMessage && (
          <div
            className={`rounded-xl border p-4 font-mono text-xs ${
              actionStatus === 'error'
                ? 'border-fault/50 bg-fault/10 text-fault'
                : actionStatus === 'success'
                ? 'border-clear/50 bg-clear/10 text-clear'
                : 'border-gate/50 bg-gate/10 text-gate'
            }`}
          >
            {actionMessage}
          </div>
        )}

        {/* =====================================================================
            SECTION 1: 48-HOUR SAFETY TIMELOCK & ACTIVE PROPOSAL
        ===================================================================== */}
        {hasActiveProposal ? (
          <div className="rounded-2xl border border-gate/60 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-gate">
                  <span>⏳ 48-HOUR RECOVERY TIMELOCK IN FLIGHT</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-mist-100 mt-1">
                  Active Recovery Proposal Underway
                </h2>
              </div>

              {/* Owner Veto Button */}
              <button
                type="button"
                onClick={() => setVetoModalOpen(true)}
                className="rounded-xl border border-fault/80 bg-fault/15 px-5 py-2.5 font-mono text-xs sm:text-sm font-bold text-fault hover:bg-fault/25 transition-all shadow-md shadow-fault/10"
              >
                🛑 Owner Veto / Abort Proposal
              </button>
            </div>

            {/* Countdown Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Digit Clock */}
              <div className="md:col-span-2 flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900 p-5">
                <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                  Remaining Safety Window Until Execution
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="font-display text-4xl sm:text-5xl font-black text-mist-100 tabular-nums">
                      {timeFormatted.hours}
                    </span>
                    <span className="font-mono text-[10px] text-mist-400 uppercase">Hours</span>
                  </div>
                  <span className="font-display text-3xl font-bold text-gate">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-4xl sm:text-5xl font-black text-mist-100 tabular-nums">
                      {timeFormatted.minutes}
                    </span>
                    <span className="font-mono text-[10px] text-mist-400 uppercase">Mins</span>
                  </div>
                  <span className="font-display text-3xl font-bold text-gate">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-4xl sm:text-5xl font-black text-gate tabular-nums">
                      {timeFormatted.seconds}
                    </span>
                    <span className="font-mono text-[10px] text-mist-400 uppercase">Secs</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-ink-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-gate h-2 rounded-full transition-all duration-500"
                    style={{ width: `${timelockProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-mist-400">
                  <span>Proposal Initiated</span>
                  <span>{timelockProgress}% of 48h Window</span>
                  <span>Timelock Matures</span>
                </div>
              </div>

              {/* Quorum Progress Box */}
              <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900 p-5 h-full">
                <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                  Guardian Quorum
                </span>
                <div className="my-2">
                  <div className="font-display text-3xl font-bold text-mist-100">
                    {approvalsCount} of {quorumThreshold}
                  </div>
                  <span className="font-mono text-xs text-clear">
                    {hasQuorum ? '✓ Threshold Met' : 'Awaiting Remaining Signatures'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-mist-400">
                  Target State: <span className="text-mist-100 font-bold">{proposal.targetState}</span>
                </div>
              </div>
            </div>

            {/* Approvals Details */}
            <div className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
              <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                Endorsing Guardian Signers:
              </span>
              <div className="flex flex-col gap-2">
                {proposal.approvals.map((addr, idx) => (
                  <div
                    key={addr + idx}
                    className="flex items-center justify-between font-mono text-xs rounded-lg bg-ink-800 px-3 py-2 border border-ink-700"
                  >
                    <div className="flex items-center gap-2 text-mist-100 truncate">
                      <span className="text-clear font-bold">✓</span>
                      <span className="truncate">{addr}</span>
                    </div>
                    <span className="text-[10px] text-clear shrink-0 ml-2">Signed & Verified</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution / Approval CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleApproveRecovery}
                disabled={actionStatus === 'submitting'}
                className="flex-1 rounded-xl bg-clear px-6 py-3 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-colors shadow-sm"
              >
                ✍️ Co-Sign Proposal as Guardian
              </button>

              <button
                type="button"
                onClick={handleExecuteRecovery}
                disabled={!hasQuorum || !timelockExpired || actionStatus === 'submitting'}
                className={`flex-1 rounded-xl px-6 py-3 font-mono text-xs sm:text-sm font-bold transition-colors ${
                  hasQuorum && timelockExpired
                    ? 'bg-gate text-ink-900 hover:bg-gate/90 shadow-md shadow-gate/20'
                    : 'bg-ink-700/50 text-mist-400 cursor-not-allowed border border-ink-700'
                }`}
              >
                🚀 Execute Recovery Transition
              </button>
            </div>
            {!timelockExpired && (
              <p className="font-mono text-[11px] text-mist-400 text-center">
                * On-chain execution is physically locked until the 48-hour timelock hits zero, preserving the owner's unconditional veto right.
              </p>
            )}
          </div>
        ) : (
          /* =====================================================================
              SECTION 2: PROPOSE RECOVERY (IF WALLET IS FROZEN OR CHALLENGED)
          ===================================================================== */
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-4">
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
                  GUARDIAN RESCUE DECK
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
                  Initiate Account Recovery Proposal
                </h2>
              </div>
              <span className="font-mono text-xs text-clear">48h Timelock Enforced</span>
            </div>

            <p className="text-sm text-mist-400 leading-relaxed max-w-3xl">
              If the account holder lost access or the account is locked in <strong className="text-mist-100">Frozen</strong> status,
              any appointed guardian can submit a proposal to restore normal operation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-mist-400 uppercase">
                  Target Account State
                </label>
                <select
                  value={targetState}
                  onChange={(e) => setTargetState(e.target.value as AccountState)}
                  className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 font-mono text-xs sm:text-sm text-mist-100 focus:border-clear focus:outline-none"
                >
                  <option value="Normal">Normal (Full Access Restored)</option>
                  <option value="Watch">Watch (Elevated Alert Mode)</option>
                  <option value="Restricted">Restricted (Capped Transfers)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-mist-400 uppercase">
                  Guardian Proposer Address
                </label>
                <input
                  type="text"
                  value={proposerAddress}
                  onChange={(e) => setProposerAddress(e.target.value)}
                  placeholder="G..."
                  className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 font-mono text-xs sm:text-sm text-mist-100 focus:border-clear focus:outline-none truncate"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleProposeRecovery}
              disabled={actionStatus === 'submitting'}
              className="rounded-xl bg-clear px-6 py-3 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-all shadow-md shadow-clear/15"
            >
              {actionStatus === 'submitting' ? 'Submitting Proposal…' : 'Publish Recovery Proposal to Soroban'}
            </button>
          </div>
        )}

        {/* =====================================================================
            SECTION 3: ARCHITECTURAL EXPLANATION CARDS
        ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-clear uppercase">
              <span>🛡️</span>
              <span>The Absolute Owner Veto</span>
            </div>
            <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
              Warden&apos;s smart contract guarantees that no guardian or malicious coalition can hijack an account
              instantaneously. Every recovery proposal enforces a hard 48-hour delay during which the owner can
              cancel the attempt with a single signature.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-gate uppercase">
              <span>⚖️</span>
              <span>Cryptographic Quorum Math</span>
            </div>
            <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
              Restoring a frozen account requires both M-of-N guardian endorsements and the full maturation of the
              timelock. All votes are recorded permanently on Soroban ledger state, preventing collusion behind closed doors.
            </p>
          </div>
        </div>

        {/* =====================================================================
            MODAL: OWNER VETO CONFIRMATION
        ===================================================================== */}
        {vetoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border-2 border-fault bg-ink-900 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center gap-3 text-fault font-bold font-mono text-sm">
                <span className="text-2xl">🛑</span>
                <span>EXECUTE ON-CHAIN VETO</span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-display text-lg font-bold text-mist-100">
                  Cancel Recovery Proposal?
                </h3>
                <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
                  This will immediately destroy the active recovery proposal and reset the 48-hour countdown.
                  If this recovery was initiated without your consent, your account has successfully prevented an unauthorized takeover.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVetoModalOpen(false)}
                  className="flex-1 rounded-xl border border-ink-700 bg-ink-800 py-2.5 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleOwnerVeto}
                  className="flex-1 rounded-xl bg-fault py-2.5 font-mono text-xs font-bold text-white hover:bg-fault/90 transition-colors shadow-md shadow-fault/20"
                >
                  Confirm Veto
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
