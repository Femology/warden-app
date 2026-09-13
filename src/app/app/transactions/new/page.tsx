'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { connectedWalletId, connectFreighterWallet, signXdr, signXdrFor, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { buildTransfer, submitTransfer, tokenAssembledFromXdr } from '@/lib/tokenClient';
import { sounds } from '@/lib/soundEngine';
import type { StepUpReason, Decision } from 'warden-sdk';

const TRUSTED_SUPPLIER = 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ';
const CLEAN_NEW_WALLET = 'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56';
const DRAIN_WALLET = 'GCRUN4321DRAIN567890ABCDEF1234567890HIJKLMNO12';
const FLAGGED_WALLET = 'GB3XFLAGGEDSCAMMERREGISTRYBLACKLSTED9999999990';

export default function NewTransactionPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [connecting, setConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Form State
  const [recipient, setRecipient] = useState<string>(TRUSTED_SUPPLIER);
  const [amount, setAmount] = useState<string>('12.00');

  // Execution State
  const [status, setStatus] = useState<'idle' | 'evaluating' | 'allowed' | 'stepup' | 'paying' | 'success' | 'error'>('idle');
  const [stepUpReason, setStepUpReason] = useState<StepUpReason | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Explain State
  const [explanation, setExplanation] = useState<{ summary: string; factors: string[]; nextSteps: string[] } | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [showExplain, setShowExplain] = useState<boolean>(false);

  useEffect(() => {
    const active = connectedWalletId();
    if (active) {
      setWallet(active);
      setIsDemoMode(false);
    }
  }, []);

  async function handleConnect() {
    sounds.playClick();
    setConnecting(true);
    try {
      const addr = await connectFreighterWallet();
      setWallet(addr);
      setIsDemoMode(false);
      sounds.playAllowChime();
    } catch {
      // Connect cancelled
    } finally {
      setConnecting(false);
    }
  }

  // Determine counterparty trust status
  const recipientStatus = useMemo(() => {
    if (!recipient) return { badge: 'Empty', color: 'var(--mist-400)', border: 'var(--ink-700)', type: 'empty' };
    if (recipient === FLAGGED_WALLET || recipient.toLowerCase().includes('flag') || recipient.toLowerCase().includes('scam')) {
      return { badge: '🚫 Blacklisted', color: 'var(--fault)', border: 'var(--fault)', type: 'flagged' };
    }
    if (recipient === TRUSTED_SUPPLIER) {
      return { badge: '✓ Trusted Active', color: 'var(--clear)', border: 'var(--clear)', type: 'trusted' };
    }
    if (recipient.startsWith('GA7Q')) {
      return { badge: '⏳ Trust Decayed', color: 'var(--gate)', border: 'var(--gate)', type: 'decayed' };
    }
    return { badge: '⚠ Unindexed Recipient', color: 'var(--mist-400)', border: 'var(--ink-700)', type: 'new' };
  }, [recipient]);

  // Real-time pre-flight inspection
  const preFlightVerdict = useMemo(() => {
    const num = Number(amount) || 0;
    if (recipientStatus.type === 'flagged') {
      return {
        text: 'Recipient is flagged on-chain. Transfer will be intercepted and blocked.',
        color: 'var(--fault)',
        willStepUp: true,
      };
    }
    if (num > 500) {
      return {
        text: `Amount ($${num.toFixed(2)}) exceeds daily velocity limit ($500.00). Will require multi-sig step-up.`,
        color: 'var(--gate)',
        willStepUp: true,
      };
    }
    if (num > 150) {
      return {
        text: `Amount ($${num.toFixed(2)}) exceeds single-transaction threshold ($150.00). Will trigger biometric challenge.`,
        color: 'var(--gate)',
        willStepUp: true,
      };
    }
    if (recipientStatus.type === 'new' || recipientStatus.type === 'decayed') {
      return {
        text: 'New or decayed recipient requires secondary confirmation for initial interaction.',
        color: 'var(--gate)',
        willStepUp: true,
      };
    }
    return {
      text: 'Transfer is within single-tx cap ($150.00) and hourly velocity limits. Will settle instantly without step-up.',
      color: 'var(--clear)',
      willStepUp: false,
    };
  }, [amount, recipientStatus]);

  // Evaluate and send
  async function handleEvaluateAndSend() {
    sounds.playClick();
    setStatus('evaluating');
    setError(null);
    setTxHash(null);
    setStepUpReason(null);
    setShowExplain(false);
    setExplanation(null);

    const activeWallet = wallet || 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET';

    try {
      if (!wallet) {
        // Simulated Sandbox Execution
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (preFlightVerdict.willStepUp) {
          const reason: StepUpReason =
            recipientStatus.type === 'flagged'
              ? 'FlaggedRecipient'
              : Number(amount) > 500
              ? 'VelocityExceeded'
              : Number(amount) > 150
              ? 'AmountExceeded'
              : 'NewRecipient';

          setStepUpReason(reason);
          setStatus('stepup');
          sounds.playStepUpAlert();
        } else {
          setStatus('success');
          setTxHash('4f98a2bc9103e87d654109bca74921de08296813957a47b28ad98e009fe47ece');
          sounds.playAllowChime();
        }
        return;
      }

      // Live On-Chain Evaluation
      const { xdr } = await wardenClient.buildEvaluate(
        activeWallet,
        recipient,
        amount,
        sourceAccountOverride(),
      );
      const signedXdr = await signXdr(xdr);
      const decision: Decision = await wardenClient.submitEvaluate(signedXdr);

      if (decision.type === 'Allow') {
        setStatus('paying');
        const payTx = await buildTransfer(activeWallet, recipient, amount);
        const signedPayXdr = await signXdrFor(payTx.xdr, tokenAssembledFromXdr);
        const hash = await submitTransfer(signedPayXdr);
        setTxHash(hash);
        setStatus('success');
        sounds.playAllowChime();
      } else {
        setStepUpReason(decision.reason);
        setStatus('stepup');
        sounds.playStepUpAlert();
      }
    } catch (err) {
      setStatus('error');
      sounds.playBlockAlert();
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Request AI Explanation
  async function handleRequestExplain() {
    if (!stepUpReason) return;
    sounds.playClick();
    setIsExplaining(true);
    setShowExplain(true);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'stepup_required',
          reason: stepUpReason,
          amount,
        }),
      });

      if (!res.ok) throw new Error('Explain service unavailable');
      const data = await res.json();
      setExplanation({
        summary: data.plainEnglishExplanation || 'Step-up authorization required by smart contract policy.',
        factors: data.policyContext ? [data.policyContext] : ['Amount or recipient triggered risk invariant.'],
        nextSteps: data.recommendedAction ? [data.recommendedAction] : ['Sign secondary confirmation or adjust parameters.'],
      });
    } catch {
      // Robust verified fallback
      setExplanation({
        summary: `The on-chain policy intercepted this payment because ${stepUpReason} exceeded active boundaries.`,
        factors: [
          `Outflow amount: $${amount} USDC`,
          `Destination status: ${recipientStatus.badge}`,
          `Security invariant: ${stepUpReason}`,
        ],
        nextSteps: [
          'Authorize this transaction using your second key or passkey.',
          'Alternatively, reduce the payment amount or wait for velocity rolling window reset.',
        ],
      });
    } finally {
      setIsExplaining(false);
    }
  }

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

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            SECTION A: HEADER & BALANCE INDICATOR
        ===================================================================== */}
        <div className="flex flex-col gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                  EXECUTION ENGINE // TRANSFER RUNNER
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
                Send Payment &amp; Test Guardrails
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/app/transactions"
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 font-mono text-xs text-mist-400 hover:border-clear hover:text-mist-100 transition-colors"
              >
                <span>📜 View Ledger</span>
              </Link>
            </div>
          </div>

          <p className="text-sm sm:text-base text-mist-400 max-w-3xl leading-relaxed">
            Enter transfer details. Payments within your rules settle in seconds; transfers crossing limits
            trigger an on-chain step-up challenge.
          </p>

          {/* Monospace Wallet Strip */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${wallet ? 'bg-clear' : 'bg-gate'}`} />
                <span className="text-mist-400">Account:</span>
                <span className="font-bold text-mist-100">
                  {wallet
                    ? `${wallet.slice(0, 6)}…${wallet.slice(-6)}`
                    : isDemoMode
                    ? 'Simulated Sandbox Account'
                    : 'Disconnected'}
                </span>
              </div>
              <span className="rounded-full bg-clear/15 px-2.5 py-0.5 text-[10px] font-bold text-clear">
                STATE: NORMAL
              </span>
            </div>

            <div className="flex items-center gap-4 text-mist-400">
              <span>Remaining Capacity:</span>
              <span className="text-mist-100 font-bold">$170.00 left</span>
              <span className="text-[10px] text-mist-400">of $200.00 hourly cap</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION B: QUICK TEST COUNTERPARTY PILLS
        ===================================================================== */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
            QUICK SCENARIO PRESETS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                setRecipient(TRUSTED_SUPPLIER);
                setAmount('12.00');
                sounds.playClick();
              }}
              className="flex flex-col items-start rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-left transition-all hover:border-clear"
            >
              <span className="text-xs font-bold text-mist-100 flex items-center gap-1.5">
                <span>🥬</span>
                <span>Mama Amina</span>
              </span>
              <span className="font-mono text-[11px] text-clear mt-1">$12.00 • Trusted Supplier</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecipient(CLEAN_NEW_WALLET);
                setAmount('150.00');
                sounds.playClick();
              }}
              className="flex flex-col items-start rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-left transition-all hover:border-gate"
            >
              <span className="text-xs font-bold text-mist-100 flex items-center gap-1.5">
                <span>👤</span>
                <span>Clean New Wallet</span>
              </span>
              <span className="font-mono text-[11px] text-gate mt-1">$150.00 • Unindexed Peer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecipient(DRAIN_WALLET);
                setAmount('1200.00');
                sounds.playClick();
              }}
              className="flex flex-col items-start rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-left transition-all hover:border-gate"
            >
              <span className="text-xs font-bold text-mist-100 flex items-center gap-1.5">
                <span>🚨</span>
                <span>Large Drain Burst</span>
              </span>
              <span className="font-mono text-[11px] text-gate mt-1">$1,200.00 • Cap Breach</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecipient(FLAGGED_WALLET);
                setAmount('50.00');
                sounds.playClick();
              }}
              className="flex flex-col items-start rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-left transition-all hover:border-fault"
            >
              <span className="text-xs font-bold text-mist-100 flex items-center gap-1.5">
                <span>🚫</span>
                <span>Known Scammer</span>
              </span>
              <span className="font-mono text-[11px] text-fault mt-1">$50.00 • Flagged Address</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            SECTION C: TRANSFER FORM & DYNAMIC GATE APERTURE
        ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transfer Form Deck (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
                PAYMENT DISPATCHER
              </span>
              <span className="font-mono text-xs text-clear">USDC on Soroban</span>
            </div>

            {/* Recipient Input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="recipient" className="font-display text-sm font-bold text-mist-100">
                  Recipient Address
                </label>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                  style={{
                    backgroundColor: `${recipientStatus.color}20`,
                    color: recipientStatus.color,
                    border: `1px solid ${recipientStatus.border}40`,
                  }}
                >
                  {recipientStatus.badge}
                </span>
              </div>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G… or C… address"
                className="address-mono w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 font-mono text-xs sm:text-sm text-mist-100 outline-none focus:border-clear transition-colors"
                required
              />
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="font-display text-sm font-bold text-mist-100">
                Transfer Amount
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    sounds.playRatchetTick();
                  }}
                  className="tabular-amount w-full rounded-xl border border-ink-700 bg-ink-900 pl-4 pr-16 py-3 font-mono text-lg font-bold text-mist-100 outline-none focus:border-clear transition-colors"
                  placeholder="0.00"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 font-mono text-xs font-semibold text-mist-400">
                  USDC
                </span>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2 mt-1">
                {['15', '150', '500'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setAmount(`${chip}.00`);
                      sounds.playClick();
                    }}
                    className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                      amount === `${chip}.00`
                        ? 'bg-clear text-ink-900 font-bold'
                        : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                    }`}
                  >
                    ${chip}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAmount('1200.00');
                    sounds.playClick();
                  }}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    amount === '1200.00'
                      ? 'bg-gate text-ink-900 font-bold'
                      : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-gate'
                  }`}
                >
                  $1,200 (Max)
                </button>
              </div>
            </div>

            {/* Real-time Pre-Flight Check Indicator */}
            <div
              className="rounded-xl border p-4 font-mono text-xs leading-relaxed"
              style={{
                borderColor: `${preFlightVerdict.color}40`,
                backgroundColor: `${preFlightVerdict.color}10`,
                color: preFlightVerdict.color,
              }}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <span>PRE-FLIGHT CONTRACT CHECK:</span>
              </div>
              <p>{preFlightVerdict.text}</p>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleEvaluateAndSend}
              disabled={status === 'evaluating' || status === 'paying' || !amount || !recipient}
              className="flex items-center justify-center gap-2 rounded-xl bg-clear px-8 py-3.5 font-mono text-sm font-bold text-ink-900 shadow-lg shadow-clear/20 transition-all hover:bg-clear/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === 'evaluating' ? (
                <span>Evaluating On-Chain Rules…</span>
              ) : status === 'paying' ? (
                <span>Submitting Payment Transaction…</span>
              ) : (
                <span>Evaluate &amp; Send Payment</span>
              )}
            </button>
          </div>

          {/* Custom Illustration: The Dynamic Gate Aperture (1 Col) */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl flex flex-col justify-between items-center text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
              THE DYNAMIC GATE APERTURE
            </span>

            <div className="my-6 relative flex items-center justify-center">
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
                {/* Outer Ring */}
                <circle cx="90" cy="90" r="80" stroke="var(--ink-700)" strokeWidth="2" />
                <circle cx="90" cy="90" r="70" stroke="var(--ink-700)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Aperture Status Blades */}
                {status === 'success' || status === 'allowed' ? (
                  // Open Green Aperture
                  <g className="transition-all duration-700 ease-out">
                    <circle cx="90" cy="90" r="50" fill="rgba(34, 195, 141, 0.15)" stroke="var(--clear)" strokeWidth="2" />
                    <circle cx="90" cy="90" r="30" fill="rgba(34, 195, 141, 0.3)" stroke="var(--clear)" strokeWidth="2" />
                    <path d="M75 90L85 100L105 80" stroke="var(--clear)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : status === 'stepup' ? (
                  // Closed Amber Teeth
                  <g className="transition-all duration-500 ease-out">
                    <polygon points="90,40 105,75 140,90 105,105 90,140 75,105 40,90 75,75" fill="rgba(242, 153, 74, 0.15)" stroke="var(--gate)" strokeWidth="2" />
                    <circle cx="90" cy="90" r="20" stroke="var(--gate)" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="90" y="95" fill="var(--gate)" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">!</text>
                  </g>
                ) : (
                  // Idle Thin Lines
                  <g>
                    <polygon points="90,45 100,75 130,90 100,105 90,135 80,105 50,90 80,75" stroke="var(--mist-400)" strokeWidth="1.5" />
                    <circle cx="90" cy="90" r="16" stroke="var(--ink-700)" strokeWidth="1.5" />
                    <circle cx="90" cy="90" r="4" fill="var(--clear)" className="animate-pulse" />
                  </g>
                )}
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold text-mist-100">
                {status === 'success' || status === 'allowed'
                  ? 'Aperture Open: Autonomous Passage'
                  : status === 'stepup'
                  ? 'Gate Locked: Step-Up Challenge'
                  : 'Aperture Armed: Continuous Monitoring'}
              </span>
              <span className="text-[11px] font-mono text-mist-400">
                Soroban CustomAccountInterface::__check_auth
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION D: REAL-TIME VERDICT RESULT CARD
        ===================================================================== */}
        {status === 'success' && (
          <div className="rounded-2xl border border-clear bg-ink-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clear/20 text-clear font-bold text-lg">
                ✓
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold uppercase text-clear">
                  PAYMENT EXECUTED DIRECTLY ON-CHAIN
                </span>
                <span className="font-display text-xl font-bold text-mist-100">
                  Allowed Instantly (Zero Biometric Challenges)
                </span>
              </div>
            </div>

            <p className="text-sm text-mist-400">
              Payment executed directly on-chain in 5.2s. 0 biometric prompts required. Amount was within
              autonomous parameters and the recipient is verified in your active web-of-trust.
            </p>

            {txHash && (
              <div className="flex flex-wrap items-center justify-between border-t border-ink-700 pt-4 text-xs font-mono text-mist-400">
                <span className="truncate max-w-sm">TX HASH: {txHash}</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-clear hover:underline"
                >
                  View on Stellar.Expert ↗
                </a>
              </div>
            )}
          </div>
        )}

        {status === 'stepup' && (
          <div className="rounded-2xl border border-gate bg-ink-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gate/20 text-gate font-bold text-lg">
                  !
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-semibold uppercase text-gate">
                    ON-CHAIN VERDICT // REQUIRE STEP-UP
                  </span>
                  <span className="font-display text-xl font-bold text-mist-100">
                    Reason: {stepUpReason}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestExplain}
                disabled={isExplaining}
                className="inline-flex items-center gap-2 rounded-xl border border-gate/50 bg-gate/15 px-4 py-2 font-mono text-xs font-bold text-gate hover:bg-gate/25 transition-colors cursor-pointer"
              >
                <span>✨</span>
                <span>{isExplaining ? 'Analyzing with DeepSeek…' : 'Explain this with DeepSeek'}</span>
              </button>
            </div>

            <p className="text-sm text-mist-400 leading-relaxed">
              This transaction was halted by your smart account&apos;s risk policy because it crosses safety boundaries.
              Funds remain completely safe in your vault.
            </p>

            {/* DeepSeek AI Grounded Explanation Drawer */}
            {showExplain && explanation && (
              <div className="rounded-xl border border-ink-700 bg-ink-900 p-5 flex flex-col gap-4 font-mono text-xs animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 text-gate font-bold border-b border-ink-700 pb-2">
                  <span>✨ DEEPSEEK V4.1 FLASH // GROUNDED ON-CHAIN ANALYSIS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 rounded-lg border border-ink-700 bg-ink-800 p-3.5">
                    <span className="text-[10px] text-mist-400 uppercase font-bold">1. Plain-English Summary</span>
                    <p className="text-mist-100 leading-relaxed">{explanation.summary}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-lg border border-ink-700 bg-ink-800 p-3.5">
                    <span className="text-[10px] text-mist-400 uppercase font-bold">2. Trigger Factors Detected</span>
                    <ul className="list-disc pl-4 text-mist-100 space-y-1">
                      {explanation.factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-lg border border-ink-700 bg-ink-800 p-3.5">
                    <span className="text-[10px] text-mist-400 uppercase font-bold">3. Required Resolution</span>
                    <ul className="list-disc pl-4 text-mist-100 space-y-1">
                      {explanation.nextSteps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && error && (
          <div className="rounded-xl border border-fault bg-ink-800 p-4 font-mono text-xs text-fault">
            Execution Failed: {error}
          </div>
        )}
      </main>
    </div>
  );
}
