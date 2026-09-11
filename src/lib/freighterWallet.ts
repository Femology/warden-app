import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { CONFIG } from './config';

const NETWORK = CONFIG.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;

let initialized = false;

// Matches Warden's design system (master PRD section 6) -- the kit's own
// default themes are a generic light/dark, not this product's ink/edge
// palette. Every key here is required by the kit's own SwkAppTheme type.
const WARDEN_KIT_THEME = {
  background: '#18213A',
  'background-secondary': '#101728',
  'foreground-strong': '#E9EDF7',
  foreground: '#E9EDF7',
  'foreground-secondary': '#94A2C4',
  primary: '#6C5CE7',
  'primary-foreground': '#FFFFFF',
  transparent: 'transparent',
  lighter: '#232F4F',
  light: '#232F4F',
  'light-gray': '#232F4F',
  gray: '#94A2C4',
  danger: '#FF5A52',
  border: '#232F4F',
  shadow: 'rgba(0, 0, 0, 0.4)',
  'border-radius': '8px',
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

/**
 * Opens the kit's wallet picker (Freighter, and anything else in `modules`
 * above) and returns the connected classic G... address. Unlike a passkey
 * smart wallet, this address IS a real funded account -- it can pay its own
 * transaction fees directly, no server-side co-signer needed.
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

/** Signs a bare XDR string directly -- no AssembledTransaction reconstruction
 * needed, unlike the passkey path, since the kit works with a plain XDR and
 * whichever wallet module is currently selected. */
export async function signWithFreighter(xdr: string): Promise<string> {
  ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: CONFIG.networkPassphrase,
  });
  return signedTxXdr;
}
