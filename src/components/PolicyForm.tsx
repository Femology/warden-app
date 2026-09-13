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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 text-[#EAF2ED]">
      {/* 4-Pillar Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =====================================================================
            PILLAR I: SINGLE-TRANSACTION THRESHOLD
        ===================================================================== */}
        <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl transition-all hover:border-[#22C38D]/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#22C38D]">
                PILLAR I • SINGLE PAYMENT
              </span>
              <span className="font-mono text-[11px] text-[#93A99C]">Autonomous Limit</span>
            </div>

            <label htmlFor="maxNoStepUp" className="font-display text-lg font-bold text-[#EAF2ED]">
              Amount before step-up
            </label>
            <p className="text-xs text-[#93A99C] leading-relaxed">
              Transfers under this amount to trusted recipients glide through with zero biometric challenges.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-[#93A99C]">
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
                className="tabular-amount w-full rounded-lg border border-[#223229] bg-[#0D1712] pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-[#EAF2ED] outline-none focus:border-[#22C38D] transition-colors"
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
                      ? 'bg-[#22C38D] text-[#0D1712] font-bold'
                      : 'border border-[#223229] bg-[#0D1712] text-[#93A99C] hover:border-[#93A99C] hover:text-[#EAF2ED]'
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
                    ? 'border border-[#22C38D] text-[#22C38D]'
                    : 'border border-[#223229] bg-[#0D1712] text-[#93A99C]'
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
          className={`flex flex-col justify-between rounded-xl border bg-[#16251E] p-6 shadow-xl transition-all ${
            hourlyAboveDaily ? 'border-[#FF5A52]' : 'border-[#223229] hover:border-[#22C38D]/40'
          }`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F2994A]">
                PILLAR II • ROLLING WINDOW
              </span>
              <span className="font-mono text-[11px] text-[#93A99C]">60-Minute Burst</span>
            </div>

            <label htmlFor="hourlyVelocityCap" className="font-display text-lg font-bold text-[#EAF2ED]">
              Hourly limit
            </label>
            <p className="text-xs text-[#93A99C] leading-relaxed">
              Maximum cumulative outflow allowed within any 60-minute window to halt automated account draining.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-[#93A99C]">
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
                className={`tabular-amount w-full rounded-lg border bg-[#0D1712] pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-[#EAF2ED] outline-none transition-colors ${
                  hourlyAboveDaily
                    ? 'border-[#FF5A52] focus:border-[#FF5A52]'
                    : 'border-[#223229] focus:border-[#22C38D]'
                }`}
                placeholder="200"
              />
            </div>

            {/* Invariant Error Message */}
            {hourlyAboveDaily && (
              <p role="alert" className="mt-1 font-mono text-xs font-semibold text-[#FF5A52]">
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
                      ? 'bg-[#F2994A] text-[#0D1712] font-bold'
                      : 'border border-[#223229] bg-[#0D1712] text-[#93A99C] hover:border-[#93A99C] hover:text-[#EAF2ED]'
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
          className={`flex flex-col justify-between rounded-xl border bg-[#16251E] p-6 shadow-xl transition-all ${
            capBelowMax ? 'border-[#FF5A52]' : 'border-[#223229] hover:border-[#22C38D]/40'
          }`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#22C38D]">
                PILLAR III • GLOBAL CEILING
              </span>
              <span className="font-mono text-[11px] text-[#93A99C]">24-Hour Horizon</span>
            </div>

            <label htmlFor="dailyVelocityCap" className="font-display text-lg font-bold text-[#EAF2ED]">
              Daily limit
            </label>
            <p className="text-xs text-[#93A99C] leading-relaxed">
              Absolute maximum capital that can leave this account within a rolling 24-hour day across all transactions.
            </p>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-base font-bold text-[#93A99C]">
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
                className={`tabular-amount w-full rounded-lg border bg-[#0D1712] pl-8 pr-4 py-2.5 font-mono text-base font-semibold text-[#EAF2ED] outline-none transition-colors ${
                  capBelowMax
                    ? 'border-[#FF5A52] focus:border-[#FF5A52]'
                    : 'border-[#223229] focus:border-[#22C38D]'
                }`}
                placeholder="500"
              />
            </div>

            {/* Invariant Error Message */}
            {capBelowMax && (
              <p role="alert" className="mt-1 font-mono text-xs font-semibold text-[#FF5A52]">
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
                      ? 'bg-[#22C38D] text-[#0D1712] font-bold'
                      : 'border border-[#223229] bg-[#0D1712] text-[#93A99C] hover:border-[#93A99C] hover:text-[#EAF2ED]'
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
        <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl transition-all hover:border-[#22C38D]/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F2994A]">
                PILLAR IV • MEMORY HORIZON
              </span>
              <span className="font-mono text-[11px] text-[#93A99C]">Trust Decay</span>
            </div>

            <label htmlFor="trustDecayDays" className="font-display text-lg font-bold text-[#EAF2ED]">
              Trust expires after
            </label>
            <p className="text-xs text-[#93A99C] leading-relaxed">
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
                      ? 'border-[#22C38D] bg-[#22C38D]/15 text-[#EAF2ED]'
                      : 'border-[#223229] bg-[#0D1712] text-[#93A99C] hover:border-[#93A99C]'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#EAF2ED]">{opt.label}</span>
                  <span className="text-[10px] font-mono text-[#93A99C]">{Number(opt.days) * 86400} seconds</span>
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
                className="tabular-amount w-28 rounded-md border border-[#223229] bg-[#0D1712] px-3 py-1.5 font-mono text-xs text-[#EAF2ED] outline-none focus:border-[#22C38D]"
              />
              <span className="font-mono text-xs text-[#93A99C]">days without a payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECURITY SWITCH: NEW RECIPIENT SHIELD
      ========================================================================= */}
      <div className="rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl">
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
                newRecipientRequiresStepUp ? 'bg-[#22C38D]' : 'bg-[#223229]'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-[#0D1712] transition-transform duration-200 ease-out mt-0.5 ml-0.5 ${
                  newRecipientRequiresStepUp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-display text-base font-bold text-[#EAF2ED]">
              Ask for confirmation the first time I send to a new recipient
            </span>
            <span className="text-xs text-[#93A99C] leading-relaxed">
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
        <div className="flex flex-col gap-3 rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
            ILLUSTRATION // THE MULTI-TIER SAFETY ENVELOPE
          </span>
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-[#223229] bg-[#0D1712] p-4">
            <svg viewBox="0 0 320 140" fill="none" className="w-full max-w-[300px] h-auto">
              {/* Daily Outer Boundary */}
              <rect x="10" y="10" width="300" height="120" rx="12" stroke="#223229" strokeWidth="2" strokeDasharray="4 4" />
              <text x="20" y="28" fill="#93A99C" fontSize="10" fontFamily="monospace">
                DAILY CEILING: ${dailyVelocityCap}
              </text>

              {/* Hourly Velocity Ring */}
              <rect x="40" y="36" width="240" height="84" rx="8" stroke="#F2994A" strokeWidth="1.5" />
              <text x="50" y="52" fill="#F2994A" fontSize="9" fontFamily="monospace">
                HOURLY SPEED LIMIT: ${hourlyVelocityCap}
              </text>

              {/* Single-Tx Core */}
              <rect x="75" y="64" width="170" height="46" rx="6" fill="rgba(34,195,141,0.08)" stroke="#22C38D" strokeWidth="1.5" />
              <text x="85" y="90" fill="#22C38D" fontSize="11" fontWeight="bold" fontFamily="monospace">
                SINGLE-TX CAP: ${maxNoStepUp}
              </text>
            </svg>
          </div>
          <p className="text-[11px] font-mono text-[#93A99C]">
            Enclosed boundaries: Single-Tx Cap ⊂ Hourly Velocity ⊂ Daily Global Cap.
          </p>
        </div>

        {/* Illustration 2: Trust Decay Timeline */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#93A99C]">
            ILLUSTRATION // TRUST DECAY TIMELINE
          </span>
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-[#223229] bg-[#0D1712] p-4">
            <svg viewBox="0 0 320 140" fill="none" className="w-full max-w-[300px] h-auto">
              {/* Solid Green Active Lifeline */}
              <line x1="30" y1="70" x2="190" y2="70" stroke="#22C38D" strokeWidth="3" />
              {/* Amber Dashed Decaying Lifeline */}
              <line x1="190" y1="70" x2="290" y2="70" stroke="#F2994A" strokeWidth="2" strokeDasharray="4 4" />

              {/* Node 1: Day 0 Verified */}
              <circle cx="30" cy="70" r="8" fill="#0D1712" stroke="#22C38D" strokeWidth="2" />
              <circle cx="30" cy="70" r="3" fill="#22C38D" />
              <text x="15" y="98" fill="#93A99C" fontSize="9" fontFamily="monospace">Day 0</text>
              <text x="10" y="112" fill="#22C38D" fontSize="8" fontFamily="monospace">Active</text>

              {/* Node 2: Current Progress (Day 24) */}
              <circle cx="190" cy="70" r="7" fill="#0D1712" stroke="#F2994A" strokeWidth="2" />
              <circle cx="190" cy="70" r="2.5" fill="#F2994A" />
              <text x="175" y="98" fill="#93A99C" fontSize="9" fontFamily="monospace">Day 24</text>
              <text x="165" y="112" fill="#F2994A" fontSize="8" fontFamily="monospace">Decaying</text>

              {/* Node 3: Decay Expiry Threshold */}
              <circle cx="290" cy="70" r="6" fill="#0D1712" stroke="#FF5A52" strokeWidth="1.5" />
              <text x="270" y="98" fill="#93A99C" fontSize="9" fontFamily="monospace">Day {trustDecayDays}</text>
              <text x="260" y="112" fill="#FF5A52" fontSize="8" fontFamily="monospace">Expired</text>
            </svg>
          </div>
          <p className="text-[11px] font-mono text-[#93A99C]">
            Verified counterparties fade to unverified status after {trustDecayDays} days without interaction.
          </p>
        </div>
      </div>

      {/* =========================================================================
          RULEBOOK IMPACT PREVIEW SIMULATOR CARD
      ========================================================================= */}
      <div className="rounded-xl border border-[#223229] bg-[#16251E] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#223229] pb-4 gap-2">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#22C38D]">
              REAL-TIME SIMULATION
            </span>
            <h3 className="font-display text-xl font-bold text-[#EAF2ED]">
              Rulebook Impact Preview
            </h3>
          </div>
          <span className="font-mono text-xs text-[#93A99C]">
            Dynamic Evaluation against Current Form Limits
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Test Case A: Morning Coffee */}
          <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#0D1712] p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#93A99C]">TEST CASE A</span>
              <span className="font-display text-sm font-bold text-[#EAF2ED]">Morning Coffee</span>
              <span className="font-mono text-xs text-[#93A99C]">$8.50 to Trusted Friend</span>
            </div>
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-[#22C38D]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#22C38D]">
                ALLOW INSTANTLY
              </span>
            </div>
          </div>

          {/* Test Case B: Large Purchase */}
          <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#0D1712] p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#93A99C]">TEST CASE B</span>
              <span className="font-display text-sm font-bold text-[#EAF2ED]">Large Purchase</span>
              <span className="font-mono text-xs text-[#93A99C]">$300.00 Outflow</span>
            </div>
            <div className="mt-4">
              {300 > numMax ? (
                <span className="inline-flex rounded-full bg-[#F2994A]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F2994A]">
                  STEP-UP (AmountExceeded)
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-[#22C38D]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#22C38D]">
                  ALLOW INSTANTLY
                </span>
              )}
            </div>
          </div>

          {/* Test Case C: Automated Burst */}
          <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#0D1712] p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#93A99C]">TEST CASE C</span>
              <span className="font-display text-sm font-bold text-[#EAF2ED]">3:00 AM Drain Burst</span>
              <span className="font-mono text-xs text-[#93A99C]">4 × $100 in 10 minutes</span>
            </div>
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-[#F2994A]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F2994A]">
                HOURLY SPEED LIMIT REACHED
              </span>
            </div>
          </div>

          {/* Test Case D: Inactive Friend */}
          <div className="flex flex-col justify-between rounded-xl border border-[#223229] bg-[#0D1712] p-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#93A99C]">TEST CASE D</span>
              <span className="font-display text-sm font-bold text-[#EAF2ED]">Inactive Peer (35 Days)</span>
              <span className="font-mono text-xs text-[#93A99C]">$40.00 to Dormant Peer</span>
            </div>
            <div className="mt-4">
              {Number(trustDecayDays) < 35 ? (
                <span className="inline-flex rounded-full bg-[#F2994A]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F2994A]">
                  STEP-UP (TrustDecayed)
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-[#22C38D]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#22C38D]">
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
      <div className="rounded-xl border border-[#223229] bg-[#16251E] p-6 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-lg font-bold text-[#EAF2ED]">Commit Boundaries to Stellar</span>
            <span className="text-xs text-[#93A99C]">
              Updates will be signed with your active Freighter keys and recorded in contract storage.
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            aria-label="Set limits"
            disabled={isInvalid || status === 'submitting' || status === 'building' || status === 'signing'}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#22C38D] px-8 py-3.5 font-mono text-sm font-bold text-[#0D1712] shadow-lg shadow-[#22C38D]/20 transition-all hover:bg-[#22C38D]/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Sign &amp; Commit Policy to Stellar</span>
            <span className="sr-only">Set limits</span>
          </button>
        </div>

        {/* Real-time Submission States */}
        {status === 'building' && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#F2994A]">
            <span className="h-2 w-2 rounded-full bg-[#F2994A] animate-ping" />
            <span>Building XDR transaction envelope…</span>
          </div>
        )}
        {status === 'signing' && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#F2994A]">
            <span className="h-2 w-2 rounded-full bg-[#F2994A] animate-ping" />
            <span>Awaiting wallet authorization signature via Freighter…</span>
          </div>
        )}
        {status === 'submitting' && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#22C38D]">
            <span className="h-2 w-2 rounded-full bg-[#22C38D] animate-ping" />
            <span>Submitting to Stellar Testnet Soroban RPC…</span>
          </div>
        )}
        {status === 'success' && (
          <p role="status" className="font-mono text-xs font-semibold text-[#22C38D]">
            Limits set. Policy Committed On-Chain.
          </p>
        )}
        {status === 'error' && error && (
          <p role="alert" className="font-mono text-xs font-semibold text-[#FF5A52]">
            {error}
          </p>
        )}

        {/* Monospace Telemetry Strip */}
        <div className="border-t border-[#223229] pt-4 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#93A99C]">
          <span>NETWORK: STELLAR TESTNET</span>
          <span>ESTIMATED FEE: &lt; 0.00001 XLM</span>
          <span>AUTHORIZATION: WALLET REQUIRED</span>
          <span>INTEGER SCALING: 7-DECIMAL STROOPS</span>
        </div>
      </div>
    </form>
  );
}
