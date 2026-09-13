import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { CONFIG } from './config';

const NETWORK = CONFIG.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;

let initialized = false;

// Matches Warden's design system v2 (Zero Blue Rule):
// Raised dark moss (#16251E), forest borders (#223229), canopy green (#22C38D), coral (#FF5A52)
const WARDEN_KIT_THEME = {
  background: '#16251E',
  'background-secondary': '#0D1712',
  'foreground-strong': '#EAF2ED',
  foreground: '#EAF2ED',
  'foreground-secondary': '#93A99C',
  primary: '#22C38D',
  'primary-foreground': '#0D1712',
  transparent: 'transparent',
  lighter: '#223229',
  light: '#223229',
  'light-gray': '#223229',
  gray: '#93A99C',
  danger: '#FF5A52',
  border: '#223229',
  shadow: 'rgba(0, 0, 0, 0.6)',
  'border-radius': '12px',
  'font-family': "'Instrument Sans', ui-sans-serif, system-ui, sans-serif",
};

function ensureInit(): void {
  if (initialized) return;
  StellarWalletsKit.init({
    network: NETWORK,
    modules: [new FreighterModule()],
    theme: WARDEN_KIT_THEME,
  });
  initialized = true;
}

export function isFreighterInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { freighter?: unknown }).freighter ||
    (window as unknown as { stellar?: unknown }).stellar
  );
}

/**
 * Opens the kit's wallet picker and returns the connected classic G... address.
 * Catches user modal dismissal cleanly.
 */
export async function connectFreighter(): Promise<string> {
  ensureInit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectFreighter(): Promise<void> {
  ensureInit();
  await StellarWalletsKit.disconnect();
}

/** Signs a bare XDR string directly. */
export async function signWithFreighter(xdr: string): Promise<string> {
  ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: CONFIG.networkPassphrase,
  });
  return signedTxXdr;
}
