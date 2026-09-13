'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/soundEngine';

export default function ProtocolPage() {
  // Cost Calculator State
  const [monthlyTransfers, setMonthlyTransfers] = useState<number>(60); // 2 transfers per day
  const [avgTransferAmount, setAvgTransferAmount] = useState<number>(25);

  const sorobanMonthlyCost = monthlyTransfers * 0.0001; // < 0.001 XLM (~$0.0001)
  const legacyMonthlyCost = monthlyTransfers * 2.85; // ~$2.85 average gas per smart contract tx on legacy networks
  const annualSavings = (legacyMonthlyCost - sorobanMonthlyCost) * 12;

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden transition-colors">
      {/* Background ambient lighting - strictly forest green tones, zero blue */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[160px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-28 px-6 py-8 sm:py-16">
        {/* =========================================================================
            ACT I: THE HERO - "THE ALL-OR-NOTHING FLAW"
        ========================================================================= */}
        <section className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 text-xs font-mono text-mist-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            THE PROTOCOL MANIFESTO • WHY WARDEN EXISTS
          </div>

          <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight text-mist-100 sm:text-6xl sm:leading-tight">
            Digital assets gave us sovereignty. <br />
            <span className="text-clear">Then they forgot how humans actually live.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-mist-400 leading-relaxed">
            Every modern crypto wallet is trapped in an all-or-nothing design: you either endure suffocating biometric
            friction for a routine coffee purchase, or a single leaked key silently drains your life savings at 3:00 AM.
            Warden was created to introduce <strong className="text-mist-100 font-semibold">proportional, sensible security</strong> directly to the blockchain.
          </p>

          {/* Illustration 1: The Spectrum of Proportionality */}
          <div className="mt-12 w-full rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3 text-xs font-mono text-mist-400">
              <span>FIGURE 01: THE SPECTRUM OF PROPORTIONALITY</span>
              <span className="text-clear font-semibold">CONTINUOUS RISK EVALUATION</span>
            </div>

            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 760 200" className="w-full max-w-[700px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="calmTrack" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--clear)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--clear)" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="barrierGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--gate)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="var(--fault)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Base Horizon Track */}
                <line x1="50" y1="120" x2="710" y2="120" stroke="var(--ink-700)" strokeWidth="2" strokeDasharray="6 6" />

                {/* Micro-Payments Track (Canopy Green) */}
                <line x1="60" y1="120" x2="380" y2="120" stroke="var(--clear)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="80" cy="120" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="80" y="124" textAnchor="middle" fill="var(--clear)" fontSize="10" fontFamily="monospace" fontWeight="bold">$4.50</text>
                <text x="80" y="150" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="sans-serif">Morning Coffee</text>

                <circle cx="220" cy="120" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="220" y="124" textAnchor="middle" fill="var(--clear)" fontSize="10" fontFamily="monospace" fontWeight="bold">$28</text>
                <text x="220" y="150" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="sans-serif">Groceries (Mama Amina)</text>

                {/* Frictionless Corridor Label */}
                <rect x="100" y="60" width="180" height="26" rx="6" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="1" />
                <text x="190" y="77" textAnchor="middle" fill="var(--clear)" fontSize="10" fontFamily="monospace" fontWeight="bold">FRICTIONLESS CORRIDOR ✓</text>

                {/* The Policy Boundary Gate */}
                <line x1="420" y1="30" x2="420" y2="170" stroke="url(#barrierGlow)" strokeWidth="3" strokeLinecap="round" />
                <polygon points="420,20 428,34 412,34" fill="var(--gate)" />
                <text x="420" y="190" textAnchor="middle" fill="var(--gate)" fontSize="10" fontFamily="monospace" fontWeight="bold">$500 SAFETY THRESHOLD</text>

                {/* High-Velocity Drain Vectors (Ember Gold & Coral Red) */}
                <path d="M 460 120 L 680 120" stroke="var(--gate)" strokeWidth="3" strokeDasharray="8 4" />
                <circle cx="560" cy="120" r="16" fill="var(--ink-800)" stroke="var(--gate)" strokeWidth="2" />
                <text x="560" y="124" textAnchor="middle" fill="var(--gate)" fontSize="10" fontFamily="monospace" fontWeight="bold">$1,200</text>
                <text x="560" y="150" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="sans-serif">Stolen Phone Drain</text>

                <circle cx="670" cy="120" r="16" fill="var(--ink-800)" stroke="var(--fault)" strokeWidth="2" />
                <text x="670" y="124" textAnchor="middle" fill="var(--fault)" fontSize="10" fontFamily="monospace" fontWeight="bold">$25,000</text>
                <text x="670" y="150" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="sans-serif">Catastrophic Siphon</text>

                {/* Hard Gate Label */}
                <rect x="520" y="60" width="180" height="26" rx="6" fill="var(--ink-900)" stroke="var(--gate)" strokeWidth="1" />
                <text x="610" y="77" textAnchor="middle" fill="var(--gate)" fontSize="10" fontFamily="monospace" fontWeight="bold">ON-CHAIN LOCKDOWN 🛑</text>
              </svg>
            </div>
          </div>
        </section>

        {/* =========================================================================
            ACT II: THE FALSE DICHOTOMY - "THE TWO BROKEN EXTREMES"
        ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-gate font-semibold">ACT II</span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              The Two Broken Extremes
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Fintech today forces you to choose between two unacceptable extremes. Warden bridges the gap.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* The Web2 Trap */}
            <div className="flex flex-col gap-4 rounded-2xl border border-fault/30 bg-ink-800 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-fault">EXTREME 01</span>
                <span className="text-xl">🏛️</span>
              </div>
              <h3 className="font-display text-xl font-bold text-mist-100">The Web2 Trap</h3>
              <span className="font-mono text-xs text-fault font-semibold">The Prison of Constant Friction</span>
              <p className="text-xs text-mist-400 leading-relaxed">
                Every purchase demands an SMS code, facial scan, captcha puzzle, and password reset. You are treated like an
                intruder inside your own account, while banks still charge overdraft fees and freeze accounts arbitrarily.
              </p>
            </div>

            {/* The Web3 Trap */}
            <div className="flex flex-col gap-4 rounded-2xl border border-fault/30 bg-ink-800 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-fault">EXTREME 02</span>
                <span className="text-xl">🎲</span>
              </div>
              <h3 className="font-display text-xl font-bold text-mist-100">The Web3 Trap</h3>
              <span className="font-mono text-xs text-fault font-semibold">The Illusion of Freedom</span>
              <p className="text-xs text-mist-400 leading-relaxed">
                A single signature has unlimited authority. A 24-word seed phrase on a napkin stands between your treasury
                and total ruin. One bad signature or prompt injection drains millions of dollars in 5 seconds.
              </p>
            </div>

            {/* The Warden Bridge */}
            <div className="flex flex-col gap-4 rounded-2xl border border-clear bg-ink-800 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-clear/10 rounded-bl-full" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-clear">THE SOLUTION</span>
                <span className="text-xl">🛡️</span>
              </div>
              <h3 className="font-display text-xl font-bold text-mist-100">The Warden Bridge</h3>
              <span className="font-mono text-xs text-clear font-semibold">Proportional On-Chain Defense</span>
              <p className="text-xs text-mist-400 leading-relaxed">
                Security matches the context. Small, verified daily routines glide through in seconds with zero friction;
                unusual speeds, new addresses, and balance drains are halted on-chain by deterministic mathematical rules.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            ACT III: WHY STELLAR SOROBAN IS LOAD-BEARING
        ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">ACT III</span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Why Stellar Soroban Is Load-Bearing
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Why Stellar? Why not Ethereum, Solana, or Base? Because Soroban provides mathematical guarantees that make
              this architecture physically viable:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded bg-ink-900 p-2 font-mono text-xs text-clear border border-ink-700 font-bold">01</span>
                <h3 className="font-display text-lg font-bold text-mist-100">5-Second Deterministic Settlement</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                When a payment is authorized, it settles permanently in 5 seconds. Security evaluations happen in-line without
                multi-minute mempool delays or front-running sandwich attacks.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded bg-ink-900 p-2 font-mono text-xs text-clear border border-ink-700 font-bold">02</span>
                <h3 className="font-display text-lg font-bold text-mist-100">Sub-Cent Evaluation Fees (&lt; 0.001 XLM)</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                Evaluating rolling velocity counters and multi-tiered spending limits costs fractions of a cent. On Ethereum,
                checking an hourly velocity counter would cost $15 in gas per transfer, making everyday micro-security unusable.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded bg-ink-900 p-2 font-mono text-xs text-clear border border-ink-700 font-bold">03</span>
                <h3 className="font-display text-lg font-bold text-mist-100">Native Account Abstraction (__check_auth)</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                Warden does not require complex off-chain relayer networks or secondary multi-sig proxy contracts. Soroban
                executes custom policy logic natively inside <code className="text-mist-100 font-semibold">__check_auth</code> right at the vault entrance.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded bg-ink-900 p-2 font-mono text-xs text-clear border border-ink-700 font-bold">04</span>
                <h3 className="font-display text-lg font-bold text-mist-100">Deterministic Integer Math (Zero Floats)</h3>
              </div>
              <p className="text-xs text-mist-400 leading-relaxed">
                Soroban guest WASM intentionally omits floating-point operations (f32/f64) to eliminate cross-platform rounding
                discrepancies. Security policies are mathematically exact, reproducible, and verifiable.
              </p>
            </div>
          </div>

          {/* Illustration 2: The Native Soroban Vault Aperture */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3 text-xs font-mono text-mist-400">
              <span>FIGURE 02: NATIVE SOROBAN APERTURE VS. OFF-CHAIN FRAGILITY</span>
              <span className="text-clear font-semibold">PROTOCOL BOUNDARY EXECUTION</span>
            </div>

            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 760 220" className="w-full max-w-[720px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left Side: Fragile Off-Chain Systems */}
                <g transform="translate(10, 20)">
                  <rect x="0" y="0" width="340" height="170" rx="12" fill="var(--ink-900)" stroke="var(--fault)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="170" y="28" textAnchor="middle" fill="var(--fault)" fontSize="11" fontFamily="monospace" fontWeight="bold">FRAGILE OFF-CHAIN SYSTEMS</text>

                  {/* Client App */}
                  <rect x="30" y="55" width="80" height="35" rx="6" fill="var(--ink-800)" stroke="var(--ink-700)" strokeWidth="1" />
                  <text x="70" y="77" textAnchor="middle" fill="var(--mist-400)" fontSize="10" fontFamily="sans-serif">Client App</text>

                  {/* Cloud API */}
                  <rect x="230" y="55" width="80" height="35" rx="6" fill="var(--ink-800)" stroke="var(--fault)" strokeWidth="1" />
                  <text x="270" y="77" textAnchor="middle" fill="var(--fault)" fontSize="10" fontFamily="sans-serif">Cloud API</text>

                  {/* Fragile Connection */}
                  <path d="M 110 72 L 230 72" stroke="var(--fault)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="170" y="65" textAnchor="middle" fill="var(--fault)" fontSize="8" fontFamily="monospace">SPOOFABLE</text>

                  {/* Blockchain Gateway */}
                  <rect x="130" y="115" width="80" height="35" rx="6" fill="var(--ink-800)" stroke="var(--ink-700)" strokeWidth="1" />
                  <text x="170" y="137" textAnchor="middle" fill="var(--mist-400)" fontSize="10" fontFamily="sans-serif">Mempool</text>
                  <path d="M 270 90 L 210 120" stroke="var(--fault)" strokeWidth="1" strokeDasharray="3 3" />
                </g>

                {/* Right Side: Native Soroban Invariant */}
                <g transform="translate(390, 20)">
                  <rect x="0" y="0" width="360" height="170" rx="12" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="1.5" />
                  <text x="180" y="28" textAnchor="middle" fill="var(--clear)" fontSize="11" fontFamily="monospace" fontWeight="bold">WARDEN: NATIVE SOROBAN APERTURE</text>

                  {/* Ledger Foundation */}
                  <rect x="30" y="115" width="300" height="35" rx="6" fill="var(--ink-900)" stroke="var(--ink-700)" strokeWidth="1.5" />
                  <text x="180" y="137" textAnchor="middle" fill="var(--mist-100)" fontSize="11" fontFamily="monospace" fontWeight="bold">STELLAR LEDGER STATE (ATOMIC FINALITY)</text>

                  {/* Soroban Gate */}
                  <g transform="translate(180, 75)">
                    <polygon points="0,-25 80,0 0,25 -80,0" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fill="var(--clear)" fontSize="10" fontFamily="monospace" fontWeight="bold">CustomAccount::__check_auth</text>
                  </g>

                  <path d="M 180 50 L 180 115" stroke="var(--clear)" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>

          {/* Interactive Cost of Protection Live Calculator */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">INTERACTIVE METRIC</span>
                <h3 className="font-display text-xl font-bold text-mist-100">The Cost of Protection Calculator</h3>
              </div>
              <span className="font-mono text-xs text-mist-400">Comparing Transaction Overhead</span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="flex flex-col gap-4 lg:col-span-6">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-mist-400">Estimated Monthly Outflows</span>
                  <span className="text-mist-100 font-bold">{monthlyTransfers} transfers/month</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={monthlyTransfers}
                  onChange={(e) => {
                    sounds.playRatchetTick();
                    setMonthlyTransfers(Number(e.target.value));
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-clear outline-none focus-visible:ring-2 focus-visible:ring-clear/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                />

                <div className="flex justify-between text-xs font-mono">
                  <span className="text-mist-400">Average Outflow Value</span>
                  <span className="text-mist-100 font-bold">${avgTransferAmount} USDC</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={avgTransferAmount}
                  onChange={(e) => {
                    sounds.playRatchetTick();
                    setAvgTransferAmount(Number(e.target.value));
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-clear outline-none focus-visible:ring-2 focus-visible:ring-clear/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 lg:col-span-6">
                <div className="flex flex-col justify-between rounded-xl border border-clear/40 bg-ink-900 p-4">
                  <span className="text-[11px] font-mono text-mist-400 uppercase">Warden on Stellar</span>
                  <div className="my-2">
                    <div className="font-mono text-2xl font-bold text-clear tabular-nums">
                      ${sorobanMonthlyCost.toFixed(4)}
                    </div>
                    <span className="text-[10px] font-mono text-mist-400">/ month overhead</span>
                  </div>
                  <span className="text-[10px] text-clear font-semibold">(&lt; 0.001 XLM per check)</span>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-fault/40 bg-ink-900 p-4">
                  <span className="text-[11px] font-mono text-mist-400 uppercase">Legacy EVM Multi-Sig</span>
                  <div className="my-2">
                    <div className="font-mono text-2xl font-bold text-fault tabular-nums">
                      ${legacyMonthlyCost.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-mist-400">/ month in gas</span>
                  </div>
                  <span className="text-[10px] text-fault font-semibold">(~$2.85 per policy evaluation)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900 p-4 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-mist-400">Projected Annual Gas Savings with Warden:</span>
              <span className="text-base font-bold text-clear tabular-nums">
                ${annualSavings.toFixed(2)} USD Saved / Year
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            ACT IV: THE PUBLIC GOOD MANIFESTO - "WHY THERE IS NO WARDEN TOKEN"
        ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">ACT IV</span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Why There Is No Warden Token
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Security infrastructure should never be a speculative casino. Here is our direct commercial philosophy:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
              <span className="text-2xl">🚫</span>
              <h3 className="font-display text-xl font-bold text-mist-100">No Middleman Token</h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                You do not need to buy, stake, or hold a volatile &quot;WARDEN token&quot; to protect your wallet. All fees settle
                directly in native Stellar assets (XLM/USDC).
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
              <span className="text-2xl">🔓</span>
              <h3 className="font-display text-xl font-bold text-mist-100">No SaaS Tollbooth</h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                If a security company charges a monthly subscription to keep your vault locked, their outage becomes your failure
                point. Warden is Apache-2.0 open source: free forever and immutable.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
              <span className="text-2xl">⏳</span>
              <h3 className="font-display text-xl font-bold text-mist-100">Decentralized Longevity</h3>
              <p className="text-xs text-mist-400 leading-relaxed">
                Even if the original developers retire tomorrow, the smart contracts deployed on Stellar will continue enforcing
                velocity limits, trust decay, and guardian recoveries for decades to come.
              </p>
            </div>
          </div>

          {/* Illustration 3: The Open Commons Lattice */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3 text-xs font-mono text-mist-400">
              <span>FIGURE 03: THE OPEN COMMONS LATTICE</span>
              <span className="text-clear font-semibold">DECENTRALIZED PUBLIC INFRASTRUCTURE</span>
            </div>

            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 600 200" className="w-full max-w-[560px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Mesh Lines */}
                <polygon points="300,30 450,70 480,150 300,180 120,150 150,70" stroke="var(--ink-700)" strokeWidth="1.5" />
                <line x1="300" y1="30" x2="300" y2="180" stroke="var(--ink-700)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="70" x2="450" y2="70" stroke="var(--ink-700)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="120" y1="150" x2="480" y2="150" stroke="var(--ink-700)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Nodes */}
                <circle cx="300" cy="30" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="300" y="34" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">USER</text>

                <circle cx="450" cy="70" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="450" y="74" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">AGENT</text>

                <circle cx="480" cy="150" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="480" y="154" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">MERCHANT</text>

                <circle cx="300" cy="180" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="300" y="184" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">GUARDIAN</text>

                <circle cx="120" cy="150" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="120" y="154" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">FINTECH</text>

                <circle cx="150" cy="70" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                <text x="150" y="74" textAnchor="middle" fill="var(--clear)" fontSize="9" fontFamily="monospace" fontWeight="bold">WALLET</text>

                {/* Center Soroban Smart Contract */}
                <circle cx="300" cy="110" r="28" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="2" />
                <text x="300" y="107" textAnchor="middle" fill="var(--mist-100)" fontSize="10" fontFamily="sans-serif" fontWeight="bold">WARDEN</text>
                <text x="300" y="120" textAnchor="middle" fill="var(--clear)" fontSize="8" fontFamily="monospace" fontWeight="bold">PUBLIC GOOD</text>
              </svg>
            </div>
          </div>
        </section>

        {/* =========================================================================
            ACT V: PROTOCOL GOVERNANCE & FORMAL SPECIFICATIONS
        ========================================================================= */}
        <section className="flex flex-col gap-8 rounded-3xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-gate font-semibold">ACT V</span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Protocol Governance &amp; Standards
            </h2>
            <p className="max-w-2xl text-sm text-mist-400">
              Warden is governed by the formal, language-neutral standard documented in <code className="text-mist-100 font-semibold">WARDEN-PROTOCOL.md</code> (v1.0.0).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-ink-700 bg-ink-900 p-5">
              <h4 className="font-display text-base font-bold text-mist-100">Language-Neutral Invariants</h4>
              <p className="text-xs text-mist-400 leading-relaxed">
                The protocol defines state machines, step-up reasons, and recovery math independently of Rust or TypeScript.
                Any developer can implement a compatible client in Go, Python, or Swift.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-ink-700 bg-ink-900 p-5">
              <h4 className="font-display text-base font-bold text-mist-100">Open RFC Rule Changes</h4>
              <p className="text-xs text-mist-400 leading-relaxed">
                Any modification to step-up conditions or state transitions requires a public GitHub proposal with community
                review via <code className="text-clear font-semibold">protocol-rule-change.md</code> before deployment.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-ink-700 pt-6">
            <div className="flex flex-col">
              <span className="font-mono text-xs text-mist-100 font-semibold">WARDEN-PROTOCOL.md • v1.0.0</span>
              <span className="font-mono text-[11px] text-mist-400">Published under Apache-2.0 License</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/wardenoss/warden-contract/blob/main/WARDEN-PROTOCOL.md"
                target="_blank"
                rel="noreferrer"
                onClick={() => sounds.playClick()}
                className="rounded-full bg-clear px-6 py-2.5 text-xs font-semibold text-ink-900 hover:bg-clear/90 transition-colors shadow-md shadow-clear/20"
              >
                Read Specification on GitHub ↗
              </a>
              <Link
                href="/developers"
                onClick={() => sounds.playClick()}
                className="rounded-full border border-ink-700 bg-ink-900 px-6 py-2.5 text-xs font-medium text-mist-100 hover:border-mist-400 transition-colors shadow-sm"
              >
                Developer Hub →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
