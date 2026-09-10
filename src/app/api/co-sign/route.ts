import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { NextResponse } from 'next/server';

/**
 * Adds the deployer's own envelope signature to a transaction whose source
 * account is the deployer (fee/sequence payer) but whose Soroban auth entry
 * belongs to a connected passkey smart wallet, already signed client-side via
 * kit.sign(). This route only signs and hands the XDR back -- submission and
 * result decoding stay client-side through warden-sdk's own submitX methods,
 * so none of that logic is duplicated here.
 */
export async function POST(request: Request) {
  const deployerSecret = process.env.WARDEN_DEPLOYER_SECRET;
  if (!deployerSecret) {
    return NextResponse.json(
      { error: 'Server is missing WARDEN_DEPLOYER_SECRET.' },
      { status: 500 },
    );
  }

  const { xdr, networkPassphrase } = (await request.json()) as {
    xdr: string;
    networkPassphrase: string;
  };

  try {
    const feeSource = Keypair.fromSecret(deployerSecret);
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    if (typeof tx === 'string' || !('sign' in tx)) {
      throw new Error('Malformed transaction XDR.');
    }
    tx.sign(feeSource);
    return NextResponse.json({ xdr: tx.toXDR() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
