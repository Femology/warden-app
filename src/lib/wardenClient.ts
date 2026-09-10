import { AssembledTransaction, Client as ContractClient, type Spec } from '@stellar/stellar-sdk/contract';
import { WardenClient } from 'warden-sdk';

import { CONFIG } from './config';

export const wardenClient = new WardenClient({
  contractId: CONFIG.contractId,
  rpcUrl: CONFIG.rpcUrl,
  networkPassphrase: CONFIG.networkPassphrase,
  referenceAssetDecimals: CONFIG.referenceAssetDecimals,
});

let specPromise: Promise<Spec> | undefined;

/** Fetches and caches the contract's on-chain spec, shared across helpers. */
async function getSpec(): Promise<Spec> {
  if (!specPromise) {
    specPromise = ContractClient.from({
      contractId: CONFIG.contractId,
      rpcUrl: CONFIG.rpcUrl,
      networkPassphrase: CONFIG.networkPassphrase,
    }).then((client) => client.spec);
  }
  return specPromise;
}

/**
 * Reconstructs an AssembledTransaction from unsigned XDR produced by one of
 * warden-sdk's buildX methods, for passkey-kit's kit.sign() to consume --
 * passkey-kit requires a full AssembledTransaction object, not a bare XDR
 * string (verified against its real type declarations).
 */
export async function assembledFromXdr<T = unknown>(xdr: string): Promise<AssembledTransaction<T>> {
  const spec = await getSpec();
  return AssembledTransaction.fromXdr<T>(
    {
      contractId: CONFIG.contractId,
      networkPassphrase: CONFIG.networkPassphrase,
      rpcUrl: CONFIG.rpcUrl,
    },
    xdr,
    spec,
  );
}
