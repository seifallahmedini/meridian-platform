# Implementation Plan — MLP-46: Scaffold the project skeleton (.NET 10 API + React SPA)

## Branch
`feature/MLP-46-project-skeleton-scaffold`

## Steps

### Step 1 — Repo baseline (est: S)
- Files: `.gitignore`, `MeridianPlatform.sln` (empty solution), `Directory.Build.props`
  (`TargetFramework=net10.0`, nullable/warnings-as-errors), `docs/adr/0001-tech-stack.md`
- Change: Recreate the ADR (React SPA + .NET 10, per the signed-off MLP-45 decision — content
  transcribed in `01-exploration.md`), add a .NET+Node `.gitignore` (bin/obj, node_modules/dist,
  `.env`, IDE files), create the empty solution file.
- Verify: `git status` shows only intended new files; `dotnet sln list` shows the empty solution.

### Step 2 — Domain + Infrastructure (est: M)
- Files: `src/Domain/Domain.csproj`, `src/Domain/SampleWidget.cs`,
  `src/Infrastructure/Infrastructure.csproj`, `src/Infrastructure/Persistence/AppDbContext.cs`,
  `src/Infrastructure/Persistence/Migrations/*`
- Change: `SampleWidget` entity (`Id: Guid`, `Name: string`, `CreatedAt: DateTimeOffset`).
  `AppDbContext : DbContext` with `DbSet<SampleWidget>`, Npgsql provider registration point (config
  passed in from Api). Generate the initial EF Core migration (`SampleWidgets` table).
  Add both projects to `MeridianPlatform.sln`.
- Verify: `dotnet build` succeeds; `dotnet ef migrations list --project src/Infrastructure`
  shows the one migration (requires a connection string — use design-time factory if needed).

### Step 3 — Application layer (est: S)
- Files: `src/Application/Application.csproj`, `src/Application/SampleWidgets/SampleWidgetDto.cs`,
  `src/Application/SampleWidgets/SampleWidgetService.cs`,
  `src/Application/SampleWidgets/SampleWidgetValidator.cs` (FluentValidation)
- Change: DTO mapping from `SampleWidget`, a thin service (`GetAllAsync`) reading via
  `AppDbContext`, a trivial FluentValidation validator wired for later POST use (even if no write
  endpoint ships yet, per "FluentValidation... configured" AC — validate the DTO shape).
- Verify: `dotnet build` succeeds; project references Domain + Infrastructure correctly.

### Step 4 — Api host: cross-cutting + health (est: M)
- Files: `src/Api/Api.csproj`, `src/Api/Program.cs`, `src/Api/Endpoints/HealthEndpoints.cs`,
  `src/Api/Middleware/ExceptionHandlingMiddleware.cs` (or `IExceptionHandler`),
  `appsettings.json`, `appsettings.Development.json`
- Change: Minimal API host wiring: Serilog (console sink, structured), OpenTelemetry
  (ASP.NET Core + EF Core instrumentation, console/no-op exporter), built-in OpenAPI
  (`AddOpenApi`/`MapOpenApi`) + Scalar UI at `/scalar/v1`, centralized exception handler returning
  `application/problem+json`, `GET /health` → `200 { "status": "healthy" }` (anonymous).
- Verify: `dotnet run --project src/Api`; `curl localhost:<port>/health` → 200; `/openapi/v1.json`
  and `/scalar/v1` respond.

### Step 5 — Sample endpoints + JWT auth (est: M)
- Files: `src/Api/Endpoints/SampleEndpoints.cs`, `src/Infrastructure/Auth/` (JWT bearer options
  binding), `appsettings.json` (Keycloak `Authority`/`Audience` config section)
- Change: `GET /api/v1/sample-widgets` (anonymous, calls `SampleWidgetService`),
  `GET /api/v1/sample-widgets/protected` (`.RequireAuthorization()`), JWT bearer auth registered
  against the local Keycloak realm issuer/JWKS (`AddAuthentication().AddJwtBearer(...)`).
- Verify: manual curl — anonymous endpoint returns 200 with empty/seeded array; protected endpoint
  returns 401 with no token (full "valid token → 200" check happens once Keycloak is up in Step 9).

### Step 6 — Backend test project (est: M)
- Files: `tests/Api.IntegrationTests/Api.IntegrationTests.csproj`,
  `tests/Api.IntegrationTests/HealthEndpointTests.cs`,
  `tests/Api.IntegrationTests/Fixtures/PostgresFixture.cs` (Testcontainers)
- Change: xUnit project referencing `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`)
  + `Testcontainers.PostgreSql`. One test: spin a Postgres container, point the factory's
  connection string at it, apply migrations, assert `GET /health` → 200.
- Verify: `dotnet test` — the one test passes (requires Docker running locally/in CI).

### Step 7 — Frontend scaffold + app shell (est: M)
- Files: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`,
  `web/tailwind.config.ts`, `web/postcss.config.js`, `web/src/main.tsx`, `web/src/App.tsx`,
  `web/components.json` (shadcn config), `web/src/components/ui/*` (button/card via shadcn CLI)
- Change: `npm create vite@latest web -- --template react-ts`; init Tailwind; init shadcn/ui;
  add React Router v7 (`createBrowserRouter`) and a `QueryClientProvider` (TanStack Query) in
  `App.tsx`/`main.tsx`.
- Verify: `npm run build` in `web/` succeeds; `npm run dev` serves the default shell.

### Step 8 — Typed API client generation (est: M)
- Files: `web/nswag.json` (or `openapitsclient` config), `web/package.json` (add a
  `generate:api-client` script), `web/src/lib/api-client/*` (generated, committed)
- Change: Wire NSwag to read the running Api's `/openapi/v1.json` and emit a TS fetch client into
  `web/src/lib/api-client/`. Run it once against Step 4/5's Api and commit the output.
- Verify: generated client compiles (`npm run build`); a quick script call to the client's health
  method against a running Api returns the expected shape.

### Step 9 — Sample page, OIDC/PKCE auth context (est: M)
- Files: `web/src/pages/SampleWidgetsPage.tsx`, `web/src/auth/AuthProvider.tsx` (or
  `react-oidc-context` config), `web/src/auth/ProtectedRoute.tsx`,
  `deploy/keycloak/realm-export.json`
- Change: Minimal realm export (one client, one test user) for local Keycloak dev-mode container.
  `SampleWidgetsPage` uses a shadcn component, TanStack Query + the generated client to call
  `/health` and `/api/v1/sample-widgets`; OIDC+PKCE login flow stubbed against the local Keycloak
  realm; a route/button that calls the protected endpoint once logged in.
- Verify: with Keycloak running (Step 11's compose), manually log in via the stubbed flow and
  confirm the protected call succeeds; logged-out state shows the anonymous call only.

### Step 10 — Frontend test (est: S)
- Files: `web/vitest.config.ts`, `web/src/setupTests.ts`,
  `web/src/pages/SampleWidgetsPage.test.tsx`
- Change: Vitest + Testing Library config; one component test rendering `SampleWidgetsPage` with
  the generated API client mocked at the network boundary (e.g. `msw` or a manual fetch mock),
  asserting the shadcn component and fetched content render.
- Verify: `npm test` (Vitest) — the one test passes.

### Step 11 — Docker + docker-compose fallback (est: M)
- Files: `src/Api/Dockerfile`, `web/Dockerfile`, `docker-compose.yml`, `.env.example`
- Change: Multi-stage Dockerfiles for Api (dotnet SDK build → ASP.NET runtime) and web (node build
  → static/nginx or `vite preview`). `docker-compose.yml` services: `postgres`, `redis`,
  `keycloak` (dev mode, mounts `deploy/keycloak/realm-export.json`), `api`, `web`.
- Verify: `docker compose up` brings up all five services; `/health`, the web app, and Keycloak's
  login page are all reachable.

### Step 12 — .NET Aspire AppHost (est: M)
- Files: `src/AppHost/AppHost.csproj`, `src/AppHost/Program.cs`, `src/AppHost/appsettings.json`
- Change: Aspire distributed application wiring `AddPostgres`, `AddRedis`, `AddProject<Api>`, and
  the `web` app via Aspire's Node/npm hosting integration (`AddNpmApp`), with references so the
  Api gets its Postgres/Redis connection strings injected and `web` gets the Api's base URL.
- Verify: `dotnet run --project src/AppHost` brings up the Aspire dashboard with all resources
  healthy; same manual checks as Step 11 but through Aspire instead of compose.

### Step 13 — CI pipeline (est: S)
- Files: `.github/workflows/ci.yml`
- Change: Two jobs on `push`/`pull_request`: (1) `dotnet-test` — `actions/setup-dotnet` (.NET 10),
  `dotnet build`, `dotnet test` (Docker is preinstalled on `ubuntu-latest` for Testcontainers);
  (2) `web-test` — `actions/setup-node`, `npm ci`, `npm run build`, `npm test` in `web/`.
- Verify: push the branch / open the PR and confirm both jobs run green in GitHub Actions.

### Step 14 — README and final docs pass (est: S)
- Files: `README.md`
- Change: Prerequisites (.NET 10 SDK, Node LTS, Docker), clone steps, how to run
  (`dotnet run --project src/AppHost` or `docker compose up`), how to run each test suite
  (`dotnet test`, `npm test` in `web/`), a short repo-layout explanation (why mono-repo, what
  `src/` vs `web/` contain), and a link to `docs/adr/0001-tech-stack.md`.
- Verify: a fresh read-through by re-following the steps literally (or ask a teammate) — no step
  assumes undocumented tribal knowledge.

### Step 15 — Full acceptance-criteria verification pass (est: S)
- Files: none (verification only)
- Change: none
- Verify: run every command from the ticket's AC list in order — `dotnet test`,
  `dotnet run --project src/Api` + curl `/health` (200) + `/openapi/v1.json`, `npm run build` +
  `npm test` in `web/`, curl the protected endpoint with no token (401) and with a valid Keycloak
  token (200), `dotnet run --project src/AppHost` (or `docker compose up`) bringing up all four
  services with one command, and confirm the CI run from Step 13 is green on the PR.

## Test plan
- Backend: `tests/Api.IntegrationTests/HealthEndpointTests.cs` (Step 6) — Testcontainers Postgres,
  asserts `/health` → 200 through the full DI/EF Core stack.
- Frontend: `web/src/pages/SampleWidgetsPage.test.tsx` (Step 10) — renders the sample page with
  the API client mocked, asserts shadcn UI + fetched content render.
- No additional unit tests planned beyond these two, per the ticket's explicit "one passing test"
  minimum per suite — do not over-build test coverage for a scaffold ticket.

## Migrations / config
- One EF Core migration (Step 2): `SampleWidgets` table.
- New env vars (documented in `.env.example`, Step 11): Postgres connection string, Redis URL,
  Keycloak issuer URL + realm + client ID/secret (dummy values in the example file).
- No feature flags — this ticket has no runtime toggle, it's additive scaffolding only.

## Rollout & rollback
- Low risk: net-new files only, nothing existing is modified or removed (the prior Next.js
  scaffold is already gone from `HEAD`). A single PR merging to `main` is sufficient; no staged
  rollout, canary, or backfill needed.
- Rollback: revert the merge commit — no data migrations against a live database exist yet (no
  environment runs this code today).

## Definition of done
- [ ] `dotnet test` passes (incl. Testcontainers integration test) and the API boots with
      `/health` returning 200 and OpenAPI served — Steps 4, 6, 15
- [ ] The React app builds, runs, renders the sample shadcn page, and successfully calls
      `/health` through the generated client — Steps 7, 8, 9, 15
- [ ] `npm test`/Vitest passes on the frontend — Step 10
- [ ] A protected sample endpoint rejects anonymous calls and accepts a valid Keycloak-issued
      JWT — Steps 5, 9, 15
- [ ] `.NET Aspire` (or docker-compose) brings up API + Postgres + Redis + web with one
      command — Steps 11, 12
- [ ] CI runs both test suites green on a pull request — Step 13
- [ ] README lets a new engineer clone, run both apps, and execute both test suites without
      tribal knowledge — Step 14
- [ ] ADR at `docs/adr/0001-tech-stack.md` committed — Step 1
- [ ] Repository structure (mono-repo) documented — Step 14
