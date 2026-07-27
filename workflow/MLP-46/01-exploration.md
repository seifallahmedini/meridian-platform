# Exploration — MLP-46: Scaffold the project skeleton (.NET 10 API + React SPA) per the MLP-45 stack decision

## Ticket summary

- **User story:** As an engineer, I want a running project skeleton on the approved stack (MLP-45), so that every feature ticket (MLP-9 … MLP-17) starts from a consistent, tested, deployable baseline instead of setting up infrastructure per feature.
- **Depends on:** MLP-45 (tech-stack decision) — **Done**, signed off 2026-07-26. Decision is now final: **decoupled React SPA + .NET 10 backend** (see below), *not* the Next.js/tRPC/Prisma stack that was originally spiked.
- **Priority / epic:** P0, Story Points 8, Type "Foundation / scaffolding". No parent epic set; blocks feature tickets MLP-9…MLP-17.
- **Acceptance criteria:**
  1. `dotnet test` passes (incl. the Testcontainers integration test) and the API boots with `/health` returning 200 and OpenAPI served.
  2. The React app builds, runs, renders the sample shadcn page, and successfully calls `/health` through the generated client.
  3. `npm test` / Vitest passes on the frontend.
  4. A protected sample endpoint rejects anonymous calls and accepts a valid Keycloak-issued JWT.
  5. `.NET Aspire` (or docker-compose) brings up API + Postgres + Redis + web with one command.
  6. CI runs both test suites green on a pull request.
  7. README lets a new engineer clone, run both apps, and execute both test suites without tribal knowledge.
- **Out of scope:** any MLP-9…MLP-17 business feature; full RBAC/SCIM (MLP-41/42 own that); production infra hardening, monitoring dashboards, cost optimisation.

### The MLP-45 decision, as signed off

- **Frontend:** React SPA — TypeScript + Vite, shadcn/ui + Tailwind CSS, React Router v7, TanStack Query (+ TanStack Table, Recharts for later feature work), React Hook Form + Zod, typed API client generated from the backend's OpenAPI spec (NSwag or Kiota).
- **Backend:** .NET 10, ASP.NET Core Minimal APIs, built-in OpenAPI generation + Scalar UI, EF Core 10 + Npgsql, FluentValidation, SignalR (realtime — later ticket), Hangfire (background jobs — later ticket), ASP.NET Core policy-based authorization.
- **Auth/SSO:** Keycloak — OIDC + PKCE from React, JWT bearer validated by .NET.
- **Data/cross-cutting:** PostgreSQL, Redis (cache + rate limiting), OpenTelemetry + Serilog, .NET Aspire for local orchestration.
- **Testing:** xUnit + Testcontainers (backend), Vitest (+ Playwright later) for frontend.
- **Hosting:** Docker → Azure Container Apps + Azure Database for PostgreSQL (or any container host + Neon) — not part of this ticket's scope.

## ⚠️ Critical finding: the repo is currently an empty slate

`git log` shows this repo already went through one full scaffold-and-revert cycle under the MLP-45 ticket, on the same day (2026-07-26):

- Commits `fb1b94f`…`959cfd2` scaffolded a **Next.js + tRPC + Prisma + pnpm** app (App Router, `server/routers/*`, `prisma/schema.prisma`, a health tRPC procedure, Vitest config, a CI workflow, an ADR at `docs/adr/0001-tech-stack.md`, a README) — this was an earlier draft/exploration of the architecture spike, evidently before the team's decision was finalized.
- Commit `7b38ec1` ("chore: remove unused configuration files and code") deleted **all** of that: the entire Next.js app, Prisma schema, tRPC routers, the CI workflow, `.env.example`, `README.md`, and **`docs/adr/0001-tech-stack.md`**.
- Commit `9d56cb9` then removed the leftover `workflow/MLP-45/*` ticket-to-code workflow artifacts (the previous run's exploration/plan/report files) as "obsolete."

The current repo tree (excluding `.git` and the `ticket-to-code-marketplace` tooling checkout) contains only:

```
.claude/settings.json
```

There is **no existing application code, no README, no `docs/adr/` directory, no CI workflow, and no `.gitignore`** at the repo root. This ticket is a scaffold onto a genuinely blank repository, not an incremental change to existing code. Every acceptance criterion requires net-new files; there is nothing in-repo to pattern-match against.

Implication for MLP-45's own AC ("The decision is recorded as an ADR committed to the repo (`docs/adr/0001-tech-stack.md`)") — that ADR file was deleted along with the Next.js scaffold and was never re-added. MLP-46's description explicitly lists `docs/adr/0001-tech-stack.md` as part of its own scope ("ADR at docs/adr/0001-tech-stack.md committed (from MLP-45)"), so recreating it is this ticket's responsibility, not a gap to raise back on MLP-45.

## Repository at a glance

- **Git remote:** `https://github.com/seifallahmedini/meridian-platform`, default branch `main`. `gh` CLI is authenticated (scopes: `repo`, `read:org`, `gist`) — no separate GitHub connector needed; `git`/`gh` in the sandbox is the path for later stages (per shared conventions' fallback rule).
- **Stack to scaffold:** .NET 10 (ASP.NET Core Minimal APIs) backend + React 18/19 + Vite + TypeScript frontend, per MLP-45 above. Nothing is installed or configured yet — no `.sln`, no `package.json`, no Dockerfiles.
- **Build/test commands:** none exist yet; they are deliverables of this ticket (`dotnet test`, `dotnet run`, `npm run build`, `npm test`/`vitest`, `docker compose up` or `aspire run`).
- **Tooling already present:** the `ticket-to-code-marketplace/` directory (this workflow's own tooling, unrelated to the app) and `.claude/settings.json` (enables the `ticket-to-code` plugin). Neither is part of the product codebase.
- **Architecture notes:** none exist in-repo (the only ADR was deleted). The authoritative source for architecture decisions right now is the MLP-45 Jira ticket description + sign-off comment, transcribed above.

## Requirement → code map

Since there is no existing code, this maps each acceptance criterion to the **new** files/directories that will need to be created, not to existing locations.

| Acceptance criterion | Where it lands (files/modules to create) | Notes |
| --- | --- | --- |
| `dotnet test` passes incl. Testcontainers integration test; API boots with `/health` returning 200 + OpenAPI served | `src/Api/` (Minimal API host, `Program.cs`, `/health` endpoint, OpenAPI+Scalar wiring), `src/Application/`, `src/Domain/`, `src/Infrastructure/` (EF Core `DbContext`, Npgsql config, migrations), `tests/Api.IntegrationTests/` (xUnit + Testcontainers Postgres fixture), `MeridianPlatform.sln` | Layered solution per ticket description: Api / Application / Domain / Infrastructure + a test project |
| React app builds/runs, renders sample shadcn page, calls `/health` via generated client | `web/` (Vite + TS scaffold), `web/src/App.tsx` or a routed page, `web/src/components/ui/*` (shadcn), `web/src/lib/api-client/` (generated from OpenAPI via NSwag/Kiota) | Generated client needs the API's OpenAPI spec as an input — establishes an API→web build-order dependency |
| `npm test` / Vitest passes on frontend | `web/vitest.config.ts`, `web/src/**/*.test.tsx` (one sample component test) | |
| Protected sample endpoint rejects anonymous, accepts valid Keycloak JWT | `src/Api/Endpoints/` (a `[Authorize]`-equivalent minimal-API endpoint), `src/Api/Program.cs` (JWT bearer auth against Keycloak issuer/JWKS), plus a Keycloak realm/client config for local dev (likely under `deploy/keycloak/` or an Aspire resource) | Needs a running Keycloak instance for the integration test/local run — realm export or dev-mode container |
| `.NET Aspire` (or docker-compose) brings up API + Postgres + Redis + web with one command | `src/AppHost/` (Aspire AppHost project) or `docker-compose.yml` at repo root, `Dockerfile` under `src/Api/` and `web/` | Ticket explicitly wants Aspire orchestrating web too — Aspire's Node/npm app hosting integration needed for the React app |
| CI runs both test suites green on PR | `.github/workflows/ci.yml` | Needs two jobs/matrix legs: dotnet build+test, npm build+test |
| README lets new engineer clone, run both apps, run both test suites | `README.md` at repo root | Must cover prerequisites (.NET 10 SDK, Node version, Docker), Aspire/compose run, test commands |
| (MLP-46 scope item) ADR committed | `docs/adr/0001-tech-stack.md` | Recreate reflecting the final MLP-45 decision (React SPA + .NET 10), not the earlier Next.js draft that was deleted |
| Repo structure documented (mono-repo vs two repos) | README or a short `docs/` note | Ticket says "agreed and documented" — since one repo already exists and the ticket scaffolds both apps into it, the implied decision is mono-repo; state that explicitly rather than leaving it implicit |

## Files likely to change (create)

Everything below is a new file/directory — there is nothing to modify, only to add:

- `MeridianPlatform.sln` — solution file tying together Api/Application/Domain/Infrastructure/tests
- `src/Api/*`, `src/Application/*`, `src/Domain/*`, `src/Infrastructure/*` — layered backend, Minimal API host, EF Core `DbContext` + initial migration + sample entity, FluentValidation validators, Serilog + OpenTelemetry setup, centralized exception-handling middleware, JWT bearer auth config
- `tests/Api.IntegrationTests/*` — xUnit project, Testcontainers Postgres fixture, one passing integration test
- `web/*` — Vite React TS app: `package.json`, `vite.config.ts`, Tailwind + shadcn/ui init, `src/main.tsx`, a sample routed page, React Router v7 setup, TanStack Query provider, generated API client output directory, OIDC/PKCE auth context stub, `vitest.config.ts` + one sample component test
- `src/AppHost/*` (if using Aspire) and/or `docker-compose.yml` + `Dockerfile`s for `src/Api` and `web`
- `.github/workflows/ci.yml` — build+test both apps
- `docs/adr/0001-tech-stack.md` — the ADR (recreate; previous version was deleted)
- `README.md`, `.gitignore`, `.env.example` — root-level docs/config (also deleted previously, need recreating)

## Patterns & conventions to follow

None exist in-repo — this ticket is establishing the conventions, not following them. Sources of truth to align with instead:

- The MLP-45 ticket description/sign-off comment (transcribed above) is the binding spec for every technology choice — treat any deviation as something to flag, not decide unilaterally.
- The deleted Next.js scaffold (commits `fb1b94f`–`c049d41`, reachable via `git show <sha>:<path>` even though the files are gone from `HEAD`) may still be a useful *reference* for repo-hygiene conventions (`.gitignore` shape, `.env.example` structure, CI workflow shape) even though the stack itself changed — worth a quick look during planning, but not to be copied wholesale since the runtime is now .NET+React, not Next.js.
- General .NET/ASP.NET Core and Vite/React community conventions apply by default given nothing in-repo overrides them (e.g. standard Minimal API `Program.cs` organization, standard Vite project layout).

## Risks & open questions

- **Mono-repo vs. two-repo structure is only implied, not decided.** The ticket asks for this to be "agreed and documented." Since the target GitHub repo (`meridian-platform`) is singular and both apps scaffold into it per the AC list, proceeding as mono-repo (`src/` for .NET, `web/` for React) is the reasonable default — but this should be stated explicitly in the annotated instructions/plan rather than assumed silently.
- **Aspire hosting the React app** is a real integration risk: .NET Aspire's Node.js/npm app-hosting support needs to correctly proxy/orchestrate a Vite dev server alongside the API, Postgres, and Redis containers. If this proves brittle, docker-compose is the ticket's explicitly allowed fallback ("`.NET Aspire` (or docker-compose)").
- **Keycloak for local dev** needs either a checked-in realm export/dev-mode container config or clear README instructions — otherwise the "protected endpoint rejects anonymous / accepts valid JWT" AC and the OIDC+PKCE frontend flow can't be exercised locally. No existing Keycloak config to reference.
- **OpenAPI client generation tool choice (NSwag vs. Kiota)** is left open by both MLP-45 and MLP-46 ("NSwag or Kiota") — this should be pinned to one tool in the technical instructions/plan stage rather than left ambiguous, since it affects build tooling and generated-code location on the frontend.
- **Testcontainers requires Docker available in whatever environment runs `dotnet test`**, including CI — the CI workflow must provision Docker-in-Docker or use a runner with Docker pre-installed (GitHub-hosted `ubuntu-latest` runners have it, so this is likely fine, but worth confirming explicitly in the plan).
- **No test coverage exists anywhere** (expected, given the blank repo) — not a gap to flag against existing code, just a reminder that this ticket's "one passing test" per suite is the entire initial coverage baseline.
- **Scope creep risk:** the ticket explicitly excludes SignalR, Hangfire, full RBAC/SCIM, TanStack Table, Recharts, React Hook Form+Zod, and Playwright even though MLP-45 lists them as part of the overall stack — those are wired up by later feature tickets, not MLP-46. The plan stage should resist adding them now.
- **.NET 10 and EF Core 10 are pinned versions** — confirm the .NET 10 SDK is actually GA/available in the target dev and CI environments before planning around it (ticket calls it "the current LTS," consistent with a 2026 timeframe).
