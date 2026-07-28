# Technical Instructions — MLP-18: Single Shipment Creation

## Approach

Add two new resources — `Location` (a per-coordinator address book) and `Shipment` — following
the exact layering the MLP-46 scaffold established: Domain entities → `AppDbContext` +
migration → Application DTOs/service/validators → Api Minimal API endpoint groups with
`.Produces<T>()` annotations → NSwag-regenerated client → TanStack Query hooks on new
`web/src/pages/shipments/*` pages. This is the first feature ticket in the repo, so it also has
to establish two conventions the scaffold left open: user-scoping (via the JWT `sub` claim, no
new `Users` table) and a real multi-field form (React Hook Form + Zod, per the MLP-45 ADR, not
yet installed).

**Do not attempt to reuse or merge the existing `feature/MLP-18-single-shipment-creation` branch**
— it targets the abandoned Next.js/tRPC/Prisma stack and is incompatible with `main`. It's useful
only as a read-only reference for field names/validation shape
(`server/schemas/shipment.ts`, `server/schemas/location.ts`, `tests/shipment.test.ts` on that
branch). Work happens on a fresh branch; see Decisions below for the exact name.

## Decisions (resolving the exploration's open questions)

- **Branch naming conflict:** use `feature/MLP-18-single-shipment-creation-v2` for this work.
  Separately: ask the repo owner whether to delete or archive the old
  `feature/MLP-18-single-shipment-creation` branch — not done as part of this ticket.
- **"Submit" status, given MLP-20 gates real booking on carrier selection:** add a
  `ShipmentStatus` enum with exactly two values for this ticket — `Draft` and `Submitted`.
  "Submitted" means "ready for the next stage (rate shopping, MLP-20)," not "booked." Button copy:
  "Create Shipment" (not "Book Shipment") to avoid overpromising.
- **User/tenant scoping:** no new `Users` table. Both `Location` and `Shipment` get a plain
  `OwnerId` (string) column populated from the authenticated JWT's `sub` claim. All
  location/shipment endpoints require authentication — reuse the existing JWT bearer pipeline;
  the frontend pages sit behind the existing `ProtectedRoute` wrapper. Location book and drafts
  are scoped per-owner (not shared across coordinators) — simplest safe default, easy to loosen
  later without a breaking schema change.
- **Freight class:** model as a `string` validated against a fixed allow-list of standard NMFC
  classes (`FreightClasses.All` constant: `50, 55, 60, 65, 70, 77.5, 85, 92.5, 100, 110, 125, 150,
  175, 200, 250, 300, 400, 500`), not a C# enum (18 members is unwieldy) and not free text.
  Frontend renders a `Select` populated from the same list (exported from a shared
  `web/src/lib/constants/freight-classes.ts` so both sides can't drift). Flag to product: confirm
  this list matches what's actually contracted — implemented as a swappable constant either way.
- **Draft vs. submit validation:** two separate FluentValidation validators over the same request
  shape — `SaveDraftShipmentRequestValidator` (types/ranges only, nothing required) and
  `SubmitShipmentRequestValidator` (full: all cargo fields required, hazmat conditional fields
  required when `isHazmat`, origin ≠ destination). The endpoint picks the validator based on the
  request's `isDraft` flag. This directly satisfies "Save as Draft is available at any point"
  (i.e., with incomplete data) without needing FluentValidation RuleSets.
- **Perf AC (2.5s P95):** no perf-testing tooling exists in this repo. Verify manually via browser
  devtools/Lighthouse before calling the ticket done; do not attempt to add automated perf testing
  as part of this ticket (real scope creep for a 5-point story) — call this out explicitly in the
  PR description as a manual check, not an automated gate.
- **shadcn/ui CLI workaround:** repeat the exact procedure from MLP-46's implementation report for
  every new component this ticket needs (`form`, `input`, `label`, `select`, `switch`, `command`,
  `popover`, `dialog`): run `npx shadcn@latest add <name>`, it will write to a literal `./web/@/`
  directory instead of resolving the `@/*` alias; `mv` the files into `web/src/components/ui/` and
  `rm -rf` the stray `@/` directory afterward. Budget real time for this — six-plus components.

## Files to create

**Backend:**
- `src/Domain/Location.cs` — `Id: Guid`, `OwnerId: string`, `Label: string`, `AddressLine1: string`,
  `AddressLine2: string?`, `City: string`, `State: string`, `PostalCode: string`, `Country: string`,
  `CreatedAt: DateTimeOffset`.
- `src/Domain/ServiceLevel.cs` — enum `Standard`, `Expedited`, `Guaranteed`.
- `src/Domain/ShipmentStatus.cs` — enum `Draft`, `Submitted`.
- `src/Domain/Shipment.cs` — `Id: Guid`, `OwnerId: string`, `OriginLocationId: Guid`,
  `DestinationLocationId: Guid`, `WeightKg: decimal`, `LengthCm/WidthCm/HeightCm: decimal`,
  `FreightClass: string`, `IsHazmat: bool`, `HazmatUnNumber/HazmatPackingGroup/
  HazmatEmergencyContact: string?`, `ServiceLevel: ServiceLevel`, `Status: ShipmentStatus`,
  `CreatedAt/UpdatedAt: DateTimeOffset`.
- `src/Infrastructure/Persistence/AppDbContext.cs` (existing file) — add `DbSet<Location>`,
  `DbSet<Shipment>`, `OnModelCreating` config (required columns, FK constraints
  `Shipment.OriginLocationId`/`DestinationLocationId` → `Location.Id`, no cascade delete).
- `src/Infrastructure/Persistence/Migrations/*` — new migration for both tables.
- `src/Application/Locations/LocationDto.cs`, `CreateLocationRequest.cs`,
  `CreateLocationRequestValidator.cs`, `LocationService.cs` (search-by-owner-and-query,
  create-scoped-to-owner).
- `src/Application/Shipments/ShipmentDto.cs`, `ShipmentSummaryDto.cs`, `SaveShipmentRequest.cs`
  (shared shape for both draft/submit), `SaveDraftShipmentRequestValidator.cs`,
  `SubmitShipmentRequestValidator.cs`, `ShipmentService.cs` (create, update-draft, get-by-id,
  list-by-owner-and-status — all filtered by `OwnerId` from the caller's JWT).
- `src/Api/Endpoints/LocationEndpoints.cs`, `src/Api/Endpoints/ShipmentEndpoints.cs`.
- `src/Api/Program.cs` (existing file) — `app.MapLocationEndpoints()`, `app.MapShipmentEndpoints()`.
  No DI changes needed beyond `AddScoped<LocationService>()`/`AddScoped<ShipmentService>()` —
  validators auto-register via the existing `AddValidatorsFromAssemblyContaining`.

**Frontend:**
- `web/package.json` — add `react-hook-form`, `zod`, `@hookform/resolvers`.
- `web/src/lib/constants/freight-classes.ts`, `web/src/lib/schemas/shipment.ts` (Zod schema
  mirroring the backend's submit validator, incl. hazmat conditional rules via `.superRefine`).
- `web/src/components/ui/{form,input,label,select,switch,command,popover,dialog}.tsx` — via the
  shadcn workaround described above.
- `web/src/pages/shipments/NewShipmentPage.tsx` — the main form.
- `web/src/pages/shipments/components/LocationCombobox.tsx` (Command + Popover, calls
  `GET /api/v1/locations?query=`, "Add new address" opens `AddLocationDialog`).
- `web/src/pages/shipments/components/AddLocationDialog.tsx` — inline address creation, calls
  `POST /api/v1/locations`, invalidates the locations query on success.
- `web/src/pages/shipments/components/CargoFields.tsx` — weight/dimensions/freight class +
  hazmat `Switch` that conditionally renders `HazmatFields.tsx` (UN number, packing group,
  emergency contact).
- `web/src/pages/shipments/DraftsListPage.tsx` — calls `GET /api/v1/shipments?status=draft`.
- `web/src/router.tsx` (existing file) — add `/shipments/new` and `/shipments/drafts` routes,
  both wrapped in the existing `ProtectedRoute`.
- Corresponding `*.test.tsx` files per the existing `SampleWidgetsPage.test.tsx` pattern (mock
  `@/lib/api-client`, mock `react-oidc-context`'s `useAuth`).

## Interfaces & contracts

- `GET /api/v1/locations?query={string}` → `200 LocationDto[]` (`{ id, label, addressLine1,
  addressLine2, city, state, postalCode, country }`), auth required, filtered to the caller's
  `OwnerId` and matching `query` case-insensitively against `label`/`city`.
- `POST /api/v1/locations` → body `CreateLocationRequest`, `201 LocationDto`, auth required.
- `POST /api/v1/shipments` → body `SaveShipmentRequest` (`{ originLocationId, destinationLocationId,
  weightKg, lengthCm, widthCm, heightCm, freightClass, isHazmat, hazmatUnNumber?,
  hazmatPackingGroup?, hazmatEmergencyContact?, serviceLevel, isDraft }`), `201 ShipmentDto`,
  `400 ValidationProblem` if `isDraft=false` and the submit validator fails, auth required.
- `PUT /api/v1/shipments/{id}` → same body shape, updates an existing shipment; `404` if not found
  or not owned by the caller; `409` (or just reject via validation) if the existing shipment's
  status is already `Submitted` — editing a submitted shipment is out of scope here.
- `GET /api/v1/shipments?status=draft` → `200 ShipmentSummaryDto[]` (`{ id, originLabel,
  destinationLabel, serviceLevel, updatedAt }`), auth required, filtered to caller + status.
- `GET /api/v1/shipments/{id}` → `200 ShipmentDto` (full detail, for reopening a draft), `404` if
  not found/not owned.
- EF Core migration: `Locations` table + `Shipments` table with FKs to `Locations` on
  origin/destination (`Restrict` delete behavior — don't let a location delete silently orphan
  shipments).

## Validation & edge cases

- `SaveDraftShipmentRequestValidator`: only type/range rules (e.g., weight ≥ 0 if provided) —
  nothing required. A draft can have empty origin/destination/etc.
- `SubmitShipmentRequestValidator`: `originLocationId`/`destinationLocationId` required and must
  differ; `weightKg`/dimensions > 0; `freightClass` must be in the allow-list; `serviceLevel` must
  be a valid enum value; when `isHazmat`, `hazmatUnNumber` required (format `UN\d{4}`),
  `hazmatPackingGroup` required (one of `I`, `II`, `III`), `hazmatEmergencyContact` required
  (non-empty).
- Origin/destination location IDs must resolve to a `Location` owned by the caller — otherwise
  `400 ValidationProblem`, not a raw 500 from an FK violation.
- Editing a draft that has since been submitted (race: two tabs) → `409` or a validation error,
  not a silent overwrite.
- Frontend: on submit-attempt with hazmat validation errors, move focus to the first invalid
  field and announce the error count via an `aria-live="polite"` region (WCAG AC).

## Non-functional requirements

- **Security:** every location/shipment endpoint requires a valid JWT; server-side `OwnerId`
  filtering on every query — never trust an `ownerId` from the request body/query string.
- **Accessibility (WCAG 2.1 AA):** every input has an associated `<Label>` (shadcn's `Form`
  primitives handle this via `FormLabel`/`FormControl`/`aria-describedby` wiring already);
  validation errors rendered via `FormMessage` (which Radix/shadcn associates via
  `aria-describedby`); the hazmat toggle is a real `Switch` with `role="switch"` (Radix default);
  full keyboard navigation through the combobox (`Command`/`Popover` — Radix default) and the
  dialog (focus trap — Radix default).
- **Performance:** 2.5s P95 page-load/submit — verify manually (devtools/Lighthouse) before
  closing the ticket; no automated perf gate exists or is being added here.
- **Observability:** reuse existing Serilog/OpenTelemetry on the backend; no new instrumentation
  needed for a CRUD feature at this stage.

## Test strategy

- Backend (extend `tests/Api.IntegrationTests`, following `HealthEndpointTests.cs`'s
  `ApiFactory` pattern):
  - Create location → 201; search returns it; search is scoped to owner (a second "user"'s
    locations don't leak).
  - Save shipment as draft with all fields empty → 201 (draft validator allows it).
  - Submit shipment missing required cargo fields → 400 with field-level errors.
  - Submit shipment with `isHazmat=true` and missing hazmat fields → 400; with all hazmat fields
    present → 201.
  - Submit with identical origin/destination → 400.
  - `GET /api/v1/shipments?status=draft` only returns the caller's drafts, not another owner's.
  - Anonymous requests to any of these endpoints → 401 (mirrors the existing protected-endpoint
    test pattern).
- Frontend (Vitest + Testing Library, following `SampleWidgetsPage.test.tsx`):
  - Toggling hazmat reveals the three conditional fields; submitting without them shows inline
    errors and does not call the create mutation.
  - Selecting an existing location from the combobox populates the field; "Add new address"
    opens the dialog, submitting it calls `POST /api/v1/locations` and closes the dialog.
  - "Save as Draft" calls the create/update mutation with `isDraft: true` regardless of field
    completeness.

## Out of scope

- Rate shopping / carrier selection and anything resembling a real "book" action (MLP-20).
- CSV bulk import (MLP-19).
- Recurring templates (MLP-21).
- A full `Users`/organizations table — `OwnerId` is a bare string from the JWT `sub` claim only.
- Automated performance testing tooling.
- Deleting/archiving the stale `feature/MLP-18-single-shipment-creation` branch (flagged to the
  repo owner, not actioned here).

## Open questions

1. **Confirm the freight-class list** matches what's actually contracted with carriers — shipped
   with the standard NMFC list as a placeholder, easy to swap.
2. **Confirm "Submitted" is the right terminal status for this ticket** given MLP-20 gates real
   booking on carrier selection, rather than the product wanting some other intermediate name/flow.
3. **Confirm location book is per-coordinator, not shared org-wide** — implemented as per-owner by
   default; changing to org-wide later needs an actual `Organization`/`User` model, not just a
   filter tweak.
4. **Decide the fate of the stale `feature/MLP-18-single-shipment-creation` branch** (delete /
   archive / leave) — not part of this ticket's implementation.
