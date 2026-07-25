# Meridian Logistics Platform

## Stack

TypeScript · Next.js (App Router) · tRPC (internal API) + Next.js route handlers (public REST
API) · PostgreSQL via Prisma · Auth.js + WorkOS (SSO/SCIM) · Inngest · Vitest + Playwright ·
Vercel + Neon.

See [`docs/adr/0001-tech-stack.md`](docs/adr/0001-tech-stack.md) for the full decision, the
alternative considered, and the rationale.

## Prerequisites

- Node.js 22 (see `.nvmrc` — `nvm use` if you have nvm installed)
- [pnpm](https://pnpm.io) 10.x (`corepack enable` will pick up the `packageManager` field in
  `package.json`)

## Setup

```bash
pnpm install
cp .env.example .env   # optional for local dev — see note below
```

Nothing in `.env.example` is required to run the app or its tests. The scaffold boots and its
sample module/tests pass with no third-party credentials present; SDKs (WorkOS, Inngest, Ably)
are initialized lazily rather than at import time. Fill in `.env` only once you're wiring up a
real database or a real third-party integration.

## Running the app

```bash
pnpm dev     # start the dev server at http://localhost:3000
pnpm build   # production build
pnpm start   # run the production build
```

Two sample endpoints are wired up to prove the internal/external API pattern:

- `GET /api/v1/health` — public REST endpoint (`{ "status": "ok" }`)
- `/api/trpc/health.ping` — internal tRPC procedure (`{ status: "ok", time: <ISO string> }`)

## Running tests

```bash
pnpm test        # vitest run
pnpm lint        # eslint
pnpm exec tsc --noEmit   # typecheck
```

CI (`.github/workflows/ci.yml`) runs all three on every push/PR to `main`.

## Database

The Prisma schema (`prisma/schema.prisma`) has a placeholder model so `prisma validate` and
`prisma generate` work without a live database:

```bash
pnpm exec prisma validate
pnpm exec prisma generate
```

Running a real migration (`prisma migrate dev`) requires a `DATABASE_URL` in `.env` pointing at
a real Postgres instance (Neon in production, local Postgres in dev) — not required for this
scaffold to build, run, or pass its tests.
