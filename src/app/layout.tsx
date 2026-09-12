import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-bricolage',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-instrument',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Warden',
  description:
    'A risk-policy engine for Stellar smart wallets: friction where the risk actually is, not on every transaction.',
};

// Runs before hydration/paint so there's no flash of the wrong theme on
// load -- reads the user's explicit choice, if any, and stamps it onto
// <html> immediately. If nothing is stored, the CSS's own
// prefers-color-scheme fallback in globals.css handles it with no JS
// involved at all.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('warden-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${instrument.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
