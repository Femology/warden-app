import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Notice - Warden Security Operating System',
  description:
    'Radical transparency about data collection, public blockchain visibility, zero tracking cookies, and optional security alert emails.',
};

export default function PrivacyNoticePage() {
  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-ink-700 pb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
              DATA PRIVACY &amp; SECURITY // DOCUMENT PN-1.0
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-mist-100 tracking-tight">
            Privacy Notice
          </h1>
          <p className="text-base sm:text-lg text-mist-400 max-w-2xl leading-relaxed">
            Warden is engineered on the principle of data minimization: we cannot sell, monetize, or leak data
            that we never collect in the first place.
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-mist-400 mt-2">
            <span>Last Updated: September 2026</span>
            <span>•</span>
            <span>Policy: Minimalist Telemetry</span>
            <span>•</span>
            <span className="text-clear">Zero Tracker Guarantee</span>
          </div>
        </div>

        {/* Privacy Invariant Banner */}
        <div className="rounded-2xl border border-clear/40 bg-clear/10 p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-clear uppercase tracking-wider">
            <span>🛡️</span>
            <span>OUR CORE PRIVACY INVARIANT</span>
          </div>
          <p className="text-sm sm:text-base text-mist-100 font-medium leading-relaxed">
            All transaction verification occurs on the public Stellar blockchain or locally inside your browser.
            The only private data ever stored server-side is your optional email address used exclusively for
            on-chain security state alerts.
          </p>
        </div>

        {/* Content Sections */}
        <article className="flex flex-col gap-10 text-sm sm:text-base text-mist-400 leading-relaxed font-sans">
          {/* Section 1 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              1. Public Blockchain Transparency
            </h2>
            <p>
              When you interact with the Warden protocol, you submit transactions to the public Stellar ledger.
              By fundamental design of blockchain technology:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Your public wallet address (<code className="text-mist-100 font-mono text-xs">G...</code> or <code className="text-mist-100 font-mono text-xs">C...</code>) is publicly queryable.</li>
              <li>Transaction amounts, timestamps, and contract invocation arguments are permanently indexed on the ledger.</li>
              <li>Your configured spending limits, velocity records, and appointed recovery guardians are visible on-chain.</li>
            </ul>
            <p>
              This public ledger proof is what enables mathematical verification and decentralized auditability without
              relying on a trusted centralized authority.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              2. Optional Security Alert Email Address
            </h2>
            <p>
              In <Link href="/app/settings" className="text-clear underline">Account Settings</Link>, you may choose to provide
              an email address for out-of-band security notifications:
            </p>
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 font-mono text-xs text-mist-100">
              &ldquo;We only use this to email you if your security state changes.&rdquo;
            </div>
            <p>
              This email is used solely to alert you if:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-sm">
              <li>Your wallet state enters <strong className="text-mist-100">Frozen</strong> or <strong className="text-mist-100">Restricted</strong> mode.</li>
              <li>A guardian initiates an emergency recovery proposal (triggering the 48h veto window).</li>
              <li>A high-value transaction exceeds your no-step-up threshold.</li>
            </ul>
            <p>
              Your email is never shared with, rented, or sold to any third party or marketing database. You can modify
              or purge it at any time directly in your settings.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              3. Client-Side Cryptographic Credentials
            </h2>
            <p>
              Warden supports WebAuthn Passkeys and browser wallet extensions (such as Freighter).
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong className="text-mist-100">Passkeys:</strong> Your private authentication key is generated and
                held exclusively inside your device&apos;s hardware Secure Enclave (Apple TouchID/FaceID, Android Biometrics,
                or YubiKey). It is cryptographically prohibited from ever leaving your device.
              </li>
              <li>
                <strong className="text-mist-100">No Key Storage:</strong> Warden servers never receive, log, or transmit
                private keys or seed phrases.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              4. Zero Tracking Cookies &amp; Telemetry
            </h2>
            <p>
              The Warden application does not load third-party advertising cookies, Google Analytics tracking pixels,
              Meta tracking beacons, or cross-site fingerprinting scripts.
            </p>
            <p>
              Local browser storage (<code className="font-mono text-xs text-mist-100">localStorage</code>) is used solely
              to preserve your client-side UI preferences (such as Dark/Light theme mode, sound effect toggles, and recent demo states).
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
              5. Contact &amp; Security Inquiries
            </h2>
            <p>
              If you have questions about this privacy notice or wish to report a security vulnerability, please contact the
              core engineering team at: <a href="mailto:femimi1234@gmail.com" className="text-clear underline font-mono">femimi1234@gmail.com</a>.
            </p>
          </section>
        </article>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-700 pt-8 font-mono text-xs text-mist-400">
          <Link href="/risk-disclosure" className="text-clear hover:underline">
            ← Risk Disclosure
          </Link>
          <Link href="/terms" className="text-clear hover:underline">
            Terms of Use →
          </Link>
        </div>
      </main>
    </div>
  );
}
