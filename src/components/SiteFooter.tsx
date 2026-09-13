'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CONFIG } from '@/lib/config';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  }

  function handleCopyContract() {
    navigator.clipboard.writeText(CONFIG.contractId);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  }

  return (
    <footer className="border-t border-ink-700 bg-ink-900 text-mist-400 transition-colors">
      <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col gap-14">
        {/* Top Emergency Security Alert Teaser Card */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-clear font-semibold">
                Autonomous Security Telemetry
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-mist-100 sm:text-2xl">
              Stay Informed on Account Security Transitions
            </h3>
            <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
              Receive instant out-of-band email notifications whenever your account triggers a step-up challenge, enters a restricted tier, or when guardians propose emergency recovery.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 sm:items-center w-full lg:w-auto">
            {subscribed ? (
              <div className="flex items-center gap-2 rounded-xl bg-clear/15 border border-clear/40 px-5 py-3 text-xs font-mono text-clear">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Security alerts subscribed for your session!</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for emergency alerts"
                  required
                  className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-mist-100 placeholder:text-mist-400/60 outline-none transition-colors focus-visible:border-edge w-full sm:w-72"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-clear px-5 py-2.5 text-xs font-bold text-ink-900 transition-all hover:bg-clear/90 shrink-0 shadow-sm"
                >
                  Subscribe Alerts →
                </button>
              </>
            )}
          </form>
        </div>

        {/* 5-Column Navigation Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Col 1: Brand & Operating System */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo/logo-mark-colorful.svg"
                alt="Warden Logo"
                width={32}
                height={32}
                className="h-8 w-8 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-mist-100 group-hover:text-clear transition-colors">
                  WARDEN
                </span>
                <span className="text-[9px] font-mono font-semibold tracking-widest text-mist-400 -mt-1">
                  SECURITY OS
                </span>
              </div>
            </Link>

            <p className="text-xs text-mist-400 leading-relaxed">
              Autonomous on-chain spending limits, dynamic trust decay, and social guardian recovery on Stellar Soroban.
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-clear">
                <span className="h-2 w-2 rounded-full bg-clear" />
                <span>Protocol 22 • Testnet Active</span>
              </div>
              <span className="font-mono text-[10px] text-mist-400">
                Non-Custodial • Zero SaaS Tollbooth
              </span>
            </div>
          </div>

          {/* Col 2: Security Console */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mist-100">
              Security Console
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/app" className="hover:text-mist-100 transition-colors">
                Command Center
              </Link>
              <Link href="/app/policy" className="hover:text-mist-100 transition-colors">
                Spending Limits
              </Link>
              <Link href="/app/transfer" className="hover:text-mist-100 transition-colors">
                Send Transfer
              </Link>
              <Link href="/app/recipients" className="hover:text-mist-100 transition-colors">
                Address Book
              </Link>
              <Link href="/app/guardians" className="hover:text-mist-100 transition-colors">
                Guardian Setup
              </Link>
              <Link href="/app/recovery" className="hover:text-gate transition-colors flex items-center gap-1">
                <span>Recovery Center</span>
                <span className="rounded bg-gate/15 px-1 py-0.2 text-[9px] text-gate">Rescue</span>
              </Link>
              <Link href="/app/risk" className="hover:text-fault transition-colors flex items-center gap-1">
                <span>Flagged Registry</span>
                <span className="rounded bg-fault/15 px-1 py-0.2 text-[9px] text-fault">Risk</span>
              </Link>
              <Link href="/app/audit" className="hover:text-clear transition-colors">
                Audit Trail
              </Link>
              <Link href="/app/onboarding" className="hover:text-mist-100 transition-colors">
                Setup Wizard
              </Link>
            </div>
          </div>

          {/* Col 3: Protocol Architecture */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mist-100">
              Architecture
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/how-it-works" className="hover:text-mist-100 transition-colors">
                How It Works
              </Link>
              <Link href="/security" className="hover:text-mist-100 transition-colors">
                Security Model
              </Link>
              <Link href="/developers" className="hover:text-mist-100 transition-colors">
                Developer Hub
              </Link>
              <Link href="/protocol" className="hover:text-mist-100 transition-colors">
                Protocol Story &amp; RFC
              </Link>
              <Link href="/app/settings" className="hover:text-mist-100 transition-colors">
                Node &amp; RPC Settings
              </Link>
            </div>
          </div>

          {/* Col 4: Ecosystem & Repositories */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mist-100">
              Ecosystem
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <a
                href="https://github.com/Femology/warden-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mist-100 transition-colors flex items-center justify-between"
              >
                <span>warden-sdk</span>
                <span className="text-mist-400">TypeScript</span>
              </a>
              <a
                href="https://github.com/Femology/warden-contract"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mist-100 transition-colors flex items-center justify-between"
              >
                <span>warden-contract</span>
                <span className="text-mist-400">Rust</span>
              </a>
              <a
                href="https://github.com/Femology/warden-app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mist-100 transition-colors flex items-center justify-between"
              >
                <span>warden-app</span>
                <span className="text-mist-400">Next.js</span>
              </a>
              <a
                href="https://github.com/Femology/warden-monitor"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mist-100 transition-colors flex items-center justify-between"
              >
                <span>warden-monitor</span>
                <span className="text-mist-400">Indexer</span>
              </a>
              <a
                href="https://github.com/Femology/warden-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mist-100 transition-colors flex items-center justify-between"
              >
                <span>warden-docs</span>
                <span className="text-mist-400">Spec</span>
              </a>
            </div>
          </div>

          {/* Col 5: Transparency & Legal */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mist-100">
              Transparency
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/risk-disclosure" className="hover:text-mist-100 transition-colors">
                Risk Disclosure
              </Link>
              <Link href="/privacy" className="hover:text-mist-100 transition-colors">
                Privacy Notice
              </Link>
              <Link href="/terms" className="hover:text-mist-100 transition-colors">
                Terms of Use
              </Link>
              <a
                href="https://stellar.expert/explorer/testnet/contract/CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-clear transition-colors flex items-center gap-1"
              >
                <span>Stellar Expert ↗</span>
              </a>
              <a
                href="mailto:femimi1234@gmail.com"
                className="hover:text-mist-100 transition-colors text-[11px] pt-1"
              >
                Security: femimi1234@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Contract Copy and License */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-ink-700 pt-8 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-mist-400">
            <p>© {new Date().getFullYear()} Warden Project. Open-source software under Apache-2.0.</p>
            <span className="hidden sm:inline">•</span>
            <span>Zero administrative custody or backdoors.</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-2.5 py-1 text-[11px]">
              <span className="text-mist-400">Contract:</span>
              <span className="text-mist-100">{CONFIG.contractId.slice(0, 6)}…{CONFIG.contractId.slice(-6)}</span>
              <button
                type="button"
                onClick={handleCopyContract}
                className="ml-1 text-clear hover:underline"
              >
                {copiedContract ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
