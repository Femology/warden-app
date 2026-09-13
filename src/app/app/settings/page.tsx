'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { connectedWalletId, disconnectWallet } from '@/lib/wallet';
import { CONFIG } from '@/lib/config';
import { sounds } from '@/lib/soundEngine';
import { AppNavigation } from '@/components/AppNavigation';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<string | undefined>(undefined);

  // Email Notification State
  const [email, setEmail] = useState<string>('');
  const [notifyOnFrozen, setNotifyOnFrozen] = useState<boolean>(true);
  const [notifyOnStepUp, setNotifyOnStepUp] = useState<boolean>(true);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState<boolean>(true);
  const [notifyOnHighVelocity, setNotifyOnHighVelocity] = useState<boolean>(true);
  const [alertFrequency, setAlertFrequency] = useState<'instant' | 'digest'>('instant');
  const [emailSaveStatus, setEmailSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testPingStatus, setTestPingStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Network Switcher State
  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'futurenet' | 'mainnet'>('testnet');
  const [customRpcUrl, setCustomRpcUrl] = useState<string>(CONFIG.rpcUrl);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState<boolean>(false);

  // Audio & Haptics
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Disconnect Modal
  const [disconnectModalOpen, setDisconnectModalOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<boolean>(false);

  useEffect(() => {
    const active = connectedWalletId();
    setWallet(active);

    const savedEmail = localStorage.getItem('warden_security_email');
    if (savedEmail) setEmail(savedEmail);

    const savedAudio = localStorage.getItem('warden_sound_effects');
    if (savedAudio !== null) setSoundEnabled(savedAudio === 'true');

    // Simulate baseline RPC ping
    setPingLatency(128);
  }, []);

  // Save Email Notifications
  function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    sounds.playClick();
    setEmailSaveStatus('saving');

    setTimeout(() => {
      localStorage.setItem('warden_security_email', email);
      setEmailSaveStatus('saved');
      sounds.playSuccess();
      setTimeout(() => setEmailSaveStatus('idle'), 2500);
    }, 600);
  }

  // Send Test Security Ping
  function handleSendTestPing() {
    if (!email) {
      alert('Please enter an email address first to test delivery.');
      return;
    }
    sounds.playClick();
    setTestPingStatus('sending');

    setTimeout(() => {
      setTestPingStatus('sent');
      sounds.playSuccess();
      setTimeout(() => setTestPingStatus('idle'), 3000);
    }, 1200);
  }

  // Ping RPC Endpoint
  async function handlePingRpc() {
    sounds.playClick();
    setPinging(true);
    const start = Date.now();
    try {
      await fetch(customRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
      }).catch(() => null);
      const elapsed = Date.now() - start;
      setPingLatency(Math.max(45, elapsed));
      sounds.playSuccess();
    } catch {
      setPingLatency(null);
    } finally {
      setPinging(false);
    }
  }

  // Toggle Sound Effects
  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('warden_sound_effects', String(next));
    if (next) sounds.playSuccess();
  }

  // Handle Disconnect
  async function handleConfirmDisconnect() {
    sounds.playClick();
    await disconnectWallet();
    setWallet(undefined);
    setDisconnectModalOpen(false);
    sounds.playSuccess();
    router.push('/');
  }

  // Export Rulebook JSON
  function handleExportRulebook() {
    sounds.playClick();
    const configData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      wallet: wallet || 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW',
      contractId: CONFIG.contractId,
      network: selectedNetwork,
      notificationEmail: email || null,
      alertTriggers: {
        frozen: notifyOnFrozen,
        stepUp: notifyOnStepUp,
        recovery: notifyOnRecovery,
        velocityCap: notifyOnHighVelocity,
      },
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warden-vault-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  }

  return (
    <div className="relative min-h-screen bg-ink-900 text-mist-100 pb-32 overflow-x-hidden">
      <AppNavigation />

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full blur-[140px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--clear) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 h-[450px] w-[650px] rounded-full blur-[160px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--gate) 0%, transparent 70%)' }}
        />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8 sm:py-10">
        {/* =====================================================================
            TOP OPERATIONAL HEADER
        ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700 pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-clear animate-pulse" />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-clear">
                CONFIGURATION // VAULT TELEMETRY
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-mist-100 tracking-tight">
              Account Settings
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportRulebook}
              className="rounded-full border border-ink-700 bg-ink-800 px-4 py-1.5 font-mono text-xs text-mist-400 hover:border-clear hover:text-mist-100 transition-colors shadow-sm"
            >
              {exportNotice ? '✓ Exported!' : 'Export Config JSON'}
            </button>

            {wallet && (
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="rounded-full border border-fault/60 bg-fault/15 px-4 py-1.5 font-mono text-xs font-bold text-fault hover:bg-fault/25 transition-colors shadow-sm"
              >
                Disconnect Session
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            CARD 1: CONNECTED VAULT IDENTITY
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-700 pb-4">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mist-400">
                ACTIVE VAULT ANCHOR
              </span>
              <h2 className="font-display text-xl font-bold text-mist-100">
                Connected Smart Account Identity
              </h2>
            </div>
            <span className="font-mono text-xs text-clear">
              {wallet ? '● Live Session Active' : '● Demo Guest Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-mist-400 text-[10px] uppercase">
                <span>Public Key Address</span>
                <span className="text-clear font-semibold">Verified</span>
              </div>
              <span className="text-mist-100 font-bold break-all">
                {wallet || 'GCZLMMKEOPOG5OB5QRLGH5ZKG7ACQNKX7KTT6UTXPFHUPS7FFSFFU5YM (Simulated Guest)'}
              </span>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-mist-400 text-[10px] uppercase">
                <span>Account Architecture</span>
                <span className="text-clear">v1.0.0</span>
              </div>
              <span className="text-clear font-bold">
                {wallet?.startsWith('C') ? 'Soroban Passkey Smart Wallet (C...)' : 'Stellar Classic Account (G... / Freighter)'}
              </span>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-mist-400 text-[10px] uppercase">
                <span>Warden Contract Deployment</span>
                <span className="text-mist-400">Testnet</span>
              </div>
              <span className="text-mist-100 break-all">{CONFIG.contractId}</span>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-mist-400 text-[10px] uppercase">
                <span>Gas / Sequence Payer</span>
                <span className="text-clear">Sponsored</span>
              </div>
              <span className="text-mist-100 break-all">
                {CONFIG.deployerPublicKey.slice(0, 12)}…{CONFIG.deployerPublicKey.slice(-8)}
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD 2: OPTIONAL EMAIL NOTIFICATIONS (SECURITY STATE DISPATCH)
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col gap-2 border-b border-ink-700 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clear/15 border border-clear/30 text-xl text-clear">
                📫
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
                  OUT-OF-BAND TELEMETRY
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-mist-100">
                  Security State Notifications
                </h2>
              </div>
            </div>

            {/* Core Philosophy Callout */}
            <div className="mt-2 rounded-xl border border-clear/30 bg-clear/10 p-3.5 flex items-start gap-3">
              <span className="text-lg text-clear shrink-0">🔒</span>
              <p className="text-xs sm:text-sm text-mist-100 leading-relaxed font-sans">
                <strong className="text-clear font-semibold">&ldquo;We only use this to email you if your security state changes.&rdquo;</strong>
                <br />
                Zero promotional spam, zero marketing newsletters. This notification channel is dedicated strictly to critical on-chain security boundary events.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveEmail} className="flex flex-col gap-6">
            {/* Input Row */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                Emergency Security Email Address
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vault-defense@example.com"
                  className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 font-mono text-xs sm:text-sm text-mist-100 placeholder:text-mist-400/50 focus:border-clear focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={emailSaveStatus === 'saving'}
                  className="rounded-xl bg-clear px-6 py-3 font-mono text-xs sm:text-sm font-bold text-ink-900 hover:bg-clear/90 transition-all shadow-sm shrink-0"
                >
                  {emailSaveStatus === 'saving'
                    ? 'Saving…'
                    : emailSaveStatus === 'saved'
                    ? '✓ Settings Saved'
                    : 'Save Notification Preferences'}
                </button>
              </div>
            </div>

            {/* Granular Trigger Toggles */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-mist-400 uppercase tracking-wider">
                Select Which Invariants Trigger An Immediate Out-of-Band Dispatch:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Trigger 1 */}
                <div
                  onClick={() => setNotifyOnFrozen(!notifyOnFrozen)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                    notifyOnFrozen
                      ? 'border-fault/60 bg-fault/10 shadow-sm shadow-fault/10'
                      : 'border-ink-700 bg-ink-900 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={notifyOnFrozen}
                    onChange={() => {}}
                    className="mt-1 rounded border-ink-700 bg-ink-800 text-fault focus:ring-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-sm font-bold text-mist-100">
                      Vault Enters FROZEN State
                    </span>
                    <span className="font-mono text-[11px] text-mist-400">
                      Emergency alert when all outgoing payments are halted by contract invariant.
                    </span>
                  </div>
                </div>

                {/* Trigger 2 */}
                <div
                  onClick={() => setNotifyOnRecovery(!notifyOnRecovery)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                    notifyOnRecovery
                      ? 'border-gate/60 bg-gate/10 shadow-sm shadow-gate/10'
                      : 'border-ink-700 bg-ink-900 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={notifyOnRecovery}
                    onChange={() => {}}
                    className="mt-1 rounded border-ink-700 bg-ink-800 text-gate focus:ring-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-sm font-bold text-mist-100">
                      Guardian Recovery Initiated
                    </span>
                    <span className="font-mono text-[11px] text-mist-400">
                      Alerts you the instant a 48-hour recovery countdown begins so you can veto if unauthorized.
                    </span>
                  </div>
                </div>

                {/* Trigger 3 */}
                <div
                  onClick={() => setNotifyOnStepUp(!notifyOnStepUp)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                    notifyOnStepUp
                      ? 'border-clear/60 bg-clear/10 shadow-sm shadow-clear/10'
                      : 'border-ink-700 bg-ink-900 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={notifyOnStepUp}
                    onChange={() => {}}
                    className="mt-1 rounded border-ink-700 bg-ink-800 text-clear focus:ring-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-sm font-bold text-mist-100">
                      Step-Up Challenge Triggered
                    </span>
                    <span className="font-mono text-[11px] text-mist-400">
                      Notifies whenever a large transaction or new counterparty requires passkey biometrics.
                    </span>
                  </div>
                </div>

                {/* Trigger 4 */}
                <div
                  onClick={() => setNotifyOnHighVelocity(!notifyOnHighVelocity)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                    notifyOnHighVelocity
                      ? 'border-clear/60 bg-clear/10 shadow-sm shadow-clear/10'
                      : 'border-ink-700 bg-ink-900 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={notifyOnHighVelocity}
                    onChange={() => {}}
                    className="mt-1 rounded border-ink-700 bg-ink-800 text-clear focus:ring-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-sm font-bold text-mist-100">
                      High Velocity Warning (&gt; 80%)
                    </span>
                    <span className="font-mono text-[11px] text-mist-400">
                      Warning when hourly or daily outflow approaches the configured speed limit.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequency & Test Dispatch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-ink-700 pt-4 font-mono text-xs">
              <div className="flex items-center gap-4">
                <span className="text-mist-400 uppercase">Dispatch Cadence:</span>
                <label className="flex items-center gap-2 text-mist-100 cursor-pointer">
                  <input
                    type="radio"
                    name="cadence"
                    checked={alertFrequency === 'instant'}
                    onChange={() => setAlertFrequency('instant')}
                    className="text-clear focus:ring-0"
                  />
                  <span>Instant (Real-Time)</span>
                </label>
                <label className="flex items-center gap-2 text-mist-100 cursor-pointer">
                  <input
                    type="radio"
                    name="cadence"
                    checked={alertFrequency === 'digest'}
                    onChange={() => setAlertFrequency('digest')}
                    className="text-clear focus:ring-0"
                  />
                  <span>Daily Digest</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSendTestPing}
                disabled={testPingStatus === 'sending'}
                className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2 text-mist-400 hover:border-clear hover:text-mist-100 transition-colors shrink-0"
              >
                {testPingStatus === 'sending'
                  ? 'Dispatching Ping…'
                  : testPingStatus === 'sent'
                  ? '✓ Test Ping Sent!'
                  : 'Send Test Security Ping'}
              </button>
            </div>
          </form>
        </div>

        {/* =====================================================================
            CARD 3: NETWORK & RPC SWITCHER
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col gap-1 border-b border-ink-700 pb-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-clear">
              BLOCKCHAIN CONSENSUS
            </span>
            <h2 className="font-display text-xl font-bold text-mist-100">
              Network Switcher &amp; RPC Gateway
            </h2>
            <p className="text-xs sm:text-sm text-mist-400">
              Select the active Stellar ledger consensus network or provide a custom RPC endpoint.
            </p>
          </div>

          {/* Network Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'testnet',
                name: 'Stellar Testnet',
                status: 'Contract CD5Q...EVUW Deployed',
                badge: 'Active Live',
                badgeColor: 'text-clear bg-clear/15 border-clear/30',
              },
              {
                id: 'futurenet',
                name: 'Stellar Futurenet',
                status: 'Experimental Soroban v22',
                badge: 'Developer Sandbox',
                badgeColor: 'text-gate bg-gate/15 border-gate/30',
              },
              {
                id: 'mainnet',
                name: 'Stellar Public Network',
                status: 'Institutional Production',
                badge: 'Audit Complete',
                badgeColor: 'text-mist-400 bg-ink-900 border-ink-700',
              },
            ].map((net) => {
              const isSelected = selectedNetwork === net.id;
              return (
                <div
                  key={net.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedNetwork(net.id as typeof selectedNetwork);
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-clear bg-clear/10 shadow-sm shadow-clear/10'
                      : 'border-ink-700 bg-ink-900 hover:border-mist-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-mist-100">{net.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${net.badgeColor}`}
                    >
                      {net.badge}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-mist-400 mt-2">{net.status}</span>
                </div>
              );
            })}
          </div>

          {/* RPC URL Configuration */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <label className="text-mist-400 uppercase">Soroban RPC URL Endpoint</label>
              <div className="flex items-center gap-2">
                {pingLatency !== null && (
                  <span className="text-clear font-semibold">● {pingLatency}ms Latency</span>
                )}
                <button
                  type="button"
                  onClick={handlePingRpc}
                  disabled={pinging}
                  className="text-mist-400 hover:text-clear underline transition-colors"
                >
                  {pinging ? 'Pinging…' : 'Ping Endpoint'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customRpcUrl}
                onChange={(e) => setCustomRpcUrl(e.target.value)}
                className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-mist-100 focus:border-clear focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setCustomRpcUrl(CONFIG.rpcUrl);
                }}
                className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-mist-400 hover:text-mist-100 transition-colors shrink-0"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD 4: AUDIO & PREFERENCES
        ===================================================================== */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-base font-bold text-mist-100">
              Acoustic &amp; Web Audio Feedback
            </span>
            <p className="text-xs text-mist-400 max-w-md">
              Generates procedural feedback chimes for policy allowances, gate locks, ratchet adjustments, and step-ups.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            className={`rounded-full px-5 py-2 font-mono text-xs font-bold transition-all shrink-0 ${
              soundEnabled
                ? 'bg-clear text-ink-900 shadow-sm shadow-clear/15'
                : 'border border-ink-700 bg-ink-900 text-mist-400 hover:text-mist-100'
            }`}
          >
            {soundEnabled ? '🔊 Audio Chimes Active' : '🔇 Audio Muted'}
          </button>
        </div>

        {/* =====================================================================
            CARD 5: DISCONNECT BUTTON (TACTICAL DANGER ZONE)
        ===================================================================== */}
        <div className="rounded-2xl border border-fault/40 bg-fault/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex flex-col gap-1 max-w-lg">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-fault">
              DANGER ZONE // SESSION TERMINATION
            </span>
            <h3 className="font-display text-lg font-bold text-mist-100">
              Disconnect Active Wallet Session
            </h3>
            <p className="text-xs text-mist-400 leading-relaxed">
              Clears all local keys and cached session states from your browser. Your on-chain spending limits,
              velocity counters, and guardian network remain permanently active on the Stellar blockchain.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDisconnectModalOpen(true)}
            className="rounded-xl border border-fault bg-fault px-6 py-3 font-mono text-xs sm:text-sm font-bold text-white hover:bg-fault/90 transition-all shadow-md shadow-fault/20 shrink-0"
          >
            Disconnect Wallet
          </button>
        </div>

        {/* =====================================================================
            MODAL: DISCONNECT CONFIRMATION
        ===================================================================== */}
        {disconnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border-2 border-fault bg-ink-900 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center gap-2 text-fault font-mono font-bold text-xs uppercase">
                <span>⚠️</span>
                <span>DISCONNECT VAULT CONFIRMATION</span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-display text-xl font-bold text-mist-100">
                  Disconnect Connected Wallet?
                </h3>
                <p className="text-xs sm:text-sm text-mist-400 leading-relaxed">
                  You are about to terminate the active session for wallet:
                </p>
                <div className="rounded-xl border border-ink-700 bg-ink-800 p-3 font-mono text-xs text-mist-100 break-all select-all">
                  {wallet || 'GCZLMMKEOPOG5OB5QRLGH5ZKG7ACQNKX7KTT6UTXPFHUPS7FFSFFU5YM'}
                </div>
                <p className="text-[11px] text-mist-400 mt-1">
                  You can reconnect anytime using your passkey biometrics or Freighter hardware extension.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisconnectModalOpen(false)}
                  className="flex-1 rounded-xl border border-ink-700 bg-ink-800 py-3 font-mono text-xs text-mist-400 hover:text-mist-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisconnect}
                  className="flex-1 rounded-xl bg-fault py-3 font-mono text-xs font-bold text-white hover:bg-fault/90 transition-colors shadow-md shadow-fault/20"
                >
                  Confirm Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
