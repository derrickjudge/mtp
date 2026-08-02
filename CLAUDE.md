# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Rigor & Hosting

    Rigor: production
    Hosting: managed-cloud

Live site with real users on Vercel. Full rigor applies: TDD, feature branches
with PR merges to main, and the complete pre-commit checklist.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # prisma generate + next build
npm run lint         # ESLint via next lint
npm test             # Run all tests
npm run test:watch   # Jest in watch mode
npx jest src/__tests__/lib/rateLimit.test.ts   # Run a single test file
npm run create-admin # Seed an admin user (ts-node)
npm run check-db     # Verify DB connectivity
```

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · NextAuth v4 · Prisma (schema-only) · Supabase PostgreSQL · Cloudflare R2 · Vercel

### Database: Dual-client pattern

The project uses **Prisma for schema definition only** (`prisma/schema.prisma`). All runtime queries go through `src/lib/db-native.ts` — a hand-rolled `NativeDBService` class using the `pg` client directly. This was done to work around Prisma's prepared-statement incompatibility with Supabase's connection pooler (pgBouncer).

- Always use `nativeDB` from `@/lib/db-native` for queries — never `PrismaClient` at runtime.
- `nativeDB` lazily creates and closes a `pg.Client` per query.
- Junction tables (`_CategoryToPhoto`, etc.) are created by `ensureJunctionTables()`, which runs once per process lifetime. There are no `supabase/migrations/*.sql` files for them; that function is the only place they are defined.
- Ordered relations (`_EventPhotos`, `_ArticleToPhoto`) carry a `position` column holding the curated display order. When reading them back, aggregate with an ordered subquery — `json_agg(DISTINCT ...)` sorts by the JSON value and silently discards `position`.

### Articles

- An article's photo set is a hand-picked, ordered list of existing `Photo` rows, stored in `_ArticleToPhoto` with `position` taken from the array index of the `photoIds` the client submits. It is independent of `Article.coverImage` (the header image) and of any linked `Event`.
- Create/update routes take `photoIds` alongside `categoryIds`/`tagIds`/`eventIds`; `PUT` clears and relinks the whole set, so the submitted array is the source of truth for both membership and order.
- `getArticleWithRelations` returns the set as `photos`, already in curated order.

### Image storage: R2 (server-side only)

- Config lives in `src/config/r2.ts`, populated from `R2_*` env vars (never `NEXT_PUBLIC_*`).
- `src/services/photoService.ts` is the single entry point for all photo operations: upload, resize (via `sharp`), persist to DB, and delete from R2.
- `src/lib/r2Client.ts` is a stub — client-side R2 access is disallowed.
- Storage keys are generated server-side (`<timestamp>-<uuid>.<ext>` and `thumbnails/<timestamp>-<uuid>.<ext>`) via `randomUUID`; the client filename is never used in the key. The main image is resized to 1200x800 (fit inside) and the thumbnail to 300x200 (cover).
- Upload routes require an `ADMIN` session and validate type/size via `validateImageUpload` in `src/lib/uploadValidation.ts` (images only, 4MB max — kept under Vercel's 4.5MB serverless request body cap).

### Auth

- NextAuth v4 with `CredentialsProvider` and JWT sessions (7-day expiry).
- `src/lib/auth.ts` uses `nativeDB.findUserByEmail` — no Prisma adapter.
- Roles: `USER | EDITOR | ADMIN`. Only `ADMIN` can access `/admin/*`.
- Middleware (`src/middleware.ts`) guards all `/admin/*` routes; login page is always permitted.

### API layer

All routes live under `src/app/api/`. Rate limiting is applied per-IP using a token-bucket implementation in `src/lib/rateLimit.ts` (in-memory, resets on cold start). Use `rateLimit(key, { tokens, windowMs })` at the top of any mutating route handler.

### Admin panel

`/admin` routes are full-page React components under `src/app/admin/`. The sidebar (`src/components/admin/AdminSidebar.tsx`) and header (`src/components/admin/AdminHeader.tsx`) are shared layout components.

## Environment Variables

All secrets live in `.env.local` (never committed). Required vars:

| Variable | Purpose |
|---|---|
| `POSTGRES_PRISMA_URL` | Supabase PostgreSQL connection string (with pgBouncer params) |
| `DATABASE_URL` | Fallback DB URL |
| `DATABASE_CA_CERT_PATH` | Preferred. Path to a CA certificate file (`.crt`/`.pem`). When set, the DB connection verifies the server certificate (`rejectUnauthorized: true`); when unset, TLS is unverified. Store certs in files, not inline. |
| `DATABASE_CA_CERT` | Fallback for platforms without a convenient filesystem. Inline PEM contents of the CA certificate; takes precedence over `DATABASE_CA_CERT_PATH` when both are set. |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket |
| `R2_PUBLIC_URL` | Public CDN base URL for R2 objects |
| `R2_ENDPOINT` | R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 credentials (server-side only) |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client-side config |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access (server-side only) |
| `RESEND_API_KEY` | Resend API key used by `/api/contact` to send contact-form submissions. The `from` address (`contact@mtpcollective.com`) must be a verified sending domain in Resend or sends will fail. |

## Testing

Tests live in `src/__tests__/` mirroring the `src/` structure. `jest.setup.js` mocks:
- `next/navigation`, `next/image`
- All `R2_*` and `NEXTAUTH_SECRET` env vars with safe test values
- `nativeDB` entirely — tests never hit the real database

To add a new API route test, follow the pattern in `src/__tests__/api/photos/route.test.ts`.

### Integration tests

Because `nativeDB` is mocked everywhere, raw SQL is otherwise unverified. Tests
under `src/__tests__/integration/` run against a real PostgreSQL instance and
skip unless `INTEGRATION_DATABASE_URL` is set. That variable is deliberately
distinct from `POSTGRES_PRISMA_URL`/`DATABASE_URL` so a normal `npm test` can
never point these destructive tests at the live database. Run them against a
throwaway instance:

```bash
podman run -d --name mtp-sqlcheck -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=sqlcheck -p 55432:5432 docker.io/library/postgres:16-alpine
INTEGRATION_DATABASE_URL='postgresql://postgres:test@localhost:55432/sqlcheck?sslmode=disable' \
  npx jest src/__tests__/integration
podman rm -f mtp-sqlcheck
```

## Supabase Migrations

Schema history is tracked in `supabase/migrations/`. The Prisma schema (`prisma/schema.prisma`) is the authoritative source for the data model; run `prisma generate` before building to regenerate the client types used for type hints.
