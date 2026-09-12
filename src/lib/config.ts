export const CONFIG = {
  network: process.env.NEXT_PUBLIC_WARDEN_NETWORK ?? 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  contractId:
    process.env.NEXT_PUBLIC_WARDEN_CONTRACT_ID ??
    'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW',
  referenceAsset:
    process.env.NEXT_PUBLIC_WARDEN_REFERENCE_ASSET ??
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  referenceAssetDecimals: 7,
  walletWasmHash:
    process.env.NEXT_PUBLIC_WARDEN_WALLET_WASM_HASH ??
    '97ce047884106b1c6c3bb40b8973cc48db1c4dad95c9e20462bf2c701daa764e',
  /**
   * The fee/sequence-paying account for every transaction a connected
   * passkey smart wallet submits. A smart wallet is a C... contract address,
   * which cannot itself be a transaction envelope source (only classic G...
   * accounts hold a sequence number) -- see warden-sdk's sourceAccount
   * parameter. This is a public address, safe to expose client-side; the
   * matching secret (WARDEN_DEPLOYER_SECRET) stays server-only.
   */
  deployerPublicKey:
    process.env.NEXT_PUBLIC_WARDEN_DEPLOYER_PUBLIC_KEY ??
    'GCZLMMKEOPOG5OB5QRLGH5ZKG7ACQNKX7KTT6UTXPFHUPS7FFSFFU5YM',
} as const;
