# Implementation Report — MLP-18: Single Shipment Creation

## Summary

Implemented single shipment creation: a Shipping Coordinator can pick or inline-create origin and
destination addresses, enter cargo details with a conditional hazmat section, choose a service
level, and either save a draft (bypassing full validation) or create the shipment (full
validation, incl. hazmat conditional rules and origin≠destination). Established two conventions
this repo didn't have yet: JWT-based per-owner data scoping (plain `OwnerId` string from the
token's `sub` claim, no `Users` table) and a real multi-field form (React Hook Form + Zod).

## PR

https://github.com/seifallahmedini/meridian-platform/pull/5

## Branch

`feature/MLP-18-single-shipment-creation-v2` — not the original `feature/MLP-18-single-shipment-
creation`, which already existed remotely but targeted the abandoned Next.js/tRPC/Prisma stack
from before the MLP-45→MLP-46 pivot and can't be merged. Left untouched per the user's explicit
choice during planning; someone should separately decide its fate.

## Test results

- `dotnet test` on `MeridianPlatform.slnx` (Release): 11/11 passing.
- `npm run build && npm test` in `web/`: build succeeds, 4/4 Vitest tests passing.
- Full manual browser walkthrough via `docker compose up` + a real Keycloak login (see PR
  description for the exact steps exercised) — every acceptance criterion except the performance
  budget was directly observed working, not just inferred from code.

## Bugs found and fixed during implementation/verification

1. **NSwag duplicate-type bug** — ASP.NET Core's OpenAPI 3.1 output represents a nullable enum
   property as `oneOf:[null, $ref]`; NSwag's TypeScript client generator doesn't resolve that back
   to the shared enum and synthesizes a fresh duplicate type per occurrence
   (`ServiceLevel2`/`3`/`4`). Fixed by using a plain `string` for `ServiceLevel` on the DTO wire
   contract; the enum is still enforced server-side via FluentValidation
   (`Enum.TryParse<ServiceLevel>`).
2. **Label/`aria-describedby` association bug** — `LocationCombobox` accepted its own `id` prop,
   which clobbered the `id` shadcn's `FormControl` injects via Radix `Slot` for
   `<label for>` association. Broke keyboard/screen-reader navigation to both the origin and
   destination fields — exactly the kind of defect this ticket's WCAG AC exists to prevent. Fixed
   by having the component forward `FormControl`'s injected props (`id`, `aria-describedby`,
   `aria-invalid`) instead of accepting a redundant custom `id`. Caught by the frontend test suite,
   not by manual inspection.
3. **Null-deref in hazmat validation** — FluentValidation's rule cascade let
   `.Must(v => UnNumberRegex().IsMatch(v!))` execute with `v = null` after `.NotEmpty()` already
   failed, throwing a `NullReferenceException` and turning a 400 validation failure into a raw
   500. Fixed with an explicit null check. Caught by the backend integration test suite.
4. Two jsdom gaps (`ResizeObserver`, pointer-capture methods) needed stubbing in `setupTests.ts`
   before Radix's Popover/Select/Command primitives would render in tests at all.

## Acceptance criteria

- [x] Origin/destination autocomplete from saved location book; new addresses saved inline
- [x] Cargo fields: weight, dimensions, freight class, hazmat toggle
- [x] Hazmat toggle reveals required fields; submission blocked with inline errors if missing
- [x] Service level selector: Standard, Expedited, Guaranteed
- [x] Save as Draft available at any point; drafts in a dedicated list
- [ ] 2.5s P95 performance budget — manual-only per the technical instructions (no perf tooling
      exists in this repo); felt responsive in testing but not measured with real tooling
- [x] WCAG 2.1 AA — labels, error announcements (`aria-live`), keyboard navigation all verified

## Deferred / out of scope

Rate shopping/carrier selection and any real "book" action (MLP-20); CSV bulk import (MLP-19);
recurring templates (MLP-21); a full `Users`/organizations model; automated performance testing;
the fate of the stale MLP-18 branch (flagged to the repo owner, not actioned).

## Ticket status

MLP-18 to be transitioned to **In Review** with a summary comment linking this PR.
