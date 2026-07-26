# ADR 0001: Technology Stack for the Meridian Logistics Platform

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Engineering team (MLP-45)
**Related tickets:** MLP-45 (decision), MLP-46 (this scaffold)

## Context

Meridian Logistics Platform needs to support booking forms, real-time shipment tracking,
warehouse/dock scheduling, customs documentation, freight audit & billing, analytics/reporting,
enterprise RBAC with SSO/SCIM, and a public REST API with webhooks. This is the first
architectural decision for the platform and blocks every feature epic (MLP-9…MLP-17).

An earlier exploratory scaffold on this repository used Next.js + tRPC + Prisma. That scaffold
predated this decision and has been removed; it should not be treated as prior art for this ADR.

## Decision

A decoupled **React SPA frontend** and a **.NET 10 backend**, kept type-safe across the network
boundary via a client generated from the backend's OpenAPI spec.

### Frontend — React SPA

- Language/build: TypeScript + Vite
- UI: React + shadcn/ui + Tailwind CSS (accessible primitives support WCAG 2.1 AA, e.g. MLP-18)
- Routing: React Router v7
- Server state: TanStack Query · Tables: TanStack Table · Charts: Recharts
- Forms + validation: React Hook Form + Zod
- API client: TypeScript client generated from the backend's OpenAPI spec via **NSwag**

### Backend — .NET 10 (ASP.NET Core)

- API: ASP.NET Core Minimal APIs; built-in OpenAPI generation + Scalar UI for the public API (MLP-44)
- ORM: EF Core 10 with Npgsql (Dapper reserved for hot analytics queries only)
- Validation: FluentValidation (mirrors the frontend's Zod rules)
- Real-time tracking (MLP-11): SignalR
- Background jobs (invoice ingestion, tracking polls, freight audit, notifications): Hangfire;
  graduate to MassTransit + RabbitMQ if true event-driven messaging becomes necessary
- Authorization (RBAC, MLP-41): ASP.NET Core policy-based authorization

### Enterprise SSO + SCIM (MLP-41/42)

**Keycloak** (open-source, SAML/OIDC + SCIM). React authenticates via OIDC + PKCE; .NET validates
the issued JWT. Alternatives considered: Microsoft Entra ID (if standardizing on Azure), WorkOS.

### Database & cross-cutting

- Database: PostgreSQL
- Cache + public-API rate limiting (MLP-44, 1000 req/min): Redis + ASP.NET Core's built-in rate limiter
- Observability: OpenTelemetry + Serilog
- Local orchestration: .NET Aspire (wires up Postgres, Redis, the API, and the React app)
- Testing: xUnit + Testcontainers (backend); Vitest + Playwright (frontend)
- Packaging/hosting: Docker; Azure Container Apps + Azure Database for PostgreSQL (or any
  container host + Neon) — not addressed by this ADR's scaffold ticket

## Alternatives considered

- **Next.js full-stack (React + API routes), Prisma, tRPC** — evaluated in an early spike on this
  repo. Rejected: a single Next.js deployment couples frontend and backend release cadence and
  doesn't cleanly support the platform's need for a versioned public REST API + webhooks (MLP-44)
  consumed by third parties, nor .NET-ecosystem strengths needed for background job processing
  (Hangfire) and enterprise auth patterns already standard in the target operating environment.
- **Node.js/NestJS backend** instead of .NET — rejected in favor of .NET 10 for stronger typed
  background-job tooling (Hangfire), team familiarity, and first-class OpenTelemetry/Serilog support.
- **Microsoft Entra ID / WorkOS** instead of Keycloak — kept as fallback options; Keycloak chosen
  first for being open-source and self-hostable, avoiding per-seat SSO/SCIM vendor costs at this stage.

## Consequences

- Two independently deployable apps (API, SPA) instead of one full-stack app — more moving parts
  locally, mitigated by .NET Aspire (or docker-compose) providing single-command local orchestration.
- A generated OpenAPI client is the frontend/backend contract; keeping the OpenAPI spec accurate
  is now load-bearing for type safety across the boundary.
- Feature tickets (MLP-9…MLP-17) build on the scaffold delivered in MLP-46 rather than provisioning
  infrastructure per feature.
