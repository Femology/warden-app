'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { connectedWalletId, connectFreighterWallet } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';
import { AppNavigation } from '@/components/AppNavigation';

export default function AppDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);

  // Dashboard Live / Simulated State
  const [securityState, setSecurityState] = useState<'NORMAL' | 'WATCH' | 'RESTRICTED' | 'CHALLENGED' | 'FROZEN'>('NORMAL');
  const [spentHourly, setSpentHourly] = useState<number>(30);
  const hourlyCap = 200;
  const [spentDaily, setSpentDaily] = useState<number>(150);
  const dailyCap = 500;
  const singleTxLimit = 150;
  const trustDecayDays = 30;

  useEffect(() => {
    const id = connectedWalletId();
    if (id) {
      setWalletAddress(id);
      setIsDemoMode(false);
      // Attempt live query
      wardenClient
        .getPolicy(id)
        .then((policy) => {
          if (policy) {
            // Apply live policy limits if found
          }
        })
        .catch(() => {
          // Gracefully keep baseline
        });
    }
  }, []);

  async function handleConnectWallet() {
    sounds.playClick();
    setConnecting(true);
    try {
      const addr = await connectFreighterWallet();
      setWalletAddress(addr);
      setIsDemoMode(false);
      sounds.playAllowChime();
    } catch {
      // Connect failed or rejected
    } finally {
      setConnecting(false);
    }
  }

  function toggleDemoMode() {
    sounds.playClick();
    setIsDemoMode((prev) => !prev);
  }

  // Calculate gauge offsets
  const hourlyPercent = Math.min(100, (spentHourly / hourlyCap) * 100);
  const dailyPercent = Math.min(100, (spentDaily / dailyCap) * 100);

  // SVG Gauge calculations (radius 48, circumference 2 * PI * 48 = 301.6)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const hourlyOffset = circumference - (hourlyPercent / 100) * circumference;
  const dailyOffset = circumference - (dailyPercent / 100) * circumference;

  return (
    <div className="relative min-h-screen bg-[#0D1712] text-[#EAF2ED] pb-32 overflow-x-hidden">
      <AppNavigation />
      {/* Background ambient lighting - strictly forest green tones, zero blue */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #22C38D 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[160px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F2994A 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#223229] pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C38D] animate-pulse" />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#22C38D]">
                SECURITY COMMAND CENTER
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[#EAF2ED]">
              Vault Operational Overview
            </h1>
          </div>

          {/* Account Status / Demo Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {isDemoMode ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F2994A]/40 bg-[#16251E] px-3.5 py-1 text-xs font-mono text-[#F2994A]">
                <span>● Simulated Sandbox Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22C38D]/40 bg-[#16251E] px-3.5 py-1 text-xs font-mono text-[#22C38D]">
                <span>● Live Testnet Account</span>
                <span className="text-[#93A99C]">({walletAddress?.slice(0, 4)}…{walletAddress?.slice(-4)})</span>
              </div>
            )}

            {!walletAddress && (
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="rounded-full bg-[#22C38D] px-4 py-1.5 font-mono text-xs font-bold text-[#0D1712] hover:bg-[#22C38D]/90 transition-colors shadow-sm"
              >
                {connecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleDemoMode}
              className="rounded-full border border-[#223229] bg-[#16251E] px-3.5 py-1.5 font-mono text-xs text-[#93A99C] hover:text-[#EAF2ED] hover:border-[#93A99C] transition-colors"
            >
              {isDemoMode ? 'Use Real Wallet' : 'Toggle Demo'}
            </button>
          </div>
        </div>

        {/* =========================================================================
            BENTO GRID LAYOUT
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ---------------------------------------------------------------------
              TILE 1: ACCOUNT SECURITY TIER (Spans 2 Cols)
          --------------------------------------------------------------------- */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#223229] bg-[#16251E] p-6 sm:p-8 lg:col-span-2 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            {/* Watermark Knot Graphic */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-5">
              <svg width="240" height="240" viewBox="0 0 200 200" fill="none">
                <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" stroke="#22C38D" strokeWidth="8" />
                <circle cx="100" cy="100" r="50" stroke="#22C38D" strokeWidth="6" />
              </svg>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                  TIER 01 • ACCOUNT SECURITY STATE
                </span>
                <span className="rounded-full bg-[#22C38D]/15 px-3 py-0.5 font-mono text-xs font-bold text-[#22C38D]">
                  AUTONOMOUS
                </span>
              </div>

              {/* Status Radar Glyph & Headline */}
              <div className="flex items-center gap-4 mt-2">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#22C38D]/40 bg-[#0D1712]">
                  <span className="h-6 w-6 rounded-full bg-[#22C38D] animate-ping opacity-40 absolute" />
                  <span className="h-4 w-4 rounded-full bg-[#22C38D]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-mono uppercase text-[#93A99C]">State Machine Position:</span>
                  <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#EAF2ED]">
                    STATUS: {securityState}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#93A99C] leading-relaxed mt-2 max-w-md">
                Peace-time baseline: Full spending headroom active. Single-key authorizations allowed. System watches
                velocity counters in real time.
              </p>
            </div>

            {/* Sub-indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#223229] pt-4 text-xs font-mono text-[#93A99C] gap-2">
              <span>Last Transition: 14 days ago</span>
              <span>Recovery Mode: Idle (Safe)</span>
              <Link href="/security" className="text-[#22C38D] hover:underline">
                Security Model ↗
              </Link>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 2: DUAL OUTFLOW SPEEDOMETERS (Spans 2 Cols)
          --------------------------------------------------------------------- */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#223229] bg-[#16251E] p-6 sm:p-8 lg:col-span-2 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-[#223229] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                DUAL-HORIZON VELOCITY METERS
              </span>
              <span className="font-mono text-xs text-[#22C38D]">On-Chain Gauges</span>
            </div>

            {/* Dual Speedometers Grid */}
            <div className="my-4 grid grid-cols-2 gap-4">
              {/* 1-Hour Rolling Speedometer */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke="#223229"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke={spentHourly > 150 ? '#F2994A' : '#22C38D'}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={hourlyOffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-lg font-bold text-[#EAF2ED] tabular-nums">
                      ${spentHourly}
                    </span>
                    <span className="text-[10px] font-mono text-[#93A99C]">/ ${hourlyCap}</span>
                  </div>
                </div>
                <span className="mt-2 text-xs font-mono font-semibold text-[#EAF2ED]">1-Hour Velocity</span>
                <span className="text-[11px] font-mono text-[#93A99C] mt-0.5">
                  ${hourlyCap - spentHourly} headroom left
                </span>
              </div>

              {/* 24-Hour Daily Speedometer */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke="#223229"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke={spentDaily > 400 ? '#FF5A52' : spentDaily > 250 ? '#F2994A' : '#22C38D'}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={dailyOffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-lg font-bold text-[#EAF2ED] tabular-nums">
                      ${spentDaily}
                    </span>
                    <span className="text-[10px] font-mono text-[#93A99C]">/ ${dailyCap}</span>
                  </div>
                </div>
                <span className="mt-2 text-xs font-mono font-semibold text-[#EAF2ED]">24-Hour Velocity</span>
                <span className="text-[11px] font-mono text-[#93A99C] mt-0.5">
                  ${dailyCap - spentDaily} daily room left
                </span>
              </div>
            </div>

            {/* Reset Countdown Indicator */}
            <div className="flex items-center justify-between border-t border-[#223229] pt-3 text-xs font-mono text-[#93A99C]">
              <span>Rolling Window Reset:</span>
              <span className="text-[#EAF2ED]">~42 minutes remaining</span>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 3: POLICY LIMITS SUMMARY (1 Col)
          --------------------------------------------------------------------- */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#223229] bg-[#16251E] p-6 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-[#223229] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                POLICY BOUNDARIES
              </span>
              <Link href="/policy" className="font-mono text-xs text-[#22C38D] hover:underline">
                Edit ↗
              </Link>
            </div>

            <div className="my-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Single-Tx Limit:</span>
                <span className="font-bold text-[#EAF2ED]">${singleTxLimit}.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Trust Decay:</span>
                <span className="font-bold text-[#EAF2ED]">{trustDecayDays} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">New Recipient:</span>
                <span className="rounded bg-[#F2994A]/15 px-2 py-0.5 text-[10px] font-bold text-[#F2994A]">
                  Step-Up Required
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Scam Blacklist:</span>
                <span className="rounded bg-[#22C38D]/15 px-2 py-0.5 text-[10px] font-bold text-[#22C38D]">
                  Active Shield
                </span>
              </div>
            </div>

            <div className="border-t border-[#223229] pt-3 text-[11px] font-mono text-[#93A99C]">
              Enforced by Soroban WASM
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 4: TRUSTED COUNTERPARTIES & TRUST DECAY RADAR (1 Col)
          --------------------------------------------------------------------- */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#223229] bg-[#16251E] p-6 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-[#223229] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                TRUST DECAY RADAR
              </span>
              <Link href="/policy" className="font-mono text-xs text-[#22C38D] hover:underline">
                Book ↗
              </Link>
            </div>

            <div className="my-3 flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#EAF2ED]">4 Active</span>
                <span className="font-mono text-xs text-[#22C38D]">Verified Peers</span>
              </div>

              {/* Decay Alert Preview */}
              <div className="rounded-xl border border-[#223229] bg-[#0D1712] p-3 font-mono text-xs flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] text-[#93A99C]">
                  <span>Closest Expiry:</span>
                  <span className="text-[#F2994A]">GA7Q...VSGZ</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#93A99C]">Last Outflow:</span>
                  <span className="text-[#EAF2ED]">24 days ago</span>
                </div>

                {/* Lifeline Progress Bar */}
                <div className="mt-1 flex flex-col gap-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#223229]">
                    <div className="h-full bg-[#F2994A]" style={{ width: '80%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#93A99C]">
                    <span>Day 24 of 30</span>
                    <span className="text-[#F2994A]">6 days remaining</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#223229] pt-3 text-[11px] font-mono text-[#93A99C]">
              Recipients require step-up upon expiry
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 5: GUARDIAN RECOVERY HEALTH (1 Col)
          --------------------------------------------------------------------- */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#223229] bg-[#16251E] p-6 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-[#223229] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                GUARDIAN HEALTH
              </span>
              <Link href="/app/guardians" className="font-mono text-xs text-[#22C38D] hover:underline">
                Manage ↗
              </Link>
            </div>

            <div className="my-3 flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#EAF2ED]">2-of-3</span>
                <span className="font-mono text-xs text-[#22C38D]">Quorum Active</span>
              </div>

              <div className="rounded-xl border border-[#223229] bg-[#0D1712] p-3 font-mono text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#22C38D]">
                  <span>✓ 48-Hour Safety Lock</span>
                </div>
                <div className="text-[11px] text-[#93A99C]">
                  Status: <span className="text-[#22C38D]">No Active Proposals</span>
                </div>
                <p className="text-[10px] text-[#93A99C] mt-1 leading-relaxed">
                  Owner retains absolute veto power over any unapproved recovery attempt.
                </p>
              </div>
            </div>

            <div className="border-t border-[#223229] pt-3 text-[11px] font-mono text-[#93A99C]">
              3 of 7 Max Guardians Appointed
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 5B / EXTRA TILE: ON-CHAIN VERIFICATION STATUS (1 Col)
          --------------------------------------------------------------------- */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#223229] bg-[#16251E] p-6 shadow-xl hover:border-[#22C38D]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-[#223229] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
                LEDGER SETTLEMENT
              </span>
              <span className="font-mono text-xs text-[#22C38D]">Testnet</span>
            </div>

            <div className="my-3 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Protocol Version:</span>
                <span className="text-[#EAF2ED] font-bold">v1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Avg Eval Latency:</span>
                <span className="text-[#22C38D] font-bold">380ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Gas Expenditure:</span>
                <span className="text-[#22C38D] font-bold">&lt; 0.001 XLM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93A99C]">Client SDK:</span>
                <span className="text-[#EAF2ED]">v0.4.0</span>
              </div>
            </div>

            <div className="border-t border-[#223229] pt-3 text-[11px] font-mono text-[#93A99C]">
              Stellar Consensus Protocol
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              TILE 6: QUICK ACTION OPERATIONS DECK (Spans Full Width / 4 Cols)
          --------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#223229] bg-[#16251E] p-6 sm:p-8 lg:col-span-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#223229] pb-4">
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#22C38D]">
                  OPERATIONS DECK
                </span>
                <h3 className="font-display text-xl font-bold text-[#EAF2ED]">
                  Quick Actions &amp; Transaction Controls
                </h3>
              </div>
              <span className="font-mono text-xs text-[#93A99C]">Instant Soroban Routing</span>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Action 1: Send Transfer */}
              <Link
                href="/app/transfer"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#22C38D] p-3.5 font-mono text-xs font-bold text-[#0D1712] hover:bg-[#22C38D]/90 transition-all shadow-md shadow-[#22C38D]/20 text-center"
              >
                <span className="text-base">💸</span>
                <span>Send Transfer</span>
              </Link>

              {/* Action 2: Configure Limits */}
              <Link
                href="/app/policy"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#223229] bg-[#0D1712] p-3.5 font-mono text-xs font-semibold text-[#EAF2ED] hover:border-[#22C38D] transition-colors text-center"
              >
                <span className="text-base">⚙️</span>
                <span>Set Limits</span>
              </Link>

              {/* Action 3: Recovery Center */}
              <Link
                href="/app/recovery"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gate/40 bg-gate/10 p-3.5 font-mono text-xs font-semibold text-gate hover:border-gate transition-colors text-center"
              >
                <span className="text-base">🚨</span>
                <span>Recovery</span>
              </Link>

              {/* Action 4: Flagged Registry */}
              <Link
                href="/app/risk"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-fault/40 bg-fault/10 p-3.5 font-mono text-xs font-semibold text-fault hover:border-fault transition-colors text-center"
              >
                <span className="text-base">🛑</span>
                <span>Risk Flags</span>
              </Link>

              {/* Action 5: Audit Trail */}
              <Link
                href="/app/audit"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#223229] bg-[#0D1712] p-3.5 font-mono text-xs font-semibold text-[#EAF2ED] hover:border-[#22C38D] transition-colors text-center"
              >
                <span className="text-base">📜</span>
                <span>Audit Trail</span>
              </Link>

              {/* Action 6: Setup Wizard */}
              <Link
                href="/app/onboarding"
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-clear/40 bg-clear/10 p-3.5 font-mono text-xs font-semibold text-clear hover:border-clear transition-colors text-center"
              >
                <span className="text-base">✨</span>
                <span>Setup Wizard</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
