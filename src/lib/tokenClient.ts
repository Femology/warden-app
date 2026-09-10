import { AssembledTransaction, Client as ContractClient, type Spec } from '@stellar/stellar-sdk/contract';
import { CONFIG } from './config';

/**
 * Minimal SEP-41 surface this app needs. Verified against the actually
 * deployed reference asset (native XLM's SAC) via
 * `stellar contract info interface` -- transfer's exact signature is
 * (from: Address, to: MuxedAddress, amount: i128), not assumed from the
 * generic SEP-41 spec text.
 */
interface TokenContractMethods {
  transfer: (
    args: { from: string; to: string; amount: bigint },
    options?: { publicKey?: string },
  ) => Promise<AssembledTransaction<null>>;
}

let tokenClientPromise: Promise<ContractClient & TokenContractMethods> | undefined;

async function getTokenClient(): Promise<ContractClient & TokenContractMethods> {
  if (!tokenClientPromise) {
    tokenClientPromise = ContractClient.from<TokenContractMethods>({
      contractId: CONFIG.referenceAsset,
      rpcUrl: CONFIG.rpcUrl,
      networkPassphrase: CONFIG.networkPassphrase,
    });
  }
  return tokenClientPromise;
}

let tokenSpecPromise: Promise<Spec> | undefined;

async function getTokenSpec(): Promise<Spec> {
  if (!tokenSpecPromise) {
    tokenSpecPromise = getTokenClient().then((client) => client.spec);
  }
  return tokenSpecPromise;
}

/** Same fixed-point approach as warden-sdk's codec -- no float ever touches a monetary amount. */
function decimalToI128(amount: string, decimals: number): bigint {
  const [wholePart, fractionalPart = ''] = amount.trim().split('.');
  if (fractionalPart.length > decimals) {
    throw new Error(`Amount "${amount}" has more fractional digits than ${decimals} decimals.`);
  }
  return BigInt(`${wholePart}${fractionalPart.padEnd(decimals, '0')}`);
}

export async function buildTransfer(
  from: string,
  to: string,
  amount: string,
): Promise<{ xdr: string }> {
  const client = await getTokenClient();
  const assembled = await client.transfer(
    { from, to, amount: decimalToI128(amount, CONFIG.referenceAssetDecimals) },
    { publicKey: CONFIG.deployerPublicKey },
  );
  return { xdr: assembled.toXdr() };
}

export async function tokenAssembledFromXdr(xdr: string): Promise<AssembledTransaction<null>> {
  const spec = await getTokenSpec();
  return AssembledTransaction.fromXdr<null>(
    {
      contractId: CONFIG.referenceAsset,
      networkPassphrase: CONFIG.networkPassphrase,
      rpcUrl: CONFIG.rpcUrl,
    },
    xdr,
    spec,
  );
}

/**
 * Submits an already fully-signed (passkey + deployer envelope) transfer
 * transaction, returning its hash for the confirmation link.
 */
export async function submitTransfer(fullySignedXdr: string): Promise<string> {
  const assembled = await tokenAssembledFromXdr(fullySignedXdr);
  const sent = await assembled.send();
  const hash = sent.sendTransactionResponse?.hash;
  if (!hash) {
    throw new Error('Transfer submitted, but no transaction hash was returned.');
  }
  return hash;
}
