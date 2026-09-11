import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { CONFIG } from './config';

const NETWORK = CONFIG.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;

let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  StellarWalletsKit.init({
    network: NETWORK,
    modules: [new FreighterModule()],
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
