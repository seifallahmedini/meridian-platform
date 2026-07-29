# Implementation Report — MLP-49: Add toast notifications and fix silent save failures

## What changed

- `web/package.json` — added `sonner` as a plain npm dependency (skipped the shadcn CLI
  entirely — its stock `sonner.tsx` wrapper depends on `next-themes`, which this Vite app has no
  equivalent for).
- `web/src/App.tsx` — mounted a single `<Toaster richColors closeButton />` app-wide.
- `web/src/pages/shipments/components/AddLocationDialog.tsx` — added the missing `onError`
  (error toast — the ticket's primary bug fix) and a success toast to the existing `onSuccess`.
- `web/src/pages/shipments/NewShipmentPage.tsx` — added a success toast to the draft-save
  (`isDraft: true`) branch only; the Create-shipment success screen and the existing
  `saveError`/`role="alert"` error banner are untouched by design.
- `web/src/pages/shipments/components/AddLocationDialog.test.tsx` (new, 2 cases).
- `web/src/pages/shipments/NewShipmentPage.test.tsx` (extended, +1 assertion on an existing case).

Frontend-only — no backend (`src/`) changes.

## Deviations from the plan

None — all 6 plan steps executed as written.

## Test results

- `npm run lint` — clean (only 2 pre-existing warnings in shadcn `button.tsx`/`form.tsx`).
- `npm test` — **15/15 passing**.
- `npm run build` — clean.
- **Manual end-to-end verification against the full docker-compose stack** (real
  Postgres/Redis/Keycloak/API, logged in as `testuser`/`Testpass123!`):
  - Saved a draft with an empty form → "Draft saved." success toast fired.
  - Added a new address via `AddLocationDialog` with the API up → "Address saved." success
    toast fired, dialog closed, address populated the Origin field.
  - Stopped the API container and retried adding an address → "Failed to save the address.
    Please try again." error toast fired, dialog stayed open with form data intact.
  - Restarted the API container afterward; stack left running.

This confirms the silent-failure bug is genuinely fixed against real infrastructure, not only
mocked in unit tests — directly addresses the ticket's primary complaint.

## Found but not fixed (pre-existing, out of scope)

`NewShipmentPage.test.tsx`'s "shows a back-to-drafts control on the success screen after
creating a shipment" test (added in MLP-48) intermittently times out under Vitest's default
5000ms limit — it drives ~15 sequential `userEvent` interactions across two comboboxes and two
selects. Confirmed with `--testTimeout=20000` that it passes reliably and is not a logic
regression; this is a pre-existing test-suite fragility unrelated to this ticket's diff. Flagged
in the PR description as a follow-up (raise the timeout or split the test into smaller pieces).

## Acceptance criteria

All 5 met:
- [x] Toast/notification provider added and available app-wide
- [x] `AddLocationDialog` error toast fixes the silent-failure bug
- [x] Success toasts on adding a location and saving a draft
- [x] Keep-or-migrate decision made explicit (kept the inline banner, toast only on
      previously-silent paths)
- [x] Toasts are accessible (verified manually — sonner's built-in live region, dismissible via
      close button)

## PR

https://github.com/seifallahmedini/meridian-platform/pull/8

## Ticket status

MLP-49 transitioned To Do → In Review, with an implementation-report comment posted.

## Code review

Per explicit user instruction, the code-review stage was skipped for this ticket. The workflow
ends here.

## Deferred / follow-ups

- Pre-existing flaky test in `NewShipmentPage.test.tsx` (see above) — worth its own ticket.
- MLP-50 (shared loading/empty/error state components) and MLP-51 (drafts list search/filter/
  delete) remain open under the MLP-47 epic.
