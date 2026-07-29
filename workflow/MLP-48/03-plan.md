# Implementation Plan — MLP-48: Add app navigation shell

## Branch
`feature/MLP-48-app-navigation-shell`

## Steps

### Step 1 — Add nav links to AppShell  (est: S)
- Files: `web/src/layouts/AppShell.tsx`
- Change: Add `<nav aria-label="Main">` to the header with three `NavLink`s (`from 'react-router'`):
  `/` ("Home", pass `end`), `/shipments/new` ("New Shipment", no `end` so `/shipments/new/:id`
  also matches), `/shipments/drafts` ("Drafts"). Style the active link via `NavLink`'s
  `className` render-prop function using existing Tailwind conventions (`cn()` from
  `web/src/lib/utils.ts`); rely on the built-in `aria-current="page"` rather than a custom
  implementation.
- Verify: `npm run dev`, manually click through all three links from each route, confirm the
  active link is visually distinct and `/shipments/new/2` (a fake id) still highlights "New
  Shipment".

### Step 2 — Add the user menu  (est: M)
- Files: `web/src/layouts/AppShell.tsx`
- Change: Add a `Popover`-based user menu to the header (reuse the already-installed
  `web/src/components/ui/popover.tsx` — do not add a new shadcn component, see technical
  instructions for why). Read `useAuth()` from `react-oidc-context`:
  - `auth.isLoading` → render nothing in the menu slot (match `ProtectedRoute.tsx`'s plain-text
    `Loading...` convention if any placeholder is needed).
  - `!auth.isAuthenticated` → render a "Log in" affordance instead of the menu.
  - `auth.isAuthenticated` → render a trigger showing `auth.user?.profile?.name ??
    auth.user?.profile?.email ?? 'Account'`, opening a popover with a "Sign out" button that
    calls `auth.signoutRedirect()`.
- Verify: manual check in dev against a real Keycloak login — confirm the displayed name/email
  (or fallback), and that "Sign out" actually redirects and clears the session.

### Step 3 — Write AppShell.test.tsx  (est: M)
- Files: `web/src/layouts/AppShell.test.tsx` (new)
- Change: Following `NewShipmentPage.test.tsx`'s mocking pattern (`vi.mock('react-oidc-context', …)`),
  add cases:
  1. Renders nav links to `/`, `/shipments/new`, `/shipments/drafts`.
  2. Active link on a given route gets `aria-current="page"` (mock router location, e.g. via
     `MemoryRouter`/`createMemoryRouter` wrapping `AppShell` + a stub `Outlet` route).
  3. `isAuthenticated: true` → user menu renders; clicking "Sign out" calls the mocked
     `signoutRedirect`.
  4. `isAuthenticated: false` → "Log in" affordance renders instead of the user menu.
- Verify: `npm test` (Vitest) — new file passes.

### Step 4 — Add Cancel button to the shipment form  (est: S)
- Files: `web/src/pages/shipments/NewShipmentPage.tsx`
- Change: In the action row (currently "Save as Draft" / "Create Shipment", lines ~248-255), add
  a third `Button variant="outline"` labeled "Cancel" calling `navigate('/shipments/drafts')`.
  No dirty-check/confirmation prompt (explicitly out of scope).
- Verify: manual click in dev from `/shipments/new` and from `/shipments/new/:id` — confirm it
  navigates to `/shipments/drafts` without a full reload.

### Step 5 — Add return link to the success screen  (est: S)
- Files: `web/src/pages/shipments/NewShipmentPage.tsx`
- Change: In the `submitted` branch (lines ~137-156), add a `Button`/`Link` back to
  `/shipments/drafts` alongside the existing "Create another shipment" button.
- Verify: manual — create a shipment in dev, confirm both actions appear and the back link
  navigates correctly.

### Step 6 — Extend NewShipmentPage.test.tsx  (est: S)
- Files: `web/src/pages/shipments/NewShipmentPage.test.tsx`
- Change: Add cases using the file's existing `useNavigate` mock:
  1. Clicking Cancel calls `navigate('/shipments/drafts')`.
  2. On the success screen, the back-to-drafts control is present and calls `navigate` with the
     expected path when clicked.
- Verify: `npm test` — new cases pass alongside existing ones.

### Step 7 — Full verification pass  (est: S)
- Files: none (verification only)
- Change: n/a
- Verify: `npm run lint` (oxlint), `npm test` (full suite), `npm run build` (`tsc -b && vite
  build`) all green in `web/`. Manual click-through in `npm run dev`: home → new shipment →
  cancel → drafts → open a draft → cancel → create a shipment → success screen → back to drafts;
  log out and confirm nav still renders sensibly while unauthenticated.

## Test plan
- `web/src/layouts/AppShell.test.tsx` (new) — nav rendering, active-link `aria-current`,
  authenticated user menu + sign out, unauthenticated fallback (Step 3).
- `web/src/pages/shipments/NewShipmentPage.test.tsx` (extend) — Cancel navigation, success-screen
  back link (Step 6).
- No backend or e2e tests — this ticket is frontend-only and the repo has no e2e tooling.

## Migrations / config
- None. No schema, env var, or feature-flag changes — pure frontend UI addition using
  already-configured OIDC settings.

## Rollout & rollback
- Standard PR merge to `main`; no flag needed, no data migration, no backend deploy coordination.
- Rollback is a plain revert of the merge commit — no persisted state depends on this change.

## Definition of done
- [ ] Nav shows Home/New Shipment/Drafts with active-route styling (AC1) — Steps 1, 3
- [ ] User menu with logout wired to `react-oidc-context` (AC2) — Steps 2, 3
- [ ] Cancel action on the shipment form (AC3) — Steps 4, 6
- [ ] Success screen offers a way back to Drafts (AC4) — Steps 5, 6
- [ ] Nav uses accessible, keyboard-navigable markup (`<nav>` landmark, `aria-current`) (AC5) —
      Steps 1, 3
- [ ] No regressions to `ProtectedRoute` behavior or existing pages (AC6) — Step 7
- [ ] `npm run lint`, `npm test`, `npm run build` all pass
- [ ] PR opened against `main` and ticket updated
