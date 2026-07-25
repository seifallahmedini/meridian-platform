# 0001. Technology stack for the Meridian Logistics Platform

## Status

Proposed

Pending team sign-off (MLP-45, acceptance criterion #3). Flip to **Accepted** once a reviewer has
approved the scaffolding PR or recorded sign-off on the ticket.

## Context

Meridian Logistics Platform (MLP) is a greenfield build. This ADR is the first decision recorded
for the project and is a blocker for every feature epic in the backlog: Shipment Booking (MLP-9),
Carrier Management (MLP-10), Real-Time Tracking (MLP-11), Warehouse & Dock Scheduling (MLP-12),
Customs & Documentation (MLP-13), Freight Audit & Billing (MLP-14), Analytics & Reporting
(MLP-15), User Management & Permissions incl. RBAC + enterprise SSO/SCIM (MLP-16, MLP-41,
MLP-42), and Notifications & Integrations incl. webhooks + a public REST API (MLP-17, MLP-44).

The stack must therefore support, out of the box or with a clear extension path: forms and
transactional writes, real-time push updates, calendar/scheduling logic, document generation and
versioned storage, background job processing (invoice ingestion, freight audit, notifications),
dashboards and reporting, enterprise-grade auth (RBAC + SSO/SCIM), and a versioned public REST
API usable by external systems (customer ERPs, carrier integrations).

Because this is ADR #1 in a repo with no prior precedent, its format also sets the template every
future ADR in `docs/adr/` will follow.

## Decision

We adopt **Option A** below.

## Options considered

### Option A — Next.js monolith (chosen)

- **Language:** TypeScript end-to-end.
- **App framework:** Next.js (App Router), single deployable app.
- **Typed API:** tRPC for internal (frontend ↔ backend) calls; Next.js route handlers under
  `app/api/v1/...` for the public REST API consumed by external systems (MLP-44). Zod validation
  at every boundary, shared between both API surfaces.
- **Database:** PostgreSQL via Prisma (schema + migrations + generated client).
- **Auth:** Auth.js for standard email/OAuth login, scoped to WorkOS *only* for enterprise
  SSO/SCIM provisioning (MLP-41/MLP-42). WorkOS's core product is the SSO/SCIM connector layer;
  routing all standard logins through it as well would mean configuring a heavier product than
  needed for the common case.
- **Background jobs:** Inngest (hosted queue — invoice ingestion, tracking polls, freight audit,
  notifications). No self-hosted queue infra to provision.
- **Realtime:** Postgres `LISTEN`/`NOTIFY` for MVP scale (MLP-11 tracking updates, dock
  scheduling changes). Ably is the documented upgrade path once tracking event volume needs
  horizontal fan-out beyond a single Postgres instance's notify throughput — not adopted now to
  avoid a third-party realtime dependency before it's needed.
- **UI:** Tailwind + shadcn/ui (accessible primitives) + TanStack Query/Table + Recharts.
- **Testing:** Vitest (unit) + Playwright (e2e — dependency/config present, first real e2e test
  lands with the first feature ticket).
- **Hosting:** Vercel (app) + Neon (managed Postgres).

**Why:** one codebase, one deploy target. tRPC gives end-to-end type safety between UI and
backend with zero codegen. Inngest and Neon are both hosted/managed, so the team isn't standing
up and operating a queue or a database server in addition to learning a new stack. Vercel+Neon is
a well-trodden pairing for Next.js + Postgres with preview deploys per PR out of the box.

### Option B — NestJS API + separate SPA (rejected)

- NestJS backend API, deployed independently from a Vite/React SPA frontend.
- Passport.js + WorkOS for all auth (no split).
- PostgreSQL via TypeORM or Prisma.
- BullMQ (Redis-backed) for background jobs.
- Socket.IO for realtime.
- Two deploy targets: API service + static frontend host.

**Why rejected:**

- **Two runtimes/deploy targets instead of one.** More operational surface for a team that also
  has to stand up Postgres, WorkOS, and a job queue for the first time.
- **No end-to-end type sharing.** NestJS + a separate SPA needs a codegen step (OpenAPI client
  generation, or a shared types package kept manually in sync) to get what tRPC gives Option A
  for free.
- **Extra infrastructure.** BullMQ requires a Redis instance the team doesn't otherwise need;
  Inngest is hosted and needs no infra of its own.
- **No hosting synergy equivalent to Vercel+Neon.** Two services means assembling and
  coordinating two deploy pipelines instead of one.

Option B would be the better call if the team already knew it needed independent scaling of API
vs. frontend, a non-JS team owning the API, or wanted to avoid serverless/Vercel lock-in. Nothing
in the current MLP-9…44 backlog points that direction — it is standard CRUD, realtime updates,
and background jobs, which Option A handles cleanly as a single deployable.

## Consequences

- All future feature tickets (MLP-9…MLP-44) build on the Option A stack: Next.js App Router
  conventions, tRPC for internal APIs, Zod schemas at every boundary, Prisma for schema/migrations,
  Vitest for unit tests.
- The public REST API (MLP-44, webhooks + external integrations) is implemented as versioned
  Next.js route handlers under `app/api/v1/...`, separate from the internal tRPC surface, with
  its own auth (API keys / OAuth client-credentials) distinct from Auth.js session cookies.
- Realtime starts on Postgres `LISTEN`/`NOTIFY`; if MLP-11 tracking volume outgrows a single
  Postgres instance's notify throughput, migrating the realtime transport to Ably is the
  anticipated next step — flagged here so it isn't a surprise re-architecture later.
- Auth is intentionally split across two providers (Auth.js + WorkOS); this trades a small amount
  of integration surface for not over-provisioning WorkOS for the common login case. If this
  split proves awkward in practice, consolidating on a single provider is the fallback.

## Rejected alternatives

- **Option B (NestJS + separate SPA)** — see above.
- **Single-provider auth (WorkOS end-to-end)** — considered as a simplification of the Option A
  auth split; rejected for now because it would mean every standard login also depends on WorkOS
  being configured and available, adding an external dependency to the most basic app flow.
- **Ably-first realtime** — considered to avoid a future migration; rejected because it adds a
  third-party dependency and cost before there's evidence Postgres `LISTEN`/`NOTIFY` can't carry
  MVP-scale tracking traffic.
