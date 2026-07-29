# Exploration — MLP-18: Single Shipment Creation

## Ticket summary

- **User story:** As a Shipping Coordinator, I want to create a shipment by entering origin,
  destination, cargo details, and service level, so that I can book freight in under 5 minutes
  without switching between systems.
- **Acceptance criteria:**
  1. Form accepts origin/destination with autocomplete from the saved location book; new
     addresses can be saved inline without leaving the form.
  2. Cargo fields capture weight, dimensions, freight class, and a hazmat toggle.
  3. Hazmat toggle reveals required fields: UN number, packing group, emergency contact; form
     submission is blocked with inline field-level errors if any are missing.
  4. Service level selector offers Standard, Expedited, and Guaranteed options.
  5. "Save as Draft" is available at any point; drafts are accessible from a dedicated drafts list.
  6. Page loads and form submits within the 2.5s P95 performance budget.
  7. All form fields are WCAG 2.1 AA accessible (labels, error announcements, keyboard navigation).
- **Priority / epic:** P0, Story Points 5, parent epic **MLP-9 "Shipment Booking"**. Source: PRD §4.1.
- **Sibling tickets under MLP-9** (for scope boundaries, not this ticket's job):
  - MLP-19 — Bulk Shipment Import via CSV
  - MLP-20 — Rate Shopping & Carrier Selection (explicitly gates real "booking" on carrier
    selection — see risk below)
  - MLP-21 — Recurring Shipment Templates

## ⚠️ Critical finding: a prior implementation attempt exists but targets the abandoned stack

A remote branch `feature/MLP-18-single-shipment-creation` already exists (11 commits, last commit
`d813f59` on 2026-07-25) implementing this exact ticket — **but it was branched from the point
right after the original MLP-45 Next.js/tRPC/Prisma scaffold merged, a full day before the team
reconsidered and pivoted to the current .NET 10 + React SPA stack** (see MLP-46's exploration
history). That branch adds `app/shipments/new`, `server/routers/shipment.ts`, tRPC, Prisma
`Shipment`/`Location` models, `pnpm-lock.yaml`, etc. — none of which exist in the repo anymore;
`main` has zero Next.js files today.

**This prior branch cannot be merged or continued as-is.** It is, however, a genuinely useful
**functional reference**: it shows a previously-agreed field set, validation shape (Zod schemas
in `server/schemas/shipment.ts`, `server/schemas/location.ts`), and test cases
(`tests/shipment.test.ts`, `tests/shipment-schema.test.ts`, `tests/location.test.ts`) for this
exact feature. Worth reading for domain shape before designing the .NET/EF Core entities, but
every line of implementation code needs to be rewritten against the current stack.

Flagging for the user/product owner: what should happen to the old branch (`feature/MLP-18-single-
shipment-creation`)? Left alone, deleted, or renamed to something like `archive/...`? I've picked
`feature/MLP-18-single-shipment-creation-v2` as this run's work-branch name to avoid colliding
with it, but that's a naming workaround, not a resolution — I have not deleted or force-pushed
over anything.

## Repository at a glance

- **Stack (current, post-MLP-46):** .NET 10 (ASP.NET Core Minimal API) backend in `src/`
  (Api/Application/Domain/Infrastructure), EF Core 10 + Npgsql, FluentValidation, JWT bearer auth
  against Keycloak; React 19 + Vite + TypeScript SPA in `web/` (Tailwind v4, shadcn/ui, React
  Router v7, TanStack Query, an NSwag-generated typed client, OIDC+PKCE via `react-oidc-context`).
- **Build/test:** `dotnet test` (xUnit + Testcontainers, one integration test project
  `tests/Api.IntegrationTests`); `npm run build && npm test` in `web/` (Vitest + Testing Library).
  Both run in `.github/workflows/ci.yml` on push/PR.
- **Local run:** `dotnet run --project src/AppHost` (Aspire) or `docker compose up` — both bring
  up Postgres, Redis, Keycloak, the Api, and the web app.
- **Architecture notes:** `docs/adr/0001-tech-stack.md` records the stack decision. No other ADRs
  exist yet.

## Requirement → code map

Only one demo entity (`SampleWidget`) and one demo page exist today — everything below is new,
following the demo's established patterns rather than replacing them.

| Acceptance criterion | Where it lands | Notes |
| --- | --- | --- |
| Origin/destination autocomplete + inline "save new address" | New `Location` domain entity + `LocationEndpoints` (`GET /api/v1/locations?query=`, `POST /api/v1/locations`) + a new `web/src/pages/shipments/` combobox component | No location/address concept exists anywhere in the codebase yet |
| Cargo fields (weight, dimensions, freight class, hazmat toggle) | New `Shipment` domain entity fields + a shipment creation form component | Freight class is presumably a fixed set of codes (NMFC classes) — not specified in the ticket, needs a decision in stage 2 |
| Hazmat conditional required fields + inline validation | FluentValidation validator on the backend (conditional rules via `.When(x => x.IsHazmat)`) + Zod schema + React Hook Form conditional `required` on the frontend | Mirrors the "FluentValidation mirrors Zod" convention set out in the ADR; neither React Hook Form nor Zod are installed yet (see below) |
| Service level selector (Standard/Expedited/Guaranteed) | A `ServiceLevel` enum in `Domain`, exposed as a string enum in the DTO, a shadcn `Select` on the frontend | No enum-modeling precedent in the codebase yet — first one |
| Save as Draft + dedicated drafts list | `POST /api/v1/shipments/draft` (or a `status` field on the normal create endpoint) + `GET /api/v1/shipments?status=draft` + `web/src/pages/shipments/DraftsListPage.tsx` + a new route in `router.tsx` | No "list" endpoint pattern exists yet (`SampleEndpoints` only has get-all/get-protected, no filtering) |
| 2.5s P95 perf budget | Not directly mappable to existing code — no perf-testing tooling exists in this repo yet (OpenTelemetry is backend-only, nothing on the frontend) | Flagged as a risk below |
| WCAG 2.1 AA | shadcn/ui + Radix primitives (already used for `Button`/`Card`) are accessible by default; new form primitives (`Form`, `Input`, `Select`, `Switch`, `Command`/`Popover` for the combobox, `Dialog` for inline address creation) need to be added via shadcn and wired with proper `aria-describedby`/labels | No forms exist yet in `web/` to pattern-match against — this ticket sets the convention |

## Files likely to change

**Backend (new):**
- `src/Domain/Location.cs`, `src/Domain/Shipment.cs`, `src/Domain/ServiceLevel.cs` (enum) —
  new entities/enum, following `src/Domain/SampleWidget.cs`'s plain-POCO style
- `src/Infrastructure/Persistence/AppDbContext.cs` — add `DbSet<Location>`, `DbSet<Shipment>`,
  and their `OnModelCreating` config (existing file, not new)
- `src/Infrastructure/Persistence/Migrations/*` — new EF Core migration
- `src/Application/Locations/*`, `src/Application/Shipments/*` — DTOs, services, FluentValidation
  validators, following `src/Application/SampleWidgets/`'s structure exactly
- `src/Api/Endpoints/LocationEndpoints.cs`, `src/Api/Endpoints/ShipmentEndpoints.cs` — new,
  following `src/Api/Endpoints/SampleEndpoints.cs`'s `MapGroup`/`.Produces<T>()` pattern
- `src/Api/Program.cs` — register new services/validators (existing file; `AddValidatorsFromAssemblyContaining` already scans the whole `Application` assembly, so new validators there are auto-registered — no extra wiring needed for that part) and `app.MapLocationEndpoints()` / `app.MapShipmentEndpoints()`
- `tests/Api.IntegrationTests/*` — new tests for the above, following `HealthEndpointTests.cs`'s
  `ApiFactory` + Testcontainers pattern

**Frontend (new):**
- `web/src/lib/api-client/generated-client.ts` — regenerated via `npm run generate:api-client`
  once the backend endpoints exist
- `web/src/pages/shipments/NewShipmentPage.tsx`, `web/src/pages/shipments/DraftsListPage.tsx`
- `web/src/pages/shipments/components/` — location combobox, hazmat fields, cargo fields
- `web/src/router.tsx` — add the new routes (existing file, currently only has one index route)
- `web/src/components/ui/*` — new shadcn components: `form`, `input`, `label`, `select`,
  `switch`, `command`, `popover`, `dialog` (only `button` and `card` exist today)
- `package.json` — add `react-hook-form`, `zod`, `@hookform/resolvers` (part of MLP-45's overall
  frontend stack decision, but explicitly deferred out of MLP-46's scope to "later feature
  tickets" — this is that ticket)

## Patterns & conventions to follow

- **Backend layering**: Domain (plain entities) → Infrastructure (`AppDbContext` + migrations) →
  Application (DTOs + a service class that takes `AppDbContext` directly via constructor
  injection — no repository abstraction) → Api (Minimal API endpoint groups with
  `.Produces<T>()` annotations so NSwag generates a properly-typed client). Follow this exactly;
  it's a two-ticket-old but consistent convention.
- **Endpoint style**: `app.MapGroup("/api/v1/{resource}")`, `.WithTags(...)`, explicit
  `.Produces<T>(statusCode)` / `.ProducesValidationProblem()` on every route — required for the
  generated client to get real types instead of `Promise<void>` (this bit the MLP-46 scaffold
  once already; see its implementation report).
- **Validation**: FluentValidation on the backend, registered once via
  `AddValidatorsFromAssemblyContaining<T>` (already wired) — new validators just need to exist in
  `Application`, no `Program.cs` change required for that part.
- **Frontend data fetching**: TanStack Query hooks calling the generated NSwag client
  (`web/src/lib/api-client`), not raw `fetch`. See `SampleWidgetsPage.tsx` for the pattern
  (`useQuery`, `queryKey`, mocking the client at the network boundary in tests).
- **Auth**: `react-oidc-context`'s `useAuth()` + a `ProtectedRoute` wrapper exists
  (`web/src/auth/`), used today only to gate one demo card. Whether shipment creation/drafts
  should be behind login is not stated in the ticket — see open questions.
- **Testing**: one integration-test project (`tests/Api.IntegrationTests`) using
  `WebApplicationFactory` + Testcontainers Postgres; no separate unit-test project for
  `Application`-layer logic exists. Frontend: Vitest + Testing Library, generated client mocked
  via `vi.mock('@/lib/api-client', ...)`.
- **shadcn/ui gotcha (already hit and worked around during MLP-46)**: the shadcn CLI's `init`/`add`
  alias resolution is broken against this repo's toolchain (Vite 8, TS 6, React 19.2) — `npx
  shadcn@latest add <component>` writes files into a literal `./@/` directory instead of
  resolving the `@/*` path alias, even with `baseUrl`/`paths` correctly configured. The MLP-46
  implementation report's fix was: let it write to `./@/...`, then `mv` the files into
  `web/src/components/ui/` manually. Expect to repeat this workaround for every new shadcn
  component this ticket adds (`form`, `input`, `select`, `switch`, `command`, `popover`,
  `dialog`), and budget time for it in the plan.

## Risks & open questions

- **No "submit"/"book" acceptance criterion beyond Save as Draft.** The user story talks about
  "booking freight," but the AC list only specifies drafting, not a final create/submit action or
  what status a non-draft shipment ends up in. MLP-20 (Rate Shopping) explicitly says "Booking is
  not possible until a carrier is explicitly selected from the comparison" — implying real booking
  happens in a later ticket. **Open question for the product owner**: does MLP-18's "create" action
  persist a shipment in a `PendingRateShopping`/`Submitted` status ready for MLP-20 to pick up, or
  is Save-as-Draft the *only* persistence path this ticket delivers?
- **No user/tenant scoping exists anywhere in the codebase.** Confirmed via grep — zero references
  to `ClaimsPrincipal`, a user id, or an owner id anywhere in `src/`. The ticket's "saved location
  book" and "dedicated drafts list" both imply data scoped to *someone*, but there's no `User`
  entity, and the JWT's `sub` claim isn"t persisted/mapped anywhere yet. This ticket would be the
  first to establish that pattern — needs an explicit decision (global data for now vs. persisting
  the Keycloak subject id as a plain string owner column) rather than an implicit assumption.
- **No perf-testing tooling exists for the 2.5s P95 AC.** OpenTelemetry is wired backend-only;
  nothing measures frontend page-load/form-submit timing today. This AC likely can't be
  automatically verified in this ticket's test suite — flag it as a manual/Lighthouse check rather
  than silently dropping it.
- **Freight class values are unspecified.** "Freight class" strongly implies the NMFC freight
  class system (a fixed list of ~18 codes), but the ticket doesn't say so explicitly or link a
  reference list. Needs confirmation before modeling it as an enum vs. a free-text/lookup field.
- **shadcn CLI workaround adds real time cost.** Six-plus new components each need the
  write-then-move workaround described above; not a blocker, but should be sized into the plan,
  not discovered mid-implementation.
- **The stale `feature/MLP-18-single-shipment-creation` branch** should be explicitly
  addressed (delete, archive, or leave) — flagged above, not resolved here.
- **Dialog-based "save new address inline"** needs a decision on whether saving a new address
  should immediately persist it (so it's reusable across future shipments, matching "saved
  location book") or only attach it to the current shipment — the AC says "saved inline without
  leaving the form," which reads as immediate persistence, but worth confirming in stage 2 given
  the user/tenant-scoping question above (a globally-shared, ever-growing address book from every
  coordinator's ad-hoc entries could get messy without scoping or dedup).
