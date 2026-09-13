'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/soundEngine';

type ExampleStory = 'coffee' | 'sister' | 'drain' | 'scam';

interface StoryData {
  id: ExampleStory;
  buttonLabel: string;
  amount: string;
  recipient: string;
  reason: string;
  result: 'allow' | 'stepup' | 'block';
  resultTitle: string;
  explanation: string;
  stepChecks: {
    amountOk: boolean;
    amountText: string;
    recipientOk: boolean;
    recipientText: string;
    speedOk: boolean;
    speedText: string;
  };
}

const STORIES: Record<ExampleStory, StoryData> = {
  coffee: {
    id: 'coffee',
    buttonLabel: '☕ $4.50 Morning Coffee',
    amount: '$4.50',
    recipient: 'Downtown Cafe (Saved Merchant)',
    reason: 'Under your $500 limit • Regular morning spot • Zero prior spend today',
    result: 'allow',
    resultTitle: 'Allowed Instantly - No Face Scan Needed',
    explanation:
      'Because the amount is small and you pay this cafe every week, Warden lets it through right away. You get your coffee without standing in line scanning your face.',
    stepChecks: {
      amountOk: true,
      amountText: 'Under $500 threshold ($4.50)',
      recipientOk: true,
      recipientText: 'Paid 3 days ago (Trusted)',
      speedOk: true,
      speedText: '$4.50 spent today (Plenty of room)',
    },
  },
  sister: {
    id: 'sister',
    buttonLabel: '🎁 $25 Gift to Sister',
    amount: '$25.00',
    recipient: 'Sarah (Sister)',
    reason: 'Under your $500 limit • On your trusted friend list • Normal spending pace',
    result: 'allow',
    resultTitle: 'Allowed Instantly - Sent in 5 Seconds',
    explanation:
      'Sarah is on your saved list of friends. Since the transfer is well within your safety budget, the money sends immediately with one normal tap.',
    stepChecks: {
      amountOk: true,
      amountText: 'Under $500 threshold ($25.00)',
      recipientOk: true,
      recipientText: 'Verified family contact',
      speedOk: true,
      speedText: '$25 spent today (Within limit)',
    },
  },
  drain: {
    id: 'drain',
    buttonLabel: '🚨 $4,500 Transfer to a Stranger',
    amount: '$4,500.00',
    recipient: 'Unknown Address (Never seen before)',
    reason: 'Over your $500 limit • New recipient • Attempting to drain entire balance',
    result: 'stepup',
    resultTitle: 'Safe Stays Locked: 2nd Confirmation Required',
    explanation:
      'If someone steals your unlocked phone at a party, they cannot drain your savings. Warden holds the money inside the safe until you provide a second confirmation.',
    stepChecks: {
      amountOk: false,
      amountText: 'Exceeds $500 safety limit ($4,500)',
      recipientOk: false,
      recipientText: 'Brand-new address (Not in friend list)',
      speedOk: false,
      speedText: 'Exceeds $1,000 daily budget',
    },
  },
  scam: {
    id: 'scam',
    buttonLabel: '🚫 Known Scam Address',
    amount: '$15.00',
    recipient: 'Reported Phishing Wallet (Blacklisted)',
    reason: 'Address reported on community security registry',
    result: 'block',
    resultTitle: 'Blocked: Address Flagged as Dangerous',
    explanation:
      'Even if a transfer is small, Warden checks an on-chain safety list. If someone tricks you into sending money to a known scammer, Warden stops it on the spot.',
    stepChecks: {
      amountOk: true,
      amountText: 'Amount is small ($15.00)',
      recipientOk: false,
      recipientText: 'Matched known scammer registry',
      speedOk: true,
      speedText: 'Spending pace is normal',
    },
  },
};

export default function HowItWorksClient() {
  const [selectedStory, setSelectedStory] = useState<ExampleStory>('coffee');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const current = STORIES[selectedStory];

  function handleSelectStory(key: ExampleStory) {
    setSelectedStory(key);
    if (STORIES[key].result === 'allow') {
      sounds.playAllowChime();
    } else {
      sounds.playGateLockImpact();
    }
  }

  function handleStepClick(step: 1 | 2 | 3) {
    setActiveStep(step);
    sounds.playRatchetTick();
  }

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* =========================================================================
            HEADER & VALUE PROPOSITION (GRADE 5-7 ENGLISH)
        ========================================================================= */}
        <section className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-mist-400">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            <span>How Warden Protects Your Money</span>
          </div>

          <h1 className="font-display max-w-3xl text-4xl font-extrabold tracking-tight text-mist-100 sm:text-5xl md:text-6xl">
            Friction where the danger is.{' '}
            <span className="text-clear underline decoration-clear/30 underline-offset-8">
              Freedom where it isn&apos;t.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-mist-400 sm:text-lg">
            Have you ever wondered why banking apps force you to scan your face to buy a $3 snack, but do nothing to stop a
            thief from emptying your savings if your phone gets stolen?
          </p>

          <p className="mt-3 max-w-2xl text-base font-semibold text-mist-100">
            Warden fixes that. It is a smart guard for your money that knows your everyday habits, trusts your friends, and
            only stops a payment when something looks unusual.
          </p>

          {/* 3 Value Pillars at a Glance */}
          <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-5 text-center">
              <span className="text-2xl">⚡</span>
              <h3 className="font-display text-base font-bold text-mist-100">Daily Purchases Glide Through</h3>
              <p className="text-xs text-mist-400">Coffee, groceries, and regular bills go through in 5 seconds without annoying face scans.</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-5 text-center">
              <span className="text-2xl">🛡️</span>
              <h3 className="font-display text-base font-bold text-mist-100">Big Drains Get Stopped</h3>
              <p className="text-xs text-mist-400">Transfers over your safety limit or to strangers require a second confirmation before sending.</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-5 text-center">
              <span className="text-2xl">🔐</span>
              <h3 className="font-display text-base font-bold text-mist-100">You Stay in Complete Control</h3>
              <p className="text-xs text-mist-400">No bank manager or AI can take your money. Everything follows the exact rules you choose.</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            INTERACTIVE REAL-LIFE DEMONSTRATION
        ========================================================================= */}
        <section className="flex flex-col gap-6 rounded-3xl border border-ink-700 bg-ink-800/80 p-6 sm:p-10 shadow-xl">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-clear">
              Interactive Test Drive
            </span>
            <h2 className="font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              See What Happens in Real Life
            </h2>
            <p className="text-sm text-mist-400">
              Tap any of the 4 real-world situations below to see how Warden handles the payment:
            </p>
          </div>

          {/* Scenario Buttons */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(STORIES) as ExampleStory[]).map((key) => {
              const item = STORIES[key];
              const isSelected = selectedStory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectStory(key)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-clear bg-clear/15 text-mist-100 shadow-md ring-2 ring-clear/40'
                      : 'border-ink-700 bg-ink-900/40 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                  }`}
                >
                  <span className="font-display text-xs font-bold">{item.buttonLabel}</span>
                  <span className="text-[11px] text-mist-400 truncate w-full">{item.recipient}</span>
                </button>
              );
            })}
          </div>

          {/* Live Outcome Box */}
          <div
            className={`flex flex-col gap-5 rounded-2xl border p-6 transition-all duration-300 ${
              current.result === 'allow'
                ? 'border-clear/60 bg-clear/10 shadow-[0_0_25px_rgba(34,195,141,0.15)]'
                : current.result === 'stepup'
                ? 'border-gate/60 bg-gate/10 shadow-[0_0_25px_rgba(242,153,74,0.15)]'
                : 'border-fault/60 bg-fault/10 shadow-[0_0_25px_rgba(255,90,82,0.15)]'
            }`}
          >
            {/* Top Badge & Amount */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-white ${
                    current.result === 'allow'
                      ? 'bg-clear'
                      : current.result === 'stepup'
                      ? 'bg-gate'
                      : 'bg-fault'
                  }`}
                >
                  {current.result === 'allow' ? '✓' : current.result === 'stepup' ? '!' : '✕'}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-mist-100">{current.resultTitle}</h3>
                  <span className="text-xs text-mist-400">{current.reason}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="tabular-amount font-display text-2xl font-bold text-mist-100">{current.amount}</span>
                <span className="block text-[11px] text-mist-400">{current.recipient}</span>
              </div>
            </div>

            {/* Explanation paragraph */}
            <p className="text-sm leading-relaxed text-mist-100">{current.explanation}</p>

            {/* The 3 Quick Checks */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-xs">
                <span className={current.stepChecks.amountOk ? 'text-clear font-bold' : 'text-fault font-bold'}>
                  {current.stepChecks.amountOk ? '✓' : '✕'}
                </span>
                <span className="text-mist-400">{current.stepChecks.amountText}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-xs">
                <span className={current.stepChecks.recipientOk ? 'text-clear font-bold' : 'text-fault font-bold'}>
                  {current.stepChecks.recipientOk ? '✓' : '✕'}
                </span>
                <span className="text-mist-400">{current.stepChecks.recipientText}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-xs">
                <span className={current.stepChecks.speedOk ? 'text-clear font-bold' : 'text-fault font-bold'}>
                  {current.stepChecks.speedOk ? '✓' : '✕'}
                </span>
                <span className="text-mist-400">{current.stepChecks.speedText}</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            HOW IT ACTUALLY WORKS: 3 SIMPLE STEPS
        ========================================================================= */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-clear">
              The 3 Simple Steps
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              What Happens Every Time You Send Money
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Behind the scenes, Warden checks 3 simple questions in less than half a second:
            </p>
          </div>

          {/* Interactive Stepper Tabs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1 */}
            <div
              onClick={() => handleStepClick(1)}
              className={`cursor-pointer flex flex-col justify-between gap-4 rounded-2xl border p-6 transition-all ${
                activeStep === 1
                  ? 'border-clear bg-ink-800 shadow-lg shadow-clear/10 ring-1 ring-clear'
                  : 'border-ink-700 bg-ink-800/50 hover:border-mist-400'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clear/20 text-sm font-bold text-clear">
                    1
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-clear">Step 1</span>
                </div>
                <h3 className="font-display text-xl font-bold text-mist-100">The Guard Checks the Payment</h3>
                <p className="text-xs leading-relaxed text-mist-400">
                  When you press &quot;Send&quot;, Warden looks at three basic details: How much money is it? Who are you sending it
                  to? And how much have you already spent today?
                </p>
              </div>
              <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-[11px] text-mist-400">
                ✓ Takes less than 0.2 seconds.
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => handleStepClick(2)}
              className={`cursor-pointer flex flex-col justify-between gap-4 rounded-2xl border p-6 transition-all ${
                activeStep === 2
                  ? 'border-gate bg-ink-800 shadow-lg shadow-gate/10 ring-1 ring-gate'
                  : 'border-ink-700 bg-ink-800/50 hover:border-mist-400'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gate/20 text-sm font-bold text-gate">
                    2
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gate">Step 2</span>
                </div>
                <h3 className="font-display text-xl font-bold text-mist-100">The Guard Checks Your Rules</h3>
                <p className="text-xs leading-relaxed text-mist-400">
                  Warden compares the transfer against your personal safety rules: your daily spending limit, your trusted friends
                  list, and a community blacklist of known scam addresses.
                </p>
              </div>
              <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-[11px] text-mist-400">
                ✓ Your rules are saved permanently in the blockchain safe.
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => handleStepClick(3)}
              className={`cursor-pointer flex flex-col justify-between gap-4 rounded-2xl border p-6 transition-all ${
                activeStep === 3
                  ? 'border-clear bg-ink-800 shadow-lg shadow-clear/10 ring-1 ring-clear'
                  : 'border-ink-700 bg-ink-800/50 hover:border-mist-400'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clear/20 text-sm font-bold text-clear">
                    3
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-clear">Step 3</span>
                </div>
                <h3 className="font-display text-xl font-bold text-mist-100">The Safe Opens or Locks</h3>
                <p className="text-xs leading-relaxed text-mist-400">
                  If everything looks normal, the payment leaves instantly. If anything looks unusual, the safe locks down and
                  asks you for a second confirmation so a thief cannot steal your money.
                </p>
              </div>
              <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 p-3 text-[11px] text-mist-400">
                ✓ No hackers or bots can bypass this door.
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            COMMON QUESTIONS IN PLAIN ENGLISH (FAQ)
        ========================================================================= */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-mist-400">
              Simple Answers
            </span>
            <h2 className="font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-6">
              <h3 className="font-display text-base font-bold text-mist-100">
                Can Warden ever lock me out of my own money?
              </h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                No. You are always the owner of your wallet. If an unusual transfer is flagged, Warden simply asks you to confirm
                it. You can also name trusted friends or backup devices (called Guardians) who can help you unlock your wallet if
                you ever lose your phone.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-6">
              <h3 className="font-display text-base font-bold text-mist-100">
                Does an AI decide whether my payment goes through?
              </h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                No. AI never touches your money. An AI is only used to explain security events to you in plain English. Your
                actual payments are decided by simple math and the rules you set yourself.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-6">
              <h3 className="font-display text-base font-bold text-mist-100">
                What happens if I don&apos;t pay a friend for a few months?
              </h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                Warden uses something called &quot;Trust Decay&quot;. If you haven&apos;t sent money to someone for 30 days, Warden will ask
                you to confirm the next payment just to make sure you didn&apos;t make a typo. Once confirmed, they are back on your trusted
                list!
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-800/60 p-6">
              <h3 className="font-display text-base font-bold text-mist-100">
                Why is this built on Stellar?
              </h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                Stellar is built for real-world global payments. Transfers settle in about 5 seconds, and fees cost less than a fraction
                of a cent ($0.0001). This allows Warden to protect everyday micro-payments without charging you high fees.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            BOTTOM CALL TO ACTION
        ========================================================================= */}
        <section className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-ink-700 bg-ink-800/80 p-8 sm:flex-row sm:p-10">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-xl font-bold text-mist-100">Ready to try it yourself?</h3>
            <p className="text-xs text-mist-400">
              Connect your wallet on Stellar Testnet, set your spending threshold, and see how easy security can be.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-ink-700 bg-ink-900/60 px-5 py-2.5 text-xs font-semibold text-mist-100 hover:border-mist-400 transition-colors"
            >
              ← Test Sandbox
            </Link>
            <Link
              href="/policy"
              className="rounded-full bg-clear px-6 py-2.5 text-xs font-bold text-ink-900 shadow-md shadow-clear/20 hover:bg-clear/90 transition-all"
            >
              Set Your Policy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
