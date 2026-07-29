# Technical Instructions — MLP-48: Add app navigation shell

## Approach

Add navigation entirely inside the existing `AppShell.tsx` header — no routing rework needed,
since `AppShell` already wraps every route via `<Outlet />`. Use React Router v7's `NavLink` (not
used elsewhere in the repo yet, but the natural fit for active-state styling) for the three nav
links, and build the user menu with the **already-installed `Popover`** component rather than
adding a new `dropdown-menu` — this avoids the shadcn-CLI alias-resolution workaround that cost
real time on MLP-18 (`npx shadcn add` writes into a literal `./@/` dir on this toolchain and has
to be moved by hand). Add a Cancel button to the shipment form's action row and a return link on
its success screen, both using the existing `useNavigate`/`Link` patterns already in
`NewShipmentPage.tsx` and `DraftsListPage.tsx`.

## Files to create/modify

- **`web/src/layouts/AppShell.tsx`** (modify) — add a `<nav aria-label="Main">` with `NavLink`s
  to `/` ("Home"), `/shipments/new` ("New Shipment"), `/shipments/drafts` ("Drafts"); add a user
  menu (Popover-based) to the header showing `auth.user?.profile?.name` (falling back to
  `.email`, then a generic "Account" label if neither is present) with a "Sign out" action.
- **`web/src/pages/shipments/NewShipmentPage.tsx`** (modify) — add a `Button variant="outline"`
  labeled "Cancel" to the action row (next to "Save as Draft" / "Create Shipment") that calls
  `navigate('/shipments/drafts')`; add a "Back to Drafts" link/button to the `submitted` success
  screen alongside the existing "Create another shipment" button.
- **`web/src/layouts/AppShell.test.tsx`** (new) — no test file exists for `AppShell` today.
- **`web/src/pages/shipments/NewShipmentPage.test.tsx`** (extend) — add cases for the new Cancel
  button and success-screen back link, reusing the file's existing `useNavigate`/`useAuth` mocks.

No backend (`src/`) changes — this ticket is frontend-only.

## Interfaces & contracts

No new API endpoints or data model changes. Uses the existing `useAuth()` hook from
`react-oidc-context` exactly as `ProtectedRoute.tsx` does:
- `auth.isLoading`, `auth.isAuthenticated` — gate what the header/user-menu area renders.
- `auth.user?.profile?.name` / `auth.user?.profile?.email` — display name in the user menu (both
  optional; see open question below).
- `auth.signoutRedirect()` — already configured with `post_logout_redirect_uri` in
  `AuthProvider.tsx`; wire directly to the "Sign out" action, no new config needed.

## Validation & edge cases

- **Unauthenticated user:** nav links still render and are clickable (routes behind
  `ProtectedRoute` will show their own "Log in with Keycloak" button on click — unchanged
  behavior). Show a "Log in" affordance in place of the user menu instead of an empty/broken
  menu.
- **`auth.isLoading`:** nav renders normally; the user-menu area shows nothing (or reuses the
  existing plain-text `Loading...` convention from `ProtectedRoute.tsx` — do **not** introduce a
  new spinner/skeleton component, that's tracked separately under MLP-47's feedback-states
  theme).
- **Missing profile claims:** if neither `name` nor `email` is present on the token, fall back to
  a generic label (e.g. "Account") rather than rendering blank.
- **Active-route highlighting:** `/shipments/new` must also read as active on
  `/shipments/new/:id` (editing a draft) — do not pass NavLink's `end` prop for that link, but do
  pass it for `/` so Home doesn't stay highlighted everywhere.
- **Cancel button:** navigates immediately with no unsaved-changes confirmation prompt — a
  dirty-check/confirm dialog is a distinct, out-of-scope concern (destructive-action confirmation
  patterns are tracked separately under MLP-47).

## Non-functional requirements

- **Accessibility:** real `<nav aria-label="Main">` landmark; link text is visible (not
  icon-only); rely on NavLink's built-in `aria-current="page"` on the active link rather than a
  custom implementation; focus-visible states come from the existing shadcn/Tailwind defaults
  already used throughout the repo — no custom focus CSS needed.
- **Performance/security/observability:** none beyond what already exists — this is static nav
  markup plus a call to an already-configured OIDC method.
- **i18n:** none — repo has no i18n today; plain English strings, consistent with existing pages.

## Test strategy

**`AppShell.test.tsx` (new):**
- Renders nav links to `/`, `/shipments/new`, `/shipments/drafts`.
- Active link gets `aria-current="page"` on the matching route (mock the router location).
- Authenticated (`useAuth` mocked `isAuthenticated: true`): user menu/Sign-out control renders;
  clicking Sign out calls `auth.signoutRedirect()`.
- Unauthenticated (`isAuthenticated: false`): a "Log in" affordance renders instead of the user
  menu.

**`NewShipmentPage.test.tsx` (extend):**
- Clicking Cancel calls `navigate` with `/shipments/drafts` (existing file already mocks
  `useNavigate`, so this follows the established pattern).
- Success screen (`submitted` state) renders a working back-to-drafts control alongside "Create
  another shipment".

No e2e/manual test tooling exists in this repo — not adding any as part of this ticket.

## Out of scope

- New pages (shipment list/detail) — nav links to routes that don't exist yet are not part of
  this ticket.
- Toast/notification system.
- Mobile-specific nav pattern (hamburger menu, etc.) — nav renders as a plain horizontal list at
  all viewport widths.
- Dark mode toggle.
- Unsaved-changes confirmation dialog on Cancel.
- Any backend (`src/`) changes.

## Open questions

- **"Home" nav target:** `/` currently renders `SampleWidgetsPage`, a demo page unrelated to
  shipments. Default for this ticket: link "Home" to `/` as-is, no content changes to that page —
  flag to the product owner separately whether the index route should eventually become
  shipment-relevant. Not a blocker for this ticket.
- **Keycloak profile claims:** not yet confirmed whether the local/deployed Keycloak realm
  actually sends `name`/`email` claims. Implementation should handle the fallback regardless (see
  Validation section above), so this does not block starting work — just worth a quick manual
  check against the running realm during implementation.
