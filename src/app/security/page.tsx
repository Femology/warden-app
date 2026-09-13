'use client';

import Link from 'next/link';
import { sounds } from '@/lib/soundEngine';

export default function SecurityPage() {
  const ladderSteps = [
    {
      state: 'NORMAL',
      tag: 'Peace-Time Baseline',
      color: 'text-clear',
      borderColor: 'border-clear/40',
      bgColor: 'bg-clear/5',
      indicatorBg: 'bg-clear',
      desc: 'Your regular daily state. Habitual coffee, groceries, and trusted transfers glide through in 5 seconds with zero biometric challenges.',
      trigger: 'Default operational mode',
    },
    {
      state: 'WATCH',
      tag: 'Heightened Observation',
      color: 'text-gate',
      borderColor: 'border-gate/40',
      bgColor: 'bg-gate/5',
      indicatorBg: 'bg-gate',
      desc: 'Transfers continue as normal, but hourly speed limits tighten automatically. The system watches recipient age and frequency closely.',
      trigger: 'Triggered by a minor velocity spike or a new device network',
    },
    {
      state: 'RESTRICTED',
      tag: 'Micro-Spending Cap',
      color: 'text-gate',
      borderColor: 'border-gate/40',
      bgColor: 'bg-gate/5',
      indicatorBg: 'bg-gate',
      desc: 'Large transfers are halted entirely. Spending drops to a strict micro-limit to prevent rapid account skimming while keeping basic utilities on.',
      trigger: 'Triggered by repeated velocity breaches or unverified bursts',
    },
    {
      state: 'CHALLENGED',
      tag: 'Two-Key Lockdown',
      color: 'text-fault',
      borderColor: 'border-fault/40',
      bgColor: 'bg-fault/5',
      indicatorBg: 'bg-fault',
      desc: 'Single-key phone authorizations are temporarily revoked on-chain. Money cannot leave without an explicit second confirmation from a backup key.',
      trigger: 'Triggered by an attempt to drain the full balance to an unknown address',
    },
    {
      state: 'FROZEN',
      tag: 'Vault Door Dropped',
      color: 'text-fault',
      borderColor: 'border-fault/40',
      bgColor: 'bg-fault/5',
      indicatorBg: 'bg-fault',
      desc: 'All outgoing transactions are halted directly on the blockchain. Funds are immovable until an on-chain recovery process completes.',
      trigger: 'Triggered by emergency panic call or confirmed key compromise',
    },
  ];

  const permissionsMatrix = [
    {
      action: 'Halt an abnormal spending drain?',
      canWe: 'YES',
      allowed: true,
      reason: 'Enforced automatically on-chain by your sliding hourly and daily velocity rules.',
    },
    {
      action: 'Move funds out of your wallet?',
      canWe: 'NEVER',
      allowed: false,
      reason: 'We do not hold your private keys. Only you have the cryptographic authority to sign transfers.',
    },
    {
      action: 'Change your spending rules without your key?',
      canWe: 'NEVER',
      allowed: false,
      reason: 'Rule updates require your direct wallet signature. No admin can override your policy.',
    },
    {
      action: 'Freeze your account if our servers go offline?',
      canWe: 'NEVER',
      allowed: false,
      reason: 'The contract lives on Stellar and executes autonomously even if our servers vanish.',
    },
    {
      action: 'Bypass your 48-hour guardian recovery timer?',
      canWe: 'NEVER',
      allowed: false,
      reason: 'The 48-hour delay is hardcoded into the immutable smart contract. It cannot be skipped.',
    },
    {
      action: 'See your passwords, seed phrases, or identity?',
      canWe: 'NEVER',
      allowed: false,
      reason: 'We do not store passwords, log private keys, or collect personal identifying data.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12">
      {/* Background ambient lighting - strictly forest green tones, no blue */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[750px] rounded-full bg-clear opacity-[0.06] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-8 sm:pt-12">
        {/* Section 1: Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 text-xs font-mono text-mist-400">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            TRANSPARENCY REPORT • HOW WE PROTECT YOU
          </div>

          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-mist-100 sm:text-6xl sm:leading-tight">
            We don&apos;t ask for your trust. <br />
            <span className="text-clear">We built a system that doesn&apos;t need it.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-mist-400 leading-relaxed">
            True security isn&apos;t a promise written in a terms-of-service document. It is mathematical logic enforced
            directly on a public blockchain. Here is exactly how Warden works, where our authority ends, and what we can
            never do with your money.
          </p>
        </div>

        {/* Section 2: Principle 1 - Asymmetric Escalation */}
        <div className="mt-24 rounded-2xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-gate">SECURITY PRINCIPLE 01</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              Easy to raise the alarm. Hard to stand down.
            </h2>
            <p className="mt-3 text-sm text-mist-400 leading-relaxed">
              When a thief compromises a phone, their first goal is always to silence security alerts and lower spending
              limits. Warden prevents this with an asymmetric design: escalating protection happens in seconds, but
              de-escalating takes verifiable time and proof.
            </p>
          </div>

          {/* Vertical Asymmetric Ladder */}
          <div className="mt-10 space-y-4">
            {ladderSteps.map((step, idx) => (
              <div
                key={step.state}
                className={`relative rounded-xl border p-5 transition-all ${step.borderColor} ${step.bgColor}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-mist-400">0{idx + 1}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${step.indicatorBg}`} />
                    <span className="font-display text-lg font-bold text-mist-100">{step.state}</span>
                    <span className="rounded-md border border-ink-700 bg-ink-900 px-2.5 py-0.5 font-mono text-xs text-mist-400">
                      {step.tag}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-mist-400 sm:text-right">{step.trigger}</span>
                </div>
                <p className="mt-3 text-sm text-mist-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900 p-5">
            <h3 className="font-display text-base font-semibold text-mist-100">Why this stops phone thieves:</h3>
            <p className="mt-2 text-sm text-mist-400 leading-relaxed">
              Even if a thief snatches your unlocked phone and knows your local passcode, they cannot force the contract to
              lower your security restrictions on the spot. Returning to normal limits requires an on-chain cooldown period
              or verified approvals from your backup guardians.
            </p>
          </div>
        </div>

        {/* Section 3: Principle 2 - AI Separation */}
        <div className="mt-12 rounded-2xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-clear">SECURITY PRINCIPLE 02</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              Why the AI never touches your money.
            </h2>
            <p className="mt-3 text-sm text-mist-400 leading-relaxed">
              Letting an artificial intelligence model hold your wallet keys is a recipe for disaster. Models can be tricked
              by adversarial inputs, suffer outages, or make unpredictable errors. We built Warden with an absolute separation
              of powers.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gate" />
                <h3 className="font-display text-lg font-semibold text-mist-100">The AI Only Has Eyes</h3>
              </div>
              <p className="mt-3 text-sm text-mist-400 leading-relaxed">
                Our off-chain models evaluate contextual clues: device telemetry, location hops, typing velocity, and
                network clustering. It produces a probabilistic risk score from 0 to 100. It has a voice, but zero physical
                hands. It holds no cryptographic keys.
              </p>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear" />
                <h3 className="font-display text-lg font-semibold text-mist-100">The Smart Contract Has the Keys</h3>
              </div>
              <p className="mt-3 text-sm text-mist-400 leading-relaxed">
                The smart contract on Stellar runs pure, unalterable integer math. It doesn&apos;t guess; it verifies. Is the amount
                under the limit? Has the 1-hour speed limit been hit? Is the recipient trusted? Only verifiable rules can move funds.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-sm text-clear">●</span>
              <div>
                <h4 className="text-sm font-semibold text-mist-100">What happens if the AI servers go offline?</h4>
                <p className="mt-1 text-sm text-mist-400">
                  Your wallet never freezes. If external intelligence servers crash, the smart contract on Stellar
                  automatically falls back to your configured on-chain spending limits. Your money is never held hostage by an
                  external API.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Principle 3 - Guardians */}
        <div className="mt-12 rounded-2xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-gate">SECURITY PRINCIPLE 03</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              Guardians are lifeboats, not backdoors.
            </h2>
            <p className="mt-3 text-sm text-mist-400 leading-relaxed">
              Standard crypto wallets leave you stranded: if you lose your private key, your funds are gone forever. Warden
              incorporates decentralized social recovery without giving anyone a backdoor into your wealth.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
              <span className="font-mono text-xs text-clear">STEP 01</span>
              <h3 className="mt-2 font-display text-base font-semibold text-mist-100">Choose Allies</h3>
              <p className="mt-2 text-xs text-mist-400 leading-relaxed">
                Appoint up to 7 trusted friends, family members, or backup hardware keys kept in safe storage.
              </p>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
              <span className="font-mono text-xs text-clear">STEP 02</span>
              <h3 className="mt-2 font-display text-base font-semibold text-mist-100">Unlock Only</h3>
              <p className="mt-2 text-xs text-mist-400 leading-relaxed">
                Guardians cannot withdraw money or change your spending caps. They can only vote to recover an account.
              </p>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
              <span className="font-mono text-xs text-clear">STEP 03</span>
              <h3 className="mt-2 font-display text-base font-semibold text-mist-100">48-Hour Buffer</h3>
              <p className="mt-2 text-xs text-mist-400 leading-relaxed">
                When guardians vote to unlock an account, an unchangeable 48-hour timelock countdown begins on-chain.
              </p>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
              <span className="font-mono text-xs text-clear">STEP 04</span>
              <h3 className="mt-2 font-display text-base font-semibold text-mist-100">Owner Veto</h3>
              <p className="mt-2 text-xs text-mist-400 leading-relaxed">
                If guardians ever try to recover your wallet without permission, you can cancel the request with one tap.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Transparency Matrix */}
        <div className="mt-12 rounded-2xl border border-ink-700 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-clear">PERMISSIONS AUDIT</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              What Warden can and cannot do.
            </h2>
            <p className="mt-3 text-sm text-mist-400 leading-relaxed">
              We believe in total clarity. Here is the operational boundary of the software:
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-xs font-mono text-mist-400">
                  <th className="pb-4 font-normal">Action</th>
                  <th className="pb-4 font-normal">Authority</th>
                  <th className="pb-4 font-normal">Enforcement Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {permissionsMatrix.map((row) => (
                  <tr key={row.action} className="text-sm">
                    <td className="py-4 pr-4 font-medium text-mist-100">{row.action}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                          row.allowed ? 'bg-clear/15 text-clear' : 'bg-fault/15 text-fault'
                        }`}
                      >
                        {row.canWe}
                      </span>
                    </td>
                    <td className="py-4 text-mist-400 leading-relaxed">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Radical Honesty & Risk Disclosure */}
        <div className="mt-12 rounded-2xl border border-gate/40 bg-ink-800 p-8 sm:p-12 shadow-xl">
          <div className="flex items-center gap-2 text-gate">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">RADICAL HONESTY NOTICE</span>
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold text-mist-100">
            What you need to know before using Warden.
          </h2>

          <div className="mt-6 space-y-4 text-sm text-mist-400 leading-relaxed">
            <p>
              <strong className="text-mist-100">1. Open-Source &amp; Experimental:</strong> Warden is deployed on the Stellar
              Testnet. While every function is covered by automated integration test suites (58 smart contract tests and 52
              client SDK tests), this code has <span className="text-gate font-semibold">not yet completed an independent external security audit</span>.
            </p>
            <p>
              <strong className="text-mist-100">2. Self-Custody Invariants:</strong> Blockchain transactions are mathematically
              irreversible. If you configure a $10,000 daily speed limit and sign a transfer to an untrusted recipient, no
              centralized entity (not Warden, not the Stellar Development Foundation, and not a bank) can recall the funds.
            </p>
            <p>
              <strong className="text-mist-100">3. Responsible Disclosure:</strong> If you are a security researcher and
              discover a potential bug or vulnerability in our contracts or SDK, please report it privately to{' '}
              <a href="mailto:femimi1234@gmail.com" className="text-clear underline hover:opacity-80">
                femimi1234@gmail.com
              </a>{' '}
              prior to public disclosure.
            </p>
          </div>
        </div>

        {/* Section 7: Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-ink-700 bg-ink-800 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-mist-100 sm:text-3xl">Inspect the code yourself.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-mist-400">
            Warden is 100% open source. Every contract, getter function, and test suite is public on GitHub and verified on
            Stellar Testnet.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              onClick={() => sounds.playClick()}
              className="rounded-full bg-clear px-6 py-2.5 text-sm font-semibold text-ink-900 transition-opacity hover:opacity-90 shadow-md shadow-clear/20"
            >
              Test Live in Sandbox
            </Link>
            <a
              href="https://github.com/wardenoss/warden-contract/blob/main/WARDEN-PROTOCOL.md"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="rounded-full border border-ink-700 bg-ink-900 px-6 py-2.5 text-sm font-medium text-mist-100 transition-colors hover:border-mist-400"
            >
              View Protocol Spec (GitHub)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
