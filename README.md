<div align="center">

# Warden — App

**Reference wallet demonstrating Warden's risk-policy decisions end to end on Stellar
Testnet, signed by a real WebAuthn passkey.**

[![CI](https://github.com/wardenoss/warden-app/actions/workflows/ci.yml/badge.svg)](https://github.com/wardenoss/warden-app/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Network](https://img.shields.io/badge/network-Stellar%20Testnet-7D00FF)](https://stellar.expert/explorer/testnet/contract/CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW)

[Warden org](https://github.com/wardenoss) · [warden-contract](https://github.com/wardenoss/warden-contract) · [warden-sdk](https://github.com/wardenoss/warden-sdk) · [warden-monitor](https://github.com/wardenoss/warden-monitor) · [Discussions](https://github.com/wardenoss/warden-app/discussions)

</div>

---


The reference application for [Warden](https://github.com/wardenoss/warden-contract) --
a risk-policy engine for Stellar smart wallets. This app proves the decision logic works
end to end on Testnet: connect a passkey-backed smart wallet, set a policy, and send a
transfer that either goes straight through or asks for one more confirmation.

## A real limitation, stated plainly

**The step-up gate is enforced by this app, not cryptographically by the wallet.** The
app asks `warden-contract`'s `evaluate()` for a decision and refuses to proceed without
confirmation when the answer is `RequireStepUp` -- but nothing yet stops a modified
client from ignoring that answer. The payment itself is still authorized by the
wallet's single ordinary passkey signature. Registering Warden as a true smart-wallet
policy signer, inside the wallet's own auth check, is the natural next step.

## The three demo scenarios

1. **Allow** -- a transfer under your no-confirmation amount, to a trusted recipient,
   within your daily limit. Goes straight through after the usual passkey confirmation.
2. **Step-up: amount or new recipient** -- a transfer over your no-confirmation amount,
   or to a recipient you haven't sent to before (if you've enabled that check). Opens a
   confirmation modal explaining why, in plain language.
3. **Step-up: velocity** -- a transfer that would push your cumulative spend for the day
   over your daily limit, even if the transfer itself is under your per-transaction
   amount. Same modal, different reason shown.

Walk all three from `/policy` (set your limits) and `/transfer` (send).

## Local setup

```bash
npm install
npm run dev
```

### Environment variables

All `NEXT_PUBLIC_*` values default to the live Testnet deployment already captured in
the project's `DEPLOYMENT-INFO.md` -- override only if pointing at a different
deployment.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WARDEN_NETWORK` | `testnet` |
| `NEXT_PUBLIC_WARDEN_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE` | Network passphrase |
| `NEXT_PUBLIC_WARDEN_CONTRACT_ID` | Deployed `warden-contract` address |
| `NEXT_PUBLIC_WARDEN_REFERENCE_ASSET` | Reference asset's SAC address |
| `NEXT_PUBLIC_WARDEN_WALLET_WASM_HASH` | passkey-kit smart-wallet wasm hash |
| `NEXT_PUBLIC_WARDEN_DEPLOYER_PUBLIC_KEY` | Public fee/sequence-paying account (see below) |
| `WARDEN_DEPLOYER_SECRET` | **Server-only.** Matching secret key. Never exposed client-side. |
| `EVOMAP_API_KEY` | **Server-only, optional.** Powers the "Explain this" feature (`/api/explain`). If unset, that route falls back to pre-written explanations instead of calling a model -- the app works correctly either way. |

### Why there's a server-side deployer key at all

A passkey smart wallet is a contract address, which can't itself pay transaction fees
or hold a sequence number -- only a classic account can. Every transaction here is
built with a funded Testnet account (`WARDEN_DEPLOYER_SECRET`) as the fee/sequence
source, while the connected smart wallet remains the address whose own signature is
actually checked by the contract. The deployer's secret never reaches the browser.

## Architecture

```
warden-app
├── src/lib/config.ts        -- environment config
├── src/lib/wardenClient.ts  -- WardenClient instance (warden-sdk)
├── src/lib/tokenClient.ts   -- SEP-41 transfer on the reference asset
├── src/lib/passkeyWallet.ts -- passkey-kit wrapper: create, connect, sign
├── src/app/api/             -- server-only signing/submission routes
└── src/components/          -- ConnectWallet, PolicyForm, TrustedRecipientsList,
                                TransferForm, StepUpConfirmModal, VelocityGauge
```

Talks to `warden-contract` **only through `warden-sdk`** -- never a raw contract call,
never a duplicated codec.

---

## Maintainers

| Name | GitHub | Contact |
|---|---|---|
| Femology | [@Femology](https://github.com/Femology) | femimi1234@gmail.com |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Found a security issue? See
[SECURITY.md](SECURITY.md) instead of opening a public issue.

<a href="https://github.com/wardenoss/warden-app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=wardenoss/warden-app" alt="Contributors" />
</a>
