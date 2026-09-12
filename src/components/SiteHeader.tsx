import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { HeaderConnectButton } from './HeaderConnectButton';

/**
 * Marketing nav links per 13-warden-design-system-v2.md §1/§5. These routes
 * don't exist yet -- this is Step 1 of the redesign (tokens + shell only),
 * and building /how-it-works, /security, /developers, /protocol is later
 * work. Linking to them now, even as a 404 until then, is deliberate: it's
 * the real target, not a placeholder href to swap out later.
 */
const NAV_LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/security', label: 'Security' },
  { href: '/developers', label: 'Developers' },
  { href: '/protocol', label: 'Protocol' },
];

/**
 * Persistent across every route (rendered from the root layout). Frosted/
 * glassmorphism chrome per the design system's own rule: that treatment is
 * scoped to header and footer only, never a content card holding real data.
 */
export function SiteHeader() {
  return (
    <header className="glass-chrome sticky top-0 z-40 border-b border-ink-700/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo/logo-mark-colorful.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-display text-lg font-semibold tracking-tight text-mist-100">
            WARDEN
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-mist-400 transition-colors hover:text-mist-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <HeaderConnectButton />
        </div>
      </div>
    </header>
  );
}
