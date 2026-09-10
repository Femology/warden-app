import { PasskeyKit } from 'passkey-kit';
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';

import { CONFIG } from './config';
import { assembledFromXdr } from './wardenClient';

export const kit = new PasskeyKit({
  rpcUrl: CONFIG.rpcUrl,
  networkPassphrase: CONFIG.networkPassphrase,
  walletWasmHash: CONFIG.walletWasmHash,
});

/**
 * Runs the WebAuthn passkey registration ceremony and deploys a new smart
 * wallet. The deploy transaction's source is passkey-kit's own shared
 * deployer (zero balance by design), so it needs fee sponsorship -- our
 * /api/submit-wallet-creation route fee-bumps it with our funded testnet
 * deployer key. Returns the new wallet's contract id once confirmed on-chain.
 */
export async function createWallet(appName: string, userName: string): Promise<string> {
  const created = await kit.createWallet(appName, userName);

  const submitRes = await fetch('/api/submit-wallet-creation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedTx: created.signedTx,
      rpcUrl: CONFIG.rpcUrl,
      networkPassphrase: CONFIG.networkPassphrase,
    }),
  });
  const submitJson: { success: boolean; hash?: string; error?: string } = await submitRes.json();
  if (!submitJson.success || !submitJson.hash) {
    throw new Error(submitJson.error ?? 'Wallet creation transaction failed to submit.');
  }

  await kit.confirmWalletCreation(created, submitJson.hash);
  return created.contractId;
}

/** Connects an existing smart wallet from a passkey already registered on this device/browser. */
export async function connectWallet(): Promise<string | undefined> {
  const { contractId } = await kit.connectWallet();
  return contractId;
}

export function disconnectWallet(): void {
  kit.disconnect();
}

export function connectedWalletId(): string | undefined {
  return kit.contractId;
}

async function coSign(assembled: AssembledTransaction<unknown>): Promise<string> {
  await kit.sign(assembled);

  const coSignRes = await fetch('/api/co-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      xdr: assembled.toXdr(),
      networkPassphrase: CONFIG.networkPassphrase,
    }),
  });
  const coSignJson: { xdr?: string; error?: string } = await coSignRes.json();
  if (!coSignJson.xdr) {
    throw new Error(coSignJson.error ?? 'Failed to co-sign transaction.');
  }
  return coSignJson.xdr;
}

/**
 * Signs a warden-sdk buildX() result with the connected passkey (authorizing
 * the wallet's own Soroban auth entry), then has the server add the
 * deployer's envelope signature (it is the transaction's fee/sequence
 * source -- see CONFIG.deployerPublicKey). Returns fully-signed XDR ready
 * for warden-sdk's matching submitX method.
 */
export async function signWithPasskey(unsignedXdr: string): Promise<string> {
  const assembled = await assembledFromXdr(unsignedXdr);
  return coSign(assembled);
}

/**
 * Same two-step signing as signWithPasskey, but for a transaction built
 * against a different contract (e.g. the reference asset's SEP-41
 * transfer) -- the caller supplies how to reconstruct an
 * AssembledTransaction from XDR for that specific contract's spec.
 */
export async function signWithPasskeyFor<T>(
  unsignedXdr: string,
  reconstruct: (xdr: string) => Promise<AssembledTransaction<T>>,
): Promise<string> {
  const assembled = await reconstruct(unsignedXdr);
  return coSign(assembled as AssembledTransaction<unknown>);
}
