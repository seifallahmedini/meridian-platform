# Implementation Report — MLP-45: Decide the technology stack for the Meridian Logistics Platform (architecture spike)

## PR

https://github.com/seifallahmedini/meridian-platform/pull/1
Branch: `feature/MLP-45-tech-stack-adr-scaffold`

## What changed

10 commits, in plan order:

1. `docs/adr/0001-tech-stack.md` — ADR: Option A (Next.js/tRPC/Prisma monolith, accepted) vs
   Option B (NestJS + separate SPA, rejected), with the realtime (Postgres LISTEN/NOTIFY for
   MVP) and auth-split (Auth.js + WorkOS scoped to SSO/SCIM) questions resolved. Status:
   `Proposed`.
2. Project tooling — pnpm, TypeScript, Next.js (App Router), Tailwind, ESLint, Prettier,
   `.nvmrc`.
3. Minimal App Router shell (`app/layout.tsx`, `app/page.tsx`) — boots via `pnpm dev`/`pnpm
   build`; replaced the `create-next-app` boilerplate landing page with a project-relevant one.
4. Prisma schema placeholder (`prisma/schema.prisma`, `prisma.config.ts`, one `HealthCheck`
   model) — `prisma validate`/`generate` run without a live database.
5. tRPC wiring (`server/trpc.ts`, `server/routers/_app.ts`, `server/routers/health.ts`,
   `app/api/trpc/[trpc]/route.ts`) — sample `health.ping` procedure, Zod-validated output.
6. Public REST sample route (`app/api/v1/health/route.ts`) — `GET /api/v1/health`, the pattern
   MLP-44 will extend.
7. Vitest config + `tests/health.test.ts` — covers both sample endpoints via a direct tRPC
   caller and the route handler function.
8. `.env.example` — placeholders for `DATABASE_URL`, `AUTH_SECRET`, `WORKOS_API_KEY`,
   `WORKOS_CLIENT_ID`, `INNGEST_EVENT_KEY`, `ABLY_API_KEY`; `.gitignore` updated with a
   `!.env.example` exception since the blanket `.env*` rule would otherwise have swallowed it.
9. GitHub Actions CI (`.github/workflows/ci.yml`) — install → lint → typecheck → `vitest run`
   on push/PR to `main`.
10. `README.md` — prerequisites, setup, env notes, how to run the app/tests, link to the ADR.

## Notable deviations from the plan during execution

- `create-next-app`'s generated `pnpm-workspace.yaml` (with an `ignoredBuiltDependencies` key
  but no `packages` field) caused `pnpm install` to fail outright on this pnpm version. Fixed
  by adding `packages: ["."]` to the workspace file.
- `prisma init` auto-installs "Prisma agent skills" into `.agents/`, `.windsurf/`, and
  `.claude/skills/` by default — none of this was wanted in the repo or in the user's real
  `.claude/` config directory. Removed all of it after init; future Prisma CLI runs in this repo
  should use `prisma init --no-skills` if re-run.
- Prisma 7 removed `datasource.url` from `schema.prisma` in favor of `prisma.config.ts` — the
  schema only declares `provider = "postgresql"`, and the connection string lives in
  `prisma.config.ts` (reading `DATABASE_URL` from `.env` via `dotenv/config`).

## Test results

- `pnpm lint` — clean
- `pnpm exec tsc --noEmit` — clean
- `pnpm test` (Vitest) — 2/2 passing
- `pnpm build` — succeeds
- `pnpm dev` — boots; `GET /api/v1/health` and tRPC `health.ping` both verified with `curl`
- `pnpm exec prisma validate` / `prisma generate` — succeed with no live database connection
- Verified `pnpm test` and `pnpm build` both succeed with **no `.env` file present at all**
- CI run on the PR (`pull_request` trigger): ✅ success

## Acceptance criteria

- [x] AC #1 — at least two viable stack options compared (ADR "Options considered")
- [x] AC #2 — decision recorded as an ADR with rationale + rejected alternatives
- [ ] AC #3 — team signs off on the chosen stack — **not automatable.** The PR is the sign-off
      checkpoint; ADR status should flip `Proposed → Accepted` once approved.
- [x] AC #4 — minimal repo scaffolded: app boots, sample module + test runs green, CI runs the
      test on push
- [x] AC #5 — local setup documented in README

## Deferred / explicitly out of scope

- Playwright dependency/config not exercised in CI (per technical instructions — avoids
  browser-install complexity not required yet).
- No migration run against a live Postgres/Neon instance.
- No live WorkOS, Inngest, or Ably integration/account provisioning.
- Any feature from MLP-9…MLP-17.

## Ticket status

Transitioned MLP-45 to **In Review**. Implementation report and PR link posted as a Jira
comment under `## 🤖 Implementation Report (ticket-to-code)`.

## Follow-ups for the team

1. Review and approve PR #1 — this satisfies AC #3.
2. On approval, flip `docs/adr/0001-tech-stack.md` Status from `Proposed` to `Accepted`.
3. Confirm or override the defaults used for the five open questions raised in stage 2
   (package manager, CI provider, realtime choice, auth-provider split, sign-off mechanics).
