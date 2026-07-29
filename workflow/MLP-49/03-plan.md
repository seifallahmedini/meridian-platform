# Implementation Plan — MLP-49: Add toast notifications and fix silent save failures

## Branch
`feature/MLP-49-toast-notifications`

## Steps

### Step 1 — Install sonner and mount the Toaster  (est: S)
- Files: `web/package.json`, `web/src/App.tsx`
- Change: `npm install sonner` (plain npm dependency, **not** via `npx shadcn add` — see technical
  instructions for why). In `App.tsx`, import `Toaster` from `sonner` and render `<Toaster
  richColors closeButton />` once, alongside the existing `AuthProvider` /
  `QueryClientProvider` / `RouterProvider` tree.
- Verify: `npm run build` succeeds; manual check in `npm run dev` that the app still boots with
  no console errors (the Toaster renders nothing visible until a toast fires).

### Step 2 — Wire error + success toasts into AddLocationDialog  (est: S)
- Files: `web/src/pages/shipments/components/AddLocationDialog.tsx`
- Change: import `toast` from `sonner`. Add `onError: () => toast.error('Failed to save the
  address. Please try again.')` to `createMutation` (currently has none — this is the ticket's
  primary bug fix). Add `toast.success('Address saved.')` inside the existing `onSuccess`,
  alongside its current `onCreated(location)` / `onOpenChange(false)` calls.
- Verify: manual check in `npm run dev` — trigger a location save (success case, via the running
  API) and confirm a success toast appears; temporarily point the API client at a bad URL (or
  stop the API container) to confirm the error toast fires and the dialog stays open. Revert any
  temporary changes after checking.

### Step 3 — Write AddLocationDialog.test.tsx  (est: M)
- Files: `web/src/pages/shipments/components/AddLocationDialog.test.tsx` (new)
- Change: no test file exists for this component today. Mock `@/lib/api-client` the same way
  `NewShipmentPage.test.tsx` does. Add cases:
  1. Submitting with a mocked `createLocation` rejection shows an error toast (query via
     `screen.findByText(...)` against `document.body`, the same portal-query pattern
     `AppShell.test.tsx` already uses for `Popover` content).
  2. Submitting with a mocked successful `createLocation` shows a success toast and still calls
     `onCreated`/closes the dialog (existing behavior, now with an added toast assertion).
- Verify: `npm test` — new file passes.

### Step 4 — Add success toast to the draft-save path  (est: S)
- Files: `web/src/pages/shipments/NewShipmentPage.tsx`
- Change: import `toast` from `sonner`. In `saveMutation`'s `onSuccess`, add
  `toast.success('Draft saved.')` inside the `if (isDraft)` branch only, before/alongside the
  existing `navigate('/shipments/drafts')` call. Leave the non-draft branch (`setSubmitted(true)`)
  and the entire `onError`/`saveError`/`role="alert"` path untouched.
- Verify: manual check in `npm run dev` — save a draft and confirm the toast appears alongside
  the existing navigation to `/shipments/drafts`.

### Step 5 — Extend NewShipmentPage.test.tsx  (est: S)
- Files: `web/src/pages/shipments/NewShipmentPage.test.tsx`
- Change: add a case asserting the "Draft saved." toast appears after the existing "saves as
  draft even when every field is empty" scenario (or a new case reusing the same setup). Re-run
  the existing "shows a visible error and does not navigate away when saving a draft fails" case
  unchanged to confirm the inline error path wasn't touched.
- Verify: `npm test` — new case passes, all existing cases still pass.

### Step 6 — Full verification pass  (est: S)
- Files: none (verification only)
- Change: n/a
- Verify: `npm run lint`, `npm test` (full suite), `npm run build` all green in `web/`. Manual
  browser check via `npm run dev` (or the full docker-compose stack if exercising real
  success/error responses): add a location (success toast), force a location-add failure (error
  toast, dialog stays open), save a draft (success toast + existing navigation), and confirm the
  Create-shipment error path still shows only the inline banner (no toast). Since this is the
  first time this repo renders anything via `sonner`, also eyeball toast positioning/styling and
  confirm dismissal works via both the close button and keyboard.

## Test plan
- `web/src/pages/shipments/components/AddLocationDialog.test.tsx` (new) — error toast on
  rejection, success toast + existing behavior on success (Step 3).
- `web/src/pages/shipments/NewShipmentPage.test.tsx` (extend) — draft-save success toast; existing
  draft-save-failure test re-verified unchanged (Step 5).
- No backend or e2e tests — this ticket is frontend-only and the repo has no e2e tooling.

## Migrations / config
- None. `sonner` is a plain npm dependency with no environment/config changes required.

## Rollout & rollback
- Standard PR merge to `main`; no flag needed, no data migration, no backend deploy coordination.
- Rollback is a plain revert of the merge commit (and `npm uninstall sonner` if going fully back)
  — no persisted state depends on this change.

## Definition of done
- [ ] Toast/notification provider (`sonner`) added and available app-wide (AC1) — Step 1
- [ ] `AddLocationDialog` shows an error toast on failure, fixing the silent-failure bug (AC2) —
      Steps 2, 3
- [ ] Success toasts on adding a location and saving a draft (AC3) — Steps 2, 3, 4, 5
- [ ] Keep-or-migrate decision made explicit: inline `saveError` banner kept as-is for
      Create-shipment errors, toast only added to previously-silent paths (AC4) — Steps 2, 4
- [ ] Toasts are accessible (live region, dismissible, keyboard-reachable) (AC5) — Step 6 (manual
      verification, since this is the first `sonner` usage in the repo)
- [ ] `npm run lint`, `npm test`, `npm run build` all pass
- [ ] PR opened against `main` and ticket updated
