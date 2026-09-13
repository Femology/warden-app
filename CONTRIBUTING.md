# Contributing to warden-app

Thanks for looking at this. Contributions of any size are welcome.

## Before you start

- **Every monetary amount stays a decimal string end to end** -- never parsed into a JS
  `number` anywhere in this app.
- **Do not call `warden-contract` directly.** Always go through `warden-sdk`.
- **Do not present the step-up gate as cryptographically enforced.** It's app-enforced
  for now -- see the README's stated limitation.
- **Every async wallet or network action needs a distinct loading state and a distinct
  error state.** No silent failures.
- The design system in the master Warden PRD's section 6 governs every screen -- not
  just the landing page.

## Local setup

```bash
git clone https://github.com/wardenoss/warden-app.git
cd warden-app
npm install
cp .env.example .env.local   # fill in WARDEN_DEPLOYER_SECRET
npm run dev
```

## Making a change

1. Open an issue first for anything beyond a trivial fix.
2. Branch from `main`.
3. One logical change per commit (`feat`, `fix`, `test`, `docs`, `chore`).
4. `npm test` and `npm run build` must both pass locally before you open a PR.
5. Open a PR against `main`. CI (`vitest`) must pass, and the PR needs one approval
   before it can merge.

## Reporting a bug

Open an issue with what you expected, what happened, and which of the three demo
scenarios (allow / step-up by amount or new recipient / step-up by velocity) it relates
to. For a security issue, see `SECURITY.md` instead of a public issue.

## Code style

- Tailwind utility classes only -- no inline styles.
- Every public method/component prop has an explicit type.
