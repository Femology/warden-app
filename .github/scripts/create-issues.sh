#!/usr/bin/env bash
set -euo pipefail

gh issue create \
  --title "chore(app): deploy to Vercel with a real public URL" \
  --label "enhancement,complexity: small" \
  --body "## Summary
warden-app currently runs and is tested locally against the live Testnet deployment,
but has no public URL yet. This is a real, not-yet-completed step, stated plainly in
warden-contract's v0.1.0 release notes rather than linking a URL that doesn't exist.

## Acceptance Criteria
- [ ] Create a Vercel project connected to this repo.
- [ ] Set every env var from HOSTING.md's warden-app table (in warden-monitor's repo,
      which documents the shared topology) in the Vercel dashboard.
- [ ] Confirm a fresh deploy actually connects a wallet and completes all three demo
      scenarios against the live Testnet contract, not just that the build succeeds.
- [ ] Add the live URL to this repo's README and to warden-contract's release notes.

## Tech Stack
Vercel, Next.js."

gh issue create \
  --title "feat(app): register warden-contract as a true smart-wallet policy signer (depends on warden-contract#2)" \
  --label "enhancement,complexity: large" \
  --body "## Summary
Depends on [warden-contract#2](https://github.com/Femology/warden-contract/issues/2).
Once the contract side is verified and implemented, this app's step-up gate can move
from app-enforced (current, stated limitation) to cryptographically enforced.

## Acceptance Criteria
- [ ] Do not start until warden-contract#2 lands and its signer-registration interface
      is stable.
- [ ] Wire the new registration flow into wallet creation/connection.
- [ ] Remove the 'app-enforced, not cryptographic' limitation from this README once
      verified end to end.
- [ ] Keep the existing app-side confirmation modal even after this ships -- the UX
      still needs a clear moment where the user confirms, cryptographic enforcement
      or not.

## Tech Stack
TypeScript, passkey-kit, warden-sdk, warden-contract. Cross-repo dependency."

gh issue create \
  --title "feat(app): replace the deployer-key co-sign pattern with real fee sponsorship" \
  --label "enhancement,complexity: medium" \
  --body "## Summary
Every transaction currently gets its envelope co-signed server-side by a single shared
deployer key (see SECURITY.md's stated risk). This works for a Testnet demo but doesn't
scale to production: one key sponsoring every user's fees is a centralization and
key-management liability. A real fee-sponsorship relayer (e.g. Launchtube, or
passkey-kit's own PasskeyServer/RelayerClient) is the production-shaped fix.

## Acceptance Criteria
- [ ] Evaluate passkey-kit's own \`PasskeyServer\`/\`RelayerClient\` (bundled in the
      \`passkey-kit/server\` export) as a replacement for the hand-rolled
      \`/api/co-sign\` and \`/api/submit-wallet-creation\` routes.
- [ ] If adopted, remove \`WARDEN_DEPLOYER_SECRET\` from this app's server env entirely.
- [ ] Document the new sponsorship model's own key-management story in SECURITY.md.

## Tech Stack
passkey-kit's server package, or an external relayer service."

gh issue create \
  --title "test(app): add Playwright e2e tests with a WebAuthn virtual authenticator" \
  --label "enhancement,complexity: medium" \
  --body "## Summary
Current tests mock \`passkeyWallet\` and \`wardenClient\` at the module boundary -- they
verify component logic, not the real WebAuthn ceremony. Playwright's CDP-based virtual
authenticator support can simulate a real passkey create/sign flow in CI, closing the
gap between 'tests pass' and 'the three demo scenarios actually work end to end,' which
currently requires a human with a real browser.

## Acceptance Criteria
- [ ] Add Playwright with a Chromium virtual authenticator configured for platform
      attachment.
- [ ] Cover all three demo scenarios (allow, step-up by amount/new recipient, step-up
      by velocity) as real browser flows against a Testnet-pointed dev server.
- [ ] Decide whether this runs in the same CI workflow or a separate, longer-running
      one (it needs network access to Testnet, unlike the current mocked unit tests).

## Tech Stack
Playwright, Chromium DevTools Protocol WebAuthn domain."

echo "Done. Created 4 issues."
