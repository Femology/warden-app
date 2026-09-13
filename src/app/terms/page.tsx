import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — Warden Security Operating System',
  description:
    'Standard Apache-2.0 open-source software terms, non-custodial protocol disclaimers, and user responsibilities.',
};

export default function TermsOfUsePage() {
  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #22C38D 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-ink-700 pb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
              LEGAL TERMS &amp; CONDITIONS // DOCUMENT TOU-1.0
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-mist-100 tracking-tight">
            Terms of Use
          </h1>
          <p className="text-base sm:text-lg text-mist-400 max-w-2xl leading-relaxed">
            Warden is free, open-source software licensed under the Apache License, Version 2.0. By accessing this interface
            or interacting with the smart contracts, you agree to these terms.
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-mist-400 mt-2">
            <span>Effective Date: September 2026</span>
            <span>•</span>
            <span>License: Apache-2.0</span>
            <span>•</span>
            <span className="text-clear">Open-Source &amp; Free</span>
          </div>
        </div>

        {/* License Highlight Card */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-clear uppercase tracking-wider">
            <span>⚖️</span>
            <span>APACHE 2.0 OPEN-SOURCE NOTICE</span>
          </div>
          <p className="text-xs sm:text-sm text-mist-100 font-mono leading-relaxed bg-ink-900 p-4 rounded-xl border border-ink-700">
            Licensed under the Apache License, Version 2.0 (the &quot;License&quot;); you may not use this file except in compliance with the License.
            You may obtain a copy of the License at:<br />
            <a
              href="http://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-clear underline break-all"
            >
              http://www.apache.org/licenses/LICENSE-2.0
            </a>
          </p>
        </div>

        {/* Content Sections */}
        <article className="flex flex-col gap-10 text-sm sm:text-base text-mist-400 leading-relaxed font-sans">
          {/* Section 1 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              1. Non-Custodial Decentralized Interface
            </h2>
            <p>
              This web interface is a decentralized graphical portal that allows users to interact with autonomous smart
              contracts deployed on the Stellar blockchain network.
            </p>
            <p>
              Warden is not a bank, broker, financial institution, money transmitter, custodian, or financial advisor.
              The interface merely formats transactions and forwards them to your local wallet extension or WebAuthn Passkey
              device for signature before broadcasting to public Stellar validator nodes.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              2. Disclaimer of Warranties (&ldquo;AS IS&rdquo;)
            </h2>
            <p className="uppercase text-xs font-mono text-mist-100 font-semibold tracking-wider">
              IMPORTANT STATUTORY DISCLAIMER:
            </p>
            <p>
              Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
              on an <strong>&ldquo;AS IS&rdquo; BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND</strong>, either express or implied,
              including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or
              FITNESS FOR A PARTICULAR PURPOSE.
            </p>
            <p>
              You are solely responsible for determining the appropriateness of using or redistributing the Work and assume
              any risks associated with your exercise of permissions under this License.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              3. Limitation of Liability
            </h2>
            <p>
              In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless
              required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any
              contributor be liable to you for damages, including any direct, indirect, special, incidental, or consequential
              damages of any character arising as a result of this License or out of the use or inability to use the Work
              (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, loss
              of digital assets, or any and all other commercial damages or losses).
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              4. User Responsibilities &amp; Compliance
            </h2>
            <p>
              By accessing or using Warden, you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>You have the full legal capacity to enter into these terms under your jurisdiction.</li>
              <li>You are not a citizen or resident of any jurisdiction subject to comprehensive international sanctions (e.g. OFAC embargoed regions).</li>
              <li>You will not use the software for illicit asset laundering, terrorism financing, or unauthorized cyber exploitation.</li>
              <li>You are solely responsible for all tax filing and reporting obligations arising from your digital asset transfers.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              5. Self-Hosting &amp; Forking Rights
            </h2>
            <p>
              Because Warden is open-source, you are fully entitled under Apache-2.0 to clone the repository, run your own
              local instance, modify the smart contracts, or connect to independent Soroban RPC nodes without restriction.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Femology/warden-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2 font-mono text-xs text-clear hover:border-clear transition-colors"
              >
                <span>GitHub: warden-sdk ↗</span>
              </a>
              <Link
                href="/developers"
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2 font-mono text-xs text-mist-100 hover:border-clear transition-colors"
              >
                <span>Developer Hub ↗</span>
              </Link>
            </div>
          </section>
        </article>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-700 pt-8 font-mono text-xs text-mist-400">
          <Link href="/risk-disclosure" className="text-clear hover:underline">
            ← Risk Disclosure
          </Link>
          <Link href="/privacy" className="text-clear hover:underline">
            Privacy Notice →
          </Link>
        </div>
      </main>
    </div>
  );
}
