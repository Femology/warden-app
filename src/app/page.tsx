'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fallbackExplanation } from 'warden-sdk';
import type { ExplanationInput, ExplanationResult, StepUpReason } from 'warden-sdk';
import { sounds } from '@/lib/soundEngine';

interface StoryPreset {
  id: string;
  pillLabel: string;
  title: string;
  amount: number;
  recipientType: 'trusted' | 'unknown' | 'flagged';
  velocityMode: 'first' | 'burst' | 'daily_max';
  description: string;
}

const PRESET_STORIES: StoryPreset[] = [
  {
    id: 'mama-amina',
    pillLabel: '🥬 Mama Amina (Groceries)',
    title: 'Routine Household Transfer',
    amount: 12,
    recipientType: 'trusted',
    velocityMode: 'first',
    description: 'A modest $12 transfer to a recognized merchant you pay weekly. Under threshold, trusted active recipient, zero prior spend today.',
  },
  {
    id: 'stolen-phone',
    pillLabel: '🚨 Stolen Phone Drain',
    title: 'Account Takeover Attempt',
    amount: 1200,
    recipientType: 'unknown',
    velocityMode: 'first',
    description: 'An attacker gains temporary phone access and attempts to siphon $1,200 to an unregistered address with zero transaction history.',
  },
  {
    id: 'rogue-ai',
    pillLabel: '🤖 Rogue AI Burst',
    title: 'Automated Agent Loop',
    amount: 150,
    recipientType: 'unknown',
    velocityMode: 'burst',
    description: 'An autonomous script or micro-payment agent loops unexpectedly, attempting its 4th transfer ($150) in 10 minutes.',
  },
  {
    id: 'blacklisted',
    pillLabel: '🚫 Blacklisted / Flagged Wallet',
    title: 'Sanctioned or Malicious Address',
    amount: 10,
    recipientType: 'flagged',
    velocityMode: 'first',
    description: 'Even a small $10 transfer triggers an immediate halt because the destination address is permanently cataloged on-chain.',
  },
  {
    id: 'custom',
    pillLabel: '⚙️ Custom',
    title: 'Manual Parameter Sandbox',
    amount: 250,
    recipientType: 'trusted',
    velocityMode: 'first',
    description: 'Directly adjust the dials below to inspect how the on-chain Soroban contract evaluates arbitrary risk vectors in real time.',
  },
];

// Reference safety limits modeled in the demo
const POLICY_LIMIT_SINGLE = 500;
const HOURLY_CAP = 200;
const DAILY_CAP = 500;

export default function Home() {
  const [selectedStory, setSelectedStory] = useState<string>('mama-amina');
  const [amount, setAmount] = useState<number>(12);
  const [recipientType, setRecipientType] = useState<'trusted' | 'unknown' | 'flagged'>('trusted');
  const [velocityMode, setVelocityMode] = useState<'first' | 'burst' | 'daily_max'>('first');

  // Interactive Security Ladder State
  const [activeLadderTier, setActiveLadderTier] = useState<string>('NORMAL');

  // AI Explain State
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Apply a preset story
  function handleSelectStory(story: StoryPreset) {
    sounds.playClick();
    setSelectedStory(story.id);
    setAmount(story.amount);
    setRecipientType(story.recipientType);
    setVelocityMode(story.velocityMode);
    setShowExplanation(false);
    setExplanation(null);

    // Play feedback tone based on risk
    if (story.recipientType === 'flagged') {
      sounds.playBlockAlert();
    } else if (story.amount > POLICY_LIMIT_SINGLE || story.recipientType === 'unknown' || story.velocityMode !== 'first') {
      sounds.playStepUpAlert();
    } else {
      sounds.playAllowChime();
    }
  }

  // Calculate prior spend based on velocity mode
  const priorSpentHourly = velocityMode === 'burst' ? 180 : 0;
  const priorSpentDaily = velocityMode === 'daily_max' ? 480 : velocityMode === 'burst' ? 180 : 0;

  const totalHourly = priorSpentHourly + amount;
  const totalDaily = priorSpentDaily + amount;

  // Determine on-chain verdict
  const verdict = useMemo(() => {
    // 1. Flagged recipient always halts
    if (recipientType === 'flagged') {
      return {
        status: 'blocked',
        reason: 'FlaggedRecipient' as StepUpReason,
        badge: 'REQUIRE STEP-UP',
        badgeColor: 'var(--fault)',
        badgeBg: 'color-mix(in srgb, var(--fault) 15%, transparent)',
        headline: 'Flagged / Malicious Address Detected',
        summary: 'Destination is permanently cataloged on the on-chain malicious registry. Instant transfer refused regardless of amount or balance.',
        isFlagged: true,
      };
    }

    // 2. Daily velocity breach
    if (totalDaily > DAILY_CAP) {
      return {
        status: 'stepup',
        reason: 'VelocityExceeded' as StepUpReason,
        badge: 'REQUIRE STEP-UP',
        badgeColor: 'var(--gate)',
        badgeBg: 'color-mix(in srgb, var(--gate) 15%, transparent)',
        headline: '24-Hour Velocity Cap Breached',
        summary: `Accumulated $${totalDaily} across 24h exceeds the $${DAILY_CAP} daily ceiling. Multi-signer confirmation required.`,
        isFlagged: false,
      };
    }

    // 3. Hourly velocity breach
    if (totalHourly > HOURLY_CAP) {
      return {
        status: 'stepup',
        reason: 'HourlyVelocityExceeded' as StepUpReason,
        badge: 'REQUIRE STEP-UP',
        badgeColor: 'var(--gate)',
        badgeBg: 'color-mix(in srgb, var(--gate) 15%, transparent)',
        headline: '1-Hour Rapid Velocity Spike',
        summary: `Burst spend of $${totalHourly}/hr exceeds your $${HOURLY_CAP}/hr safety threshold. Halting rapid-fire testing.`,
        isFlagged: false,
      };
    }

    // 4. Amount above threshold
    if (amount > POLICY_LIMIT_SINGLE) {
      return {
        status: 'stepup',
        reason: 'AmountExceeded' as StepUpReason,
        badge: 'REQUIRE STEP-UP',
        badgeColor: 'var(--gate)',
        badgeBg: 'color-mix(in srgb, var(--gate) 15%, transparent)',
        headline: 'Single Transaction Threshold Exceeded',
        summary: `Transfer of $${amount} exceeds the $${POLICY_LIMIT_SINGLE} no-step-up ceiling. Step-up confirms intentionality.`,
        isFlagged: false,
      };
    }

    // 5. Unknown recipient
    if (recipientType === 'unknown') {
      return {
        status: 'stepup',
        reason: 'NewRecipient' as StepUpReason,
        badge: 'REQUIRE STEP-UP',
        badgeColor: 'var(--gate)',
        badgeBg: 'color-mix(in srgb, var(--gate) 15%, transparent)',
        headline: 'First-Time Recipient Check',
        summary: "You haven't sent to this address before or trust has decayed. Requires one explicit confirmation.",
        isFlagged: false,
      };
    }

    // Default: Allow
    return {
      status: 'allow',
      reason: null,
      badge: 'ALLOW INSTANTLY',
      badgeColor: 'var(--clear)',
      badgeBg: 'color-mix(in srgb, var(--clear) 15%, transparent)',
      headline: 'Low-Risk Autonomous Passage',
      summary: 'Under limit ($500), recipient verified in web-of-trust, and velocity headroom verified on-chain. Zero friction.',
      isFlagged: false,
    };
  }, [amount, recipientType, totalHourly, totalDaily]);

  // Request explanation
  async function handleFetchExplanation() {
    if (verdict.status === 'allow') return;
    sounds.playClick();
    setIsExplaining(true);
    setShowExplanation(true);

    const input: ExplanationInput = {
      eventType: 'stepup_required',
      reason: verdict.reason!,
      amount: String(amount),
    };

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('API failed');
      const data = (await res.json()) as ExplanationResult;
      setExplanation(data);
    } catch {
      setExplanation({
        ...fallbackExplanation(input),
        source: 'fallback',
      });
    } finally {
      setIsExplaining(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden transition-colors">
      {/* Ambient Atmosphere: Subtle Radial Canopy-Green Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[150px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-28 px-6 py-8 sm:py-16">
        {/* =========================================================================
            SECTION 1: HERO HEADER & METRICS BAR
        ========================================================================= */}
        <section className="flex flex-col items-center text-center">
          {/* Cyber Shield Logo Emblem */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-6 rounded-full bg-clear/20 blur-3xl animate-pulse" />
            <Image
              src="/logo/logo-shield.svg"
              alt="Warden Security Operating System"
              width={110}
              height={121}
              priority
              className="relative h-24 w-auto sm:h-28 transition-transform duration-500 hover:scale-105 drop-shadow-[0_0_35px_rgba(34,195,141,0.5)]"
            />
          </div>

          {/* Status Eyebrow Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 text-xs font-mono text-mist-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            <span>STELLAR TESTNET • PROTOCOL V1.0.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display max-w-4xl text-4xl font-extrabold tracking-tight text-mist-100 sm:text-6xl md:text-7xl">
            Most wallets treat every payment the same.{' '}
            <span className="text-clear underline decoration-clear/30 underline-offset-8">
              Warden doesn&apos;t.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-mist-400">
            An on-chain spending governor on Stellar Soroban that lets honest daily purchases glide through in seconds,
            while halting abnormal account drains before funds ever leave your vault.
          </p>

          {/* CTA Row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#sandbox"
              onClick={() => sounds.playClick()}
              className="rounded-full bg-clear px-8 py-3.5 text-base font-semibold text-ink-900 shadow-md shadow-clear/20 transition-all hover:scale-105 hover:bg-clear/90"
            >
              Launch Interactive Sandbox ↓
            </a>
            <Link
              href="/how-it-works"
              onClick={() => sounds.playClick()}
              className="rounded-full border border-ink-700 bg-ink-800 px-6 py-3.5 text-base font-medium text-mist-100 transition-all hover:border-mist-400 hover:bg-ink-700/50"
            >
              How It Works →
            </Link>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 gap-4 w-full rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:grid-cols-4 sm:gap-6 shadow-md">
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-mist-100 tabular-nums">100%</div>
              <div className="text-xs uppercase tracking-wider text-mist-400 mt-1 font-mono">On-Chain Logic</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-clear tabular-nums">&lt; 400ms</div>
              <div className="text-xs uppercase tracking-wider text-mist-400 mt-1 font-mono">Verification</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-gate tabular-nums">Dual</div>
              <div className="text-xs uppercase tracking-wider text-mist-400 mt-1 font-mono">1h &amp; 24h Velocity</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-mist-100 tabular-nums">7 Max</div>
              <div className="text-xs uppercase tracking-wider text-mist-400 mt-1 font-mono">Social Guardians</div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: THE INTERACTIVE SOROBAN RISK SANDBOX TERMINAL
        ========================================================================= */}
        <section id="sandbox" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-clear">
              <span>SIMULATION CONSOLE</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Live Soroban Risk Sandbox
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Select a preset scenario below or tune the control dials manually to observe how Warden&apos;s on-chain
              governor resolves the transaction before a single stroop is spent.
            </p>
          </div>

          {/* Preset Scenario Pills */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {PRESET_STORIES.map((story) => {
              const isActive = selectedStory === story.id;
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => handleSelectStory(story)}
                  className={`rounded-full px-4 py-2 font-mono text-xs sm:text-sm font-medium transition-all shadow-sm ${
                    isActive
                      ? 'bg-clear text-ink-900 font-bold shadow-md shadow-clear/20 ring-2 ring-clear/40 scale-102'
                      : 'border border-ink-700 bg-ink-800 text-mist-400 hover:border-ink-700 hover:text-mist-100'
                  }`}
                >
                  {story.pillLabel}
                </button>
              );
            })}
          </div>

          {/* Active Preset Context Banner */}
          <div className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-3 text-xs text-mist-400 flex items-center gap-2 shadow-sm">
            <strong className="text-mist-100 font-semibold">
              Scenario: {PRESET_STORIES.find((s) => s.id === selectedStory)?.title}
            </strong>{' '}
            {PRESET_STORIES.find((s) => s.id === selectedStory)?.description}
          </div>

          {/* Terminal Bento Card Container */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-2xl">
            {/* Left Dials Column (7 cols) */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-ink-700 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-mist-400">
                  TRANSACTION PARAMETERS
                </span>
                <span className="font-mono text-xs text-clear">soroban-sdk::evaluate()</span>
              </div>

              {/* Dial 1: Amount */}
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-mist-100">Transfer Amount</span>
                  <span className="font-mono font-bold text-2xl text-mist-100 tabular-nums">
                    ${amount} <span className="text-xs font-normal text-mist-400">USDC</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[12, 150, 1200].map((presetAmt) => (
                    <button
                      key={presetAmt}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedStory('custom');
                        setAmount(presetAmt);
                      }}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                        amount === presetAmt
                          ? 'border-clear bg-clear/20 text-clear font-bold'
                          : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                      }`}
                    >
                      ${presetAmt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setAmount(250);
                    }}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                      amount !== 12 && amount !== 150 && amount !== 1200
                        ? 'border-clear bg-clear/20 text-clear font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                <input
                  type="range"
                  min={1}
                  max={1500}
                  step={5}
                  value={amount}
                  onChange={(e) => {
                    sounds.playRatchetTick();
                    setSelectedStory('custom');
                    setAmount(Number(e.target.value));
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-clear outline-none focus-visible:ring-2 focus-visible:ring-clear/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                />
                <div className="flex justify-between text-[11px] font-mono text-mist-400">
                  <span>$1 (Micro)</span>
                  <span className="text-gate font-semibold">Policy Limit: $500</span>
                  <span>$1,500 (Large)</span>
                </div>
              </div>

              {/* Dial 2: Recipient Status */}
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-medium text-mist-100">Recipient Status</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setRecipientType('trusted');
                    }}
                    className={`rounded-lg border px-3 py-2.5 font-mono text-xs sm:text-sm font-medium transition-all ${
                      recipientType === 'trusted'
                        ? 'border-clear bg-clear/15 text-clear font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    ✓ Trusted
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setRecipientType('unknown');
                    }}
                    className={`rounded-lg border px-3 py-2.5 font-mono text-xs sm:text-sm font-medium transition-all ${
                      recipientType === 'unknown'
                        ? 'border-gate bg-gate/15 text-gate font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    ⚡ Unknown
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setRecipientType('flagged');
                    }}
                    className={`rounded-lg border px-3 py-2.5 font-mono text-xs sm:text-sm font-medium transition-all ${
                      recipientType === 'flagged'
                        ? 'border-fault bg-fault/15 text-fault font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    🚫 Flagged
                  </button>
                </div>
              </div>

              {/* Dial 3: Spending Velocity */}
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-medium text-mist-100">Spending Velocity</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setVelocityMode('first');
                    }}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs font-medium transition-all ${
                      velocityMode === 'first'
                        ? 'border-clear bg-clear/20 text-clear font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    1st Today ($0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setVelocityMode('burst');
                    }}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs font-medium transition-all ${
                      velocityMode === 'burst'
                        ? 'border-gate bg-gate/20 text-gate font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    4th in 10m ($180)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStory('custom');
                      setVelocityMode('daily_max');
                    }}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs font-medium transition-all ${
                      velocityMode === 'daily_max'
                        ? 'border-fault bg-fault/20 text-fault font-bold'
                        : 'border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                    }`}
                  >
                    50th Today ($480)
                  </button>
                </div>
              </div>

              {/* Headway Status Gauges */}
              <div className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
                {/* Hourly Track ($200 cap) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-mist-400">1-Hour Velocity Headway</span>
                    <span className="font-semibold text-mist-100 tabular-nums">
                      ${totalHourly} / ${HOURLY_CAP}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalHourly > HOURLY_CAP ? 'bg-gate' : 'bg-clear'
                      }`}
                      style={{ width: `${Math.min(100, (totalHourly / HOURLY_CAP) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Daily Track ($500 cap) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-mist-400">24-Hour Velocity Headway</span>
                    <span className="font-semibold text-mist-100 tabular-nums">
                      ${totalDaily} / ${DAILY_CAP}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalDaily > DAILY_CAP ? 'bg-fault' : totalDaily > 350 ? 'bg-gate' : 'bg-clear'
                      }`}
                      style={{ width: `${Math.min(100, (totalDaily / DAILY_CAP) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Verdict Box (5 cols) */}
            <div
              className="flex flex-col justify-between rounded-xl border p-6 transition-all duration-300 lg:col-span-5 bg-ink-900 shadow-md"
              style={{
                borderColor: verdict.badgeColor,
                boxShadow: `0 0 35px -10px ${verdict.badgeColor}`,
              }}
            >
              <div className="flex flex-col gap-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-mist-400 font-semibold">
                    ON-CHAIN VERDICT
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-300"
                    style={{
                      color: verdict.badgeColor,
                      backgroundColor: verdict.badgeBg,
                    }}
                  >
                    {verdict.badge}
                  </span>
                </div>

                {/* Main Headline */}
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-xl font-bold text-mist-100">
                    {verdict.headline}
                  </h3>
                  <p className="text-sm text-mist-400 leading-relaxed">
                    {verdict.summary}
                  </p>
                </div>

                {/* Protocol Invariant Details */}
                <div className="flex flex-col gap-2 rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-mist-400">Account State:</span>
                    <span className="text-mist-100 font-semibold">NORMAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist-400">Reason Code:</span>
                    <span className="font-bold" style={{ color: verdict.badgeColor }}>
                      {verdict.reason ? verdict.reason : 'None (Allow)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist-400">Auth Barrier:</span>
                    <span className="text-mist-100 font-semibold">
                      {verdict.status === 'allow' ? 'Single Biometric Sig' : 'Secondary Key Step-Up'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explain Action & Drawer */}
              <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-ink-700">
                {verdict.status !== 'allow' ? (
                  <button
                    type="button"
                    onClick={handleFetchExplanation}
                    disabled={isExplaining}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gate/60 bg-gate/15 py-2.5 font-mono text-xs font-semibold text-mist-100 hover:bg-gate/25 transition-colors disabled:opacity-50"
                  >
                    <span>✨</span>
                    <span>{isExplaining ? 'Consulting Grounded Engine…' : 'Explain this step-up with DeepSeek AI'}</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-clear/30 bg-clear/10 py-2.5 text-center font-mono text-xs text-clear font-medium">
                    ✓ Frictionless path active, no step-up required.
                  </div>
                )}

                {/* AI Explanation Drawer */}
                {showExplanation && explanation && (
                  <div className="rounded-xl border border-gate/40 bg-ink-800 p-4 text-xs text-mist-100 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-ink-700">
                      <span className="font-semibold text-gate">
                        {explanation.source === 'llm' ? 'Evomap DeepSeek Analysis' : 'Grounded Engine Output'}
                      </span>
                      <span className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-mono text-mist-400 border border-ink-700">
                        {explanation.source === 'llm' ? 'LLM Validated' : 'On-Chain Fact Engine'}
                      </span>
                    </div>
                    <p className="mt-2 text-mist-400 leading-relaxed">{explanation.summary}</p>
                    <div className="mt-2">
                      <span className="font-semibold text-mist-100">Governing Factors:</span>
                      <ul className="mt-1 list-disc pl-4 text-mist-400 space-y-0.5">
                        {explanation.factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monospace Telemetry Footer */}
          <div className="flex flex-wrap items-center justify-between rounded-xl border border-ink-700 bg-ink-800 px-6 py-3 font-mono text-[11px] text-mist-400 shadow-sm">
            <span>EXECUTION: ON-CHAIN SOROBAN WASM</span>
            <span>VERIFICATION COST: &lt; 0.001 XLM</span>
            <span>SETTLEMENT LATENCY: ~5 SECONDS</span>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: PROBLEM COMPARISON ("THE ALL-OR-NOTHING TRAP")
        ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2 text-center items-center">
            <span className="font-mono text-xs uppercase tracking-widest text-gate font-semibold">
              THE FUNDAMENTAL FLAW
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl max-w-3xl">
              Why Are You Scanning Your Face for a $4.50 Coffee?
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Traditional fintech apps force identical biometric barriers on routine micro-payments, then fail completely
              when an account takeover attempts a $25,000 drain to a stranger.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Card A: Traditional Wallets */}
            <div className="flex flex-col gap-6 rounded-2xl border border-fault/40 bg-ink-800 p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-fault">
                  Traditional Wallets
                </span>
                <span className="text-xl font-mono text-fault font-semibold">DUMB &amp; FRICTION-HEAVY</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-mist-100">
                The All-or-Nothing Trap
              </h3>
              <ul className="flex flex-col gap-4 text-sm text-mist-400">
                <li className="flex gap-3">
                  <span className="text-fault font-bold">✕</span>
                  <div>
                    <strong className="text-mist-100">Irritating Micro-Friction:</strong> Forces Face ID or 2FA to send $5 to your
                    sibling or buy a coffee at night.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-fault font-bold">✕</span>
                  <div>
                    <strong className="text-mist-100">Zero Attack Context:</strong> If credentials leak, an automated bot drains
                    your entire balance in 10 seconds with zero velocity caps.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-fault font-bold">✕</span>
                  <div>
                    <strong className="text-mist-100">Fragile Off-Chain Servers:</strong> Security checks run on AWS servers that
                    can be bypassed if the client application is modified.
                  </div>
                </li>
              </ul>
            </div>

            {/* Card B: Warden Proportional Defense */}
            <div className="flex flex-col gap-6 rounded-2xl border border-clear/50 bg-ink-800 p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-clear">
                  Warden Security OS
                </span>
                <span className="text-xl font-mono text-clear font-semibold">PROPORTIONAL DEFENSE</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-mist-100">
                Intelligent On-Chain Governance
              </h3>
              <ul className="flex flex-col gap-4 text-sm text-mist-400">
                <li className="flex gap-3">
                  <span className="text-clear font-bold">✓</span>
                  <div>
                    <strong className="text-mist-100">Zero Friction for Known Payments:</strong> Transfers under threshold to
                    verified recipients glide through in sub-second silence.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-clear font-bold">✓</span>
                  <div>
                    <strong className="text-mist-100">Dual-Window Velocity Bounds:</strong> Catches rapid-fire bot testing
                    through independent 1-hour and 24-hour spending bounds.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-clear font-bold">✓</span>
                  <div>
                    <strong className="text-mist-100">Enforced at Protocol Boundary:</strong> Embedded natively inside Soroban’s
                    account auth check, cannot be bypassed by modified client apps.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: THE 3-TIER SECURITY ARCHITECTURE
        ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">
              PROTOCOL ANATOMY
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              The 3-Tier Security Architecture
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Warden decouples observation, policy memory, and cryptographic muscle so that intelligence never controls
              funds, but security enforcement remains absolute.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Chamber 1: The Detective */}
            <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-lg">
              {/* Geometric SVG for Chamber 1 */}
              <div className="h-28 w-full rounded-xl border border-ink-700 bg-ink-900 p-2 flex items-center justify-center">
                <svg viewBox="0 0 200 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="40" r="28" stroke="var(--ink-700)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="100" cy="40" r="16" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="1.5" />
                  <circle cx="100" cy="40" r="5" fill="var(--clear)" />
                  {/* Scanning Radar Lines */}
                  <line x1="100" y1="40" x2="122" y2="24" stroke="var(--clear)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 40 40 Q 70 20 100 40 T 160 40" stroke="var(--ink-700)" strokeWidth="1" fill="none" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wider text-clear font-semibold">Chamber 1 • Eyes</span>
                <h3 className="font-display text-xl font-bold text-mist-100">The Detective</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                Off-chain risk observability streamed via <code className="text-mist-100">warden-monitor</code>. Evaluates
                recipient frequency, flags scam clusters, and tracks decay without ever touching user keys.
              </p>
            </div>

            {/* Chamber 2: The Rule Book */}
            <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-lg">
              {/* Geometric SVG for Chamber 2 */}
              <div className="h-28 w-full rounded-xl border border-ink-700 bg-ink-900 p-2 flex items-center justify-center">
                <svg viewBox="0 0 200 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="60" y="16" width="80" height="48" rx="6" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="1.5" />
                  <line x1="75" y1="28" x2="125" y2="28" stroke="var(--clear)" strokeWidth="1.5" />
                  <line x1="75" y1="40" x2="115" y2="40" stroke="var(--mist-400)" strokeWidth="1.5" />
                  <line x1="75" y1="52" x2="105" y2="52" stroke="var(--mist-400)" strokeWidth="1.5" />
                  <circle cx="125" cy="46" r="3" fill="var(--gate)" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wider text-clear font-semibold">Chamber 2 • Memory</span>
                <h3 className="font-display text-xl font-bold text-mist-100">The Rule Book</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                The deployed Soroban smart contract on Stellar. Tracks hourly and daily velocity state, stores authorized
                guardians, and executes pure integer arithmetic with zero floating-point risk.
              </p>
            </div>

            {/* Chamber 3: The Security Guard */}
            <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-lg">
              {/* Geometric SVG for Chamber 3 */}
              <div className="h-28 w-full rounded-xl border border-ink-700 bg-ink-900 p-2 flex items-center justify-center">
                <svg viewBox="0 0 200 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="100,14 135,32 135,56 100,68 65,56 65,32" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="1.5" />
                  <circle cx="100" cy="40" r="10" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="1.5" />
                  <line x1="100" y1="35" x2="100" y2="45" stroke="var(--gate)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wider text-gate font-semibold">Chamber 3 • Muscle</span>
                <h3 className="font-display text-xl font-bold text-mist-100">The Security Guard</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                Direct integration into the smart account’s <code className="text-mist-100">__check_auth</code> gate. Halts
                unauthorized outflows, demands secondary passkey signatures, or enforces 48h guardian recovery.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: THE ASYMMETRIC 5-STATE SECURITY LADDER
        ========================================================================= */}
        <section className="flex flex-col gap-8 rounded-3xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-gate font-semibold">
              STATE MACHINE GOVERNANCE
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              The 5-State Security Ladder
            </h2>
            <p className="max-w-3xl text-sm text-mist-400">
              Warden governs smart accounts through an asymmetric security state machine: <strong className="text-mist-100">Escalate-Easy, De-escalate-Hard</strong>.
              Climbing up happens in seconds when danger is spotted; climbing down requires on-chain cooldown timers or guardian approval.
            </p>
          </div>

          {/* Interactive Ladder Visualizer */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {[
              {
                id: 'NORMAL',
                tier: 'Tier 1',
                badgeColor: 'var(--clear)',
                title: 'NORMAL',
                desc: 'Standard friction-free operation for all transfers under policy limits.',
              },
              {
                id: 'WATCH',
                tier: 'Tier 2',
                badgeColor: 'var(--mist-400)',
                title: 'WATCH',
                desc: 'First anomaly observed. Logging frequency increases; guardians can be added.',
              },
              {
                id: 'RESTRICTED',
                tier: 'Tier 3',
                badgeColor: 'var(--gate)',
                title: 'RESTRICTED',
                desc: 'Limits cut by 50%. Large transfers disabled to prevent skimming.',
              },
              {
                id: 'CHALLENGED',
                tier: 'Tier 4',
                badgeColor: 'var(--fault)',
                title: 'CHALLENGED',
                desc: 'All outbound transfers require step-up confirmation, regardless of amount.',
              },
              {
                id: 'FROZEN',
                tier: 'Tier 5',
                badgeColor: 'var(--fault)',
                title: 'FROZEN',
                desc: 'Zero transfers allowed. Account can only be salvaged via 48h Guardian Recovery.',
              },
            ].map((ladder) => (
              <button
                key={ladder.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveLadderTier(ladder.id);
                }}
                className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                  activeLadderTier === ladder.id
                    ? 'border-clear bg-clear/15 ring-2 ring-clear/50 scale-102'
                    : 'border-ink-700 bg-ink-900 hover:border-mist-400'
                }`}
              >
                <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: ladder.badgeColor }}>
                  {ladder.tier}
                </span>
                <div className="font-display text-lg font-bold text-mist-100">{ladder.title}</div>
                <p className="text-xs text-mist-400 leading-relaxed">{ladder.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-clear uppercase font-semibold">Selected Tier: {activeLadderTier}</span>
              <p className="text-xs text-mist-400">
                {activeLadderTier === 'NORMAL' && 'All limits nominal. Everyday payments glide through in seconds with zero friction.'}
                {activeLadderTier === 'WATCH' && 'Heightened observation mode. The contract tracks velocity spikes and recipient age closely.'}
                {activeLadderTier === 'RESTRICTED' && 'Caps tightened. Guardian configuration frozen to prevent an attacker from locking you out.'}
                {activeLadderTier === 'CHALLENGED' && 'Single-key authorizations revoked. Money cannot leave without secondary backup signature.'}
                {activeLadderTier === 'FROZEN' && 'Vault door dropped. Outbound transfers locked until 48-hour social recovery completes.'}
              </p>
            </div>
            <Link
              href="/security"
              onClick={() => sounds.playClick()}
              className="rounded-full border border-ink-700 bg-ink-800 px-5 py-2 text-xs font-mono text-mist-100 hover:border-clear transition-colors whitespace-nowrap shadow-sm"
            >
              Explore Security Model →
            </Link>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: OPEN-SOURCE 5-REPOSITORY SHOWCASE
        ========================================================================= */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">
              PUBLIC INFRASTRUCTURE
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Five Coordinated Repositories
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Built under strict test discipline, zero unwrap policy, conventional commits, and verified testnet deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Repo 1 */}
            <a
              href="https://github.com/wardenoss/warden-contract"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 transition-all hover:border-clear hover:bg-ink-800/90 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-clear font-semibold">warden-contract</span>
                  <span className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-mist-400 border border-ink-700">v0.3.0</span>
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  Rust / Soroban Engine
                </h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  The core smart contract: dual velocity windows, trust decay, flagged address registry, and guardian recovery.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>58 / 58 Tests Passing</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Repo 2 */}
            <a
              href="https://github.com/wardenoss/warden-sdk"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 transition-all hover:border-clear hover:bg-ink-800/90 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-clear font-semibold">warden-sdk</span>
                  <span className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-mist-400 border border-ink-700">v0.4.0</span>
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  TypeScript Client SDK
                </h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Type-safe transaction builders, error parsers, and grounded explanation module for browser and Node environments.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>73 / 73 Tests Passing</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Repo 3 */}
            <a
              href="https://github.com/wardenoss/warden-app"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 transition-all hover:border-clear hover:bg-ink-800/90 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-clear font-semibold">warden-app</span>
                  <span className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-mist-400 border border-ink-700">Next.js 16</span>
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  Reference Wallet Demo
                </h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Design System v2 frontend demonstrating Freighter connect, policy tuning, and step-up confirmation modal.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>24 / 24 Tests Passing</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Repo 4 */}
            <a
              href="https://github.com/wardenoss/warden-monitor"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 transition-all hover:border-clear hover:bg-ink-800/90 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-clear font-semibold">warden-monitor</span>
                  <span className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-mist-400 border border-ink-700">Telemetry</span>
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  Indexer &amp; Dashboard
                </h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Long-running SQLite poller indexing Soroban contract events with zero write privileges, plus analytics dashboard.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>30 / 30 Tests Passing</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Repo 5 */}
            <a
              href="https://github.com/wardenoss/warden-docs"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 transition-all hover:border-clear hover:bg-ink-800/90 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-clear font-semibold">warden-docs</span>
                  <span className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-mist-400 border border-ink-700">GitBook</span>
                </div>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  Protocol Specification
                </h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Complete developer guides, verified contract signatures, step-by-step integrator tutorials, and mechanics.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>Full Reference Specs</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Live Contract Link */}
            <a
              href="https://stellar.expert/explorer/testnet/contract/CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="group flex flex-col justify-between rounded-2xl border border-clear/50 bg-clear/10 p-6 transition-all hover:bg-clear/20 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs text-clear font-semibold">Testnet Explorer</span>
                <h3 className="font-display text-lg font-bold text-mist-100 group-hover:text-clear transition-colors">
                  Live Contract on Stellar
                </h3>
                <p className="font-mono text-xs text-mist-400 break-all">
                  CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-mist-400">
                <span>View on StellarExpert</span>
                <span className="text-mist-100 group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
