# Implementation Report — MLP-46: Scaffold the project skeleton (.NET 10 API + React SPA)

## Summary

Scaffolded the Meridian Logistics Platform project skeleton per the MLP-45 stack decision onto a
genuinely empty repository. Backend: layered .NET 10 solution (Api/Application/Domain/Infrastructure)
with EF Core 10 + Npgsql, FluentValidation, Serilog, OpenTelemetry, OpenAPI + Scalar, JWT bearer
auth. Frontend: Vite + TypeScript + Tailwind v4 + shadcn/ui SPA with React Router v7, TanStack
Query, an NSwag-generated typed API client, and OIDC + PKCE login against Keycloak. Shared/tooling:
.NET Aspire AppHost, Dockerfiles + docker-compose fallback, GitHub Actions CI, ADR, README.

## PR

https://github.com/seifallahmedini/meridian-platform/pull/4 — both CI checks (`Backend (.NET)`,
`Frontend (web)`) passing.

## Branch

`feature/MLP-46-project-skeleton-scaffold` (14 commits, 75 files, all net-new — nothing existing
was modified since the repo had no application code before this ticket).

## Files changed

See the PR diff. Highlights: `src/{Api,Application,Domain,Infrastructure,AppHost}`,
`tests/Api.IntegrationTests`, `web/`, `docker-compose.yml`, `.github/workflows/ci.yml`,
`docs/adr/0001-tech-stack.md`, `deploy/keycloak/realm-export.json`, `README.md`.

## Test results

- `dotnet test` on `MeridianPlatform.slnx` (Release): 1/1 passing — xUnit + Testcontainers
  integration test asserting `/health` → 200 against a real ephemeral Postgres container.
- `npm run build && npm test` in `web/`: build succeeds, 1/1 Vitest + Testing Library test passing.
- CI (`.github/workflows/ci.yml`) green on the PR: `Backend (.NET)` 47s, `Frontend (web)` 20s.

## Verified live (not just written)

Ran the actual local-dev paths end-to-end, including a real browser-driven Keycloak login via
Chrome automation, rather than trusting that the written config would work:

- `docker compose up` from a clean `docker compose down` state brought up Postgres, Redis,
  Keycloak, api, and web with one command. `/health` → 200, OpenAPI + Scalar served,
  `GET /api/v1/sample-widgets` → 200 with EF Core migrations auto-applied in dev.
- Logged in through the web app's "Log in with Keycloak" button against a real local Keycloak
  realm (OIDC + PKCE, `deploy/keycloak/realm-export.json`), and confirmed
  `GET /api/v1/sample-widgets/protected` → `401` anonymously and `200` with the issued JWT.
- `dotnet run --project src/AppHost` (.NET Aspire) also brought all 6 resources (Postgres server +
  database, Redis, Keycloak, api, web) to `Running`, and the web app rendered and called the API
  successfully through it (health + anonymous list confirmed in-browser).

## Bugs found and fixed during verification

Verification surfaced five real bugs the written code didn't reveal until actually exercised:

1. **No CORS policy on the Api** — every browser fetch from the SPA was silently blocked.
   Fixed: `Cors:AllowedOrigins` config + `AddCors`/`UseCors` in `Program.cs`.
2. **Missing `.dockerignore`** — Windows-built `obj/`/`bin/` artifacts (from local `dotnet build`
   runs) leaked into the Docker build context and broke NuGet asset resolution inside the Linux
   container (`Unable to find fallback package folder 'C:\Program Files (x86)\...'`).
3. **Keycloak `KC_HOSTNAME=localhost` fixed every discovery URL to `localhost`**, including
   `jwks_uri` — unreachable from inside the Api's own container (its `localhost` is itself, not
   Keycloak). Fixed with `KC_HOSTNAME_BACKCHANNEL_DYNAMIC=true`, which lets backchannel URLs
   (jwks_uri, token_endpoint) resolve per the actual requesting host while the issuer stays fixed
   to match browser-issued tokens.
4. **`depends_on: condition: service_started`** let the Api race Keycloak's boot and permanently
   cache a failed OIDC discovery fetch for the process's lifetime. Fixed with a real Keycloak
   healthcheck (raw HTTP request via bash's `/dev/tcp`, no curl/wget in the image) and
   `service_healthy` in compose / `WithHttpHealthCheck` + `WaitFor` in Aspire.
5. **Aspire-specific**: a resource-name collision (`AddDatabase("Postgres", ...)` colliding
   case-insensitively with the server resource named `"postgres"`) and an invalid endpoint-proxy
   configuration when a non-container resource's `Port` and `TargetPort` were equal.

All five are fixed and re-verified; see commit `77629f6` and `6bc2472` for details.

## Deferred / follow-up (not a blocker for this ticket)

- `Microsoft.OpenApi` 2.0.0 (pulled in transitively by `Microsoft.AspNetCore.OpenApi` 10.0.0) has
  a known NuGet advisory (NU1903, high severity). Bumping to the patched 3.x line risks breaking
  OpenAPI/Scalar generation since `Microsoft.AspNetCore.OpenApi` 10.0.0 GA pins 2.0.0 internally —
  left as a follow-up dependency-update ticket rather than risking instability here.
- Generated API client (`web/src/lib/api-client/generated-client.ts`) is committed to git per the
  technical instructions' recommendation, regenerated via `npm run generate:api-client`.

## Ticket status

MLP-46 transitioned to **In Review** with a summary comment linking the PR, test results, and the
bugs found/fixed during verification.
