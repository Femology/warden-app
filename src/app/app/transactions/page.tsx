'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/soundEngine';

interface LedgerItem {
  id: string;
  ledgerSeq: string;
  timeAgo: string;
  recipient: string;
  recipientLabel: string;
  recipientType: 'trusted' | 'new' | 'flagged';
  amount: string;
  verdict: 'allowed' | 'stepup' | 'blocked';
  verdictLabel: string;
  reason: string;
  txHash: string;
  explanation: {
    summary: string;
    factors: string[];
    nextSteps: string[];
  };
}

const INITIAL_TRANSACTIONS: LedgerItem[] = [
  {
    id: 'tx-1',
    ledgerSeq: '#4635891',
    timeAgo: '2 mins ago',
    recipient: 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
    recipientLabel: 'Mama Amina',
    recipientType: 'trusted',
    amount: '12.00',
    verdict: 'allowed',
    verdictLabel: '● ALLOWED',
    reason: 'WithinPolicy',
    txHash: 'a89c2b9f87e24a1b0c9823f6d7e4c198a2bc9103e87d654109bca74921de0829',
    explanation: {
      summary: 'Autonomous low-risk transfer approved without friction.',
      factors: [
        'Outflow ($12.00) is well below single-tx cap ($150.00).',
        'Recipient is verified in local address book.',
        'Hourly velocity is within headroom.',
      ],
      nextSteps: ['No user action required. Settled on Stellar Testnet in 5 seconds.'],
    },
  },
  {
    id: 'tx-2',
    ledgerSeq: '#4635884',
    timeAgo: '18 mins ago',
    recipient: 'GCBNEW7890XYZ12345ABCDEF67890HIJKLMNOPQRSTUV56',
    recipientLabel: 'Hardware Supplier',
    recipientType: 'new',
    amount: '150.00',
    verdict: 'stepup',
    verdictLabel: '▲ STEP-UP',
    reason: 'NewRecipient',
    txHash: 'b78d1f2e90c33a5b6d7812e5c6d3b087a1ab8092d76c543218abc93810cd0718',
    explanation: {
      summary: 'First-time interaction challenge required by smart account policy.',
      factors: [
        'Destination address has zero historical transfer activity from this vault.',
        'Policy invariant: newRecipientRequiresStepUp is active.',
        'Single transaction amount touched maximum allowance threshold ($150.00).',
      ],
      nextSteps: [
        'Approve using secondary biometric signature in Freighter.',
        'Destination will automatically register as trusted for subsequent payments.',
      ],
    },
  },
  {
    id: 'tx-3',
    ledgerSeq: '#4635820',
    timeAgo: '1 hour ago',
    recipient: 'GCRUN4321DRAIN567890ABCDEF1234567890HIJKLMNO12',
    recipientLabel: 'External Bridge',
    recipientType: 'new',
    amount: '1200.00',
    verdict: 'stepup',
    verdictLabel: '▲ STEP-UP',
    reason: 'HourlyVelocityExceeded',
    txHash: 'c90e3a4f89d12b6a5c8934e7d8f5c209b3cd9104f87e654320bcd84921de1930',
    explanation: {
      summary: 'Large transfer initiated to an unindexed counterparty address.',
      factors: [
        'Amount ($1,200.00) breached single-transaction limit ($150.00).',
        '1-hour velocity exceeded by $450.00.',
        'Destination has zero prior interaction history.',
      ],
      nextSteps: [
        'Provide secondary signature from authorized guardian or wait 48 minutes for hourly velocity reset.',
        'Check policy limits if you frequently make large wholesale transfers.',
      ],
    },
  },
  {
    id: 'tx-4',
    ledgerSeq: '#4635742',
    timeAgo: '3 hours ago',
    recipient: 'GB3XFLAGGEDSCAMMERREGISTRYBLACKLSTED9999999990',
    recipientLabel: 'Phishing Contract',
    recipientType: 'flagged',
    amount: '50.00',
    verdict: 'blocked',
    verdictLabel: '✕ BLOCKED',
    reason: 'FlaggedRecipient',
    txHash: 'd01f4b5a90e23c7b6d9045f8e9a6d310c4de0215a98f765431cde95032ef2041',
    explanation: {
      summary: 'Malicious destination permanently cataloged on on-chain registry.',
      factors: [
        'Address GB3X...9990 is flagged on the decentralized scammer database.',
        'Zero-trust contract gate halted transaction execution in __check_auth.',
        'No funds left the vault.',
      ],
      nextSteps: [
        'Avoid interacting with this counterparty.',
        'Report phishing vector to the Stellar ecosystem security registry.',
      ],
    },
  },
  {
    id: 'tx-5',
    ledgerSeq: '#4635610',
    timeAgo: '5 hours ago',
    recipient: 'GA7QY5Z36K3F2V4Z8R6J9W1X5P7B8M4N2Q9T1V8W4Z2VSGZ',
    recipientLabel: 'Mama Amina',
    recipientType: 'trusted',
    amount: '45.00',
    verdict: 'allowed',
    verdictLabel: '● ALLOWED',
    reason: 'WithinPolicy',
    txHash: 'e12a5c6b01f34d8c7e0156a9fa07e421d5ef1326b09a876542def06143fa3152',
    explanation: {
      summary: 'Routine verified transfer processed autonomously.',
      factors: [
        'Counterparty trusted for 24 days.',
        'Under $150.00 single-tx threshold.',
        'Velocity within daily ceiling.',
      ],
      nextSteps: ['Ledger finalized. Gas fee < 0.00001 XLM.'],
    },
  },
];

export default function TransactionsLedgerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<'all' | 'allowed' | 'stepup' | 'blocked'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    sounds.playClick();
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filteredTransactions = useMemo(() => {
    return INITIAL_TRANSACTIONS.filter((tx) => {
      // Filter by verdict
      if (filterVerdict !== 'all' && tx.verdict !== filterVerdict) {
        return false;
      }
      // Search by recipient or txHash
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRecipient = tx.recipient.toLowerCase().includes(q);
        const matchLabel = tx.recipientLabel.toLowerCase().includes(q);
        const matchHash = tx.txHash.toLowerCase().includes(q);
        const matchReason = tx.reason.toLowerCase().includes(q);
        if (!matchRecipient && !matchLabel && !matchHash && !matchReason) {
          return false;
        }
      }
      return true;
    });
  }, [filterVerdict, searchQuery]);

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 pt-8 sm:pt-12 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            SECTION A: HEADER & SUMMARY STATS
        ===================================================================== */}
        <div className="flex flex-col gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                  AUDIT TRAIL // ON-CHAIN EVENT RECORD
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
                Transaction &amp; Security Ledger
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/app/transactions/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-clear px-4 py-2 font-mono text-xs font-bold text-ink-900 hover:bg-clear/90 transition-colors shadow-sm"
              >
                <span>💸 Send Payment</span>
              </Link>
            </div>
          </div>

          <p className="text-sm sm:text-base text-mist-400 max-w-3xl leading-relaxed">
            A verifiable record of every payment, velocity accumulation, and step-up challenge evaluated
            by Soroban. Grounded on-chain transparency for every transaction event.
          </p>

          {/* Summary Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5 flex flex-col">
              <span className="font-mono text-[10px] text-mist-400 uppercase font-semibold">Total Evaluated</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-mist-100 mt-0.5">$2,450.00</span>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5 flex flex-col">
              <span className="font-mono text-[10px] text-mist-400 uppercase font-semibold">Instant Clear Rate</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-clear mt-0.5">92%</span>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5 flex flex-col">
              <span className="font-mono text-[10px] text-mist-400 uppercase font-semibold">Step-Ups Enforced</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-gate mt-0.5">3 Incidents</span>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5 flex flex-col">
              <span className="font-mono text-[10px] text-mist-400 uppercase font-semibold">Blocked Drains</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-fault mt-0.5">$1,210.00</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION B: LEDGER FILTERS & SEARCH TOOLBAR
        ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address, hash, or reason…"
              className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 font-mono text-xs text-mist-100 outline-none focus:border-clear transition-colors placeholder:text-mist-400"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterVerdict('all');
                sounds.playClick();
              }}
              className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors ${
                filterVerdict === 'all'
                  ? 'bg-ink-700 text-mist-100 font-bold border border-ink-700'
                  : 'border border-ink-700 bg-ink-800 text-mist-400 hover:text-mist-100'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterVerdict('allowed');
                sounds.playClick();
              }}
              className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors ${
                filterVerdict === 'allowed'
                  ? 'bg-clear/20 text-clear font-bold border border-clear'
                  : 'border border-ink-700 bg-ink-800 text-mist-400 hover:border-clear'
              }`}
            >
              Allowed Instantly
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterVerdict('stepup');
                sounds.playClick();
              }}
              className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors ${
                filterVerdict === 'stepup'
                  ? 'bg-gate/20 text-gate font-bold border border-gate'
                  : 'border border-ink-700 bg-ink-800 text-mist-400 hover:border-gate'
              }`}
            >
              Step-Up Required
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterVerdict('blocked');
                sounds.playClick();
              }}
              className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors ${
                filterVerdict === 'blocked'
                  ? 'bg-fault/20 text-fault font-bold border border-fault'
                  : 'border border-ink-700 bg-ink-800 text-mist-400 hover:border-fault'
              }`}
            >
              Flagged Blocks
            </button>
          </div>
        </div>

        {/* =====================================================================
            SECTION C: THE HIGH-CONTRAST LEDGER TABLE
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink-700 bg-ink-900/50 text-[11px] text-mist-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Ledger &amp; Time</th>
                  <th className="py-3.5 px-4 font-semibold">Counterparty</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">On-Chain Verdict</th>
                  <th className="py-3.5 px-4 font-semibold">Invariant / Reason</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedId === tx.id;
                  return (
                    <tr key={tx.id} className="group hover:bg-ink-900/30 transition-colors">
                      {/* Column 1: Ledger & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-mist-100">{tx.ledgerSeq}</span>
                          <span className="text-[10px] text-mist-400">{tx.timeAgo}</span>
                        </div>
                      </td>

                      {/* Column 2: Counterparty */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-mist-100">
                              {tx.recipient.slice(0, 4)}…{tx.recipient.slice(-4)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                tx.recipientType === 'trusted'
                                  ? 'bg-clear/15 text-clear'
                                  : tx.recipientType === 'flagged'
                                  ? 'bg-fault/15 text-fault'
                                  : 'bg-ink-700 text-mist-400'
                              }`}
                            >
                              {tx.recipientLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Amount */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="tabular-amount font-bold text-mist-100">
                          ${tx.amount}{' '}
                          <span className="text-[10px] text-mist-400 font-normal">USDC</span>
                        </span>
                      </td>

                      {/* Column 4: Verdict */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                            tx.verdict === 'allowed'
                              ? 'bg-clear/10 text-clear border-clear/30'
                              : tx.verdict === 'stepup'
                              ? 'bg-gate/10 text-gate border-gate/30'
                              : 'bg-fault/10 text-fault border-fault/30'
                          }`}
                        >
                          {tx.verdictLabel}
                        </span>
                      </td>

                      {/* Column 5: Invariant / Reason */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-mist-400 font-mono text-[11px]">
                          {tx.reason}
                        </span>
                      </td>

                      {/* Column 6: Action */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(tx.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 font-mono text-[11px] font-bold transition-all ${
                            isExpanded
                              ? 'bg-gate text-ink-900 shadow-sm'
                              : 'border border-ink-700 text-mist-400 hover:text-mist-100 hover:border-mist-400'
                          }`}
                        >
                          <span>Explain</span>
                          <span className="text-[9px]">{isExpanded ? '▲' : '▾'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-mist-400 font-mono text-sm">
                      No matching transaction events found in current ledger view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expanded DeepSeek Drawer (Shows below table for active transaction) */}
          {expandedId && (
            <div className="border-t border-ink-700 bg-ink-900 p-6 flex flex-col gap-4 font-mono text-xs animate-in slide-in-from-top-3 duration-200">
              {(() => {
                const activeTx = INITIAL_TRANSACTIONS.find((t) => t.id === expandedId);
                if (!activeTx) return null;

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-700 pb-3 gap-2">
                      <div className="flex items-center gap-2 text-gate font-bold">
                        <span>✨ DEEPSEEK V4.1 FLASH // GROUNDED ON-CHAIN ANALYSIS</span>
                        <span className="text-[10px] text-mist-400">({activeTx.ledgerSeq})</span>
                      </div>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${activeTx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-clear hover:underline text-[11px]"
                      >
                        Ledger Hash: {activeTx.txHash.slice(0, 8)}…{activeTx.txHash.slice(-8)} ↗
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card 1: Summary */}
                      <div className="flex flex-col gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-4">
                        <span className="text-[10px] text-mist-400 uppercase font-bold tracking-wider">
                          1. Plain-English Summary
                        </span>
                        <p className="text-mist-100 text-xs leading-relaxed">
                          {activeTx.explanation.summary}
                        </p>
                      </div>

                      {/* Card 2: Factors Detected */}
                      <div className="flex flex-col gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-4">
                        <span className="text-[10px] text-mist-400 uppercase font-bold tracking-wider">
                          2. Trigger Factors Detected
                        </span>
                        <ul className="list-disc pl-4 text-mist-100 text-xs space-y-1">
                          {activeTx.explanation.factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Card 3: Required Resolution */}
                      <div className="flex flex-col gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-4">
                        <span className="text-[10px] text-mist-400 uppercase font-bold tracking-wider">
                          3. Required Resolution
                        </span>
                        <ul className="list-disc pl-4 text-mist-100 text-xs space-y-1">
                          {activeTx.explanation.nextSteps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* =====================================================================
            CUSTOM ILLUSTRATION 2: THE CHAIN OF CUSTODY GLYPH
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
              TECHNICAL AUDIT VECTOR
            </span>
            <h3 className="font-display text-lg font-bold text-mist-100">
              The Chain of Custody Glyph
            </h3>
            <p className="text-xs text-mist-400 max-w-md leading-relaxed">
              Every evaluate() invocation yields a deterministic, cryptographically signed ledger block.
              Zero off-chain state can alter this execution sequence.
            </p>
          </div>

          <div className="flex-shrink-0">
            <svg width="240" height="70" viewBox="0 0 240 70" fill="none">
              {/* Linked Blockchain Nodes */}
              <line x1="35" y1="35" x2="105" y2="35" stroke="var(--ink-700)" strokeWidth="2" />
              <line x1="105" y1="35" x2="175" y2="35" stroke="var(--ink-700)" strokeWidth="2" />

              {/* Node 1 */}
              <rect x="15" y="15" width="40" height="40" rx="8" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="1.5" />
              <circle cx="35" cy="35" r="5" fill="var(--clear)" />

              {/* Node 2 */}
              <rect x="85" y="15" width="40" height="40" rx="8" fill="var(--ink-900)" stroke="var(--gate)" strokeWidth="1.5" />
              <polygon points="105,28 111,39 99,39" fill="var(--gate)" />

              {/* Node 3 */}
              <rect x="155" y="15" width="40" height="40" rx="8" fill="var(--ink-900)" stroke="var(--clear)" strokeWidth="1.5" />
              <circle cx="175" cy="35" r="5" fill="var(--clear)" />

              {/* Pulse waves */}
              <circle cx="175" cy="35" r="14" stroke="var(--clear)" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
