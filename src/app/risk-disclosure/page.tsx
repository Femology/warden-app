import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Disclosure — Warden Security Operating System',
  description:
    'Radical, plain-spoken transparency regarding decentralized smart contract software, automated rule evaluation, and self-custody responsibilities.',
};

export default function RiskDisclosurePage() {
  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F2994A 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-ink-700 pb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gate animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-gate">
              LEGAL &amp; SYSTEM TRANSPARENCY // DOCUMENT RD-1.0
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-mist-100 tracking-tight">
            Risk Disclosure
          </h1>
          <p className="text-base sm:text-lg text-mist-400 max-w-2xl leading-relaxed">
            Warden does not hide behind vague corporate buzzwords. This document details the physical realities,
            automated mechanics, and genuine risks of using decentralized smart contract security software.
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-mist-400 mt-2">
            <span>Last Updated: September 2026</span>
            <span>•</span>
            <span>Version: v1.0.0</span>
            <span>•</span>
            <span className="text-clear">Open-Source Apache-2.0</span>
          </div>
        </div>

        {/* Highlight Summary Card */}
        <div className="rounded-2xl border border-gate/40 bg-gate/10 p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-gate uppercase tracking-wider">
            <span>⚠️</span>
            <span>CRITICAL INVARIANT AT A GLANCE</span>
          </div>
          <p className="text-sm sm:text-base text-mist-100 font-medium leading-relaxed">
            Warden is self-custodial smart contract software running on the decentralized Stellar blockchain.
            It evaluates rules autonomously with real money. There is no customer support desk, no custodian,
            and no backdoor master key that can override your contract once deployed.
          </p>
        </div>

        {/* Content Sections */}
        <article className="flex flex-col gap-10 text-sm sm:text-base text-mist-400 leading-relaxed font-sans">
          {/* Section 1 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              1. Real Automated Decisions with Real Digital Assets
            </h2>
            <p>
              When you configure spending velocity limits (such as a 200 XLM daily cap or a 50 XLM single-transaction
              threshold), those rules are compiled into Soroban smart contract bytecode.
            </p>
            <p>
              When an outgoing transaction is initiated, the contract evaluates your rulebook deterministically. If a
              transaction violates an invariant, the contract halts the payment on-chain. This is not a simulated UI
              warning; it is an on-chain refusal to sign or transfer assets.
            </p>
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 font-mono text-xs text-mist-100">
              Contract Rule: If (Current_Hourly_Spend + Tx_Amount &gt; Hourly_Velocity_Cap) → Revert with VelocityCapExceeded.
            </div>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              2. Self-Custody &amp; Key Responsibility
            </h2>
            <p>
              Warden is strictly non-custodial software. At no point does the Warden protocol, its developers, or its
              contributors possess custody, control, or visibility over your private signing keys or seed phrases.
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong className="text-mist-100">Your Keys, Your Sovereignty:</strong> You are solely responsible for
                safeguarding your hardware authenticator, Passkey device, or browser extension.
              </li>
              <li>
                <strong className="text-mist-100">Account Recovery:</strong> If you lose your signing device and have
                not appointed <Link href="/app/guardians" className="text-clear underline">Recovery Guardians</Link>,
                your funds cannot be restored by anyone.
              </li>
              <li>
                <strong className="text-mist-100">No Reversal Power:</strong> Transactions confirmed on the Stellar
                ledger are final, irreversible, and immutable.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              3. Smart Contract &amp; Compiler Risk
            </h2>
            <p>
              While Warden&apos;s smart contracts are written in memory-safe Rust and thoroughly tested against formal
              invariants, all software contains inherent risk of undiscovered vulnerabilities, unexpected edge cases, or
              compiler anomalies.
            </p>
            <p>
              Warden relies on the underlying Stellar network consensus, Soroban virtual machine runtime, and cryptographic
              primitives (Ed25519 and Secp256r1). Any failure or fork in the underlying blockchain infrastructure could
              impact transaction execution.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              4. False Positives &amp; Self-Lockout
            </h2>
            <p>
              Warden is deliberately engineered to fail safe. If you attempt an urgent transfer that exceeds your hourly
              or daily velocity caps, the contract will strictly enforce your limits and require step-up authentication or
              block the excess amount until the velocity window rolls over.
            </p>
            <p>
              You must set policy parameters that reflect your actual operational flow to prevent self-induced friction
              during genuine emergency transactions.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              5. 48-Hour Recovery Delay Mechanics
            </h2>
            <p>
              To protect against guardian collusion, every social recovery proposal enforces a strict 48-hour timelock.
              During this 48-hour window, the account owner has unconditional veto authority. However, this also means
              that in a legitimate recovery scenario, your account cannot be unlocked instantaneously.
            </p>
          </section>
        </article>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-700 pt-8 font-mono text-xs text-mist-400">
          <Link href="/privacy" className="text-clear hover:underline">
            ← Read Privacy Notice
          </Link>
          <Link href="/terms" className="text-clear hover:underline">
            Terms of Use →
          </Link>
        </div>
      </main>
    </div>
  );
}
