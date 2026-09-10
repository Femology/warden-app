'use client';

import { useState } from 'react';
import { ConnectWallet } from '@/components/ConnectWallet';

const DEMO_LIMIT = 500;
const MAX_DRAG = 1000;

export default function Home() {
  const [amount, setAmount] = useState(150);
  const isStepUp = amount > DEMO_LIMIT;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-16 px-6 py-20">
      <header className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold tracking-tight text-mist-100">
          Warden
        </span>
        <ConnectWallet />
      </header>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-mist-100 sm:text-5xl">
            Friction where the risk actually is.
          </h1>
          <p className="max-w-xl text-mist-400">
            Drag the amount below. Under your limit, it goes straight through. Over it,
            Warden asks for one more confirmation -- not because something went wrong,
            but because the system is working correctly.
          </p>
        </div>

        <div
          className="flex flex-col gap-4 rounded-lg border p-6 transition-colors duration-300"
          style={{
            borderColor: isStepUp ? 'var(--color-gate)' : 'var(--color-clear)',
            backgroundColor: 'var(--color-ink-800)',
          }}
        >
          <div className="flex items-baseline justify-between">
            <span
              className="tabular-amount font-display text-3xl font-semibold"
              style={{ color: isStepUp ? 'var(--color-gate)' : 'var(--color-clear)' }}
            >
              ${amount}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-medium transition-colors duration-300"
              style={{
                color: isStepUp ? 'var(--color-gate)' : 'var(--color-clear)',
                backgroundColor: isStepUp
                  ? 'color-mix(in oklab, var(--color-gate) 15%, transparent)'
                  : 'color-mix(in oklab, var(--color-clear) 15%, transparent)',
              }}
            >
              {isStepUp ? 'Step-up' : 'Allow'}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={MAX_DRAG}
            step={10}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            aria-label="Demo transfer amount"
            aria-valuetext={`$${amount}, ${isStepUp ? 'requires step-up' : 'allowed'}`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none transition-colors duration-300"
            style={{
              accentColor: isStepUp ? 'var(--color-gate)' : 'var(--color-clear)',
              backgroundColor: 'var(--color-ink-700)',
            }}
          />

          <p className="text-sm text-mist-400">
            {isStepUp
              ? `This amount is above your $${DEMO_LIMIT} no-confirmation limit.`
              : `Under your $${DEMO_LIMIT} limit -- no extra confirmation needed.`}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-ink-700 pt-10">
        <p className="max-w-xl text-mist-400">
          Most wallet apps treat every payment the same. Warden lets a wallet owner set
          their own rules, so the friction shows up where the risk actually is, instead
          of on every single tap.
        </p>
      </section>
    </main>
  );
}
