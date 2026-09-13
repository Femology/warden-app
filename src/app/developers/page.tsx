'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/soundEngine';

const CONTRACT_ID = 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW';

type CodeTab = 'policy' | 'evaluate' | 'guardians' | 'cli';

const CODE_SNIPPETS: Record<CodeTab, { title: string; lang: string; code: string }> = {
  policy: {
    title: '1. Configure Spending Policy',
    lang: 'typescript',
    code: `import { WardenClient } from 'warden-sdk';

const warden = new WardenClient({
  network: 'testnet',
  contractId: '${CONTRACT_ID}',
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// Configure 7-decimal Stroop thresholds (500 USDC = 500_0000000n)
const tx = await warden.buildSetPolicy({
  wallet: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
  maxAmountNoStepUp: 500_0000000n, // $500 max without second key
  hourlyVelocityCap: 500_0000000n,  // $500 rolling 1-hour burst cap
  dailyVelocityCap: 1000_0000000n,  // $1,000 rolling 24-hour daily cap
  trustDecaySeconds: 2592000n,     // 30 days until recipient trust expires
});

await tx.signAndSubmit(userKeypair);
console.log('✓ Policy updated on-chain.');`,
  },

  evaluate: {
    title: '2. Evaluate In-Flight Payment',
    lang: 'typescript',
    code: `// Evaluate transfer risk inside your wallet before submission
const decision = await warden.evaluate({
  wallet: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
  amount: 75_0000000n, // $75 transfer
  recipient: 'GCKFMEI2L262H3S2UC2A5V6R6N6C4DY63PPA2V5OQZZ5M2LCLTYL6DVO',
});

if (decision.type === 'Allow') {
  // Transfer glides through: single biometric signature accepted
  console.log('✓ Under limits and trusted. Executing transfer...');
  await executeDirectTransfer();
} else {
  // Step-up triggered: prompt user for secondary passkey or guardian auth
  console.warn('⚠️ Step-up required on-chain:', decision.reason);
  promptStepUpModal(decision.reason);
}`,
  },

  guardians: {
    title: '3. Setup Social Guardians & Recovery',
    lang: 'typescript',
    code: `// Appoint up to 7 trusted guardian addresses with a 2-of-3 quorum
const setupTx = await warden.buildSetGuardians({
  wallet: userAddress,
  guardians: [
    'GA2C5RFPE6GCKMY3E5AX6O7G3G2G5CE5B7XQZAX6O7G3G2G5CE5B7XQZ', // Spouse
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Family
    'GCDT64NWGPG7CQZKCQWZXQAX6O7G3G2G5CE5B7XQZAX6O7G3G2G5CE5', // Hardware Backup
  ],
  threshold: 2, // 2 out of 3 signatures required
});

await setupTx.signAndSubmit(userKeypair);

// If phone is lost, guardians propose recovery (starts 48-hour timelock)
// Owner can cancel at any time via cancel_recovery before timelock expires`,
  },

  cli: {
    title: '4. Stellar CLI Invocations',
    lang: 'bash',
    code: `# Evaluate a transfer directly on Stellar Testnet via CLI
stellar contract invoke \\
  --id ${CONTRACT_ID} \\
  --source alice \\
  --network testnet \\
  -- evaluate \\
  --wallet GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7 \\
  --amount 12000000000 \\
  --recipient GCKFMEI2L262H3S2UC2A5V6R6N6C4DY63PPA2V5OQZZ5M2LCLTYL6DVO

# Query active velocity state (1h spent, 24h spent, last timestamp)
stellar contract invoke \\
  --id ${CONTRACT_ID} \\
  --network testnet \\
  -- get_velocity \\
  --wallet GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7`,
  },
};

const STEP_UP_REASONS = [
  {
    id: 'AmountExceeded',
    name: 'AmountExceeded',
    color: '#F2994A',
    trigger: 'Single transfer amount exceeds max_amount_no_step_up threshold ($500).',
    uiHandling: 'Display confirmation sheet. Prompt user for primary Passkey or second biometric signature.',
    payload: `{\n  "verdict": "RequireStepUp",\n  "reason": "AmountExceeded",\n  "amount": "12000000000",\n  "threshold": "5000000000"\n}`,
  },
  {
    id: 'NewRecipient',
    name: 'NewRecipient',
    color: '#F2994A',
    trigger: 'Destination address has never been sent to, or 30-day trust decay has expired.',
    uiHandling: 'Show "First-Time Recipient" warning banner. Offer "Add to Verified Friends" toggle.',
    payload: `{\n  "verdict": "RequireStepUp",\n  "reason": "NewRecipient",\n  "recipient": "GCKFMEI2...",\n  "trustDecayElapsed": true\n}`,
  },
  {
    id: 'HourlyVelocityExceeded',
    name: 'HourlyVelocityExceeded',
    color: '#F2994A',
    trigger: 'Sum of transfers within current rolling 3600-second window exceeds hourly_velocity_cap.',
    uiHandling: 'Warn of high-frequency activity. Show remaining cooldown minutes until hourly window resets.',
    payload: `{\n  "verdict": "RequireStepUp",\n  "reason": "HourlyVelocityExceeded",\n  "hourlySpent": "5500000000",\n  "hourlyCap": "5000000000"\n}`,
  },
  {
    id: 'VelocityExceeded',
    name: 'VelocityExceeded',
    color: '#F2994A',
    trigger: 'Cumulative transfers across rolling 24 hours exceed daily_velocity_cap.',
    uiHandling: 'Alert user that 24h limit is reached. Enforce multi-signer or guardian authorization.',
    payload: `{\n  "verdict": "RequireStepUp",\n  "reason": "VelocityExceeded",\n  "dailySpent": "10500000000",\n  "dailyCap": "10000000000"\n}`,
  },
  {
    id: 'FlaggedRecipient',
    name: 'FlaggedRecipient',
    color: '#FF5A52',
    trigger: 'Recipient address is permanently cataloged on the on-chain malicious / scam registry.',
    uiHandling: 'Render high-severity red modal. Transfer halted. Advise user of verified scam report.',
    payload: `{\n  "verdict": "RequireStepUp",\n  "reason": "FlaggedRecipient",\n  "registrySource": "onchain_blacklist",\n  "action": "HALT_TRANSFER"\n}`,
  },
];

const CONTRACT_FUNCTIONS = [
  {
    name: 'set_policy',
    auth: 'wallet.require_auth()',
    params: 'wallet: Address, max_amount_no_step_up: i128, hourly_velocity_cap: i128, daily_velocity_cap: i128, trust_decay_seconds: u64',
    returns: 'Result<(), ContractError>',
    desc: 'Initializes or updates account spending limits and trust decay periods.',
  },
  {
    name: 'evaluate',
    auth: 'None (Read-only / Host gate)',
    params: 'wallet: Address, amount: i128, recipient: Address',
    returns: 'Result<EvaluationResult, ContractError>',
    desc: 'Evaluates transfer against policy and rolling velocity windows. Returns Allow or StepUp.',
  },
  {
    name: 'get_policy',
    auth: 'None',
    params: 'wallet: Address',
    returns: 'Option<PolicyConfig>',
    desc: 'Retrieves current active policy configuration for the specified wallet.',
  },
  {
    name: 'get_velocity',
    auth: 'None',
    params: 'wallet: Address',
    returns: 'VelocityState',
    desc: 'Returns current hourly spent, daily spent, and timestamp of last recorded outflow.',
  },
  {
    name: 'get_account_state',
    auth: 'None',
    params: 'wallet: Address',
    returns: 'AccountState (Normal | Watch | Restricted | Challenged | Frozen)',
    desc: 'Returns current tier on the 5-state asymmetric security ladder.',
  },
  {
    name: 'set_guardians',
    auth: 'wallet.require_auth()',
    params: 'wallet: Address, guardians: Vec<Address>, threshold: u32',
    returns: 'Result<(), ContractError>',
    desc: 'Configures up to 7 guardian addresses and the m-of-n voting threshold.',
  },
  {
    name: 'propose_recovery',
    auth: 'guardian.require_auth()',
    params: 'wallet: Address, new_owner: Address',
    returns: 'Result<u64, ContractError>',
    desc: 'Initiates social recovery and starts the immutable 48-hour timelock countdown.',
  },
  {
    name: 'execute_recovery',
    auth: 'None',
    params: 'wallet: Address',
    returns: 'Result<(), ContractError>',
    desc: 'Finalizes recovery after the 48-hour timelock has elapsed without owner veto.',
  },
  {
    name: 'cancel_recovery',
    auth: 'wallet.require_auth()',
    params: 'wallet: Address',
    returns: 'Result<(), ContractError>',
    desc: 'Absolute owner veto. Aborts any pending recovery proposal and resets timelock.',
  },
];

export default function DevelopersPage() {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('policy');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [selectedReason, setSelectedReason] = useState(STEP_UP_REASONS[0]);

  function handleCopyCode() {
    sounds.playClick();
    navigator.clipboard.writeText(CODE_SNIPPETS[activeCodeTab].code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyContract() {
    sounds.playClick();
    navigator.clipboard.writeText(CONTRACT_ID);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden transition-colors">
      {/* Background ambient lighting - strictly forest green tones */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full blur-[150px] opacity-10"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-0 h-[400px] w-[600px] rounded-full blur-[160px] opacity-5"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-8 sm:py-16">
        {/* =========================================================================
            SECTION 1: HERO & DEPLOYMENT IDENTIFIER
        ========================================================================= */}
        <section className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 text-xs font-mono text-mist-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
            DEVELOPER ENGINE • STELLAR SOROBAN V1.0.0
          </div>

          <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight text-mist-100 sm:text-6xl md:text-7xl">
            Build With <span className="text-clear">Warden</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-mist-400 leading-relaxed">
            Embed real-time on-chain spending governors, rolling velocity bounds, and 48-hour social recovery into
            Stellar wallets, autonomous AI payment agents, and decentralized fintech apps.
          </p>

          {/* Deployment Callout Card */}
          <div className="mt-10 w-full max-w-3xl rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-clear" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-clear">
                    Live Testnet Contract
                  </span>
                  <span className="rounded bg-ink-700 px-2 py-0.5 text-[10px] font-mono text-mist-400">
                    Protocol v1.0.0
                  </span>
                </div>
                <span className="mt-2 font-mono text-xs sm:text-sm text-mist-100 break-all">
                  {CONTRACT_ID}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyContract}
                  className="rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2 text-xs font-mono text-mist-100 hover:border-edge transition-colors"
                >
                  {copiedContract ? '✓ Copied' : 'Copy ID'}
                </button>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-clear px-3.5 py-2 text-xs font-semibold text-ink-900 hover:bg-clear/90 transition-colors shadow-sm"
                >
                  Explorer ↗
                </a>
              </div>
            </div>
          </div>

          {/* Custom Illustration A: The On-Chain Gateway (Fully Theme-Adaptive) */}
          <div className="mt-12 w-full max-w-4xl rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-md overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-ink-700 text-xs font-mono text-mist-400">
              <span>VECTOR ARCHITECTURE DIAGRAM</span>
              <span className="text-clear font-semibold">FIGURE 01: THE ON-CHAIN SOROBAN GATEWAY</span>
            </div>
            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 800 240" className="w-full h-auto max-h-[240px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--clear)" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="var(--clear)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="var(--clear)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Background Grid Lines */}
                <path d="M 50 120 H 750" stroke="var(--ink-700)" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 220 30 V 210" stroke="var(--ink-700)" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 580 30 V 210" stroke="var(--ink-700)" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Node 1: Transaction Inflow */}
                <g transform="translate(100, 120)">
                  <circle r="40" fill="var(--ink-800)" stroke="var(--ink-700)" strokeWidth="2" />
                  <circle r="30" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text y="-4" textAnchor="middle" fill="var(--mist-100)" fontSize="11" fontFamily="monospace" fontWeight="bold">TX PAYLOAD</text>
                  <text y="14" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="monospace">i128 Amount</text>
                </g>

                {/* Data stream arrow */}
                <path d="M 145 120 L 295 120" stroke="url(#streamGrad)" strokeWidth="3" />
                <circle cx="220" cy="120" r="4" fill="var(--clear)" filter="url(#nodeGlow)" />

                {/* Center Node: The Soroban __check_auth Gate */}
                <g transform="translate(400, 120)">
                  <polygon points="0,-70 80,0 0,70 -80,0" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2.5" filter="url(#nodeGlow)" />
                  <polygon points="0,-52 58,0 0,52 -58,0" fill="var(--ink-900)" stroke="var(--ink-700)" strokeWidth="1.5" />
                  <circle r="20" fill="var(--clear)" fillOpacity="0.15" stroke="var(--clear)" strokeWidth="1.5" />
                  <text y="-14" textAnchor="middle" fill="var(--clear)" fontSize="10" fontFamily="monospace" fontWeight="bold">__check_auth</text>
                  <text y="4" textAnchor="middle" fill="var(--mist-100)" fontSize="12" fontFamily="sans-serif" fontWeight="bold">Warden Core</text>
                  <text y="20" textAnchor="middle" fill="var(--mist-400)" fontSize="9" fontFamily="monospace">&lt; 400ms Gas</text>
                </g>

                {/* Exit Paths */}
                {/* Upper Path: Allow */}
                <path d="M 485 100 Q 560 60 635 60" stroke="var(--clear)" strokeWidth="2.5" fill="none" />
                <circle cx="560" cy="80" r="3" fill="var(--clear)" />
                <g transform="translate(690, 60)">
                  <rect x="-45" y="-18" width="90" height="36" rx="10" fill="var(--ink-800)" stroke="var(--clear)" strokeWidth="2" />
                  <text y="5" textAnchor="middle" fill="var(--clear)" fontSize="11" fontFamily="monospace" fontWeight="bold">ALLOW ✓</text>
                </g>

                {/* Lower Path: Step-Up Required */}
                <path d="M 485 140 Q 560 180 635 180" stroke="var(--gate)" strokeWidth="2.5" fill="none" strokeDasharray="5 3" />
                <circle cx="560" cy="160" r="3" fill="var(--gate)" />
                <g transform="translate(690, 180)">
                  <rect x="-50" y="-18" width="100" height="36" rx="10" fill="var(--ink-800)" stroke="var(--gate)" strokeWidth="2" />
                  <text y="5" textAnchor="middle" fill="var(--gate)" fontSize="11" fontFamily="monospace" fontWeight="bold">STEP-UP ⚠️</text>
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: 3-STEP QUICKSTART
        ========================================================================= */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">
              FAST INTEGRATION
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              From Zero to Protected in Three Steps
            </h2>
            <p className="text-sm text-mist-400 max-w-2xl">
              Warden is designed as a drop-in TypeScript library for any Stellar application or agent runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-sm">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs text-clear font-bold">STEP 01</span>
                <h3 className="font-display text-xl font-bold text-mist-100">Install the SDK</h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Pin the verified v0.4.0 client build containing type-safe contract bindings and error parsers.
                </p>
              </div>
              <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900 p-3 font-mono text-xs text-clear break-all">
                npm i github:Femology/warden-sdk#v0.4.0
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-sm">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs text-clear font-bold">STEP 02</span>
                <h3 className="font-display text-xl font-bold text-mist-100">Connect Contract</h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Instantiate <code className="text-mist-100 font-semibold">WardenClient</code> pointing to the live Soroban RPC and Testnet ID.
                </p>
              </div>
              <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900 p-3 font-mono text-xs text-mist-400">
                new WardenClient(&#123; contractId &#125;)
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-ink-700 bg-ink-800 p-6 hover:border-clear/50 transition-colors shadow-sm">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs text-clear font-bold">STEP 03</span>
                <h3 className="font-display text-xl font-bold text-mist-100">Evaluate Payments</h3>
                <p className="text-xs text-mist-400 leading-relaxed">
                  Pass any in-flight transfer to <code className="text-mist-100 font-semibold">evaluate()</code>. Route instantly or trigger step-up.
                </p>
              </div>
              <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900 p-3 font-mono text-xs text-clear">
                if (verdict === &apos;Allow&apos;) execute();
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: INTERACTIVE IMPLEMENTATION PLAYGROUND
        ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-gate font-semibold">
              CODE PLAYGROUND
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Executable TypeScript &amp; CLI Recipes
            </h2>
            <p className="text-sm text-mist-400 max-w-2xl">
              Real-world snippets for policy configuration, payment evaluations, social guardian recovery, and CLI interactions.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-800 shadow-md overflow-hidden">
            {/* Terminal Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-700 bg-ink-900 px-6 py-3.5 gap-4">
              {/* Tab Selector */}
              <div className="flex flex-wrap gap-2">
                {(['policy', 'evaluate', 'guardians', 'cli'] as CodeTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setActiveCodeTab(tab);
                    }}
                    className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-medium transition-all ${
                      activeCodeTab === tab
                        ? 'bg-ink-800 text-mist-100 border border-ink-700 shadow-sm font-semibold'
                        : 'text-mist-400 hover:text-mist-100'
                    }`}
                  >
                    {CODE_SNIPPETS[tab].title}
                  </button>
                ))}
              </div>

              {/* Copy Code Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="self-start sm:self-auto rounded-lg border border-ink-700 bg-ink-800 px-3.5 py-1.5 font-mono text-xs text-mist-100 hover:border-edge transition-colors shadow-sm"
              >
                {copiedCode ? '✓ Copied' : 'Copy Recipe'}
              </button>
            </div>

            {/* Terminal Body with Explicit Dark Background for High-Contrast Code Rendering */}
            <div className="p-6 bg-[#0D1712]">
              <pre className="overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-[#EAF2ED]">
                <code>{CODE_SNIPPETS[activeCodeTab].code}</code>
              </pre>
            </div>

            {/* Terminal Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-ink-700 bg-ink-900 px-6 py-3 text-[11px] font-mono text-mist-400">
              <span>SOROBAN HOST RUNTIME: WASM</span>
              <span>STROOP SCALING: 10^7</span>
              <span>AUTHENTICATION: WALLET REQUIRE_AUTH</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: DUAL-HORIZON VELOCITY & GUARDIAN LATTICE ILLUSTRATIONS (Theme Adaptive)
        ========================================================================= */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Custom Illustration B: Dual-Horizon Velocity Dial */}
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3 text-xs font-mono text-mist-400">
              <span>FIGURE 02: VELOCITY &amp; TRUST DECAY</span>
              <span className="text-clear font-semibold">DUAL HORIZON</span>
            </div>

            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 360 260" className="w-full max-w-[320px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 24h Daily Cap Outer Arc */}
                <circle cx="180" cy="130" r="100" stroke="var(--ink-700)" strokeWidth="12" strokeDasharray="314 314" strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="180" cy="130" r="100" stroke="var(--clear)" strokeWidth="12" strokeDasharray="314 314" strokeDashoffset="90" strokeLinecap="round" />

                {/* 1h Hourly Burst Inner Arc */}
                <circle cx="180" cy="130" r="75" stroke="var(--ink-700)" strokeWidth="10" strokeDasharray="235 235" strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="180" cy="130" r="75" stroke="var(--gate)" strokeWidth="10" strokeDasharray="235 235" strokeDashoffset="120" strokeLinecap="round" />

                {/* Center Readout */}
                <circle cx="180" cy="130" r="52" fill="var(--ink-800)" stroke="var(--ink-700)" strokeWidth="2" />
                <text x="180" y="123" textAnchor="middle" fill="var(--mist-100)" fontSize="16" fontFamily="sans-serif" fontWeight="bold">Dual Cap</text>
                <text x="180" y="142" textAnchor="middle" fill="var(--mist-400)" fontSize="10" fontFamily="monospace">1h &amp; 24h Limits</text>

                {/* Legend Filaments */}
                <line x1="30" y1="240" x2="60" y2="240" stroke="var(--clear)" strokeWidth="4" strokeLinecap="round" />
                <text x="70" y="244" fill="var(--mist-400)" fontSize="11" fontFamily="monospace">24h Limit ($1,000)</text>

                <line x1="200" y1="240" x2="230" y2="240" stroke="var(--gate)" strokeWidth="4" strokeLinecap="round" />
                <text x="240" y="244" fill="var(--mist-400)" fontSize="11" fontFamily="monospace">1h Limit ($500)</text>
              </svg>
            </div>

            <p className="text-xs text-mist-400 leading-relaxed">
              Warden tracks rolling expenditure independently across 3600-second and 86400-second on-chain sliding windows.
              If an autonomous bot bursts $500 in 3 minutes, it is halted before the daily ceiling is reached.
            </p>
          </div>

          {/* Custom Illustration C: Guardian Quorum Lattice */}
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3 text-xs font-mono text-mist-400">
              <span>FIGURE 03: SOCIAL RECOVERY LATTICE</span>
              <span className="text-gate font-semibold">48-HOUR VETO</span>
            </div>

            <div className="py-6 flex justify-center">
              <svg viewBox="0 0 360 260" className="w-full max-w-[320px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Orbital Web Lines */}
                <circle cx="180" cy="130" r="85" stroke="var(--ink-700)" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Connecting Threshold Paths */}
                <line x1="180" y1="45" x2="180" y2="130" stroke="var(--gate)" strokeWidth="2.5" />
                <line x1="260" y1="95" x2="180" y2="130" stroke="var(--gate)" strokeWidth="2.5" />
                <line x1="100" y1="95" x2="180" y2="130" stroke="var(--ink-700)" strokeWidth="1.5" />
                <line x1="250" y1="185" x2="180" y2="130" stroke="var(--ink-700)" strokeWidth="1.5" />
                <line x1="110" y1="185" x2="180" y2="130" stroke="var(--ink-700)" strokeWidth="1.5" />

                {/* Guardian 1: Signed */}
                <circle cx="180" cy="45" r="16" fill="var(--ink-800)" stroke="var(--gate)" strokeWidth="2" />
                <text x="180" y="49" textAnchor="middle" fill="var(--gate)" fontSize="10" fontFamily="monospace" fontWeight="bold">G1 ✓</text>

                {/* Guardian 2: Signed */}
                <circle cx="260" cy="95" r="16" fill="var(--ink-800)" stroke="var(--gate)" strokeWidth="2" />
                <text x="260" y="99" textAnchor="middle" fill="var(--gate)" fontSize="10" fontFamily="monospace" fontWeight="bold">G2 ✓</text>

                {/* Guardian 3: Pending */}
                <circle cx="100" cy="95" r="16" fill="var(--ink-800)" stroke="var(--ink-700)" strokeWidth="1.5" />
                <text x="100" y="99" textAnchor="middle" fill="var(--mist-400)" fontSize="10" fontFamily="monospace">G3</text>

                {/* Guardians 4-7 in orbit */}
                <circle cx="250" cy="185" r="12" fill="var(--ink-900)" stroke="var(--ink-700)" strokeWidth="1.5" />
                <circle cx="110" cy="185" r="12" fill="var(--ink-900)" stroke="var(--ink-700)" strokeWidth="1.5" />
                <circle cx="180" cy="215" r="12" fill="var(--ink-900)" stroke="var(--ink-700)" strokeWidth="1.5" />

                {/* Center Timelock Node */}
                <circle cx="180" cy="130" r="34" fill="var(--ink-800)" stroke="var(--gate)" strokeWidth="2.5" />
                <text x="180" y="125" textAnchor="middle" fill="var(--gate)" fontSize="12" fontFamily="monospace" fontWeight="bold">48H</text>
                <text x="180" y="141" textAnchor="middle" fill="var(--mist-100)" fontSize="9" fontFamily="sans-serif" fontWeight="medium">Timelock</text>
              </svg>
            </div>

            <p className="text-xs text-mist-400 leading-relaxed">
              Configures up to 7 guardian accounts. When an m-of-n threshold votes to recover, an immutable 48-hour
              timelock begins on-chain, during which the legitimate owner can trigger <code className="text-mist-100 font-semibold">cancel_recovery</code>.
            </p>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: INTERACTIVE STEP-UP REASON INSPECTOR
        ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">
              PROTOCOL SPECIFICATION
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Step-Up Reasons &amp; Wallet Handling Matrix
            </h2>
            <p className="text-sm text-mist-400 max-w-2xl">
              Select an on-chain reason code below to inspect the return structure and recommended wallet UI response.
            </p>
          </div>

          {/* Reason Pills */}
          <div className="flex flex-wrap gap-2.5">
            {STEP_UP_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedReason(reason);
                }}
                className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-all shadow-sm ${
                  selectedReason.id === reason.id
                    ? 'bg-clear text-ink-900 font-bold ring-2 ring-clear/40'
                    : 'border border-ink-700 bg-ink-800 text-mist-400 hover:text-mist-100 hover:border-ink-700'
                }`}
              >
                {reason.name}
              </button>
            ))}
          </div>

          {/* Reason Detail Box */}
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-ink-700 bg-ink-800 p-6 lg:grid-cols-12 shadow-md">
            {/* Left: Logic Breakdown (7 cols) */}
            <div className="flex flex-col gap-4 lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedReason.color }} />
                <h3 className="font-display text-xl font-bold text-mist-100">{selectedReason.name}</h3>
                <span className="rounded bg-ink-900 px-2.5 py-0.5 text-xs font-mono text-mist-400 border border-ink-700">
                  Step-Up Gate
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-mist-400">Contract Condition:</span>
                <p className="text-sm text-mist-100 leading-relaxed">{selectedReason.trigger}</p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-ink-700 bg-ink-900 p-4">
                <span className="text-xs font-mono uppercase tracking-wider text-clear font-semibold">Recommended Wallet UI Handling:</span>
                <p className="text-sm text-mist-400 leading-relaxed">{selectedReason.uiHandling}</p>
              </div>
            </div>

            {/* Right: Typed JSON Payload (5 cols) */}
            <div className="flex flex-col gap-2 lg:col-span-5">
              <span className="text-xs font-mono uppercase tracking-wider text-mist-400">Returned Struct Payload:</span>
              <pre className="rounded-xl border border-ink-700 bg-[#0D1712] p-4 font-mono text-xs text-[#22C38D] overflow-x-auto leading-relaxed shadow-inner">
                <code>{selectedReason.payload}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: ALL 9 SMART CONTRACT FUNCTIONS
        ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-clear font-semibold">
              CONTRACT INTERFACE
            </span>
            <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
              Exported Soroban Functions
            </h2>
            <p className="text-sm text-mist-400 max-w-2xl">
              The 9 verified on-chain endpoints deployed on Stellar Testnet for Warden Protocol v1.0.0.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-ink-700 bg-ink-800 shadow-md">
            <table className="w-full text-left font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900 text-xs font-mono text-mist-400">
                  <th className="p-4 font-normal">Function</th>
                  <th className="p-4 font-normal">Required Auth</th>
                  <th className="p-4 font-normal">Parameters</th>
                  <th className="p-4 font-normal">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60 font-mono">
                {CONTRACT_FUNCTIONS.map((fn) => (
                  <tr key={fn.name} className="hover:bg-ink-700/20 transition-colors">
                    <td className="p-4 font-bold text-clear">{fn.name}()</td>
                    <td className="p-4 text-gate">{fn.auth}</td>
                    <td className="p-4 text-mist-400 font-sans text-xs max-w-xs">{fn.params}</td>
                    <td className="p-4 text-mist-100">{fn.returns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
