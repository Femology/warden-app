'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEngine';

export function TrustDecayTimeMachine() {
  const [trustDays, setTrustDays] = useState<number>(5);
  const [hourlySpend, setHourlySpend] = useState<number>(50);
  const [dailySpend, setDailySpend] = useState<number>(150);

  const HOURLY_LIMIT = 200;
  const DAILY_LIMIT = 1000;

  function handleDaysChange(val: number) {
    if ((trustDays <= 30 && val > 30) || (trustDays > 30 && val <= 30)) {
      sounds.playGateLockImpact();
    } else {
      sounds.playRatchetTick();
    }
    setTrustDays(val);
  }

  function handleSimulateBurst() {
    setHourlySpend((prev) => {
      const next = prev + 50;
      if (next >= HOURLY_LIMIT) {
        sounds.playGateLockImpact();
      } else {
        sounds.playAllowChime();
      }
      return next;
    });
    setDailySpend((prev) => prev + 50);
  }

  function handleResetVelocity() {
    setHourlySpend(0);
    setDailySpend(100);
    sounds.playAllowChime();
  }

  const isDecayed = trustDays > 30;
  const isHourlyBreached = hourlySpend >= HOURLY_LIMIT;
  const isDailyBreached = dailySpend >= DAILY_LIMIT;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/80 p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700/60 pb-5">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gate">
            Micro-Lab: Stateful Memory
          </span>
          <h4 className="mt-1 font-display text-xl font-bold text-mist-100">
            Trust Decay &amp; Velocity Time-Machine
          </h4>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSimulateBurst}
            className="rounded-lg border border-gate/50 bg-gate/15 px-3 py-1.5 text-xs font-semibold text-gate transition-all hover:bg-gate/25"
          >
            ⚡ Simulate Rapid Burst: +$50
          </button>
          <button
            type="button"
            onClick={handleResetVelocity}
            className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-mist-400 hover:text-mist-100"
          >
            Reset Hours
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left: Trust Decay Interactive Slider (6 cols) */}
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-ink-700/60 bg-ink-900/60 p-5 md:col-span-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-mist-100">
                1. Recipient Trust Decay Timeline
              </span>
              <span className="tabular-amount font-mono text-xs text-mist-400">
                {trustDays} {trustDays === 1 ? 'day' : 'days'} ago
              </span>
            </div>
            <p className="mt-1 text-xs text-mist-400">
              Relationships cool off over time. After 30 days of inactivity, the contract revokes instant exemption.
            </p>
          </div>

          {/* Interactive Connection Filament Diagram */}
          <div className="flex flex-col items-center justify-center py-4">
            <svg viewBox="0 0 260 70" className="h-16 w-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Wallet Node */}
              <circle cx="35" cy="35" r="14" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2.5" />
              <text x="35" y="39" textAnchor="middle" fontSize="9" fill="var(--mist-100)" fontFamily="sans-serif" fontWeight="bold">YOU</text>

              {/* Connecting Filament */}
              <path
                d="M 52 35 L 208 35"
                stroke={isDecayed ? 'var(--gate)' : 'var(--clear)'}
                strokeWidth={isDecayed ? '2' : '3.5'}
                strokeDasharray={isDecayed ? '6 4' : 'none'}
                className="transition-all duration-300"
              />

              {/* Counterparty Node */}
              <circle cx="225" cy="35" r="14" fill="var(--ink-800)" stroke={isDecayed ? 'var(--gate)' : 'var(--clear)'} strokeWidth="2.5" />
              <text x="225" y="39" textAnchor="middle" fontSize="8" fill="var(--mist-100)" fontFamily="sans-serif" fontWeight="bold">PEER</text>
            </svg>

            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                isDecayed
                  ? 'border border-gate/40 bg-gate/15 text-gate'
                  : 'border border-clear/40 bg-clear/15 text-clear'
              }`}
            >
              {isDecayed ? '⚠️ Trust Decayed (>30d) — Step-Up Required' : '✓ Active Relationship (Instant Allowed)'}
            </div>
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={90}
              value={trustDays}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-gate outline-none"
            />
            <div className="flex justify-between text-[11px] text-mist-400">
              <span>Day 0 (Paid today)</span>
              <span className="text-gate font-medium">Day 30 (Decay Latch)</span>
              <span>Day 90 (Cold)</span>
            </div>
          </div>
        </div>

        {/* Right: Dual Velocity Arc Meters (6 cols) */}
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-ink-700/60 bg-ink-900/60 p-5 md:col-span-6">
          <div>
            <span className="font-display text-sm font-bold text-mist-100">
              2. Dual Rolling Velocity Windows
            </span>
            <p className="mt-1 text-xs text-mist-400">
              Two independent horizons. A 1-hour cap halts rapid micro-drains; a 24-hour cap contains total daily liability.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 1-Hour Speedometer */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                isHourlyBreached
                  ? 'border-fault bg-fault/10 shadow-[0_0_20px_rgba(255,90,82,0.2)]'
                  : 'border-ink-700 bg-ink-800/60'
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-400">
                1-Hour Horizon
              </span>
              <div
                className={`tabular-amount font-display text-2xl font-bold mt-1 ${
                  isHourlyBreached ? 'text-fault' : 'text-clear'
                }`}
              >
                ${hourlySpend}
              </div>
              <span className="text-[10px] text-mist-400">Cap: ${HOURLY_LIMIT} / hr</span>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHourlyBreached ? 'bg-fault' : 'bg-clear'
                  }`}
                  style={{ width: `${Math.min(100, (hourlySpend / HOURLY_LIMIT) * 100)}%` }}
                />
              </div>
              <span className="mt-2 text-[10px] font-mono text-mist-400">
                {isHourlyBreached ? '⛔ HOURLY BREACH' : 'Nominal Pace'}
              </span>
            </div>

            {/* 24-Hour Speedometer */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                isDailyBreached
                  ? 'border-fault bg-fault/10 shadow-[0_0_20px_rgba(255,90,82,0.2)]'
                  : 'border-ink-700 bg-ink-800/60'
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-400">
                24-Hour Horizon
              </span>
              <div
                className={`tabular-amount font-display text-2xl font-bold mt-1 ${
                  isDailyBreached ? 'text-fault' : 'text-mist-100'
                }`}
              >
                ${dailySpend}
              </div>
              <span className="text-[10px] text-mist-400">Cap: ${DAILY_LIMIT} / day</span>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDailyBreached ? 'bg-fault' : 'bg-clear'
                  }`}
                  style={{ width: `${Math.min(100, (dailySpend / DAILY_LIMIT) * 100)}%` }}
                />
              </div>
              <span className="mt-2 text-[10px] font-mono text-mist-400">
                {isDailyBreached ? '⛔ DAILY CAP' : 'Headroom Active'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gate/30 bg-gate/10 px-3 py-2 text-[11px] text-mist-400">
            <strong>Memory Invariant:</strong> Contract resets sliding windows every 3,600s and 86,400s without server cronjobs.
          </div>
        </div>
      </div>
    </div>
  );
}
