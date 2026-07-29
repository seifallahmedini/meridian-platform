# Exploration — MLP-48: Add app navigation shell

## Ticket summary

- **User story:** As a user of the app, I want a persistent navigation shell so I can move
  between Home, New Shipment, and Drafts without knowing URLs by hand.
- **Acceptance criteria:**
  1. App shell shows persistent nav links to Home, New Shipment, and Drafts, with the current
     route visually indicated (active state).
  2. App shell shows a user menu (or equivalent) with a logout action, wired to the existing
     Keycloak/OIDC auth (`react-oidc-context`).
  3. The shipment creation form (`NewShipmentPage.tsx`) has a visible Cancel/back action that
     returns to Home or Drafts without requiring a full page reload.
  4. The post-create success screen offers a way back to Home/Drafts, not just "Create another
     shipment".
  5. Nav is keyboard-navigable and uses accessible markup (`<nav>` landmark, visible focus
     states).
  6. Existing protected-route behavior and current page content are unaffected — shell/nav only,
     no new pages.
- **Priority / epic:** Medium, no story points set. Parent epic **MLP-47 "Improve UX/UI of the
  application"**. MLP-47 itself has no strict AC — it's a theme list; this ticket is the first
  scoped child carved out of it (navigation was picked as most foundational: nothing else is
  currently reachable without typing a URL).
- **Out of scope (per ticket):** new pages (shipment list/detail — link placeholders/disabled
  links are fine), toast/notification system, mobile-specific nav pattern, dark mode toggle.

## Repository at a glance

- **Stack:** .NET 10 (ASP.NET Core Minimal API) backend in `src/` — **not touched by this
  ticket**, it's frontend-only. React 19 + Vite + TypeScript SPA in `web/` (Tailwind v4,
  shadcn/ui + Radix primitives via the `radix-ui` package, React Router v7, TanStack Query,
  OIDC+PKCE via `react-oidc-context`).
- **Build/test:** `npm run build` (`tsc -b && vite build`), `npm test` (Vitest + Testing
  Library), `npm run lint` (oxlint) — all run from `web/`.
- **Local run:** `dotnet run --project src/AppHost` (Aspire) or `docker compose up`.
- **Installed shadcn components:** `button, card, command, dialog, form, input, label, popover,
  select, switch` (`web/src/components/ui/`). No `dropdown-menu`, `avatar`, `navigation-menu`,
  `sheet`, or `tooltip` yet — any of these needed for a user menu must be added.
- **Icons:** `lucide-react` is already a dependency — usable for nav icons without adding
  anything new.

## Requirement → code map

| Acceptance criterion | Where it lands | Notes |
| --- | --- | --- |
| Persistent nav links (Home/New Shipment/Drafts) + active state | `web/src/layouts/AppShell.tsx` — currently renders only a static header (`<span>Meridian Platform</span>`) with no nav at all | Active-route styling via React Router's `NavLink` (not currently imported anywhere in the repo — `router.tsx` only uses `Link`/`useNavigate`) |
| User menu + logout | New component inside `AppShell.tsx`'s header, using `useAuth()` from `react-oidc-context` | `auth.user?.profile` (OIDC claims) has name/email if the Keycloak realm sends them; logout is `auth.signoutRedirect()` (already configured: `post_logout_redirect_uri` is set in `AuthProvider.tsx`). No user-menu UI primitive installed — needs a new shadcn `dropdown-menu` (or a plain `Popover`, which is already installed, avoiding the shadcn-CLI workaround entirely) |
| Cancel/back on shipment form | `web/src/pages/shipments/NewShipmentPage.tsx` — form's action row (lines 248-255) currently only has "Save as Draft" / "Create Shipment"; no cancel button | Add a third `Button variant="outline"` calling `navigate('/shipments/drafts')` or `navigate(-1)`, next to the existing two |
| Success screen return link | `NewShipmentPage.tsx` lines 137-156 (the `submitted` branch) — only renders "Create another shipment" | Add a `Link`/`Button` to `/shipments/drafts` (or home `/`) alongside the existing button |
| Keyboard/accessible nav | New nav markup in `AppShell.tsx` | Use a real `<nav aria-label="Main">` landmark; shadcn/Radix components (already used elsewhere in this repo) provide focus-visible styles by default — match existing conventions rather than hand-rolling focus CSS |
| No regressions to protected routes / existing pages | `web/src/auth/ProtectedRoute.tsx`, `web/src/router.tsx` | Both stay structurally the same; `AppShell` wraps `<Outlet />` already, so nav is additive around it, not a rework of routing |

## Files likely to change

- `web/src/layouts/AppShell.tsx` — add `<nav>` with `NavLink`s to `/`, `/shipments/new`,
  `/shipments/drafts`, plus a user-menu element in the header. This is the core of the ticket.
- `web/src/pages/shipments/NewShipmentPage.tsx` — add a Cancel button to the form's action row
  and a "Back to drafts"/"Back home" link on the success screen.
- `web/src/components/ui/dropdown-menu.tsx` (new, if a dropdown pattern is chosen for the user
  menu) **or** reuse the already-installed `popover.tsx` — see shadcn-CLI risk below before
  deciding.
- `web/src/layouts/AppShell.test.tsx` (new) — no test file exists for `AppShell` today; one
  should be added following `NewShipmentPage.test.tsx`'s pattern (mock `react-oidc-context`'s
  `useAuth`, mock `react-router`, render via Testing Library).
- Possibly `web/src/pages/shipments/NewShipmentPage.test.tsx` — extend if the new
  Cancel/back-link buttons need coverage (existing file already mocks `useNavigate`, so
  assertions on `navigate` calls fit the existing pattern).

## Patterns & conventions to follow

- **Routing:** `react-router` v7's `Link`/`useNavigate` (see `DraftsListPage.tsx`,
  `NewShipmentPage.tsx`). `NavLink` (for active-state styling) isn't used anywhere yet — this
  ticket introduces it, following the same import style (`from 'react-router'`, not
  `react-router-dom`).
- **Auth:** `useAuth()` from `react-oidc-context` is already the established pattern
  (`ProtectedRoute.tsx`). Tests mock it via `vi.mock('react-oidc-context', () => ({ useAuth: () =>
  ({...}) }))` — replicate exactly (see `NewShipmentPage.test.tsx` lines 25-32).
- **UI components:** shadcn/ui + Tailwind v4 utility classes, `cn()` helper from
  `web/src/lib/utils.ts` for conditional classNames (used throughout existing components).
- **Testing:** Vitest + Testing Library, one test file per page/component, generated API client
  and `react-oidc-context`/`react-router` mocked at the module boundary rather than through
  providers. `AppShell` will need its own test file; no precedent exists for testing a layout
  component specifically, so `NewShipmentPage.test.tsx` is the closest structural reference.

## Risks & open questions

- **shadcn CLI gotcha (previously hit in MLP-18):** `npx shadcn@latest add <component>` writes
  into a literal `./@/` directory instead of resolving the `@/*` alias against this repo's
  toolchain (Vite 8, TS 6, React 19.2), requiring a manual move into
  `web/src/components/ui/`. **Recommendation:** build the user menu with the already-installed
  `Popover` component instead of adding a new `dropdown-menu` component, to sidestep this
  entirely — functionally equivalent for a small user menu, and it's the pattern this repo
  already uses for `LocationCombobox`.
- **No user-profile display data confirmed.** The ticket says "user menu (or equivalent) with a
  logout action" — whether the Keycloak realm's token actually includes a display name/email
  claim (`auth.user?.profile.name` / `.email`) hasn't been verified against the running realm
  config. If absent, the menu will need a fallback (e.g. just "Account" / a generic icon) rather
  than blocking on a specific claim being present. Worth a quick manual check against the local
  Keycloak realm before implementation, not a hard blocker.
- **"Placeholder/disabled links are acceptable for pages that don't exist yet"** (per the
  ticket's out-of-scope note) — there is no shipment list/detail page yet, only Drafts. Home
  (`/`) currently renders `SampleWidgetsPage`, a demo page unrelated to shipments. Nav to "Home"
  will point at this demo page as-is; not this ticket's job to replace it, but worth flagging
  since a first-time user clicking "Home" won't land on anything shipment-related.
  **Open question for the ticket owner:** should "Home" in the nav bar be relabeled or should the
  index route be swapped to something shipment-relevant as part of this ticket, or is linking to
  the existing demo page acceptable for now? Deferred to stage 2 rather than assumed.
- **Mobile nav explicitly out of scope**, but the nav markup added here will still render at
  small viewports (no breakpoint hiding it) since `AppShell.tsx`'s container is a fixed
  `max-w-3xl` with no existing responsive nav pattern to follow. A reasonably compact
  horizontal nav (not a hamburger menu) is likely sufficient given out-of-scope note, but should
  be confirmed rather than assumed to avoid scope creep into "mobile-specific nav pattern."
