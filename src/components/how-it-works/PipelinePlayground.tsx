'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEngine';

type Scenario = 'amina' | 'drain' | 'burst' | 'flagged';

export function PipelinePlayground() {
  const [activeScenario, setActiveScenario] = useState<Scenario>('amina');
  const [amount, setAmount] = useState<number>(12);
  const [trustDays, setTrustDays] = useState<number>(4);
  const [hourlyVelocity, setHourlyVelocity] = useState<number>(12);

  function applyPreset(s: Scenario) {
    setActiveScenario(s);
    if (s === 'amina') {
      setAmount(12);
      setTrustDays(4);
      setHourlyVelocity(12);
      sounds.playAllowChime();
    } else if (s === 'drain') {
      setAmount(1200);
      setTrustDays(0);
      setHourlyVelocity(1200);
      sounds.playGateLockImpact();
    } else if (s === 'burst') {
      setAmount(150);
      setTrustDays(2);
      setHourlyVelocity(600);
      sounds.playGateLockImpact();
    } else if (s === 'flagged') {
      setAmount(10);
      setTrustDays(0);
      setHourlyVelocity(10);
      sounds.playGateLockImpact();
    }
  }

  // Deterministic evaluation matching contract logic
  const isFlagged = activeScenario === 'flagged';
  const isTrustDecayed = trustDays > 30 || trustDays === 0;
  const isHourlyBreached = hourlyVelocity > 200;
  const isAmountBreached = amount > 150;

  const requiresStepUp = isFlagged || isTrustDecayed || isHourlyBreached || isAmountBreached;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {/* Scenario Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700/60 pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-mist-400">
          Interactive Pipeline Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'amina', label: '🥬 Mama Amina ($12)' },
            { id: 'drain', label: '🚨 Account Takeover ($1.2k)' },
            { id: 'burst', label: '🤖 Rapid Burst ($600/hr)' },
            { id: 'flagged', label: '🚫 Sanctioned Address' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyPreset(item.id as Scenario)}
              className={`rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium transition-all ${
                activeScenario === item.id
                  ? 'bg-mist-100 text-ink-900 shadow-md font-semibold'
                  : 'border border-ink-700 text-mist-400 hover:border-mist-400 hover:text-mist-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* The 3 Connected Chambers Visual Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chamber 1: The Detective */}
        <div className="relative rounded-xl border border-ink-700 bg-ink-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-edge font-semibold">CHAMBER 01 // DETECTIVE</span>
            <span className="h-2 w-2 rounded-full bg-edge animate-pulse" />
          </div>
          <h4 className="mt-3 font-display text-lg font-bold text-mist-100">Off-Chain Telemetry</h4>
          <p className="mt-1 text-xs text-mist-400">Inspects device vectors, network paths, and destination clustering.</p>

          <div className="mt-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">Risk Score:</span>
              <span className={requiresStepUp ? 'text-gate font-bold' : 'text-clear font-bold'}>
                {requiresStepUp ? '84 / 100' : '04 / 100'}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">Anomalous Spike:</span>
              <span className="text-mist-100">{isHourlyBreached ? 'DETECTED' : 'NOMINAL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist-400">Authority:</span>
              <span className="text-mist-400">Advisory (Zero Keys)</span>
            </div>
          </div>
        </div>

        {/* Chamber 2: The Rule Book */}
        <div className="relative rounded-xl border border-ink-700 bg-ink-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gate font-semibold">CHAMBER 02 // RULE BOOK</span>
            <span className="h-2 w-2 rounded-full bg-gate" />
          </div>
          <h4 className="mt-3 font-display text-lg font-bold text-mist-100">Stateful Memory</h4>
          <p className="mt-1 text-xs text-mist-400">Tracks hourly sliding caps, decay timers, and account security states.</p>

          <div className="mt-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">1-Hour Outflow:</span>
              <span className={isHourlyBreached ? 'text-fault font-bold' : 'text-mist-100'}>
                ${hourlyVelocity} / $200
              </span>
            </div>
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">Trust Status:</span>
              <span className={isTrustDecayed ? 'text-gate font-semibold' : 'text-clear font-semibold'}>
                {isTrustDecayed ? 'DECAYED (>30d)' : 'ACTIVE (Verified)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist-400">Account Tier:</span>
              <span className="text-mist-100 font-semibold">{requiresStepUp ? 'CHALLENGED' : 'NORMAL'}</span>
            </div>
          </div>
        </div>

        {/* Chamber 3: The Security Guard */}
        <div
          className={`relative rounded-xl border p-5 transition-all duration-300 ${
            !requiresStepUp
              ? 'border-clear/60 bg-clear/5 shadow-[0_0_24px_rgba(34,195,141,0.15)]'
              : isFlagged
              ? 'border-fault/60 bg-fault/5 shadow-[0_0_24px_rgba(255,90,82,0.15)]'
              : 'border-gate/60 bg-gate/5 shadow-[0_0_24px_rgba(242,153,74,0.15)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs font-semibold ${
                !requiresStepUp ? 'text-clear' : isFlagged ? 'text-fault' : 'text-gate'
              }`}
            >
              CHAMBER 03 // GUARD
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                !requiresStepUp ? 'bg-clear' : isFlagged ? 'bg-fault' : 'bg-gate'
              }`}
            />
          </div>
          <h4 className="mt-3 font-display text-lg font-bold text-mist-100">Soroban __check_auth</h4>
          <p className="mt-1 text-xs text-mist-400">Enforces deterministic integer guardrails directly on the ledger.</p>

          <div className="mt-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">Action:</span>
              <span className="font-bold text-mist-100">
                {!requiresStepUp ? 'ALLOW INSTANTLY' : 'REQUIRE STEP-UP'}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink-700/50 pb-2">
              <span className="text-mist-400">CPU Instructions:</span>
              <span className="text-mist-400">&lt; 2.5M / 100M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist-400">Vault Gate:</span>
              <span className={!requiresStepUp ? 'text-clear font-bold' : 'text-fault font-bold'}>
                {!requiresStepUp ? 'PASSED (Zero Prompt)' : 'HALTED ON-CHAIN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Invariant Explanation Footer */}
      <div className="mt-8 rounded-xl border border-ink-700/60 bg-ink-900/80 p-4 font-mono text-xs text-mist-400">
        <div className="flex items-start gap-2">
          <span className="text-gate font-bold whitespace-nowrap">▶ INVARIANT EVALUATION:</span>
          <span>
            {!requiresStepUp
              ? 'Transfer within single threshold ($12 < $150), hourly velocity normal ($12 < $200), recipient trusted. Transaction authorized without secondary biometric challenge.'
              : isFlagged
              ? 'Critical policy violation: Recipient address matches on-chain Flagged Registry hash. Single-signature execution declined.'
              : isHourlyBreached
              ? 'Velocity breach: Outflow velocity ($600/hr) exceeds configured parameter ($200/hr). Second-factor authorization or cooldown required.'
              : 'Destination trust decayed: Recipient has not interacted in >30 days. Secondary step-up prompt enforced.'}
          </span>
        </div>
      </div>
    </div>
  );
}
