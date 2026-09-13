'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEngine';

export function ThreatInspector() {
  const [anomalousPercent, setAnomalousPercent] = useState<number>(15);
  const [activePreset, setActivePreset] = useState<'coffee' | 'sim-swap' | 'custom'>('coffee');

  function handleSelectPreset(preset: 'coffee' | 'sim-swap') {
    setActivePreset(preset);
    if (preset === 'coffee') {
      setAnomalousPercent(4);
      sounds.playAllowChime();
    } else {
      setAnomalousPercent(94);
      sounds.playGateLockImpact();
    }
  }

  function handleSliderChange(val: number) {
    setActivePreset('custom');
    setAnomalousPercent(val);
    sounds.playRatchetTick();
  }

  const isHighRisk = anomalousPercent >= 60;
  const isMediumRisk = anomalousPercent >= 35 && anomalousPercent < 60;

  // Spectrum threads based on slider value
  const threads = [
    {
      name: 'Recipient Age',
      value: anomalousPercent > 50 ? 'Created 8 mins ago' : '1.4 years active',
      status: anomalousPercent > 50 ? 'warning' : 'ok',
    },
    {
      name: 'Origin Network',
      value: anomalousPercent > 60 ? 'Unindexed Foreign ASN (Tor/Proxy)' : 'Residential ISP (Matched Device)',
      status: anomalousPercent > 60 ? 'critical' : 'ok',
    },
    {
      name: 'Velocity Index',
      value: `${Math.round(anomalousPercent * 1.8)}% of baseline cadence`,
      status: anomalousPercent > 70 ? 'critical' : anomalousPercent > 40 ? 'warning' : 'ok',
    },
    {
      name: 'Behavioral Cadence',
      value: anomalousPercent > 50 ? '3:15 AM (Erratic Typing Profile)' : '9:00 AM (Habitual Pattern)',
      status: anomalousPercent > 50 ? 'warning' : 'ok',
    },
    {
      name: 'Blacklist Registry',
      value: anomalousPercent > 85 ? 'Flagged in Cluster #4092' : 'Clear (No On-Chain Matches)',
      status: anomalousPercent > 85 ? 'critical' : 'ok',
    },
  ];

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/80 p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700/60 pb-5">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-edge">
            Micro-Lab: The Threat Inspector
          </span>
          <h4 className="mt-1 font-display text-xl font-bold text-mist-100">
            Off-Chain Telemetry &amp; Prism Analysis
          </h4>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSelectPreset('coffee')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activePreset === 'coffee'
                ? 'bg-clear/20 text-clear border border-clear/50'
                : 'border border-ink-700 text-mist-400 hover:text-mist-100'
            }`}
          >
            ☕ Coffee at 9:00 AM (Nominal)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('sim-swap')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activePreset === 'sim-swap'
                ? 'bg-gate/20 text-gate border border-gate/50'
                : 'border border-ink-700 text-mist-400 hover:text-mist-100'
            }`}
          >
            🚨 3:15 AM SIM-Swap Drain
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Visual Prism Simulation (5 cols) */}
        <div className="relative flex flex-col items-center justify-center rounded-xl border border-ink-700/50 bg-ink-900/80 p-6 md:col-span-5">
          {/* Chromatic Glow Filter Simulation */}
          <div
            className="relative flex h-40 w-40 items-center justify-center rounded-full transition-all duration-500"
            style={{
              background: isHighRisk
                ? 'radial-gradient(circle, rgba(242, 153, 74, 0.25) 0%, rgba(108, 92, 231, 0.2) 60%, transparent 80%)'
                : isMediumRisk
                ? 'radial-gradient(circle, rgba(108, 92, 231, 0.25) 0%, rgba(34, 195, 141, 0.15) 70%, transparent 85%)'
                : 'radial-gradient(circle, rgba(34, 195, 141, 0.3) 0%, rgba(108, 92, 231, 0.1) 60%, transparent 80%)',
              filter: `blur(${Math.max(0, anomalousPercent / 12)}px)`,
            }}
          />

          {/* Central Faceted Prism SVG */}
          <div className="absolute flex flex-col items-center">
            <svg
              className="h-28 w-28 transition-transform duration-500 hover:rotate-12"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="50,10 90,80 10,80"
                stroke={isHighRisk ? 'var(--color-gate)' : isMediumRisk ? 'var(--color-edge)' : 'var(--color-clear)'}
                strokeWidth="2.5"
                fill={isHighRisk ? 'rgba(242, 153, 74, 0.12)' : 'rgba(34, 195, 141, 0.12)'}
                strokeLinejoin="round"
              />
              <line x1="50" y1="10" x2="50" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <line x1="10" y1="80" x2="68" y2="43" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="90" y1="80" x2="32" y2="43" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <circle
                cx="50"
                cy="50"
                r={6 + anomalousPercent / 12}
                fill={isHighRisk ? 'var(--color-gate)' : 'var(--color-clear)'}
                opacity="0.85"
                className="animate-pulse"
              />
            </svg>
            <span className="mt-2 font-mono text-xs uppercase tracking-wider text-mist-400">
              Prism Dispersion: {anomalousPercent}%
            </span>
          </div>

          <div className="mt-2 text-center text-xs text-mist-400">
            {isHighRisk ? '⚠️ Severe Chromatic Aberration' : '✓ Coherent Spectrum Alignment'}
          </div>
        </div>

        {/* Live Vector Threads (7 cols) */}
        <div className="flex flex-col justify-between gap-5 md:col-span-7">
          {/* Anomalous Origin Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-mist-100">Anomalous Origin Index</span>
              <span className="tabular-amount font-mono text-mist-100">{anomalousPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={anomalousPercent}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-edge outline-none focus-visible:ring-2 focus-visible:ring-edge/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
            />
            <div className="flex justify-between text-[11px] text-mist-400">
              <span>0% (Known Device)</span>
              <span>50% (New Location)</span>
              <span>100% (Foreign Proxy/Night)</span>
            </div>
          </div>

          {/* 5 Spectrum Threads */}
          <div className="space-y-2 rounded-xl border border-ink-700/60 bg-ink-900/60 p-3.5 text-xs">
            {threads.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-ink-700/40 pb-1.5 last:border-0 last:pb-0">
                <span className="text-mist-400">{t.name}:</span>
                <span
                  className={`font-mono ${
                    t.status === 'critical'
                      ? 'text-fault font-semibold'
                      : t.status === 'warning'
                      ? 'text-gate font-medium'
                      : 'text-clear'
                  }`}
                >
                  {t.value}
                </span>
              </div>
            ))}
          </div>

          {/* Telemetry Output Box */}
          <div className="flex items-center justify-between rounded-xl border border-edge/40 bg-edge/10 px-4 py-2.5 text-xs">
            <div>
              <span className="font-semibold text-mist-100">Detective Calculated Score: </span>
              <span
                className={`font-mono text-sm font-bold ${
                  isHighRisk ? 'text-gate' : 'text-clear'
                }`}
              >
                {anomalousPercent} / 100
              </span>
            </div>
            <span className="font-mono text-[11px] text-mist-400">
              Authority: Advisory Only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
