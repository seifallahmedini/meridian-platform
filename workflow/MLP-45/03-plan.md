# Implementation Plan — MLP-45: Decide the technology stack for the Meridian Logistics Platform (architecture spike)

## Branch

`feature/MLP-45-tech-stack-adr-scaffold`

## Steps

### Step 1 — Write the ADR (est: M)
- Files: `docs/adr/0001-tech-stack.md`
- Change: MADR-style ADR — Title, `Status: Proposed`, Context (platform needs, MLP-9…17 summary),
  Decision (Option A stack from the technical instructions), Options Considered (Option A vs
  Option B — NestJS+SPA — with concrete tradeoffs), Consequences, Rejected Alternatives. Resolve
  the two open items explicitly: realtime = Postgres LISTEN/NOTIFY for MVP (Ably as documented
  upgrade path), auth = Auth.js (login) + WorkOS (SSO/SCIM only, scoped to MLP-42).
- Verify: Manual review confirms ≥2 options genuinely compared (AC #1) and a clear, committed
  decision with rationale + rejected alternatives (AC #2).

### Step 2 — Initialize project tooling (est: S)
- Files: `package.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`/`eslint.config.js`,
  `.prettierrc`, `.nvmrc`, `pnpm-lock.yaml`
- Change: Scaffold a TypeScript Next.js (App Router) project with pnpm; add ESLint + Prettier;
  pin the Node version.
- Verify: `pnpm install` succeeds; `pnpm lint` runs cleanly.

### Step 3 — Scaffold minimal app shell (est: S)
- Files: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Change: Minimal root layout + landing page (Tailwind wired) so the app boots.
- Verify: `pnpm build` succeeds; `pnpm dev` serves `/` with a 200.

### Step 4 — Add Prisma schema placeholder (est: S)
- Files: `prisma/schema.prisma`, `package.json` (prisma devDependency + `generate` script)
- Change: `postgresql` datasource via `env("DATABASE_URL")`, Prisma client generator, one
  placeholder model (e.g. `HealthCheck { id, checkedAt }`).
- Verify: `pnpm prisma validate` and `pnpm prisma generate` succeed **without** a live database
  connection.

### Step 5 — Wire tRPC + sample `health.ping` procedure (est: M)
- Files: `server/trpc.ts`, `server/routers/_app.ts`, `server/routers/health.ts`,
  `app/api/trpc/[trpc]/route.ts`
- Change: Minimal tRPC server setup; `health` router with a `ping` query returning
  `{ status: "ok", time: <ISO string> }`.
- Verify: With `pnpm dev` running, the tRPC endpoint responds with the documented shape (checked
  directly in Step 7's test, not just manually).

### Step 6 — Add public REST sample route (est: S)
- Files: `app/api/v1/health/route.ts`
- Change: `GET` handler returning `NextResponse.json({ status: "ok" })`, no auth.
- Verify: `curl localhost:3000/api/v1/health` → `200 {"status":"ok"}`.

### Step 7 — Add Vitest config + sample tests (est: M)
- Files: `vitest.config.ts`, `tests/health.test.ts`, `package.json` (`test` script)
- Change: Configure Vitest for the TS/Next.js project. Test the tRPC `health.ping` procedure via
  a direct caller (no HTTP round-trip needed) and the REST route handler function directly,
  asserting both response shapes.
- Verify: `pnpm vitest run` passes with 0 failures — this is the "sample module + test runs
  green" half of AC #4.

### Step 8 — Add `.env.example` (est: S)
- Files: `.env.example`, `.gitignore`
- Change: List `DATABASE_URL`, `AUTH_SECRET`, `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
  `INNGEST_EVENT_KEY`, `ABLY_API_KEY`, each commented as not required to run `pnpm dev` or
  `pnpm vitest run` in this ticket's scope; confirm `.env` is git-ignored.
- Verify: `pnpm dev` and `pnpm vitest run` both succeed with **no** `.env` file present at all.

### Step 9 — Add CI workflow (est: S)
- Files: `.github/workflows/ci.yml`
- Change: GitHub Actions workflow on `push`/`pull_request` to `main`: checkout → setup Node (via
  `.nvmrc`) → setup pnpm → `pnpm install --frozen-lockfile` → `pnpm lint` →
  `pnpm exec tsc --noEmit` → `pnpm vitest run`. Every step must hard-fail the job on error (no
  `continue-on-error`).
- Verify: Push the branch and confirm the Actions run is green — this is "CI runs the test on
  push" (AC #4).

### Step 10 — Write README (est: S)
- Files: `README.md`
- Change: Prerequisites (Node version, pnpm), `pnpm install`, `.env.example` → `.env` note,
  `pnpm dev`, `pnpm vitest run`, `pnpm build`; link to `docs/adr/0001-tech-stack.md`.
- Verify: Follow the README from a clean clone/checkout and confirm every documented command
  works as written (AC #5).

### Step 11 — Finalize ADR status (manual checkpoint, est: S)
- Files: `docs/adr/0001-tech-stack.md`
- Change: Once reviewed (PR approval or a named Jira sign-off comment), flip
  `Status: Proposed` → `Status: Accepted`, recording the approver.
- Verify: PR approval or Jira sign-off comment exists and is linked from the ADR. **This step is
  not automatable — surface it explicitly rather than marking AC #3 done unilaterally.**

## Test plan

- **Unit (Vitest):** `tests/health.test.ts` — tRPC `health.ping` returns
  `{ status: "ok", time: <ISO string> }`; REST `GET /api/v1/health` returns `200 { status: "ok" }`.
- **Build/typecheck as gates:** `pnpm build` and `tsc --noEmit`, both wired into CI (Step 9).
- **No integration/e2e in this ticket** — Playwright dependency/config may be added for future
  tickets to build on, but no e2e test is required or exercised in CI here (explicit in the
  technical instructions' Out of Scope).

## Migrations / config

- No migration run against a live database in this ticket — `prisma generate`/`validate` only
  (Step 4); `prisma migrate dev` against Neon is deferred to the first ticket that needs real
  persistence.
- New documented (not required) env vars: `DATABASE_URL`, `AUTH_SECRET`, `WORKOS_API_KEY`,
  `WORKOS_CLIENT_ID`, `INNGEST_EVENT_KEY`, `ABLY_API_KEY`.
- No feature flags needed.

## Rollout & rollback

- Brand-new repo scaffold merging to `main` — no existing users/deploys to protect, so risk is
  low in the traditional sense. The real risk is a wrong foundational choice propagating across
  the ~30 downstream MLP-9…44 tickets; that's mitigated by the ADR's genuine two-option
  comparison and by surfacing the open questions to the team before merge.
- Land this as a PR rather than pushing directly to `main` — review doubles as the AC #3
  sign-off mechanism (see Step 11).
- Rollback is trivial if the team rejects the ADR decision during review: revert the PR before
  merge; nothing is deployed, so no data/runtime rollback is needed.

## Definition of done

- [ ] AC #1 — ADR documents ≥2 genuinely compared options (Step 1)
- [ ] AC #2 — ADR committed to `docs/adr/0001-tech-stack.md` with rationale + rejected
      alternatives (Step 1)
- [ ] AC #3 — Team sign-off recorded (PR approval or Jira comment) — **manual checkpoint**
      (Step 11)
- [ ] AC #4 — App boots, sample tRPC + REST module with a passing test, CI runs the test suite on
      push (Steps 2, 3, 5, 6, 7, 9)
- [ ] AC #5 — README documents local setup for app + tests (Step 10)
- [ ] All Vitest tests passing locally and in CI
- [ ] No real secrets committed — only `.env.example` placeholders (Step 8)
