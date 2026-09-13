'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sounds } from '@/lib/soundEngine';

interface AppTab {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  badge?: string;
  badgeColor?: 'clear' | 'gate' | 'fault';
}

const APP_TABS: AppTab[] = [
  {
    href: '/app',
    label: 'Command Center',
    shortLabel: 'Overview',
    icon: '⚡',
  },
  {
    href: '/app/policy',
    label: 'Spending Limits',
    shortLabel: 'Limits',
    icon: '📐',
  },
  {
    href: '/app/transfer',
    label: 'Send Transfer',
    shortLabel: 'Transfer',
    icon: '💸',
  },
  {
    href: '/app/recipients',
    label: 'Address Book',
    shortLabel: 'Contacts',
    icon: '👥',
  },
  {
    href: '/app/guardians',
    label: 'Guardian Setup',
    shortLabel: 'Guardians',
    icon: '🛡️',
  },
  {
    href: '/app/recovery',
    label: 'Recovery Center',
    shortLabel: 'Recovery',
    icon: '🚨',
    badge: 'Rescue',
    badgeColor: 'gate',
  },
  {
    href: '/app/risk',
    label: 'Flagged Registry',
    shortLabel: 'Risk',
    icon: '🛑',
    badge: 'Threats',
    badgeColor: 'fault',
  },
  {
    href: '/app/audit',
    label: 'Audit Trail',
    shortLabel: 'Audit',
    icon: '📜',
    badge: 'Live',
    badgeColor: 'clear',
  },
  {
    href: '/app/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: '⚙️',
  },
  {
    href: '/app/onboarding',
    label: 'Setup Wizard',
    shortLabel: 'Wizard',
    icon: '✨',
  },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App Sub-Navigation"
      className="sticky top-16 z-30 w-full border-b border-ink-700/80 bg-ink-900/90 backdrop-blur-md"
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-start overflow-x-auto px-4 sm:px-6 py-2.5 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {APP_TABS.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href === '/app/transfer' && pathname === '/app/transactions/new') ||
              (tab.href === '/app' && pathname === '/app/state');

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => sounds.playClick()}
                className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 font-mono text-xs transition-all ${
                  isActive
                    ? 'border border-clear/50 bg-ink-800 text-mist-100 font-semibold shadow-sm shadow-clear/10'
                    : 'border border-transparent bg-transparent text-mist-400 hover:border-ink-700 hover:bg-ink-800/60 hover:text-mist-100'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="inline lg:hidden">{tab.shortLabel}</span>

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
    </nav>
  );
}
