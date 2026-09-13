import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';
import { CONFIG } from './config';
import {
  connectWallet as connectPasskeyWallet,
  createWallet as createPasskeyWallet,
  disconnectWallet as disconnectPasskeyWallet,
  connectedWalletId as connectedPasskeyWalletId,
  signWithPasskey,
  signWithPasskeyFor,
} from './passkeyWallet';
import { connectFreighter, disconnectFreighter, signWithFreighter } from './freighterWallet';

/**
 * Two connect paths, unified behind one interface so every page/component
 * only needs to know "a wallet is connected," not which kind. Freighter is
 * the primary, reliable path (a real funded classic account, no server
 * co-signer needed). Passkey is kept as a secondary option -- see its own
 * module for the two-step sign flow it still needs.
 */
export type WalletKind = 'freighter' | 'passkey';

let currentKind: WalletKind | null = null;
let currentFreighterAddress: string | undefined;

export async function connectFreighterWallet(): Promise<string> {
  const address = await connectFreighter();
  currentKind = 'freighter';
  currentFreighterAddress = address;
  return address;
}

export function connectSimulatedSandboxWallet(): string {
  const sandboxAddress = 'GCZLWARDENSANDBOX7ACCOUNTDEMO9TESTNET';
  currentKind = 'freighter';
  currentFreighterAddress = sandboxAddress;
  return sandboxAddress;
}

export async function connectExistingPasskeyWallet(): Promise<string | undefined> {
  const contractId = await connectPasskeyWallet();
  if (contractId) currentKind = 'passkey';
  return contractId;
}

export async function createNewPasskeyWallet(appName: string, userName: string): Promise<string> {
  const contractId = await createPasskeyWallet(appName, userName);
  currentKind = 'passkey';
  return contractId;
}

export function connectedWalletId(): string | undefined {
  if (currentKind === 'freighter') return currentFreighterAddress;
  return connectedPasskeyWalletId();
}

export function connectedWalletKind(): WalletKind | null {
  return currentKind;
}

export async function disconnectWallet(): Promise<void> {
  if (currentKind === 'freighter') {
    await disconnectFreighter();
  } else if (currentKind === 'passkey') {
    disconnectPasskeyWallet();
  }
  currentKind = null;
  currentFreighterAddress = undefined;
}

/**
 * The fee/sequence source to build a transaction against. A Freighter
 * account pays its own fees directly -- it IS the source, so this returns
 * undefined (warden-sdk defaults sourceAccount to wallet itself). A passkey
 * smart wallet's C... address cannot be a transaction source at all, so it
 * needs the shared deployer account instead.
 */
export function sourceAccountOverride(): string | undefined {
  return currentKind === 'passkey' ? CONFIG.deployerPublicKey : undefined;
}

/** Signs a warden-contract call. Returns fully-signed XDR ready for the matching submit* method. */
export async function signXdr(unsignedXdr: string): Promise<string> {
  if (currentKind === 'freighter') return signWithFreighter(unsignedXdr);
  return signWithPasskey(unsignedXdr);
}

/**
 * Signs a call against a different contract (e.g. the reference asset's
 * SEP-41 transfer). Freighter signs the bare XDR directly regardless of
 * which contract it targets; the passkey path still needs to know how to
 * reconstruct an AssembledTransaction for that specific contract's spec.
 */
export async function signXdrFor<T>(
  unsignedXdr: string,
  reconstructForPasskey: (xdr: string) => Promise<AssembledTransaction<T>>,
): Promise<string> {
  if (currentKind === 'freighter') return signWithFreighter(unsignedXdr);
  return signWithPasskeyFor(unsignedXdr, reconstructForPasskey);
}
