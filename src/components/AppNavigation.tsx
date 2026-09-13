'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sounds } from '@/lib/soundEngine';

interface AppTab {
  href: string;
  label: string;
  fullTitle: string;
  icon: string;
  badge?: string;
  badgeColor?: 'clear' | 'gate' | 'fault';
}

const APP_TABS: AppTab[] = [
  {
    href: '/app',
    label: 'Overview',
    fullTitle: 'Command Center — Vault Operational Overview',
    icon: '⚡',
  },
  {
    href: '/app/policy',
    label: 'Limits',
    fullTitle: 'Spending Limits & Velocity Policies',
    icon: '📐',
  },
  {
    href: '/app/transfer',
    label: 'Transfer',
    fullTitle: 'Send Transfer & Pre-Flight Validation',
    icon: '💸',
  },
  {
    href: '/app/recipients',
    label: 'Contacts',
    fullTitle: 'Address Book & Trusted Peers',
    icon: '👥',
  },
  {
    href: '/app/guardians',
    label: 'Guardians',
    fullTitle: 'Guardian Setup & Multi-Sig Thresholds',
    icon: '🛡️',
  },
  {
    href: '/app/recovery',
    label: 'Recovery',
    fullTitle: 'Recovery Center — 48h Emergency Unlock Room',
    icon: '🚨',
    badge: 'Rescue',
    badgeColor: 'gate',
  },
  {
    href: '/app/risk',
    label: 'Risk',
    fullTitle: 'Flagged Registry — Sanctioned & Malicious Address Blacklist',
    icon: '🛑',
    badge: 'Threats',
    badgeColor: 'fault',
  },
  {
    href: '/app/audit',
    label: 'Audit',
    fullTitle: 'Audit Trail — Real-Time Soroban RPC Ledger Events',
    icon: '📜',
    badge: 'Live',
    badgeColor: 'clear',
  },
  {
    href: '/app/settings',
    label: 'Settings',
    fullTitle: 'Account Settings — Alerts, Network & Disconnect',
    icon: '⚙️',
  },
  {
    href: '/app/onboarding',
    label: 'Wizard',
    fullTitle: 'Setup Wizard — 3-Step First-Time Vault Initialization',
    icon: '✨',
  },
];

export function AppNavigation() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Monitor scroll overflow on smaller screens
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 4;
    setCanScrollLeft(hasOverflow && el.scrollLeft > 12);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 12);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Center the active tab into view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [pathname]);

  const handleScroll = (direction: 'left' | 'right') => {
    sounds.playClick();
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 220;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <nav
      aria-label="App Sub-Navigation"
      className="sticky top-16 z-30 w-full border-b border-ink-700/80 bg-ink-900/90 backdrop-blur-md transition-colors"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Left Scroll Button on small viewports */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-1 bg-gradient-to-r from-ink-900 via-ink-900/90 to-transparent">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll navigation left"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-700 bg-ink-800/90 text-mist-300 shadow-md transition-all hover:border-clear/50 hover:bg-ink-700 hover:text-mist-100 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Tabs Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-center justify-start lg:justify-center overflow-x-auto px-4 sm:px-6 py-2.5 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            {APP_TABS.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href === '/app/transfer' && pathname === '/app/transactions/new') ||
                (tab.href === '/app' && pathname === '/app/state');

              return (
                <Link
                  key={tab.href}
                  ref={isActive ? activeTabRef : undefined}
                  href={tab.href}
                  title={tab.fullTitle}
                  onClick={() => sounds.playClick()}
                  className={`group relative flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 font-mono text-xs transition-all ${
                    isActive
                      ? 'border border-clear/50 bg-ink-800 text-mist-100 font-semibold shadow-sm shadow-clear/10'
                      : 'border border-transparent bg-transparent text-mist-400 hover:border-ink-700 hover:bg-ink-800/60 hover:text-mist-100'
                  }`}
                >
                  <span className="text-sm leading-none">{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        tab.badgeColor === 'gate'
                          ? 'bg-gate/20 text-gate border border-gate/30'
                          : tab.badgeColor === 'fault'
                          ? 'bg-fault/20 text-fault border border-fault/30'
                          : 'bg-clear/20 text-clear border border-clear/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute -bottom-2.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-clear" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Button on small viewports */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-1 bg-gradient-to-l from-ink-900 via-ink-900/90 to-transparent">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll navigation right"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-700 bg-ink-800/90 text-mist-300 shadow-md transition-all hover:border-clear/50 hover:bg-ink-700 hover:text-mist-100 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
