import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
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
  title: 'Warden — Smart Account Security Operating System',
  description:
    'An on-chain spending governor on Stellar Soroban that lets honest daily purchases glide through in seconds, while halting abnormal account drains before funds ever leave your vault.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/logo/warden-shield-3d.png',
  },
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
      <body className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
