# Technical Instructions — MLP-45: Decide the technology stack (architecture spike)

## Approach

The repo is currently empty, so this ticket both **decides** and **scaffolds** the foundation
every other MLP ticket builds on. Treat the stack proposed in the ticket description as the
strong default it already is (it maps 1:1 onto the full MLP-9…MLP-17 backlog with no gaps), but
the ADR must show a genuine second option was weighed, not a rubber stamp, and it must resolve
the two things the ticket itself leaves open (realtime transport, and why auth is split across
two providers).

**Recommended decision (Option A — write this up as the accepted option):**
TypeScript end-to-end · Next.js (App Router) · tRPC internally + Next.js route handlers for the
public REST API, Zod validation at every boundary · PostgreSQL via Prisma · Auth.js for
email/OAuth login + WorkOS scoped *only* to enterprise SSO/SCIM (MLP-42) · Inngest for
background jobs · **Postgres LISTEN/NOTIFY for realtime at MVP scale, with Ably documented as
the upgrade path once tracking volume needs horizontal fan-out** · Tailwind + shadcn/ui +
TanStack Query/Table + Recharts · Vitest (unit) + Playwright (e2e, wired but not exercised by
this ticket) · Vercel + Neon.

**Option B — the genuine alternative to document and reject in the ADR:**
NestJS API + a separate Vite/React SPA, Passport.js + WorkOS for all auth, Postgres via
TypeORM/Prisma, BullMQ (Redis-backed) for jobs, Socket.IO for realtime, deployed as two services
(API + static frontend) rather than one Next.js app. Reject it in the ADR for concrete reasons:
two deploy targets and two runtimes to operate instead of one; no natural end-to-end type sharing
between API and frontend (Next.js + tRPC gives that for free); an extra piece of infrastructure
(Redis) for a team that doesn't need BullMQ's throughput yet; and no hosting synergy equivalent to
Vercel+Neon. This is the comparison AC #1 requires — write it into the ADR's "Options Considered"
section with these tradeoffs, not just a one-line dismissal.

## Files to create

- `docs/adr/0001-tech-stack.md` — the ADR itself. Use a lightweight MADR-style template: Title,
  Status (`Accepted` once signed off, `Proposed` until then), Context, Decision, Options
  Considered (Option A vs Option B above, with the specific tradeoffs), Consequences, Rejected
  Alternatives. This is ADR #1 — its structure becomes the template for every future ADR, so keep
  it clean and reusable.
- `package.json`, `tsconfig.json`, `next.config.ts` — TypeScript/Next.js project root. Use `pnpm`
  as the package manager (add `packageManager` field + `pnpm-lock.yaml`); fall back to `npm` only
  if the team has no pnpm familiarity (see Open Questions).
- `.eslintrc.json` (or flat `eslint.config.js`) + `.prettierrc` — baseline lint/format, since none
  exists in the repo yet.
- `app/layout.tsx`, `app/page.tsx` — minimal App Router shell so "app boots" is demonstrable.
- `app/api/trpc/[trpc]/route.ts` + `server/trpc.ts` + `server/routers/health.ts` — a single tRPC
  procedure (`health.ping`) to prove the internal typed-API pattern.
- `app/api/v1/health/route.ts` — a plain Next.js route handler returning JSON, to prove the
  "route handlers for the public REST API" pattern declared in the stack.
- `prisma/schema.prisma` — one placeholder model (e.g. `HealthCheck`) so `prisma validate` /
  `prisma generate` run cleanly; do **not** wire a live Neon connection into CI for this ticket.
- `.env.example` — placeholders for `DATABASE_URL`, `AUTH_SECRET`, `WORKOS_API_KEY`,
  `WORKOS_CLIENT_ID`, `INNGEST_EVENT_KEY`, `ABLY_API_KEY`, each commented as "not required to run
  the sample test/CI."
- `.github/workflows/ci.yml` — install deps, run lint, typecheck, and `vitest run` on push/PR to
  `main`.
- `tests/health.test.ts` — Vitest test(s) covering the tRPC procedure and the REST route handler.
- `README.md` — prerequisites (Node version, pnpm), setup steps, `.env` instructions, how to run
  the dev server and the test suite.
- `.nvmrc` or an `engines` field in `package.json` — pin the Node version.

## Interfaces & contracts

- **tRPC procedure** `health.ping` — no input (or `z.void()`), output
  `{ status: "ok", time: string }` (ISO timestamp). Demonstrates Zod-validated, end-to-end typed
  internal API.
- **REST route** `GET /api/v1/health` — no auth, no input — `200 { "status": "ok" }`. Demonstrates
  the public-REST-API pattern that MLP-44 (Webhooks & Public REST API) will extend.
- **Prisma schema** — one placeholder model only; no migration is run against a live database as
  part of this ticket.

## Validation & edge cases

- Every input boundary (even the trivial sample) should show a Zod schema in use — this is the
  precedent for MLP-9…44, not just decoration on this ticket.
- The app must **boot without any third-party credentials present** (WorkOS, Inngest, Ably keys
  absent). Initialize those SDKs lazily/on first use, not at module import time, so local dev and
  CI don't require live accounts just to satisfy AC #4 ("app boots").
- CI must fail the pipeline (non-zero exit) on lint, typecheck, or test failure — don't let any of
  those steps be soft-fail/`continue-on-error`.

## Non-functional requirements

- **Security:** no real secrets committed anywhere; `.env` is git-ignored; `.env.example` holds
  placeholders only.
- **Observability / performance / i18n:** explicitly out of scope for this ticket — no epic in the
  current backlog requires i18n, and performance/observability tooling is called out as
  out-of-scope in the ticket description itself. Don't build infra for these now.

## Test strategy

- **Unit only for this ticket** (Vitest): assert the tRPC procedure and REST route both return the
  documented shape. This is sufficient to satisfy AC #4 ("a sample module + test runs green").
- **Playwright:** add the config/dependency so the pattern is established, but do **not** wire an
  e2e test into this ticket's CI run — that adds browser-install complexity to the pipeline that
  AC #4 doesn't require yet. First real Playwright test lands with the first real feature ticket.
- **CI:** one GitHub Actions workflow, triggered on push, running install → lint → typecheck →
  `vitest run`.

## Out of scope

- Any feature from MLP-9…MLP-17.
- Live provisioning/integration testing of WorkOS, Inngest, Ably, or Neon — schema/config for
  these is present, but nothing in this ticket depends on a live account for them.
- Production infra hardening, monitoring, cost optimization (tracked separately per the ticket).
- Database migrations run against a real Postgres instance in CI.
- Exercising Playwright/e2e tests in CI.

## Open questions

1. **Package manager:** proposing `pnpm` — confirm, or fall back to `npm` if the team has no pnpm
   familiarity.
2. **CI provider:** proposing GitHub Actions since the repo is already on GitHub — confirm no
   competing preference (e.g. an existing CircleCI/GitLab account).
3. **Realtime decision:** proposing Postgres LISTEN/NOTIFY for MVP with Ably as a documented
   future upgrade — confirm MLP-11 (Real-Time Tracking) doesn't already have a known near-term
   scale requirement that argues for adopting Ably immediately instead.
4. **Auth split rationale:** confirm the team is fine with Auth.js (standard login) + WorkOS
   (SSO/SCIM only) as two providers, versus consolidating on a single provider (WorkOS end-to-end,
   or an alternative like Clerk) to reduce integration surface.
5. **Team sign-off mechanics:** who is the actual approver for AC #3, and what constitutes
   evidence of sign-off — a named reviewer's Jira comment, a PR approval on the ADR, or something
   else? This step cannot be completed by an automated implementation stage and should be treated
   as a manual checkpoint.
