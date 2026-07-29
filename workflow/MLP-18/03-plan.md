# Implementation Plan — MLP-18: Single Shipment Creation

## Branch
`feature/MLP-18-single-shipment-creation-v2`

(Not `feature/MLP-18-single-shipment-creation` — that branch already exists remotely and targets
the abandoned Next.js/tRPC stack. See technical instructions for the naming conflict.)

## Steps

### Step 1 — Domain entities + enums (est: S)
- Files: `src/Domain/Location.cs`, `src/Domain/ServiceLevel.cs`, `src/Domain/ShipmentStatus.cs`,
  `src/Domain/Shipment.cs`
- Change: plain POCO entities/enums per the technical instructions' field list. No behavior, no
  EF Core attributes (config lives in `AppDbContext`, matching `SampleWidget`'s style).
- Verify: `dotnet build` succeeds.

### Step 2 — AppDbContext + migration (est: S)
- Files: `src/Infrastructure/Persistence/AppDbContext.cs` (existing), new migration under
  `src/Infrastructure/Persistence/Migrations/`
- Change: add `DbSet<Location>`, `DbSet<Shipment>`; `OnModelCreating` config — required columns,
  FK `Shipment.OriginLocationId`/`DestinationLocationId` → `Location.Id` with
  `DeleteBehavior.Restrict`. Generate migration via `dotnet ef migrations add AddShipmentAndLocation --project src/Infrastructure/Infrastructure.csproj`.
- Verify: `dotnet build`; inspect the generated migration file for the expected columns/FKs.

### Step 3 — Location application layer (est: S)
- Files: `src/Application/Locations/LocationDto.cs`, `CreateLocationRequest.cs`,
  `CreateLocationRequestValidator.cs`, `LocationService.cs`
- Change: `LocationService(AppDbContext)` with `SearchAsync(ownerId, query)` and
  `CreateAsync(ownerId, request)`, following `SampleWidgetService`'s constructor-injection style.
  Validator: label/address/city/state/postal/country required, max lengths.
- Verify: `dotnet build`.

### Step 4 — Shipment application layer (est: M)
- Files: `src/Application/Shipments/ShipmentDto.cs`, `ShipmentSummaryDto.cs`,
  `SaveShipmentRequest.cs`, `SaveDraftShipmentRequestValidator.cs`,
  `SubmitShipmentRequestValidator.cs`, `ShipmentService.cs`
- Change: `ShipmentService` with `CreateAsync`, `UpdateAsync` (draft-only), `GetByIdAsync`,
  `ListAsync(ownerId, status)` — every method takes/filters by `ownerId`. Two validators per the
  technical instructions (draft = types/ranges only; submit = full, incl. hazmat `.When(x =>
  x.IsHazmat)` and a cross-field origin≠destination rule).
- Verify: `dotnet build`.

### Step 5 — Location endpoints (est: S)
- Files: `src/Api/Endpoints/LocationEndpoints.cs`, `src/Api/Program.cs` (existing)
- Change: `MapGroup("/api/v1/locations")`, `GET /` (query param, `.RequireAuthorization()`,
  `.Produces<LocationDto[]>()`), `POST /` (`.RequireAuthorization()`,
  `.Produces<LocationDto>(201)`, `.ProducesValidationProblem()`). Pull `ownerId` from
  `HttpContext.User` (JWT `sub` claim) inside the handler. `AddScoped<LocationService>()` in
  `Program.cs`.
- Verify: `dotnet build`; manual curl with/without a bearer token (401 vs 200/201).

### Step 6 — Shipment endpoints (est: M)
- Files: `src/Api/Endpoints/ShipmentEndpoints.cs`, `src/Api/Program.cs` (existing)
- Change: `MapGroup("/api/v1/shipments")`, `POST /` (create, picks draft/submit validator based
  on `isDraft`), `PUT /{id}` (update, draft-only), `GET /` (`?status=draft`, list), `GET /{id}`
  (get one). All `.RequireAuthorization()`, all with `.Produces<T>()`/`.ProducesValidationProblem()`.
  `AddScoped<ShipmentService>()` in `Program.cs`.
- Verify: `dotnet build`; manual curl covering draft-create, submit-create (valid and
  validation-failure cases), get, list.

### Step 7 — Backend integration tests (est: M)
- Files: `tests/Api.IntegrationTests/LocationEndpointTests.cs`,
  `tests/Api.IntegrationTests/ShipmentEndpointTests.cs`
- Change: extend the existing `ApiFactory`/Testcontainers fixture. Cases: create+search location
  scoped to owner (a second synthetic owner's locations don't leak); draft with empty fields →
  201; submit missing cargo fields → 400; submit hazmat missing fields → 400, with fields → 201;
  identical origin/destination → 400; drafts list scoped to caller; anonymous → 401 on every
  endpoint. Needs a way to mint a test JWT with a controllable `sub` claim — check whether
  `ApiFactory` already supports overriding auth for tests; if not, add a test-only auth handler
  or a helper that issues a token via the dev Keycloak realm's `testuser`.
- Verify: `dotnet test` — all new + existing tests green.

### Step 8 — Frontend deps + shadcn components (est: L)
- Files: `web/package.json`, `web/src/components/ui/{form,input,label,select,switch,command,popover,dialog}.tsx`
- Change: `npm install react-hook-form zod @hookform/resolvers`. Add each shadcn component via
  `npx shadcn@latest add <name>`, then apply the known write-then-move workaround (files land in
  a literal `./web/@/...` dir instead of `web/src/...` — `mv` them into
  `web/src/components/ui/` and delete the stray `@/` directory). Budget real time here; expect to
  repeat the workaround per component.
- Verify: `npm run build` succeeds with the new components importable from `@/components/ui/*`.

### Step 9 — Shared constants + Zod schema (est: S)
- Files: `web/src/lib/constants/freight-classes.ts`, `web/src/lib/schemas/shipment.ts`
- Change: exported `FREIGHT_CLASSES` array (used by both the `Select` and Zod's `.enum()`/`.refine()`);
  a Zod object schema mirroring the backend's submit validator, incl. a `.superRefine` for the
  hazmat conditional fields.
- Verify: `npm run build`; a quick unit check that the schema rejects an incomplete hazmat case
  (can fold into Step 13's component tests instead of a standalone test file).

### Step 10 — Regenerate the typed API client (est: S)
- Files: `web/src/lib/api-client/generated-client.ts` (regenerated)
- Change: start the Api (`dotnet run --project src/Api` or via Aspire/compose), run
  `npm run generate:api-client` in `web/`.
- Verify: generated client exposes typed methods for the new location/shipment endpoints
  (`getLocations`, `postLocations`, `postShipments`, `putShipments`, `getShipments`,
  `getShipmentsProtected`-style getters per NSwag's naming) with real DTO types, not `void`.

### Step 11 — Location combobox + add-address dialog (est: M)
- Files: `web/src/pages/shipments/components/LocationCombobox.tsx`,
  `web/src/pages/shipments/components/AddLocationDialog.tsx`
- Change: `Command`+`Popover` combobox querying `GET /api/v1/locations?query=` via TanStack
  Query (debounced input); an "Add new address" row opens `AddLocationDialog`, which posts via
  the generated client and invalidates the locations query key on success, then selects the new
  location.
- Verify: manual — type in the combobox, see filtered results; add a new address, see it appear
  and get selected without leaving the form.

### Step 12 — Cargo + hazmat fields (est: M)
- Files: `web/src/pages/shipments/components/CargoFields.tsx`,
  `web/src/pages/shipments/components/HazmatFields.tsx`
- Change: weight/dimensions/freight-class inputs bound to the React Hook Form context; a
  `Switch` for the hazmat toggle that conditionally renders `HazmatFields` (UN number, packing
  group, emergency contact), each wired through shadcn's `Form`/`FormMessage` for label + error
  association.
- Verify: manual — toggling hazmat shows/hides the three fields; RHF's `shouldUnregister`
  behavior confirmed so hidden fields don't block submission when hazmat is off.

### Step 13 — New shipment page (est: L)
- Files: `web/src/pages/shipments/NewShipmentPage.tsx`
- Change: `useForm` with the Zod resolver from Step 9; composes `LocationCombobox` (origin +
  destination), `CargoFields`, a service-level `Select`; two submit paths — "Save as Draft"
  (bypasses full validation, calls `POST/PUT .../shipments` with `isDraft: true`) and "Create
  Shipment" (runs full RHF+Zod validation, `isDraft: false`). On validation failure: focus first
  invalid field, announce error count via an `aria-live="polite"` region.
- Verify: manual — full happy path (fill everything, submit, see 201/navigation); hazmat
  incomplete → inline errors, no request sent; save-as-draft with blank fields → succeeds.

### Step 14 — Drafts list page (est: S)
- Files: `web/src/pages/shipments/DraftsListPage.tsx`
- Change: TanStack Query against `GET /api/v1/shipments?status=draft`; each row links back into
  `NewShipmentPage` in an edit mode (loads the draft via `GET /api/v1/shipments/{id}`, PUTs on
  save instead of POSTing).
- Verify: manual — create two drafts, see both listed; open one, confirm fields are pre-filled.

### Step 15 — Routing (est: S)
- Files: `web/src/router.tsx` (existing)
- Change: add `/shipments/new`, `/shipments/new/:id` (edit-draft), `/shipments/drafts` routes,
  each wrapped in the existing `ProtectedRoute`.
- Verify: manual — visiting these routes while logged out redirects to the Keycloak login button
  state; while logged in, renders the pages.

### Step 16 — Frontend tests (est: M)
- Files: `web/src/pages/shipments/NewShipmentPage.test.tsx`,
  `web/src/pages/shipments/components/LocationCombobox.test.tsx` (or folded into the page test)
- Change: mock `@/lib/api-client` and `react-oidc-context` per the existing
  `SampleWidgetsPage.test.tsx` pattern. Cases: hazmat toggle reveals fields and blocks submit
  when incomplete; selecting an existing location populates the field; "add new address" flow
  calls the create-location mutation and closes the dialog; "Save as Draft" submits regardless of
  field completeness.
- Verify: `npm test` — all new + existing tests green.

### Step 17 — Full verification pass, PR, Jira close-out (est: M)
- Files: none (verification only)
- Verify: `dotnet test`, `npm run build && npm test`; manually walk the real flow in a browser
  behind a real Keycloak login (create a location inline, fill cargo + hazmat, save as draft,
  reopen the draft, then submit); keyboard-only pass through the whole form (tab order, combobox,
  dialog focus trap, error announcements) for the WCAG AC; a Lighthouse/devtools timing check for
  the 2.5s P95 AC (manual, not automated — see technical instructions). Push branch, open PR,
  comment + transition MLP-18 on Jira.

## Test plan

- Backend: `LocationEndpointTests.cs`, `ShipmentEndpointTests.cs` (Step 7) — ownership scoping,
  draft-vs-submit validation, hazmat conditional validation, 401s.
- Frontend: `NewShipmentPage.test.tsx` (Step 16) — hazmat conditional UI/validation, combobox +
  inline address creation, save-as-draft bypass.
- Manual-only (no automated test): perf budget (Step 17), full keyboard/WCAG pass (Step 17).

## Migrations / config

- One new EF Core migration (Step 2): `Locations` + `Shipments` tables.
- No new env vars — reuses the existing `ConnectionStrings:Postgres` and Keycloak auth config
  from MLP-46. No feature flags; this is additive, not a behavior change to existing endpoints.

## Rollout & rollback

- Low risk: purely additive (new tables, new endpoints, new frontend routes) — nothing existing
  is modified except `AppDbContext.cs`, `Program.cs`, and `router.tsx`, all in an additive way.
  Single PR to `main` is sufficient.
- Rollback: revert the merge commit. The migration only adds tables, so a revert doesn't strand
  any other feature's data; no down-migration needs to run against a live database (nothing else
  depends on `Locations`/`Shipments` yet).

## Definition of done

- [ ] Form accepts origin/destination with autocomplete from the saved location book; new
      addresses can be saved inline without leaving the form — Steps 5, 11
- [ ] Cargo fields capture weight, dimensions, freight class, and a hazmat toggle — Step 12
- [ ] Hazmat toggle reveals required fields (UN number, packing group, emergency contact);
      submission blocked with inline field-level errors if any are missing — Steps 4, 9, 12, 13
- [ ] Service level selector offers Standard, Expedited, and Guaranteed — Steps 1, 13
- [ ] "Save as Draft" available at any point; drafts accessible from a dedicated list —
      Steps 4, 6, 13, 14
- [ ] Page loads and form submits within the 2.5s P95 budget — Step 17 (manual verification)
- [ ] All form fields are WCAG 2.1 AA accessible — Steps 8, 12, 13, 17 (manual keyboard pass)
- [ ] `dotnet test` and `npm test` both green — Steps 7, 16, 17
- [ ] CI green on the PR
