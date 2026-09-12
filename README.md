<div align="center">

# Warden — App

**Reference wallet demonstrating Warden's risk-policy decisions end to end on Stellar
Testnet, signed by a real WebAuthn passkey.**

[![CI](https://github.com/Femology/warden-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Femology/warden-app/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Network](https://img.shields.io/badge/network-Stellar%20Testnet-7D00FF)](https://stellar.expert/explorer/testnet/contract/CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW)

[Warden org](https://github.com/Femology) · [warden-contract](https://github.com/Femology/warden-contract) · [warden-sdk](https://github.com/Femology/warden-sdk) · [warden-monitor](https://github.com/Femology/warden-monitor) · [Discussions](https://github.com/Femology/warden-app/discussions)

</div>

---


The reference application for [Warden](https://github.com/Femology/warden-contract) --
a risk-policy engine for Stellar smart wallets. This app proves the decision logic works
end to end on Testnet: connect a passkey-backed smart wallet, set a policy, and send a
transfer that either goes straight through or asks for one more confirmation.

## Important limitation -- read this before assuming more than it claims

**The step-up gate here is app-enforced, not cryptographically enforced.** This app asks
`warden-contract`'s `evaluate()` for a decision and its own UI refuses to proceed
without confirmation when the answer is `RequireStepUp` -- but nothing yet stops a
modified client from ignoring that answer and sending the payment anyway. The actual
payment is still authorized by the wallet's single ordinary passkey signature; there is
no on-chain mechanism yet forcing the step-up to happen first.

Registering Warden as a true smart-wallet policy signer inside the wallet's own
`__check_auth` is the natural next step, once passkey-kit's multi-signer interface for
that is verified against its current source -- it was not fabricated here. This is a
real, current limitation of v1, not a bug.

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

### Why there's a server-side deployer key at all

A passkey smart wallet is a `C...` contract address, which cannot itself be a
transaction envelope source (only classic `G...` accounts hold a sequence number). Every
transaction in this app is built with a funded Testnet account (`WARDEN_DEPLOYER_SECRET`)
as the fee/sequence source, while the connected smart wallet remains the address whose
own Soroban auth entry is actually checked by the contract -- signed by the user's
passkey via `passkey-kit`, never by the deployer. Two API routes (`/api/co-sign`,
`/api/submit-wallet-creation`) add the deployer's own envelope signature server-side;
they never touch or see the user's passkey signature, and the deployer's secret never
reaches the browser.

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

<a href="https://github.com/Femology/warden-app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Femology/warden-app" alt="Contributors" />
</a>
