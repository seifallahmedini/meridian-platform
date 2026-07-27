# Technical Instructions — MLP-46: Scaffold the project skeleton (.NET 10 API + React SPA)

## Approach

This is a from-scratch scaffold into a genuinely empty repository (a prior Next.js/tRPC/Prisma
draft from the MLP-45 spike was fully deleted, including its ADR — see Context below). Build one
mono-repo with two top-level app roots — `src/` (.NET 10 layered solution) and `web/` (Vite React
SPA) — plus shared root-level tooling (`docs/`, `.github/workflows/`, Aspire `AppHost`, Docker
files). Backend first, frontend second, because the frontend's typed API client is generated from
the backend's OpenAPI spec — the API must boot and serve `/health` + OpenAPI before the client
generation step can run. Keep everything to the "thin vertical slice" the ticket asks for: one
sample entity, one sample page, one protected endpoint — no business features, no SignalR/Hangfire/
RBAC wiring beyond what's needed to prove the auth path works.

**Context:** `git log` shows commits `fb1b94f`…`959cfd2` scaffolded a Next.js+tRPC+Prisma app
during the MLP-45 spike; commit `7b38ec1` deleted all of it (including `docs/adr/0001-tech-stack.md`)
once the team settled on .NET 10 + React SPA instead. Nothing from that draft should be reused as
code — it's a different runtime — but `git show 7b38ec1~1:README.md` etc. are quick references for
prior repo-hygiene shape (`.gitignore`, `.env.example`, CI workflow) if useful during implementation.

## Decisions (resolving MLP-45/46's open choices)

- **Repo structure:** mono-repo (already implied by both tickets targeting one GitHub repo).
  `src/Api`, `src/Application`, `src/Domain`, `src/Infrastructure`, `src/AppHost` for .NET;
  `web/` for the React SPA; `tests/Api.IntegrationTests` for backend tests; `docs/adr/` for ADRs.
- **OpenAPI client generator:** **NSwag** (`NSwag.MSBuild` or the `nswag` CLI via npm) — mature
  TypeScript/fetch client generation, straightforward to wire into a `web` npm script that reads
  the API's `/openapi/v1.json`. Kiota is an acceptable alternative; don't switch without a reason.
- **Local orchestration:** primary path is a **.NET Aspire AppHost** (`src/AppHost`) wiring
  Postgres, Redis, the API, and the `web` app (via Aspire's Node/npm app-hosting integration).
  Also ship a `docker-compose.yml` + `Dockerfile`s for API and web as the documented fallback, per
  the ticket's "Aspire (or docker-compose)" AC — don't skip the compose file even if Aspire works.

## Files to create

**Backend (.NET 10 / ASP.NET Core)**
- `MeridianPlatform.sln` — ties together all backend projects.
- `src/Api/Api.csproj`, `Program.cs` — Minimal API host; registers OpenAPI (`AddOpenApi`) + Scalar
  UI, Serilog, OpenTelemetry, JWT bearer auth, exception-handling middleware, and endpoint groups.
- `src/Api/Endpoints/HealthEndpoints.cs` — `GET /health`.
- `src/Api/Endpoints/SampleEndpoints.cs` — `GET /api/v1/sample-widgets` (anonymous) and
  `GET /api/v1/sample-widgets/protected` (requires a valid JWT) — see Interfaces below.
- `src/Application/*` — DTOs, a sample use-case/service for the sample entity, FluentValidation
  validators.
- `src/Domain/SampleWidget.cs` — trivial sample entity (e.g. `Id`, `Name`, `CreatedAt`).
- `src/Infrastructure/Persistence/AppDbContext.cs`, `Migrations/` — EF Core 10 + Npgsql,
  `DbSet<SampleWidget>`, one initial migration.
- `src/Infrastructure/Auth/` — JWT bearer options bound to the Keycloak realm's issuer/JWKS URL.
- `src/AppHost/AppHost.csproj`, `Program.cs` — Aspire orchestration: Postgres, Redis, Api, and the
  `web` npm app as Aspire resources.
- `tests/Api.IntegrationTests/Api.IntegrationTests.csproj` — xUnit + Testcontainers.
- `tests/Api.IntegrationTests/HealthEndpointTests.cs` — integration test spinning a real Postgres
  container via Testcontainers, asserting `/health` returns 200.
- `Directory.Build.props` (optional) — shared `TargetFramework net10.0`, nullable/warnings config.

**Frontend (React + Vite + TypeScript)**
- `web/package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts` — Vite + TS + Tailwind
  init.
- `web/src/main.tsx`, `App.tsx` — app shell, React Router v7 setup, TanStack Query
  `QueryClientProvider`.
- `web/src/components/ui/*` — shadcn/ui init output (button, card, etc. — whatever the sample page
  needs).
- `web/src/pages/SampleWidgetsPage.tsx` — one sample page using a shadcn component, calling
  `/health` and the sample endpoint through the generated client via TanStack Query.
- `web/src/lib/api-client/` — generated output from NSwag (git-ignored or checked in — decide in
  plan stage; recommend checked in for a scaffold repo so CI doesn't need a live API to build).
- `web/src/auth/` — OIDC + PKCE auth context (e.g. `oidc-client-ts` or `react-oidc-context`)
  stubbed against the Keycloak realm; a route guard for the protected page's protected call.
- `web/src/pages/SampleWidgetsPage.test.tsx` — one Vitest + Testing Library component test.
- `web/vitest.config.ts`, `web/src/setupTests.ts`.
- `web/Dockerfile`.

**Shared / tooling**
- `docker-compose.yml` — Postgres, Redis, api, web services (fallback local-run path).
- `src/Api/Dockerfile`.
- `.github/workflows/ci.yml` — two jobs: `dotnet build && dotnet test` (with Docker available for
  Testcontainers) and `npm ci && npm run build && npm test` under `web/`.
- `docs/adr/0001-tech-stack.md` — recreate the ADR reflecting the final decision (content source:
  MLP-45 ticket description + sign-off comment — React SPA + .NET 10, not the earlier Next.js draft).
- `README.md` — prerequisites (.NET 10 SDK, Node LTS, Docker), how to run via Aspire
  (`dotnet run --project src/AppHost`) or `docker compose up`, how to run each test suite, repo
  layout explanation (why mono-repo, what `src/` vs `web/` contain).
- `.gitignore` — .NET (`bin/`, `obj/`) + Node (`node_modules/`, `dist/`) + IDE + `.env`.
- `.env.example` — Postgres connection string, Redis URL, Keycloak issuer/client IDs (dummy values).
- `deploy/keycloak/realm-export.json` (or similar) — a minimal realm/client/user export so a new
  engineer (or CI) can spin up Keycloak in dev mode with a ready-made client for the OIDC flow.

## Interfaces & contracts

- `GET /health` → `200 OK`, body `{ "status": "healthy" }` (no auth). Also exercised by the
  integration test and the frontend's sample call.
- `GET /api/v1/sample-widgets` → `200 OK`, `SampleWidgetDto[]` (`{ id: string, name: string,
  createdAt: string }`), no auth — proves EF Core + Postgres read path.
- `GET /api/v1/sample-widgets/protected` → requires `Authorization: Bearer <JWT>` issued by the
  local Keycloak realm; `401` with no/invalid token, `200` with the same `SampleWidgetDto[]` shape
  otherwise. This is the AC's "protected sample endpoint."
- OpenAPI spec served at `/openapi/v1.json` (ASP.NET Core built-in generator) and human-readable at
  `/scalar/v1` (Scalar UI). The frontend's NSwag client generation script points at the JSON spec.
- EF Core: one migration adding a `SampleWidgets` table (`Id uuid pk`, `Name text`,
  `CreatedAt timestamptz`).
- JWT bearer config: `Authority` = local Keycloak realm issuer URL, `Audience` = the API client ID,
  standard signature/issuer/audience/lifetime validation — no custom claims logic (RBAC is
  MLP-41/42's scope).

## Validation & edge cases

- `/health` and the OpenAPI/Scalar endpoints must always be anonymous — do not accidentally wrap
  them in the same auth requirement as the protected sample endpoint.
- Protected endpoint: missing `Authorization` header → 401; malformed/expired/wrong-issuer JWT →
  401 (default ASP.NET Core JWT bearer behavior — don't swallow it into a 500).
  A generic 500 handler (the "centralized error handling" AC) should catch unhandled exceptions
  and return a consistent `application/problem+json` body without leaking stack traces.
- EF Core migration must be idempotent on repeated `dotnet ef database update` runs (standard EF
  Core migration behavior — just don't hand-edit generated migration files).
- Frontend: the generated API client call sites should handle the loading/error states TanStack
  Query already models — no need for custom retry logic beyond the library defaults for this ticket.
- CI: the `dotnet test` job must have Docker available for Testcontainers (GitHub-hosted
  `ubuntu-latest` runners have Docker preinstalled — confirm the workflow doesn't run on a runner
  without it).

## Non-functional requirements

- **Security:** JWT validation only in this ticket (no RBAC policy logic) — restated from the
  ticket's explicit "Out of scope." Don't commit real Keycloak secrets; `.env.example` holds dummy
  placeholders only, real values via local `.env` (git-ignored) or user secrets.
- **Observability:** Serilog console sink minimum (structured JSON acceptable), OpenTelemetry
  tracing wired for ASP.NET Core + EF Core instrumentation — exporter can be console/no-op for this
  ticket (no observability backend is in scope).
- **Performance:** none specified beyond "boots and responds" — no load/perf targets for a
  scaffold ticket.
- **i18n:** not applicable — no user-facing business copy is introduced.

## Test strategy

- **Backend unit/integration:** one xUnit integration test (`HealthEndpointTests`) using
  Testcontainers to run against a real Postgres instance, asserting `/health` → 200. This is the
  ticket's explicit minimum ("one passing test... Testcontainers spins Postgres").
- **Frontend:** one Vitest + Testing Library component test rendering `SampleWidgetsPage` and
  asserting the shadcn component and fetched content render (mock the generated API client at the
  network boundary — don't require a live backend for this test).
- **Manual/CI-level verification of the full AC list:** `dotnet test`, `npm run build`, `npm test`,
  a manual curl of `/health` and the protected endpoint (with and without a token), and
  `dotnet run --project src/AppHost` (or `docker compose up`) bringing up all four
  services — these become the plan stage's verification steps, not additional automated tests.

## Out of scope

- Any MLP-9…MLP-17 business feature.
- Full RBAC/SCIM implementation (MLP-41/42) — only JWT validation + one `[Authorize]`-equivalent
  endpoint here.
- SignalR, Hangfire, TanStack Table, Recharts, React Hook Form + Zod, Playwright — these are part
  of the overall MLP-45 stack decision but are wired up by later feature tickets, not this one.
- Production infra hardening, monitoring dashboards, cost optimization, real Azure/hosting setup.

## Open questions (for product owner / team confirmation)

1. **Generated API client: commit to git or generate on every build?** Recommend committing it for
   a scaffold repo (simpler CI, no chicken-and-egg with a live API), but confirm before plan stage
   locks it in.
2. **Keycloak for local dev — dev-mode container with a checked-in realm export, or documented
   manual setup steps?** Recommended: checked-in minimal realm export under `deploy/keycloak/` so
   `docker compose up` / Aspire gives a fully working OIDC flow with zero manual console clicks.
3. **.NET 10 SDK / EF Core 10 availability** — confirm the target dev machines and GitHub Actions
   runners can install .NET 10 SDK (should be fine via `actions/setup-dotnet`, but worth a sanity
   check before the plan stage assumes it).
