# Exploration — MLP-49: Add toast notifications and fix silent save failures

## Ticket summary

- **User story:** As a user, I want visible feedback when an action succeeds or fails, so
  failures aren't silent and successes are confirmed.
- **Acceptance criteria:**
  1. A toast/notification component (e.g. shadcn's `sonner`) is added and available app-wide via
     a single provider in the app shell.
  2. `AddLocationDialog` shows an error toast when location creation fails (currently silent) —
     the primary bug this ticket fixes.
  3. Successful actions that currently give no confirmation (adding a location, saving a draft)
     show a success toast.
  4. Existing inline error displays (`NewShipmentPage`'s `saveError` banner) are either kept or
     migrated to the toast pattern — one approach per action, not both.
  5. Toasts are accessible: `aria-live`/`role="status"`, dismissible, keyboard-reachable.
- **Priority / epic:** Medium, no story points. Parent epic **MLP-47 "Improve UX/UI of the
  application"**, sibling of [MLP-48](https://seifallahmedini.atlassian.net/browse/MLP-48)
  (navigation shell, already shipped via PR #7).
- **Out of scope (per ticket):** a full error-boundary/retry-queue system; the navigation shell
  (done); shared loading/empty-state components (tracked separately as
  [MLP-50](https://seifallahmedini.atlassian.net/browse/MLP-50)).

## Repository at a glance

- **Stack:** React 19 + Vite + TypeScript SPA in `web/` (Tailwind v4, shadcn/ui + Radix via the
  `radix-ui` package, React Router v7, TanStack Query, `react-hook-form` + `zod`). Backend
  (`src/`, .NET 10) is untouched by this ticket.
- **Build/test:** `npm run build` (`tsc -b && vite build`), `npm test` (Vitest + Testing
  Library), `npm run lint` (oxlint) — all from `web/`.
- **Installed shadcn components:** `button, card, command, dialog, form, input, label, popover,
  select, switch`. No `sonner`/toast component exists yet.
- **No toast library dependency** (`sonner` is not in `web/package.json`).

## Requirement → code map

| Acceptance criterion | Where it lands | Notes |
| --- | --- | --- |
| Toast provider available app-wide | `web/src/App.tsx` — currently `AuthProvider` > `QueryClientProvider` > `RouterProvider`, nothing else | A single `<Toaster />` mounted once here (or in `AppShell.tsx`) covers every route; no provider currently exists to piggyback on |
| `AddLocationDialog` error toast | `web/src/pages/shipments/components/AddLocationDialog.tsx` lines 60-77 — `createMutation` has an `onSuccess` but **no `onError` at all** | Confirmed by reading the file: a failed `createLocation` call today does nothing visible — the dialog stays open with no message, exactly as flagged in the ticket |
| Success toasts (add location, save draft) | `AddLocationDialog.tsx`'s `onSuccess` (currently just calls `onCreated` + closes dialog) and `NewShipmentPage.tsx`'s `saveMutation.onSuccess` draft branch (currently just navigates to `/shipments/drafts` with no confirmation) | Both are real gaps — TanStack Query's `onSuccess` callbacks are the natural place to fire a toast |
| Keep-or-migrate inline error decision | `NewShipmentPage.tsx` lines 104-106 (`onError` sets `saveError`) and lines 242-246 (the `role="alert"` paragraph) | This inline error path already has test coverage (`NewShipmentPage.test.tsx`'s "shows a visible error and does not navigate away" case) and matches the repo's one existing accessible-error convention — recommend **keeping it as-is** for the Create/Draft-save error case and reserving the new toast exclusively for actions that currently have *zero* feedback (`AddLocationDialog` errors, both success cases) rather than duplicating every error path into both an inline banner and a toast. This is a decision for stage 2 to state explicitly, not assume silently |
| Accessible toasts | Whatever toast library is chosen | `sonner` renders its own live region and is keyboard-dismissible out of the box; needs verifying once installed, not implemented from scratch |

## Files likely to change

- `web/package.json` — add `sonner` as a plain npm dependency.
- `web/src/App.tsx` (or `web/src/layouts/AppShell.tsx`) — mount a single `<Toaster />`.
- `web/src/pages/shipments/components/AddLocationDialog.tsx` — add `onError` (toast) and a
  success toast to the existing `onSuccess`.
- `web/src/pages/shipments/NewShipmentPage.tsx` — add a success toast to the "Save as Draft"
  path's `onSuccess` branch (`isDraft: true`); leave the existing `saveError` inline-banner path
  for Create-shipment errors as-is per the recommendation above, unless stage 2 decides otherwise.
- Test files: `AddLocationDialog.test.tsx` (new — no test file exists for this component today)
  and extensions to `NewShipmentPage.test.tsx` for the new draft-save success toast.

## Patterns & conventions to follow

- **Avoiding the shadcn-CLI risk (already hit twice, MLP-18 and noted again in MLP-48):**
  `npx shadcn@latest add <component>` writes into a literal `./@/` directory on this toolchain
  instead of resolving the `@/*` alias. shadcn's own `sonner` component additionally assumes
  Next.js (`next-themes`' `useTheme` for light/dark switching), which doesn't exist in this Vite
  app at all. **Recommendation: skip the shadcn CLI entirely for this ticket** — `npm install
  sonner` directly and hand-write a thin `web/src/components/ui/sonner.tsx` (or inline `<Toaster
  />` usage) that doesn't depend on `next-themes`, matching the same "install what's needed,
  avoid the CLI" approach MLP-48 took by reusing `Popover` instead of adding `dropdown-menu`.
- **Mutations:** every existing mutation in the repo (`AddLocationDialog`, `NewShipmentPage`) uses
  TanStack Query's `useMutation` with `onSuccess`/`onError` callbacks — the toast calls belong
  inside those, not a new abstraction layer.
- **Testing:** existing tests mock `react-oidc-context` and the generated API client at the
  module boundary (`vi.mock('@/lib/api-client', ...)`, `vi.mock('react-oidc-context', ...)`) —
  no precedent yet exists for testing a toast appearance; `sonner`'s toasts render via a portal,
  so a new test will need `screen.findByText(...)` against `document.body` the same way
  `AppShell.test.tsx`'s `Popover`-based tests already do (Radix/portal-based components are
  already exercised in this repo's test suite, so this isn't a new testing pattern class, just a
  new library).
- **Accessibility:** the repo's one established accessible-error convention is
  `NewShipmentPage.tsx`'s `role="alert"` / `aria-live="polite"` announcer — worth checking that
  `sonner`'s default live-region behavior doesn't produce *double* announcements when both an
  inline `role="alert"` and a toast fire for the same event (relevant to the keep-or-migrate
  decision above).

## Risks & open questions

- **The keep-or-migrate decision for `NewShipmentPage`'s inline error banner is not resolved by
  the ticket text** — it explicitly says "either kept or migrated," deferring the call. Given the
  inline path already has test coverage and matches the one existing accessible pattern in the
  repo, the recommendation above is to keep it and scope the toast to the currently-silent gaps
  only. This should be stated explicitly in the technical instructions rather than left ambiguous
  going into implementation.
- **shadcn's default `sonner.tsx` wrapper assumes `next-themes`**, which this repo doesn't use (no
  theme-toggle exists yet — dark-mode tokens exist in `index.css` but are unreachable, per
  MLP-47's original findings). Installing shadcn's stock component as-is would introduce a
  dependency on a package/pattern (`next-themes`) that doesn't fit a Vite app and isn't used
  anywhere else in the repo. The recommendation above (skip the CLI, hand-write a minimal
  wrapper) avoids this, but it's worth flagging as a real gotcha rather than assuming the CLI
  output would "just work."
- **No existing precedent for testing toast/portal-rendered success confirmations** in this repo
  (only error/loading text has been tested so far) — not a blocker, but the first test of this
  kind, so stage 3's plan should budget a little extra time for it.
- **Where exactly the `<Toaster />` mounts** (`App.tsx` vs `AppShell.tsx`) isn't dictated by the
  ticket — either works since both are single global wrappers; `App.tsx` is slightly cleaner
  since it's outside the router entirely and won't remount on navigation, but this is a minor
  implementation detail for stage 2/3 to settle, not a real risk.
