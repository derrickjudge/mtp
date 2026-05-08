# Deployment Workflow

This repository uses GitHub Actions for CI checks and Vercel for deployments.

## Branch Strategy

- `main`: production source of truth. What is on `main` is expected to match production.
- `dev`: optional integration branch for larger or batched work.
- `feature/*`: short-lived branches for normal work.
- `hotfix/*`: short-lived branches for urgent production fixes.
- `prod`: legacy branch, not used by the deployment workflow.

## Environment Mapping

- **Production**: Vercel auto-deploys from `main`.
- **Non-production / validation**: Vercel Preview deployments from pull requests and branches.

## CI Checks (GitHub Actions)

The workflows in `.github/workflows/` run quality gates and do not deploy:

- Lint (`npm run lint`)
- Typecheck (`npx tsc --noEmit`)
- Tests (`npm test`)
- Build (`npm run build`)

## Standard Release Flow

1. Create a `feature/*` branch from `main`.
2. Open a pull request to `main`.
3. Review CI results and Vercel Preview deployment.
4. Merge to `main`.
5. Confirm Vercel production deployment succeeds.

## Hotfix Flow

1. Create a `hotfix/*` branch from `main`.
2. Open PR to `main` with scope limited to the fix.
3. Validate CI and preview quickly.
4. Merge to `main` and verify production deployment.

## Bypass Protocol (Solo Maintainer)

Bypassing checks is allowed only for urgent cases.

Before bypassing, record:

- Why bypass is required now.
- Which checks are being bypassed.
- Risk level and impacted area.
- Rollback plan.

After bypassing:

- Verify production behavior immediately.
- Create a follow-up task to restore green checks and close process gaps.

## Ownership Notes

- Deploy source should remain `main`.
- Keep deployment in one system (Vercel) and CI in one system (GitHub Actions) to avoid conflicting status signals.
