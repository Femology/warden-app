'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEngine';

export function VaultDoorStressTest() {
  const [testMode, setTestMode] = useState<'honest' | 'drain'>('honest');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatedResult, setEvaluatedResult] = useState<'allowed' | 'reverted' | null>(null);

  function handleTriggerTest() {
    setIsEvaluating(true);
    setEvaluatedResult(null);

    setTimeout(() => {
      setIsEvaluating(false);
      if (testMode === 'honest') {
        setEvaluatedResult('allowed');
        sounds.playAllowChime();
      } else {
        setEvaluatedResult('reverted');
        sounds.playGateLockImpact();
      }
    }, 600);
  }

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/80 p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700/60 pb-5">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
            Micro-Lab: The Vault Door Stress Test
          </span>
          <h4 className="mt-1 font-display text-xl font-bold text-mist-100">
            Native Soroban `__check_auth` Protocol Gate
          </h4>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTestMode('honest');
              setEvaluatedResult(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              testMode === 'honest'
                ? 'border border-clear bg-clear/20 text-clear shadow-md'
                : 'border border-ink-700 text-mist-400 hover:text-mist-100'
            }`}
          >
            ✓ Honest Merchant ($14)
          </button>
          <button
            type="button"
            onClick={() => {
              setTestMode('drain');
              setEvaluatedResult(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              testMode === 'drain'
                ? 'border border-fault bg-fault/20 text-fault shadow-md'
                : 'border border-ink-700 text-mist-400 hover:text-mist-100'
            }`}
          >
            🚨 Hostile Drain ($12,000)
          </button>
        </div>
      </div>

      {/* Main Blast Gate Visual Arena */}
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12 items-center">
        {/* Animated Gate Chamber Graphic (6 cols) */}
        <div className="relative flex flex-col items-center justify-center rounded-xl border border-ink-700/60 bg-ink-900/90 p-8 md:col-span-6 overflow-hidden">
          {/* Gate Rails */}
          <div className="relative h-48 w-full max-w-sm flex items-center justify-between px-4">
            {/* Left Magnetic Rail */}
            <div className="h-full w-4 rounded-full bg-ink-700 border border-ink-700 shadow-inner" />

            {/* Central Vault Aperture */}
            <div className="relative flex-1 h-36 mx-4 flex items-center justify-center border-2 border-dashed border-ink-700/60 rounded-xl overflow-hidden bg-ink-950">
              {/* Sliding Gate Ribs */}
              <div
                className={`absolute inset-0 bg-ink-800 border-x-4 border-gate transition-transform duration-500 flex flex-col justify-between p-2 ${
                  evaluatedResult === 'reverted'
                    ? 'translate-y-0 shadow-[0_0_30px_rgba(255,90,82,0.4)] border-fault'
                    : evaluatedResult === 'allowed'
                    ? '-translate-y-full opacity-0'
                    : '-translate-y-6 opacity-60'
                }`}
              >
                <div className="h-2 w-full bg-fault/30 rounded" />
                <div className="text-center font-mono text-[10px] font-bold tracking-widest text-fault">
                  BLAST GATE ACTIVE
                </div>
                <div className="h-2 w-full bg-fault/30 rounded" />
              </div>

              {/* Laser Core */}
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
                  evaluatedResult === 'allowed'
                    ? 'bg-clear/20 border-2 border-clear text-clear shadow-[0_0_30px_rgba(34,195,141,0.6)] animate-pulse scale-110'
                    : evaluatedResult === 'reverted'
                    ? 'bg-fault/20 border-2 border-fault text-fault shadow-[0_0_30px_rgba(255,90,82,0.6)]'
                    : 'bg-ink-800 border border-ink-700 text-mist-400'
                }`}
              >
                {evaluatedResult === 'allowed' ? '✓' : evaluatedResult === 'reverted' ? '✕' : '🔒'}
              </div>
            </div>

            {/* Right Magnetic Rail */}
            <div className="h-full w-4 rounded-full bg-ink-700 border border-ink-700 shadow-inner" />
          </div>

          <div className="mt-4 text-center text-xs font-mono text-mist-400">
            {evaluatedResult === 'allowed' ? (
              <span className="text-clear font-semibold">GATE APERTURE OPENED (Zero Biometric Friction)</span>
            ) : evaluatedResult === 'reverted' ? (
              <span className="text-fault font-semibold">BARRIER SLAMMED SHUT (Funds Safe in Vault)</span>
            ) : (
              <span>Ready for on-chain submission...</span>
            )}
          </div>
        </div>

        {/* Evaluation Controls & Diagnostics (6 cols) */}
        <div className="flex flex-col justify-between gap-5 md:col-span-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-mist-100">Test Payload Summary</span>
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-mist-400">Amount:</span>
                <span className="text-mist-100">{testMode === 'honest' ? '$14.00 USDC' : '$12,000.00 USDC'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist-400">Recipient:</span>
                <span className="text-mist-100">{testMode === 'honest' ? 'Trusted Merchant' : 'Brand-New Address'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist-400">Signature:</span>
                <span className="text-mist-100">Single Passkey Keypair</span>
              </div>
              <div className="flex justify-between border-t border-ink-700/40 pt-2">
                <span className="text-mist-400">Soroban Auth:</span>
                <span className="text-clear font-bold">CustomAccount::__check_auth</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerTest}
            disabled={isEvaluating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-clear py-3 text-sm font-bold text-ink-900 shadow-lg shadow-clear/20 transition-all hover:scale-[1.02] hover:bg-clear/90 disabled:opacity-50"
          >
            {isEvaluating ? (
              <span>Simulating On-Chain Ledger...</span>
            ) : (
              <span>⚡ Submit to Soroban Ledger</span>
            )}
          </button>

          {/* Result Alert Box */}
          {evaluatedResult && (
            <div
              className={`rounded-xl border p-4 text-xs font-mono transition-all animate-fadeIn ${
                evaluatedResult === 'allowed'
                  ? 'border-clear/40 bg-clear/10 text-clear'
                  : 'border-fault/40 bg-fault/10 text-fault'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{evaluatedResult === 'allowed' ? 'STATUS: ATOMIC COMMIT' : 'STATUS: EXECUTION REVERTED'}</span>
                <span className="rounded bg-ink-900/60 px-2 py-0.5 text-[10px] text-mist-100">Gas: &lt; 0.001 XLM</span>
              </div>
              <p className="mt-1 text-mist-400">
                {evaluatedResult === 'allowed'
                  ? 'Policy verified within limits. Settlement completed in 4.8 seconds on Stellar Testnet.'
                  : 'Single-signature auth failed on-chain. Rule Book refused entry. 2nd confirmation required.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
