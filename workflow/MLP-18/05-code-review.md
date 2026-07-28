# Code Review — MLP-18: Single Shipment Creation

**PR:** https://github.com/seifallahmedini/meridian-platform/pull/5
**Review posted:** https://github.com/seifallahmedini/meridian-platform/pull/5#pullrequestreview (comment review — GitHub blocks self-request-changes on your own PR, so the verdict is stated explicitly in the comment body instead of via review state)
**Diff reviewed:** `main...HEAD` on `feature/MLP-18-single-shipment-creation-v2` (16 commits, 53 files, +4737/-5)

## Verdict: **Changes requested**

Two CONFIRMED correctness findings gate this PR. Do not merge until they're fixed.

## Method

Three parallel `general-purpose` sub-agent reviews (Correctness / Standards / Spec), each given
the diff, commit list, and only the sources relevant to its axis. Findings were then spot-checked
personally against the actual code before aggregating — both CONFIRMED-and-gating findings were
independently re-verified by reading `ShipmentService.cs`, `NewShipmentPage.tsx`, and grepping for
`OwnerId`/`saveMutation` usage myself, not just trusted from the sub-agent reports.

## Findings

### 🔴 Blocking (CONFIRMED correctness — both independently found by two different review axes)

1. **Cross-tenant location reference not validated (IDOR-style data leak)** —
   `src/Application/Shipments/ShipmentService.cs` (`Apply`, ~line 89). `CreateAsync`/`UpdateAsync`
   never check that the request's `OriginLocationId`/`DestinationLocationId` belong to the calling
   owner — only the `Shipment` row itself is `OwnerId`-scoped. A user can reference another
   owner's real `Location` GUID; the DB FK is satisfied regardless of ownership, the shipment
   saves successfully, and the other owner's address label leaks via `GET`/list. Also directly
   contradicts the technical instructions' explicit validation requirement (400, not a raw 500,
   for an unowned/nonexistent location).
2. **Silent save failure** — `web/src/pages/shipments/NewShipmentPage.tsx` (~line 75).
   `saveMutation` has no `onError` handler and nothing renders on `saveMutation.isError`; any
   failed save (e.g. a 404 from editing a shipment that got submitted elsewhere in the meantime)
   shows the user nothing — looks like success.

### 🟡 Non-blocking (Standards / Spec)

- Missing `.Produces(StatusCodes.Status401Unauthorized)` on the new Location/Shipment endpoints
  (inconsistent with the one existing precedent in `SampleEndpoints.cs`).
- `ShipmentEndpoints.cs`'s `created!.Id` — an extra re-query round-trip + null-forgiving operator,
  where the established `SampleWidgetService` pattern returns the DTO directly, never nullable.
- No test exercises the "Add new address" dialog flow the test strategy calls for (feature itself
  works correctly — just untested).
- (PLAUSIBLE) `PUT` on an already-`Submitted` shipment returns 404, not the spec-suggested 409 —
  the spec's own wording arguably permits this.

### Notes (PLAUSIBLE, lower confidence, non-gating)

- `NewShipmentPage.tsx`'s "Create Shipment" path: the loose RHF resolver runs before the manual
  strict-schema check, so a loose-schema-level rejection (e.g. a manually-typed negative weight)
  could suppress the strict validation branch and its `aria-live` announcement for other
  genuinely-missing fields.
- `SubmitShipmentRequestValidator.cs`'s FreightClass `.Must()` check runs even after `.NotEmpty()`
  already failed — same unguarded-cascade shape as the `HazmatUnNumber` null-deref bug already
  fixed once in this file; currently harmless (`List.Contains(null)` doesn't throw) but latent.
- `DraftsListPage.tsx` has no colocated test, unlike its sibling pages.

## Gate

**Workflow stops here.** Per the code-review skill's gating rule, any CONFIRMED correctness
finding blocks the ticket from being considered done. MLP-18 is not complete — the PR needs the
two blocking fixes above (and ideally the non-blocking ones) before this ticket can close. Re-run
`code-review` after fixing, or continue via `implement-plan` to apply the fixes directly.
