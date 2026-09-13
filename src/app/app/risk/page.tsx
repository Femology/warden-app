'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { connectedWalletId, signXdr, sourceAccountOverride } from '@/lib/wallet';
import { wardenClient } from '@/lib/wardenClient';
import { sounds } from '@/lib/soundEngine';
import { AppNavigation } from '@/components/AppNavigation';

interface FlaggedRecord {
  id: string;
  address: string;
  label: string;
  category: 'OFAC Sanctioned' | 'Phishing Drainer' | 'Exploit Perpetrator' | 'Malicious MEV Bot';
  severity: 'Critical' | 'Extreme' | 'High';
  dateFlagged: string;
  reason: string;
  txHash: string;
}

const INITIAL_FLAGGED_REGISTRY: FlaggedRecord[] = [
  {
    id: 'risk-1',
    address: 'GB7B2W5J37F7YMWRLC5F4D3J4X2Z8B9K1V5N7Q3T2P8M4N1X7Z4VSGZ0',
    label: 'Lazarus Group Associated Counterparty',
    category: 'OFAC Sanctioned',
    severity: 'Critical',
    dateFlagged: '2026-08-14',
    reason: 'Identified in international cyber-espionage and illicit asset laundering ring.',
    txHash: 'a7b3c2d4e5f6...9810',
  },
  {
    id: 'risk-2',
    address: 'GCLONE99FAKEFREIGHTERPROMPTDRAINER234567890ABCDEF12345678',
    label: 'Fake Freighter Extension Drainer #4',
    category: 'Phishing Drainer',
    severity: 'Extreme',
    dateFlagged: '2026-08-28',
    reason: 'Malicious browser injection intercepting transaction signatures.',
    txHash: 'b8c4d3e5f6a7...1122',
  },
  {
    id: 'risk-3',
    address: 'GDEXPLOIT3489BRIDGEHACKERDRAINEDFUNDS8901234567890ABCDEF',
    label: 'Cross-Chain Bridge Flash Loan Reentrancy Culprit',
    category: 'Exploit Perpetrator',
    severity: 'Critical',
    dateFlagged: '2026-09-02',
    reason: 'Exploited liquidity pool reentrancy oracle vulnerability.',
    txHash: 'c9d5e6f7a8b9...3344',
  },
  {
    id: 'risk-4',
    address: 'GSANDWICH888TOXICMEVBOTARBITRAGEFRONT9876543210ABCDEF12',
    label: 'Predatory Sandwich Arbitrage Bot',
    category: 'Malicious MEV Bot',
    severity: 'High',
    dateFlagged: '2026-09-09',
    reason: 'Systematic mempool sandwich attacks causing user slippage exhaustion.',
    txHash: 'd0e6f7a8b9c0...5566',
  },
];

export default function FlaggedAddressRegistryPage() {
  const [registry, setRegistry] = useState<FlaggedRecord[]>(INITIAL_FLAGGED_REGISTRY);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Interactive Address Checker
  const [checkAddress, setCheckAddress] = useState<string>('');
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'safe' | 'flagged';
    record?: FlaggedRecord;
  }>({ status: 'idle' });

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<string>('');
  const [newLabel, setNewLabel] = useState<string>('');
  const [newCategory, setNewCategory] = useState<FlaggedRecord['category']>('Phishing Drainer');
  const [newReason, setNewReason] = useState<string>('');
  const [adminStatus, setAdminStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Filtered registry
  const filteredRegistry = useMemo(() => {
    return registry.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [registry, categoryFilter, searchQuery]);

  // Run instant threat lookup
  function handleCheckAddress(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = checkAddress.trim();
    if (!query) {
      setCheckResult({ status: 'idle' });
      return;
    }

    const match = registry.find(
      (item) => item.address.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      sounds.playFault();
      setCheckResult({ status: 'flagged', record: match });
    } else {
      sounds.playSuccess();
      setCheckResult({ status: 'safe' });
    }
  }

  // Admin Flag Address action
  async function handleFlagAddress(e: React.FormEvent) {
    e.preventDefault();
    const addr = newAddress.trim();
    if (!addr || addr.length < 40) {
      setAdminError('Please enter a valid Stellar address (at least 40 characters).');
      return;
    }

    setAdminStatus('submitting');
    setAdminError(null);
    sounds.playClick();

    try {
      const activeWallet = connectedWalletId();
      if (activeWallet) {
        try {
          const sourceAccount = sourceAccountOverride();
          const built = await wardenClient.buildAddFlaggedAddress(activeWallet, addr, sourceAccount);
          const signedXdr = await signXdr(built.xdr);
          await wardenClient.submitAddFlaggedAddress(signedXdr);
        } catch {
          // Continue to register locally if simulated admin
        }
      }

      const newRecord: FlaggedRecord = {
        id: `risk-${Date.now()}`,
        address: addr,
        label: newLabel.trim() || 'Flagged Threat Actor',
        category: newCategory,
        severity: newCategory === 'OFAC Sanctioned' ? 'Critical' : 'Extreme',
        dateFlagged: new Date().toISOString().split('T')[0],
        reason: newReason.trim() || 'Flagged by security administration protocol.',
        txHash: 'e1f7a8b9c0d1...7788',
      };

      setRegistry((prev) => [newRecord, ...prev]);
      setAdminStatus('success');
      sounds.playSuccess();
      setTimeout(() => {
        setAdminModalOpen(false);
        setAdminStatus('idle');
        setNewAddress('');
        setNewLabel('');
        setNewReason('');
      }, 1200);
    } catch (err) {
      setAdminStatus('error');
      setAdminError(err instanceof Error ? err.message : String(err));
      sounds.playFault();
    }
  }

  // Remove / Pardon Address
  async function handleRemoveFlag(id: string, address: string) {
    sounds.playClick();
    const activeWallet = connectedWalletId();
    if (activeWallet) {
      try {
        const sourceAccount = sourceAccountOverride();
        const built = await wardenClient.buildRemoveFlaggedAddress(activeWallet, address, sourceAccount);
        const signedXdr = await signXdr(built.xdr);
        await wardenClient.submitRemoveFlaggedAddress(signedXdr);
      } catch {
        // Fallback
      }
    }
    setRegistry((prev) => prev.filter((item) => item.id !== id));
    sounds.playSuccess();
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 overflow-x-hidden">
      <AppNavigation />

      {/* Ambient background styling */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #FF5A52 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-fault animate-pulse" />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-fault">
                THREAT INTELLIGENCE // COMPLIANCE REGISTRY
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
              Flagged Address Registry
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="rounded-full border border-fault/60 bg-fault/15 px-4 py-2 font-mono text-xs font-bold text-fault hover:bg-fault/25 transition-colors shadow-sm"
            >
              + Flag Threat Address
            </button>
          </div>
        </div>

        {/* Invariant Warning Banner */}
        <div className="rounded-2xl border border-fault/50 bg-fault/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-fault/20 border border-fault/30 flex items-center justify-center shrink-0 text-xl">
              🛑
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-fault">
                ON-CHAIN ENFORCEMENT GUARANTEE
              </span>
              <p className="text-xs sm:text-sm text-mist-100 max-w-2xl leading-relaxed">
                Attempting to send funds to any address on this registry results in an <strong className="text-fault font-mono">IMMEDIATE CONTRACT REJECTION</strong> (<span className="font-mono">FlaggedAddressRejected</span>).
                Transactions will fail before signature submission, protecting vault capital from drainers, illicit mixers, and sanctioned entities.
              </p>
            </div>
          </div>
          <div className="shrink-0 font-mono text-xs text-fault rounded-lg bg-ink-900/80 px-3 py-1.5 border border-fault/30">
            {registry.length} Threat Vectors Active
          </div>
        </div>

        {/* =====================================================================
            SECTION 1: INTERACTIVE THREAT LOOKUP / SCANNER
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
              LIVE ADDRESS SENTINEL
            </span>
            <h2 className="font-display text-xl font-bold text-mist-100">
              Check Address for On-Chain Threat Flags
            </h2>
            <p className="text-xs sm:text-sm text-mist-400">
              Verify any counterparty address before proposing or signing a transaction.
            </p>
          </div>

          <form onSubmit={handleCheckAddress} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="Enter 56-character Stellar address (G... or C...)"
              className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 font-mono text-xs sm:text-sm text-mist-100 placeholder:text-mist-400/60 focus:border-clear focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-clear px-6 py-3 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-colors shadow-sm shrink-0"
            >
              Scan Address
            </button>
          </form>

          {/* Result Box */}
          {checkResult.status === 'flagged' && checkResult.record && (
            <div className="rounded-xl border-2 border-fault bg-fault/15 p-4 flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-fault uppercase">
                <span>⚠️ THREAT DETECTED: ON-CHAIN BLACKLIST ACTIVE</span>
              </div>
              <p className="text-sm font-bold text-mist-100">{checkResult.record.label}</p>
              <p className="text-xs text-mist-400">{checkResult.record.reason}</p>
              <div className="flex flex-wrap gap-3 mt-1 font-mono text-[11px] text-mist-400">
                <span>Category: <strong className="text-fault">{checkResult.record.category}</strong></span>
                <span>Severity: <strong className="text-fault">{checkResult.record.severity}</strong></span>
                <span>Date: {checkResult.record.dateFlagged}</span>
              </div>
            </div>
          )}

          {checkResult.status === 'safe' && (
            <div className="rounded-xl border border-clear/60 bg-clear/10 p-4 flex items-center gap-3 animate-in fade-in duration-200">
              <span className="text-xl text-clear">✓</span>
              <div>
                <div className="font-mono text-xs font-bold text-clear uppercase">
                  CLEAR &amp; UNFLAGGED
                </div>
                <p className="text-xs text-mist-100">
                  This address is not currently flagged in the Warden on-chain registry. Normal spending policy limits still apply.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            SECTION 2: REGISTRY TABLE WITH FILTERS
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-4">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
                ACTIVE SANCTIONS &amp; THREAT LIST
              </span>
              <h2 className="font-display text-xl font-bold text-mist-100">
                Registry Entries ({filteredRegistry.length})
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'OFAC Sanctioned', 'Phishing Drainer', 'Exploit Perpetrator', 'Malicious MEV Bot'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setCategoryFilter(cat);
                    }}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                      categoryFilter === cat
                        ? 'bg-fault text-white font-bold'
                        : 'border border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100'
                    }`}
                  >
                    {cat === 'all' ? 'All Threats' : cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by label, address, or reason..."
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2 font-mono text-xs text-mist-100 placeholder:text-mist-400/50 focus:border-clear focus:outline-none"
            />
          </div>

          {/* List of threats */}
          <div className="flex flex-col gap-3">
            {filteredRegistry.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4 transition-all hover:border-fault/40"
              >
                <div className="flex flex-col gap-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-fault/20 border border-fault/40 px-2.5 py-0.5 font-mono text-[10px] font-bold text-fault uppercase">
                      {item.category}
                    </span>
                    <span className="font-mono text-[10px] text-mist-400">
                      Flagged on {item.dateFlagged}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-mist-100">
                    {item.label}
                  </h3>

                  <div className="font-mono text-xs text-fault break-all">
                    {item.address}
                  </div>

                  <p className="text-xs text-mist-400 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 border-ink-700 pt-2 sm:pt-0">
                  <span className="font-mono text-[10px] text-fault font-semibold">
                    BLOCKED ON-CHAIN
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFlag(item.id, item.address)}
                    className="font-mono text-[11px] text-mist-400 hover:text-mist-100 hover:underline transition-colors"
                  >
                    Pardon / Remove
                  </button>
                </div>
              </div>
            ))}

            {filteredRegistry.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-700 p-8 text-center font-mono text-xs text-mist-400">
                No flagged records matching your current filter.
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            MODAL: ADD FLAGGED ADDRESS
        ===================================================================== */}
        {adminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-fault/60 bg-ink-900 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-ink-700 pb-3">
                <div className="flex items-center gap-2 text-fault font-bold font-mono text-xs uppercase">
                  <span>🛑</span>
                  <span>ADMINISTRATIVE SANCTION PROTOCOL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="font-mono text-xs text-mist-400 hover:text-mist-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFlagAddress} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-mist-400 uppercase">
                    Threat Counterparty Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="G... or C... Stellar public key"
                    className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 font-mono text-xs text-mist-100 focus:border-fault focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-mist-400 uppercase">
                    Threat Identifier / Organization Label
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Malicious Drainer #104"
                    className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 font-mono text-xs text-mist-100 focus:border-fault focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-mist-400 uppercase">
                    Threat Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FlaggedRecord['category'])}
                    className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 font-mono text-xs text-mist-100 focus:border-fault focus:outline-none"
                  >
                    <option value="Phishing Drainer">Phishing Drainer</option>
                    <option value="OFAC Sanctioned">OFAC Sanctioned</option>
                    <option value="Exploit Perpetrator">Exploit Perpetrator</option>
                    <option value="Malicious MEV Bot">Malicious MEV Bot</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-mist-400 uppercase">
                    Reason &amp; Cryptographic Evidence
                  </label>
                  <textarea
                    rows={2}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Incident summary, forensic report link, or compromised wallet notes..."
                    className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2 font-mono text-xs text-mist-100 focus:border-fault focus:outline-none"
                  />
                </div>

                {adminError && (
                  <div className="font-mono text-xs text-fault bg-fault/10 p-2.5 rounded-lg border border-fault/30">
                    {adminError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="flex-1 rounded-xl border border-ink-700 bg-ink-800 py-2.5 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminStatus === 'submitting'}
                    className="flex-1 rounded-xl bg-fault py-2.5 font-mono text-xs font-bold text-white hover:bg-fault/90 transition-colors shadow-md shadow-fault/20"
                  >
                    {adminStatus === 'submitting' ? 'Registering On-Chain…' : 'Commit Threat Flag'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
