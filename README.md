# Meridian Logistics Platform

A decoupled **React SPA** frontend and **.NET 10** backend. See
[`docs/adr/0001-tech-stack.md`](docs/adr/0001-tech-stack.md) for the full stack decision and
rationale.

This repository is a mono-repo: the .NET solution lives under `src/` and `tests/`, the React app
lives under `web/`. One repo keeps the API's OpenAPI spec and the frontend's generated client in
sync without cross-repo coordination.

## Repository layout

```
src/
  Api/             ASP.NET Core Minimal API host (OpenAPI/Scalar, auth, /health)
  Application/      Use-case services, DTOs, FluentValidation validators
  Domain/           Entities
  Infrastructure/   EF Core DbContext, migrations, Npgsql
  AppHost/          .NET Aspire orchestration (Postgres, Redis, Keycloak, Api, web)
tests/
  Api.IntegrationTests/   xUnit + Testcontainers integration tests
web/                       React + Vite + TypeScript SPA (shadcn/ui, TanStack Query, React Router)
deploy/keycloak/           Minimal realm export for local Keycloak (dev only)
docs/adr/                  Architecture decision records
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for Postgres,
  Redis, Keycloak, and the Testcontainers-based integration test)

## Running everything locally

Two equivalent ways to bring up the API, web app, Postgres, Redis, and Keycloak together:

### Option A — .NET Aspire (recommended)

```sh
dotnet run --project src/AppHost
```

Opens the Aspire dashboard, which shows all resources (Postgres, Redis, Keycloak, `api`, `web`)
and their logs/endpoints in one place. The Api applies EF Core migrations automatically on
startup in Development.

### Option B — docker-compose

```sh
docker compose up --build
```

- Api: http://localhost:5299 (`/health`, `/scalar/v1` for the OpenAPI UI)
- Web: http://localhost:4173
- Keycloak: http://localhost:8080 (admin console login: `admin` / `admin`)

Copy `.env.example` to `.env` first if you want to override any defaults; both run paths already
have working defaults out of the box.

## Authentication

A local Keycloak realm (`meridian`) is imported automatically on startup from
[`deploy/keycloak/realm-export.json`](deploy/keycloak/realm-export.json). It ships with:

- A public client `meridian-web` (used by the React app's OIDC + PKCE login)
- A bearer-only client `meridian-api` (the Api's expected JWT audience)
- A test user: `testuser` / `Testpass123!`

Log in through the web app's "Log in with Keycloak" button to exercise the protected sample
endpoint (`GET /api/v1/sample-widgets/protected`).

## Running the test suites

Backend (xUnit + Testcontainers — spins up a real Postgres container per run, so Docker must be
running):

```sh
dotnet test
```

Frontend (Vitest + Testing Library):

```sh
cd web
npm ci
npm test
```

## Regenerating the typed API client

The frontend's API client (`web/src/lib/api-client/generated-client.ts`) is generated from the
Api's OpenAPI spec via [NSwag](https://github.com/RicoSuter/NSwag) and committed to the repo.
Regenerate it after changing any Api endpoint:

```sh
# 1. Start the Api (any of the options above, or `dotnet run --project src/Api`)
cd web
npm run generate:api-client
```

## CI

`.github/workflows/ci.yml` runs on every push and pull request: `dotnet build && dotnet test` for
the backend, and `npm run build && npm test` for the frontend.
