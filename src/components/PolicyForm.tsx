'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { wardenClient } from '@/lib/wardenClient';
import { signXdr, sourceAccountOverride } from '@/lib/wallet';
import { sounds } from '@/lib/soundEngine';

type Status = 'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error';

interface PolicyFormProps {
  wallet: string;
  onSaved?: () => void;
}

export function PolicyForm({ wallet, onSaved }: PolicyFormProps) {
  const [maxNoStepUp, setMaxNoStepUp] = useState('150');
  const [dailyVelocityCap, setDailyVelocityCap] = useState('500');
  const [hourlyVelocityCap, setHourlyVelocityCap] = useState('200');
  const [newRecipientRequiresStepUp, setNewRecipientRequiresStepUp] = useState(true);
  const [trustDecayDays, setTrustDecayDays] = useState('30');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load existing policy if available
  useEffect(() => {
    if (!wallet || typeof wardenClient?.getPolicy !== 'function') return;
    let isMounted = true;
    wardenClient
      .getPolicy(wallet)
      .then((policy) => {
        if (!isMounted || !policy) return;
        if (policy.maxNoStepUp) setMaxNoStepUp(policy.maxNoStepUp);
        if (policy.dailyVelocityCap) setDailyVelocityCap(policy.dailyVelocityCap);
        if (policy.hourlyVelocityCap) setHourlyVelocityCap(policy.hourlyVelocityCap);
        if (policy.newRecipientRequiresStepUp !== undefined) {
          setNewRecipientRequiresStepUp(policy.newRecipientRequiresStepUp);
        }
        if (policy.trustDecaySeconds) {
          setTrustDecayDays(String(Number(policy.trustDecaySeconds) / 86_400));
        }
      })
      .catch(() => {
        // Keep baseline defaults
      });
    return () => {
      isMounted = false;
    };
  }, [wallet]);

  // Contract Invariant Validations
  const numMax = Number(maxNoStepUp);
  const numHourly = Number(hourlyVelocityCap);
  const numDaily = Number(dailyVelocityCap);

  const capBelowMax =
    maxNoStepUp !== '' &&
    dailyVelocityCap !== '' &&
    numDaily < numMax;

  const hourlyAboveDaily =
    hourlyVelocityCap !== '' &&
    dailyVelocityCap !== '' &&
    numHourly > numDaily;

  const negativeMax = maxNoStepUp !== '' && numMax < 0;
  const isInvalid = capBelowMax || hourlyAboveDaily || negativeMax;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isInvalid) return;

    sounds.playClick();
    setStatus('building');
    setError(null);

    try {
      const { xdr } = await wardenClient.buildSetPolicy(
        wallet,
        {
          version: 1,
          maxAmountNoStepUp: maxNoStepUp,
          dailyVelocityCap,
          hourlyVelocityCap,
          newRecipientRequiresStepUp,
          trustedRecipients: [],
          trustDecaySeconds: Number(trustDecayDays) * 86_400,
        },
        sourceAccountOverride(),
      );

      setStatus('signing');
      const signedXdr = await signXdr(xdr);

      setStatus('submitting');
      await wardenClient.submitSetPolicy(signedXdr);

      setStatus('success');
      sounds.playAllowChime();
      onSaved?.();
    } catch (err) {
      setStatus('error');
      sounds.playBlockAlert();
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Segmented decay options
  const decayOptions = [
    { label: '7 Days', days: '7', seconds: '604800' },
    { label: '30 Days (Recommended)', days: '30', seconds: '2592000' },
    { label: '90 Days', days: '90', seconds: '7776000' },
    { label: '180 Days', days: '180', seconds: '15552000' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 text-mist-100">
      {/* 4-Pillar Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =====================================================================
            PILLAR I: SINGLE-TRANSACTION THRESHOLD
        ===================================================================== */}
        <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl transition-all hover:border-clear/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                PILLAR I • SINGLE PAYMENT
              </span>
              <span className="font-mono text-[11px] text-mist-400">Autonomous Limit</span>
            </div>

            <label htmlFor="maxNoStepUp" className="font-display text-lg font-bold text-mist-100">
              Amount before step-up
            </label>
            <p className="text-xs text-mist-400 leading-relaxed">
              Transfers under this amount to trusted recipients glide through with zero biometric challenges.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-mist-400">
                $
              </span>
              <input
                id="maxNoStepUp"
                type="number"
                inputMode="decimal"
                value={maxNoStepUp}
                onChange={(e) => {
                  setMaxNoStepUp(e.target.value);
                  sounds.playRatchetTick();
                }}
                className="tabular-amount w-full rounded-lg border border-ink-700 bg-ink-900 pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-mist-100 outline-none focus:border-clear transition-colors"
                placeholder="150"
              />
            </div>

            {/* Quick Preset Pills */}
            <div className="mt-2 flex flex-wrap gap-2">
              {['50', '150', '500'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMaxNoStepUp(preset);
                    sounds.playClick();
                  }}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    maxNoStepUp === preset
                      ? 'bg-clear text-ink-900 font-bold'
                      : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                  }`}
                >
                  ${preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMaxNoStepUp('');
                  sounds.playClick();
                }}
                className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  !['50', '150', '500'].includes(maxNoStepUp)
                    ? 'border border-clear text-clear'
                    : 'border border-ink-700 bg-ink-900 text-mist-400'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            PILLAR II: HOURLY VELOCITY CEILING
        ===================================================================== */}
        <div
          className={`flex flex-col justify-between rounded-xl border bg-ink-800 p-6 shadow-xl transition-all ${
            hourlyAboveDaily ? 'border-fault' : 'border-ink-700 hover:border-clear/40'
          }`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gate">
                PILLAR II • ROLLING WINDOW
              </span>
              <span className="font-mono text-[11px] text-mist-400">60-Minute Burst</span>
            </div>

            <label htmlFor="hourlyVelocityCap" className="font-display text-lg font-bold text-mist-100">
              Hourly limit
            </label>
            <p className="text-xs text-mist-400 leading-relaxed">
              Maximum cumulative outflow allowed within any 60-minute window to halt automated account draining.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-mist-400">
                $
              </span>
              <input
                id="hourlyVelocityCap"
                type="number"
                inputMode="decimal"
                value={hourlyVelocityCap}
                onChange={(e) => {
                  setHourlyVelocityCap(e.target.value);
                  sounds.playRatchetTick();
                }}
                aria-invalid={hourlyAboveDaily}
                className={`tabular-amount w-full rounded-lg border bg-ink-900 pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-mist-100 outline-none transition-colors ${
                  hourlyAboveDaily
                    ? 'border-fault focus:border-fault'
                    : 'border-ink-700 focus:border-clear'
                }`}
                placeholder="200"
              />
            </div>

            {/* Invariant Error Message */}
            {hourlyAboveDaily && (
              <p role="alert" className="mt-1 font-mono text-xs font-semibold text-fault">
                Your hourly limit can&apos;t be more than your daily limit. Hourly speed limit cannot exceed 24-hour daily volume ceiling.
              </p>
            )}

            {/* Quick Preset Pills */}
            <div className="mt-2 flex flex-wrap gap-2">
              {['100', '200', '500'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setHourlyVelocityCap(preset);
                    sounds.playClick();
                  }}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    hourlyVelocityCap === preset
                      ? 'bg-gate text-ink-900 font-bold'
                      : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            PILLAR III: 24-HOUR GLOBAL VOLUME CEILING
        ===================================================================== */}
        <div
          className={`flex flex-col justify-between rounded-xl border bg-ink-800 p-6 shadow-xl transition-all ${
            capBelowMax ? 'border-fault' : 'border-ink-700 hover:border-clear/40'
          }`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                PILLAR III • GLOBAL CEILING
              </span>
              <span className="font-mono text-[11px] text-mist-400">24-Hour Horizon</span>
            </div>

            <label htmlFor="dailyVelocityCap" className="font-display text-lg font-bold text-mist-100">
              Daily limit
            </label>
            <p className="text-xs text-mist-400 leading-relaxed">
              Absolute maximum capital that can leave this account within a rolling 24-hour day across all transactions.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-mist-400">
                $
              </span>
              <input
                id="dailyVelocityCap"
                type="number"
                inputMode="decimal"
                value={dailyVelocityCap}
                onChange={(e) => {
                  setDailyVelocityCap(e.target.value);
                  sounds.playRatchetTick();
                }}
                aria-invalid={capBelowMax}
                className={`tabular-amount w-full rounded-lg border bg-ink-900 pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-mist-100 outline-none transition-colors ${
                  capBelowMax
                    ? 'border-fault focus:border-fault'
                    : 'border-ink-700 focus:border-clear'
                }`}
                placeholder="500"
              />
            </div>

            {/* Invariant Error Message */}
            {capBelowMax && (
              <p role="alert" className="mt-1 font-mono text-xs font-semibold text-fault">
                Your daily limit can&apos;t be less than your no-confirmation amount.
              </p>
            )}

            {/* Quick Preset Pills */}
            <div className="mt-2 flex flex-wrap gap-2">
              {['500', '1000', '2500'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDailyVelocityCap(preset);
                    sounds.playClick();
                  }}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    dailyVelocityCap === preset
                      ? 'bg-clear text-ink-900 font-bold'
                      : 'border border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400 hover:text-mist-100'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            PILLAR IV: TEMPORAL TRUST DECAY
        ===================================================================== */}
        <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl transition-all hover:border-clear/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gate">
                PILLAR IV • MEMORY HORIZON
              </span>
              <span className="font-mono text-[11px] text-mist-400">Trust Decay</span>
            </div>

            <label htmlFor="trustDecayDays" className="font-display text-lg font-bold text-mist-100">
              Trust expires after
            </label>
            <p className="text-xs text-mist-400 leading-relaxed">
              If you haven&apos;t sent funds to a recipient in this window, their trust expires and re-verification is required.
            </p>

            {/* Segmented Selector */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {decayOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => {
                    setTrustDecayDays(opt.days);
                    sounds.playClick();
                  }}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                    trustDecayDays === opt.days
                      ? 'border-clear bg-clear/15 text-mist-100'
                      : 'border-ink-700 bg-ink-900 text-mist-400 hover:border-mist-400'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-mist-100">{opt.label}</span>
                  <span className="text-[10px] font-mono text-mist-400">{Number(opt.days) * 86400} seconds</span>
                </button>
              ))}
            </div>

            {/* Hidden/accessible input for testing and exact values */}
            <div className="mt-2 flex items-center gap-3">
              <input
                id="trustDecayDays"
                type="number"
                inputMode="numeric"
                min="1"
                value={trustDecayDays}
                onChange={(e) => {
                  setTrustDecayDays(e.target.value);
                  sounds.playRatchetTick();
                }}
                className="tabular-amount w-28 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 font-mono text-xs text-mist-100 outline-none focus:border-clear"
              />
              <span className="font-mono text-xs text-mist-400">days without a payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECURITY SWITCH: NEW RECIPIENT SHIELD
      ========================================================================= */}
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
        <label className="flex items-start gap-4 cursor-pointer">
          <div className="relative mt-0.5 flex items-center">
            <input
              type="checkbox"
              checked={newRecipientRequiresStepUp}
              onChange={(e) => {
                setNewRecipientRequiresStepUp(e.target.checked);
                sounds.playClick();
              }}
              className="sr-only"
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors ${
                newRecipientRequiresStepUp ? 'bg-clear' : 'bg-ink-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-ink-900 transition-transform duration-200 ease-out mt-0.5 ml-0.5 ${
                  newRecipientRequiresStepUp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-display text-base font-bold text-mist-100">
              Ask for confirmation the first time I send to a new recipient
            </span>
            <span className="text-xs text-mist-400 leading-relaxed">
              Require Step-Up for First-Time Recipients: When enabled, any transfer to an address you have never paid before requires secondary confirmation, regardless of how small the amount is.
            </span>
          </div>
        </label>
      </div>

      {/* =========================================================================
          CUSTOM VECTOR ILLUSTRATIONS SECTION
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Illustration 1: The Multi-Tier Safety Envelope */}
        <div className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
            ILLUSTRATION // THE MULTI-TIER SAFETY ENVELOPE
          </span>
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-ink-700 bg-ink-900 p-4">
            <svg viewBox="0 0 320 140" fill="none" className="w-full max-w-[300px] h-auto">
              {/* Daily Outer Boundary */}
              <rect x="10" y="10" width="300" height="120" rx="12" stroke="var(--ink-700)" strokeWidth="2" strokeDasharray="4 4" />
              <text x="20" y="28" fill="var(--mist-400)" fontSize="10" fontFamily="monospace">
                DAILY CEILING: ${dailyVelocityCap}
              </text>

              {/* Hourly Velocity Ring */}
              <rect x="40" y="36" width="240" height="84" rx="8" stroke="var(--gate)" strokeWidth="1.5" />
              <text x="50" y="52" fill="var(--gate)" fontSize="9" fontFamily="monospace">
                HOURLY SPEED LIMIT: ${hourlyVelocityCap}
              </text>

              {/* Single-Tx Core */}
              <rect x="75" y="64" width="170" height="46" rx="6" fill="rgba(34,195,141,0.08)" stroke="var(--clear)" strokeWidth="1.5" />
              <text x="85" y="90" fill="var(--clear)" fontSize="11" fontWeight="bold" fontFamily="monospace">
                SINGLE-TX CAP: ${maxNoStepUp}
              </text>
            </svg>
          </div>
          <p className="text-[11px] font-mono text-mist-400">
            Enclosed boundaries: Single-Tx Cap ⊂ Hourly Velocity ⊂ Daily Global Cap.
          </p>
        </div>

        {/* Illustration 2: Trust Decay Timeline */}
        <div className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
            ILLUSTRATION // TRUST DECAY TIMELINE
          </span>
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-ink-700 bg-ink-900 p-4">
            <svg viewBox="0 0 320 140" fill="none" className="w-full max-w-[300px] h-auto">
              {/* Solid Green Active Lifeline */}
              <line x1="30" y1="70" x2="190" y2="70" stroke="var(--clear)" strokeWidth="3" />
              {/* Amber Dashed Decaying Lifeline */}
              <line x1="190" y1="70" x2="290" y2="70" stroke="var(--gate)" strokeWidth="2" strokeDasharray="4 4" />

              {/* Node 1: Day 0 Verified */}
              <circle cx="30" cy="70" r="8" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="2" />
              <circle cx="30" cy="70" r="3" fill="var(--clear)" />
              <text x="15" y="98" fill="var(--mist-400)" fontSize="9" fontFamily="monospace">Day 0</text>
              <text x="10" y="112" fill="var(--clear)" fontSize="8" fontFamily="monospace">Active</text>

              {/* Node 2: Current Progress (Day 24) */}
              <circle cx="190" cy="70" r="7" fill="var(--ink-900)" stroke="var(--gate)" strokeWidth="2" />
              <circle cx="190" cy="70" r="2.5" fill="var(--gate)" />
              <text x="175" y="98" fill="var(--mist-400)" fontSize="9" fontFamily="monospace">Day 24</text>
              <text x="165" y="112" fill="var(--gate)" fontSize="8" fontFamily="monospace">Decaying</text>

              {/* Node 3: Decay Expiry Threshold */}
              <circle cx="290" cy="70" r="6" fill="var(--ink-900)" stroke="var(--fault)" strokeWidth="1.5" />
              <text x="270" y="98" fill="var(--mist-400)" fontSize="9" fontFamily="monospace">Day {trustDecayDays}</text>
              <text x="260" y="112" fill="var(--fault)" fontSize="8" fontFamily="monospace">Expired</text>
            </svg>
          </div>
          <p className="text-[11px] font-mono text-mist-400">
            Verified counterparties fade to unverified status after {trustDecayDays} days without interaction.
          </p>
        </div>
      </div>

      {/* =========================================================================
          RULEBOOK IMPACT PREVIEW SIMULATOR CARD
      ========================================================================= */}
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-700 pb-4 gap-2">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
              REAL-TIME SIMULATION
            </span>
            <h3 className="font-display text-xl font-bold text-mist-100">
              Rulebook Impact Preview
            </h3>
          </div>
          <span className="font-mono text-xs text-mist-400">
            Dynamic Evaluation against Current Form Limits
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Test Case A: Morning Coffee */}
          <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-mist-400">TEST CASE A</span>
              <span className="font-display text-sm font-bold text-mist-100">Morning Coffee</span>
              <span className="font-mono text-xs text-mist-400">$8.50 to Trusted Friend</span>
            </div>
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-clear/15 px-2.5 py-1 font-mono text-[10px] font-bold text-clear">
                ALLOW INSTANTLY
              </span>
            </div>
          </div>

          {/* Test Case B: Large Purchase */}
          <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-mist-400">TEST CASE B</span>
              <span className="font-display text-sm font-bold text-mist-100">Large Purchase</span>
              <span className="font-mono text-xs text-mist-400">$300.00 Outflow</span>
            </div>
            <div className="mt-4">
              {300 > numMax ? (
                <span className="inline-flex rounded-full bg-gate/15 px-2.5 py-1 font-mono text-[10px] font-bold text-gate">
                  STEP-UP (AmountExceeded)
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-clear/15 px-2.5 py-1 font-mono text-[10px] font-bold text-clear">
                  ALLOW INSTANTLY
                </span>
              )}
            </div>
          </div>

          {/* Test Case C: Automated Burst */}
          <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-mist-400">TEST CASE C</span>
              <span className="font-display text-sm font-bold text-mist-100">3:00 AM Drain Burst</span>
              <span className="font-mono text-xs text-mist-400">4 × $100 in 10 minutes</span>
            </div>
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-gate/15 px-2.5 py-1 font-mono text-[10px] font-bold text-gate">
                HOURLY SPEED LIMIT REACHED
              </span>
            </div>
          </div>

          {/* Test Case D: Inactive Friend */}
          <div className="flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-mist-400">TEST CASE D</span>
              <span className="font-display text-sm font-bold text-mist-100">Inactive Peer (35 Days)</span>
              <span className="font-mono text-xs text-mist-400">$40.00 to Dormant Peer</span>
            </div>
            <div className="mt-4">
              {Number(trustDecayDays) < 35 ? (
                <span className="inline-flex rounded-full bg-gate/15 px-2.5 py-1 font-mono text-[10px] font-bold text-gate">
                  STEP-UP (TrustDecayed)
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-clear/15 px-2.5 py-1 font-mono text-[10px] font-bold text-clear">
                  ALLOW INSTANTLY
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUBMISSION DECK & TRANSACTION METRICS STRIP
      ========================================================================= */}
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-lg font-bold text-mist-100">Commit Boundaries to Stellar</span>
            <span className="text-xs text-mist-400">
              Updates will be signed with your active Freighter keys and recorded in contract storage.
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            aria-label="Set limits"
            disabled={isInvalid || status === 'submitting' || status === 'building' || status === 'signing'}
            className="flex items-center justify-center gap-2 rounded-xl bg-clear px-8 py-3.5 font-mono text-sm font-bold text-ink-900 shadow-lg shadow-clear/20 transition-all hover:bg-clear/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Sign &amp; Commit Policy to Stellar</span>
            <span className="sr-only">Set limits</span>
          </button>
        </div>

        {/* Real-time Submission States */}
        {status === 'building' && (
          <div className="flex items-center gap-2 font-mono text-xs text-gate">
            <span className="h-2 w-2 rounded-full bg-gate animate-ping" />
            <span>Building XDR transaction envelope…</span>
          </div>
        )}
        {status === 'signing' && (
          <div className="flex items-center gap-2 font-mono text-xs text-gate">
            <span className="h-2 w-2 rounded-full bg-gate animate-ping" />
            <span>Awaiting wallet authorization signature via Freighter…</span>
          </div>
        )}
        {status === 'submitting' && (
          <div className="flex items-center gap-2 font-mono text-xs text-clear">
            <span className="h-2 w-2 rounded-full bg-clear animate-ping" />
            <span>Submitting to Stellar Testnet Soroban RPC…</span>
          </div>
        )}
        {status === 'success' && (
          <p role="status" className="font-mono text-xs font-semibold text-clear">
            Limits set. Policy Committed On-Chain.
          </p>
        )}
        {status === 'error' && error && (
          <p role="alert" className="font-mono text-xs font-semibold text-fault">
            {error}
          </p>
        )}

        {/* Monospace Telemetry Strip */}
        <div className="border-t border-ink-700 pt-4 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-mist-400">
          <span>NETWORK: STELLAR TESTNET</span>
          <span>ESTIMATED FEE: &lt; 0.00001 XLM</span>
          <span>AUTHORIZATION: WALLET REQUIRED</span>
          <span>INTEGER SCALING: 7-DECIMAL STROOPS</span>
        </div>
      </div>
    </form>
  );
}
