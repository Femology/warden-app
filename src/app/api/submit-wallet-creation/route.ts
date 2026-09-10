import { Keypair, rpc, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { NextResponse } from 'next/server';

/**
 * passkey-kit's createWallet() returns a signedTx whose source account is a
 * shared, zero-balance deployer (its balance is deliberately irrelevant to
 * the SDK's own deploy flow -- see passkey-kit's own docs). Submitting it as-
 * is would fail for insufficient fee balance. A fee-bump transaction, paid by
 * our own funded testnet deployer key, is the standard Stellar mechanism for
 * sponsoring exactly this case -- no external relayer signup required.
 */
export async function POST(request: Request) {
  const deployerSecret = process.env.WARDEN_DEPLOYER_SECRET;
  if (!deployerSecret) {
    return NextResponse.json(
      { success: false, error: 'Server is missing WARDEN_DEPLOYER_SECRET.' },
      { status: 500 },
    );
  }

  const { signedTx, rpcUrl, networkPassphrase } = (await request.json()) as {
    signedTx: string;
    rpcUrl: string;
    networkPassphrase: string;
  };

  try {
    const feeSource = Keypair.fromSecret(deployerSecret);
    const server = new rpc.Server(rpcUrl);

    const parsed = TransactionBuilder.fromXDR(signedTx, networkPassphrase);
    if (!(parsed instanceof Transaction)) {
      throw new Error('Expected a Transaction, not a FeeBumpTransaction.');
    }
    const innerTx = parsed;

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      feeSource,
      '1000000',
      innerTx,
      networkPassphrase,
    );
    feeBumpTx.sign(feeSource);

    const sendResult = await server.sendTransaction(feeBumpTx);
    if (sendResult.status === 'ERROR') {
      return NextResponse.json(
        { success: false, error: `Send failed: ${JSON.stringify(sendResult.errorResult)}` },
        { status: 502 },
      );
    }

    const hash = sendResult.hash;
    let getResult = await server.getTransaction(hash);
    const deadline = Date.now() + 30_000;
    while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      getResult = await server.getTransaction(hash);
    }

    if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      return NextResponse.json(
        { success: false, error: `Transaction did not succeed: ${getResult.status}`, hash },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, hash });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
