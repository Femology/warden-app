# Security Policy

## Unaudited -- use at your own risk

**`warden-app` has not had a third-party security audit**, and neither has
[`warden-contract`](https://github.com/Femology/warden-contract) or
[`warden-sdk`](https://github.com/Femology/warden-sdk), which it depends on. This app
also has a stated, deliberate limitation: the step-up gate is app-enforced, not yet
cryptographically enforced -- see the README before assuming more than that claims. Do
not deploy this app for real funds without an audit of the full stack first.

## A specific risk worth naming: the server-side deployer key

This app's two API routes (`/api/co-sign`, `/api/submit-wallet-creation`) hold
`WARDEN_DEPLOYER_SECRET` server-side to co-sign transactions on behalf of connected
passkey wallets (a smart wallet's `C...` address can't itself pay transaction fees). If
this app is ever deployed with a deployer key holding meaningful funds, that key's
exposure surface (the hosting platform's env var storage, anyone with deploy access) is
part of this app's real attack surface. Report any way that key's usage could be abused
beyond its intended co-signing role.

## Reporting a vulnerability

Report privately rather than opening a public issue.

**Contact:** femimi1234@gmail.com

Include a description, reproduction steps, and impact assessment. You'll get an
acknowledgment within a few days.

## Scope

In scope: this app's own code (`src/`), including the API routes and their use of the
deployer key. Out of scope: `passkey-kit`, `@stellar/stellar-sdk`, and the Stellar
network itself -- report issues in `warden-contract` or `warden-sdk` to their own repos.
