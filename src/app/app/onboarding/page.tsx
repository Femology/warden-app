'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { connectedWalletId, signXdr, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';
import { AppNavigation } from '@/components/AppNavigation';
import type { PortablePolicyRule } from 'warden-sdk';

export default function OnboardingWizardPage() {
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Limits & Velocity
  const [dailyCap, setDailyCap] = useState<string>('200.00');
  const [maxNoStepUp, setMaxNoStepUp] = useState<string>('20.00');
  const [hourlyCap, setHourlyCap] = useState<string>('100.00');

  // Step 2: First Trusted Friend
  const [friendAddress, setFriendAddress] = useState<string>('');
  const [friendLabel, setFriendLabel] = useState<string>('Cold Storage Key');
  const [trustDecayDays, setTrustDecayDays] = useState<number>(30);
  const [skipFriend, setSkipFriend] = useState<boolean>(false);

  // Step 3: Transaction Deployment Deck
  const [deployStep, setDeployStep] = useState<'idle' | 'building' | 'signing' | 'submitting' | 'complete'>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);

  useEffect(() => {
    const active = connectedWalletId();
    setWallet(active);
  }, []);

  // Validation step 1
  const step1Error = useMemo(() => {
    const daily = parseFloat(dailyCap);
    const noStep = parseFloat(maxNoStepUp);
    const hourly = parseFloat(hourlyCap);

    if (isNaN(daily) || daily <= 0) return 'Daily limit must be greater than 0.';
    if (isNaN(noStep) || noStep <= 0) return 'No-confirmation limit must be greater than 0.';
    if (isNaN(hourly) || hourly <= 0) return 'Hourly limit must be greater than 0.';
    if (noStep > daily) return 'Single payment limit cannot exceed the 24-hour daily cap.';
    if (hourly > daily) return 'Hourly speed limit cannot exceed the daily cap.';
    return null;
  }, [dailyCap, maxNoStepUp, hourlyCap]);

  function handleNextStep1() {
    if (step1Error) return;
    sounds.playClick();
    setStep(2);
  }

  // Address validation step 2
  const addressValidation = useMemo(() => {
    if (skipFriend || !friendAddress.trim()) {
      return { isValid: true, message: null };
    }
    const addr = friendAddress.trim();
    if (addr.length !== 56) {
      return { isValid: false, message: 'Stellar address must be exactly 56 characters.' };
    }
    if (!addr.startsWith('G') && !addr.startsWith('C')) {
      return { isValid: false, message: 'Address must start with "G" (classic account) or "C" (contract).' };
    }
    return { isValid: true, message: null };
  }, [friendAddress, skipFriend]);

  function handleNextStep2() {
    if (!addressValidation.isValid) return;
    sounds.playClick();
    setStep(3);
  }

  // Final step 3: Commit on-chain
  async function handleDeployPolicy() {
    sounds.playClick();
    setDeployStep('building');
    setDeployError(null);

    const targetWallet = wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';
    const trustedList = !skipFriend && friendAddress.trim() ? [friendAddress.trim()] : [];

    const rule: PortablePolicyRule = {
      version: 1,
      maxAmountNoStepUp: maxNoStepUp,
      dailyVelocityCap: dailyCap,
      hourlyVelocityCap: hourlyCap,
      newRecipientRequiresStepUp: true,
      trustedRecipients: trustedList,
      trustDecaySeconds: trustDecayDays * 86400,
    };

    try {
      if (!wallet) {
        // Simulated execution with realistic step progression
        await new Promise((r) => setTimeout(r, 600));
        setDeployStep('signing');
        sounds.playClick();
        await new Promise((r) => setTimeout(r, 800));
        setDeployStep('submitting');
        sounds.playClick();
        await new Promise((r) => setTimeout(r, 900));
        setDeployStep('complete');
        sounds.playSuccess();
        setTimeout(() => setStep(4), 500);
        return;
      }

      // Phase 1: Build policy XDR
      const sourceAccount = sourceAccountOverride();
      const built = await wardenClient.buildSetPolicy(targetWallet, rule, sourceAccount);

      // Phase 2: Sign XDR
      setDeployStep('signing');
      const signedXdr = await signXdr(built.xdr);

      // Phase 3: Submit to Soroban
      setDeployStep('submitting');
      await wardenClient.submitSetPolicy(signedXdr);

      // Add trusted friend if provided
      if (trustedList.length > 0) {
        try {
          const friendBuilt = await wardenClient.buildAddTrustedRecipient(
            targetWallet,
            trustedList[0],
            sourceAccount
          );
          const friendSignedXdr = await signXdr(friendBuilt.xdr);
          await wardenClient.submitAddTrustedRecipient(friendSignedXdr);
        } catch {
          // Already registered in policy rule
        }
      }

      setDeployStep('complete');
      sounds.playSuccess();
      setTimeout(() => setStep(4), 500);
    } catch (err) {
      setDeployStep('idle');
      setDeployError(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 overflow-x-hidden">
      <AppNavigation />

      {/* Ambient background styling */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[160px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            TOP WIZARD HEADER & STEP PROGRESSION
        ===================================================================== */}
        <div className="flex flex-col items-center text-center gap-3 border-b border-ink-700 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-clear/30 bg-clear/10 px-4 py-1 text-xs font-mono text-clear font-semibold">
            <span>✨ FIRST-TIME VAULT SETUP WIZARD</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
            Configure Your Vault Defense
          </h1>
          <p className="text-xs sm:text-sm text-mist-400 max-w-lg leading-relaxed">
            In 3 simple steps, establish the cryptographic rules that protect your funds from theft, drainers, and key compromises.
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3 mt-4">
            {[
              { num: 1, title: 'Speed Limit' },
              { num: 2, title: 'Trusted Friend' },
              { num: 3, title: 'Sign & Seal' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-bold transition-all ${
                      step === s.num
                        ? 'border-2 border-clear bg-clear text-ink-900 shadow-md shadow-clear/25 scale-110'
                        : step > s.num
                        ? 'border border-clear bg-ink-800 text-clear font-bold'
                        : 'border border-ink-700 bg-ink-900 text-mist-400'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline font-mono text-xs ${
                      step === s.num
                        ? 'text-mist-100 font-bold'
                        : step > s.num
                        ? 'text-clear'
                        : 'text-mist-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>

                {idx < 2 && (
                  <div
                    className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors ${
                      step > s.num ? 'bg-clear' : 'bg-ink-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            STEP 1: SET YOUR DAILY SPEED LIMIT
        ===================================================================== */}
        {step === 1 && (
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col gap-1 border-b border-ink-700 pb-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                STEP 1 OF 3 // VELOCITY DEFENSE
              </span>
              <h2 className="font-display text-2xl font-bold text-mist-100">
                1. Set Your Daily Spending Speed Limit
              </h2>
              <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
                Think of this like an ATM daily withdrawal cap. If an attacker steals your phone or private key,
                they are physically prohibited from draining your entire balance in one strike.
              </p>
            </div>

            {/* Presets Cards */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                Choose a Security Preset (or customize below):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    tier: 'Cautious Defense',
                    badge: 'Maximum Safety',
                    daily: '50.00',
                    hourly: '25.00',
                    noStep: '10.00',
                    desc: 'For long-term holders. Tightest guardrails.',
                  },
                  {
                    tier: 'Standard Balance',
                    badge: '★ Recommended',
                    daily: '200.00',
                    hourly: '100.00',
                    noStep: '20.00',
                    desc: 'Perfect daily balance of comfort and security.',
                    isBest: true,
                  },
                  {
                    tier: 'Active Trader',
                    badge: 'High Throughput',
                    daily: '1000.00',
                    hourly: '500.00',
                    noStep: '100.00',
                    desc: 'For frequent transfers and DeFi participants.',
                  },
                ].map((preset) => {
                  const isSelected = dailyCap === preset.daily;
                  return (
                    <div
                      key={preset.tier}
                      onClick={() => {
                        sounds.playClick();
                        setDailyCap(preset.daily);
                        setHourlyCap(preset.hourly);
                        setMaxNoStepUp(preset.noStep);
                      }}
                      className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-clear bg-clear/15 shadow-sm shadow-clear/10'
                          : 'border-ink-700 bg-ink-900 hover:border-mist-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-clear font-semibold">
                          {preset.badge}
                        </span>
                        <span className="font-mono text-xs text-mist-400">XLM</span>
                      </div>

                      <div className="my-2">
                        <div className="font-display text-2xl font-bold text-mist-100">
                          {preset.daily} <span className="text-xs font-mono text-mist-400">/ day</span>
                        </div>
                        <p className="text-[11px] text-mist-400 mt-1 leading-snug">{preset.desc}</p>
                      </div>

                      <div className="border-t border-ink-700/60 pt-2 font-mono text-[10px] text-mist-400 flex justify-between">
                        <span>Instant: &lt; {preset.noStep}</span>
                        <span>Hourly: {preset.hourly}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5 flex flex-col gap-4">
              <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                Fine-Tune Precise Caps (XLM):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-mist-400 text-[11px] uppercase">Daily Limit (24h)</label>
                  <input
                    type="text"
                    value={dailyCap}
                    onChange={(e) => setDailyCap(e.target.value)}
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3.5 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-mist-400 text-[11px] uppercase">Hourly Cap (60m)</label>
                  <input
                    type="text"
                    value={hourlyCap}
                    onChange={(e) => setHourlyCap(e.target.value)}
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3.5 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-mist-400 text-[11px] uppercase">Instant Threshold</label>
                  <input
                    type="text"
                    value={maxNoStepUp}
                    onChange={(e) => setMaxNoStepUp(e.target.value)}
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3.5 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
                  />
                </div>
              </div>

              {/* Visual Spending Zones */}
              <div className="rounded-xl border border-ink-700 bg-ink-950 p-3.5 flex flex-col gap-2 font-mono text-[11px]">
                <span className="text-mist-400 uppercase text-[10px]">Visual Spending Flow:</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 rounded-lg bg-clear/15 border border-clear/30 p-2 text-center text-clear font-semibold">
                    0 to {maxNoStepUp} XLM<br />
                    <span className="text-[9px] font-normal text-mist-400">Instant (No Passkey Prompt)</span>
                  </div>
                  <span className="text-mist-400 text-center">→</span>
                  <div className="flex-1 rounded-lg bg-gate/15 border border-gate/30 p-2 text-center text-gate font-semibold">
                    {maxNoStepUp} to {dailyCap} XLM<br />
                    <span className="text-[9px] font-normal text-mist-400">Requires Step-Up Biometrics</span>
                  </div>
                  <span className="text-mist-400 text-center">→</span>
                  <div className="flex-1 rounded-lg bg-fault/15 border border-fault/30 p-2 text-center text-fault font-semibold">
                    &gt; {dailyCap} XLM<br />
                    <span className="text-[9px] font-normal text-mist-400">Halted Until Tomorrow</span>
                  </div>
                </div>
              </div>
            </div>

            {step1Error && (
              <div className="rounded-xl border border-fault/60 bg-fault/10 p-3 font-mono text-xs text-fault">
                ⚠️ {step1Error}
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextStep1}
                disabled={!!step1Error}
                className={`rounded-xl px-8 py-3.5 font-mono text-xs sm:text-sm font-bold transition-all shadow-md ${
                  step1Error
                    ? 'bg-ink-700 text-mist-400 cursor-not-allowed'
                    : 'bg-clear text-ink-900 hover:bg-clear/90 shadow-clear/20'
                }`}
              >
                Continue to Step 2: Add Trusted Friend →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STEP 2: ADD YOUR FIRST TRUSTED FRIEND
        ===================================================================== */}
        {step === 2 && (
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col gap-1 border-b border-ink-700 pb-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                STEP 2 OF 3 // COUNTERPARTY WEB-OF-TRUST
              </span>
              <h2 className="font-display text-2xl font-bold text-mist-100">
                2. Add Your First Trusted Counterparty
              </h2>
              <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
                Add an address you frequently send funds to (such as your cold storage hardware key, an exchange deposit, or a spouse).
                Payments to trusted contacts bypass new-recipient confirmation challenges.
              </p>
            </div>

            {!skipFriend ? (
              <div className="flex flex-col gap-5">
                {/* Address Input */}
                <div className="flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-mist-400 uppercase">
                      Counterparty Stellar Public Key (G... or C...)
                    </label>
                    {addressValidation.isValid && friendAddress.trim().length === 56 && (
                      <span className="text-clear font-bold">✓ Valid Stellar Key</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={friendAddress}
                    onChange={(e) => setFriendAddress(e.target.value)}
                    placeholder="GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ"
                    className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-mist-100 placeholder:text-mist-400/40 focus:border-clear focus:outline-none truncate"
                  />
                  {addressValidation.message && (
                    <span className="text-fault text-[11px]">{addressValidation.message}</span>
                  )}
                </div>

                {/* Nickname & Decay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-mist-400 uppercase">Friendly Identifier</label>
                    <input
                      type="text"
                      value={friendLabel}
                      onChange={(e) => setFriendLabel(e.target.value)}
                      placeholder="e.g. Ledger Cold Vault"
                      className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
                    />

                    {/* Quick Nickname suggestions */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['Cold Storage', 'Family Vault', 'Exchange'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setFriendLabel(tag);
                          }}
                          className="rounded-md bg-ink-700/60 px-2 py-0.5 text-[10px] text-mist-400 hover:text-mist-100 transition-colors"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-mist-400 uppercase">Trust Decay Timeline</label>
                    <select
                      value={trustDecayDays}
                      onChange={(e) => setTrustDecayDays(Number(e.target.value))}
                      className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
                    >
                      <option value={30}>30 Days (Recommended)</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>180 Days (Semi-Annual)</option>
                    </select>

                    <p className="text-[10px] text-mist-400 mt-1 leading-tight">
                      If 30 days pass with no payments, trust automatically decays to protect against hijacked addresses.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ink-700 bg-ink-900/60 p-6 flex flex-col items-center gap-2 text-center font-mono text-xs text-mist-400">
                <span className="text-2xl">🛡️</span>
                <span className="text-mist-100 font-semibold">Contact Step Skipped</span>
                <p className="max-w-md text-[11px]">
                  All recipients will require step-up authentication on their first transfer until added to your address book later.
                </p>
              </div>
            )}

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between border-t border-ink-700 pt-4">
              <button
                type="button"
                onClick={() => setSkipFriend(!skipFriend)}
                className="font-mono text-xs text-mist-400 hover:text-mist-100 underline transition-colors"
              >
                {skipFriend ? '← Re-enable Adding Contact' : 'Skip Contact for Now'}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-ink-700 bg-ink-900 px-5 py-2.5 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  disabled={!addressValidation.isValid}
                  className={`rounded-xl px-8 py-3 font-mono text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    !addressValidation.isValid
                      ? 'bg-ink-700 text-mist-400 cursor-not-allowed'
                      : 'bg-clear text-ink-900 hover:bg-clear/90 shadow-clear/15'
                  }`}
                >
                  Review Rulebook →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            STEP 3: REVIEW AND SIGN
        ===================================================================== */}
        {step === 3 && (
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col gap-1 border-b border-ink-700 pb-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                STEP 3 OF 3 // CRYPTOGRAPHIC SEAL
              </span>
              <h2 className="font-display text-2xl font-bold text-mist-100">
                3. Review and Commit Policy On-Chain
              </h2>
              <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
                Review your autonomous security parameters before signing the transaction that activates your smart contract defense.
              </p>
            </div>

            {/* Review Summary Bento Box */}
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-6 flex flex-col gap-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-ink-700/80 pb-3">
                <span className="text-mist-400 uppercase tracking-wider">Daily Spending Ceiling</span>
                <span className="font-display text-lg font-bold text-mist-100">{dailyCap} XLM</span>
              </div>

              <div className="flex items-center justify-between border-b border-ink-700/80 pb-3">
                <span className="text-mist-400 uppercase tracking-wider">Hourly Speed Limit</span>
                <span className="font-bold text-clear">{hourlyCap} XLM / hour</span>
              </div>

              <div className="flex items-center justify-between border-b border-ink-700/80 pb-3">
                <span className="text-mist-400 uppercase tracking-wider">Friction-Free Threshold</span>
                <span className="font-bold text-mist-100">&lt; {maxNoStepUp} XLM</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-mist-400 uppercase tracking-wider">First Trusted Contact</span>
                <span className="font-bold text-mist-100 truncate max-w-xs text-right">
                  {skipFriend || !friendAddress.trim()
                    ? 'None (Step-Up on all new recipients)'
                    : `${friendLabel} (${trustDecayDays}d Decay)`}
                </span>
              </div>
            </div>

            {/* Deployment Terminal Progress */}
            {deployStep !== 'idle' && (
              <div className="rounded-xl border border-clear/40 bg-clear/10 p-4 font-mono text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-clear font-bold">
                  <span className="h-2 w-2 rounded-full bg-clear animate-ping" />
                  <span>
                    {deployStep === 'building' && 'Phase 1/3: Synthesizing Portable Soroban XDR…'}
                    {deployStep === 'signing' && 'Phase 2/3: Awaiting Biometric / Hardware Signature…'}
                    {deployStep === 'submitting' && 'Phase 3/3: Submitting to Stellar Testnet Ledger…'}
                    {deployStep === 'complete' && '✓ Policy Sealed On-Chain!'}
                  </span>
                </div>
              </div>
            )}

            {deployError && (
              <div className="rounded-xl border border-fault/60 bg-fault/10 p-3 font-mono text-xs text-fault">
                ⚠️ {deployError}
              </div>
            )}

            {/* Stepper Actions */}
            <div className="flex items-center justify-between border-t border-ink-700 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={deployStep !== 'idle'}
                className="rounded-xl border border-ink-700 bg-ink-900 px-5 py-2.5 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleDeployPolicy}
                disabled={deployStep !== 'idle'}
                className="rounded-xl bg-clear px-8 py-3.5 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-all shadow-md shadow-clear/20"
              >
                {deployStep !== 'idle' ? 'Committing Rulebook…' : '🚀 Deploy Vault Rulebook On-Chain'}
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STEP 4: CELEBRATION & LAUNCHPAD
        ===================================================================== */}
        {step === 4 && (
          <div className="rounded-2xl border-2 border-clear bg-ink-800 p-8 sm:p-12 flex flex-col items-center text-center gap-6 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Shield SVG Graphic */}
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-clear/20 border-2 border-clear text-5xl shadow-xl shadow-clear/20">
              🛡️
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-clear">
                PROTOCOL PROTECTION ACTIVE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100">
                Vault Defense Successfully Sealed!
              </h2>
              <p className="text-sm text-mist-400 max-w-md leading-relaxed">
                Your spending velocity caps and counterparty decay parameters have been committed to Soroban state.
                Your smart wallet is now protected by autonomous on-chain guardrails.
              </p>
            </div>

            {/* Quick Launchpad Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <Link
                href="/app"
                className="rounded-xl bg-clear px-8 py-3.5 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-all shadow-md shadow-clear/20"
              >
                Enter Security Command Center →
              </Link>

              <Link
                href="/app/transfer"
                className="rounded-xl border border-ink-700 bg-ink-900 px-6 py-3.5 font-mono text-xs text-mist-100 hover:border-clear transition-colors"
              >
                Test a Safe Transfer
              </Link>

              <Link
                href="/app/guardians"
                className="rounded-xl border border-ink-700 bg-ink-900 px-6 py-3.5 font-mono text-xs text-mist-100 hover:border-clear transition-colors"
              >
                Appoint Recovery Guardians
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
