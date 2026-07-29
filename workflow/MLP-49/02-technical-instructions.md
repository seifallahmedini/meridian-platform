# Technical Instructions — MLP-49: Add toast notifications and fix silent save failures

## Approach

Install `sonner` as a plain npm dependency and mount a single `<Toaster />` once in
`web/src/App.tsx` (outside the router, so it never remounts on navigation) — **do not** run
`npx shadcn@latest add sonner`. shadcn's stock `sonner.tsx` wrapper depends on `next-themes` for
light/dark switching, which this Vite app doesn't use and has no equivalent for (no theme toggle
exists yet); on top of that, the shadcn CLI's alias-resolution workaround (writes into a literal
`./@/` dir on this toolchain) has already cost real time twice (MLP-18, noted again in MLP-48).
Hand-write a minimal `<Toaster />` usage with a fixed theme instead. Wire `toast.error(...)` into
`AddLocationDialog`'s missing `onError` (the ticket's primary bug fix), and `toast.success(...)`
into the two currently-silent success paths (add location, save draft). Leave
`NewShipmentPage`'s existing `saveError` inline `role="alert"` banner as-is for Create-shipment
errors — it already has test coverage and is the repo's one established accessible-error
pattern; duplicating it into a toast for the same event would just produce two announcements
for one failure.

## Files to create/modify

- **`web/package.json`** (modify) — add `sonner` as a dependency (`npm install sonner`).
- **`web/src/App.tsx`** (modify) — import `Toaster` from `sonner` and render `<Toaster
  richColors closeButton />` once, alongside `AuthProvider`/`QueryClientProvider`/`RouterProvider`.
- **`web/src/pages/shipments/components/AddLocationDialog.tsx`** (modify) — add `onError` to
  `createMutation` calling `toast.error('Failed to save the address. Please try again.')`; add
  `toast.success('Address saved.')` to the existing `onSuccess` (alongside its current
  `onCreated`/`onOpenChange(false)` calls).
- **`web/src/pages/shipments/NewShipmentPage.tsx`** (modify) — in `saveMutation`'s `onSuccess`,
  add `toast.success('Draft saved.')` on the `isDraft: true` branch only (the non-draft branch
  already shows a full "Shipment created" screen, which is confirmation enough — do not add a
  redundant toast there). Leave the `onError` / `saveError` / `role="alert"` banner untouched.
- **`web/src/pages/shipments/components/AddLocationDialog.test.tsx`** (new) — no test file exists
  for this component today.
- **`web/src/pages/shipments/NewShipmentPage.test.tsx`** (extend) — add a case for the new
  draft-save success toast.

No backend (`src/`) changes.

## Interfaces & contracts

No new API endpoints or data model changes. `sonner`'s public API used: `toast.success(message:
string)`, `toast.error(message: string)`, and the `<Toaster />` component (props: `richColors`
for semantic error/success coloring, `closeButton` for keyboard/pointer dismissal — both are
built-in `sonner` props, no custom styling needed).

## Validation & edge cases

- **`AddLocationDialog` error toast:** fires on any `createLocation` rejection (network error,
  validation error surfaced by the API, etc.) — the dialog stays open (unchanged behavior) so the
  user can retry without re-entering data; the toast is the *only* new feedback, no other UI
  changes to the dialog.
- **Success toasts fire once per successful mutation**, not on every render — this falls out
  naturally from placing them in `onSuccess`, but verify no duplicate toasts fire if
  `saveMutation`/`createMutation` retries internally (neither currently configures retries beyond
  TanStack Query's defaults; do not change retry behavior as part of this ticket).
- **No toast on the Create-shipment success path** — the existing "Shipment created" screen
  already serves as confirmation; adding a toast there would be redundant, not additive.
- **No toast on Create-shipment *failure*** — stays exactly as today (inline `saveError`
  banner), per the keep-or-migrate decision above.
- **Dismissal:** toasts must be dismissible via the `closeButton` prop and via keyboard (verify
  `sonner`'s default keyboard handling covers this — it does out of the box, but confirm rather
  than assume).

## Non-functional requirements

- **Accessibility:** `sonner` renders its own ARIA live region by default — confirm (during
  implementation, e.g. via the accessibility tree in a manual browser check) that this doesn't
  produce a *double* announcement when `NewShipmentPage`'s existing `role="alert"` banner and a
  hypothetical toast could both fire for the same event; this is avoided by design here since no
  action gets both an inline banner and a toast, but call it out if that changes later.
- **Performance/security/observability:** none beyond what already exists — this is a UI-feedback
  layer with no new data flow.
- **i18n:** none — repo has no i18n today; plain English toast copy, consistent with existing
  strings ("Failed to load", "No drafts yet.", etc.).
- **Bundle size:** `sonner` is a small, dependency-light package — no code-splitting or lazy-load
  concerns for this ticket.

## Test strategy

**`AddLocationDialog.test.tsx` (new):**
- Submitting the form with a mocked `createLocation` rejection shows an error toast (query
  `sonner`'s rendered content via `screen.findByText(...)`, matching how `AppShell.test.tsx`
  already queries portal-rendered `Popover` content in this repo).
- Submitting the form with a mocked successful `createLocation` shows a success toast and still
  calls `onCreated`/closes the dialog (existing behavior, now with an added assertion).

**`NewShipmentPage.test.tsx` (extend):**
- Saving a draft successfully (the existing "saves as draft even when every field is empty"
  case, or a new case alongside it) shows a "Draft saved." success toast.
- The existing "shows a visible error and does not navigate away when saving a draft fails" test
  must keep passing unchanged — confirms the inline error path is untouched.

No e2e/manual test tooling exists in this repo — not adding any as part of this ticket. A manual
browser check (via `npm run dev` or the full docker-compose stack) is worth doing once to eyeball
toast styling/positioning, since this is the first time this repo renders anything via `sonner`.

## Out of scope

- A full error-boundary/retry-queue system.
- Navigation shell (delivered in MLP-48).
- Shared loading/empty-state components (tracked separately as MLP-50).
- Migrating `NewShipmentPage`'s existing inline error banner to a toast (explicitly decided
  against above — keep it).
- Any theme/dark-mode wiring for the toaster (no theme toggle exists yet; ship with a single
  fixed appearance).
- Any backend (`src/`) changes.

## Open questions

- None blocking. The one true open item from exploration — whether to keep or migrate
  `NewShipmentPage`'s inline error banner — is resolved above (keep it) rather than left for
  implementation to guess.
