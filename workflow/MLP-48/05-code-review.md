# Code Review — MLP-48: Add app navigation shell

**PR:** https://github.com/seifallahmedini/meridian-platform/pull/7
**Diff reviewed:** `git diff main...HEAD` on `feature/MLP-48-app-navigation-shell` (6 commits)
**Overall verdict:** No high-severity findings — clean, comment-only review posted to the PR.

## Method

Three independent review passes run as parallel sub-agents against the same diff (Correctness,
Standards, Spec), each re-running `npm test`/`npm run lint`/`npm run build` themselves. Findings
spot-checked against the actual source before aggregating.

## Correctness — 0 findings

Traced the `NavLink` active-route matching against the real route tree in `router.tsx`, the
`react-oidc-context`/`oidc-client-ts` state machine (including background silent token renewal,
to rule out the user menu flickering during refresh), the
`auth.user?.profile.name ?? .email ?? 'Account'` fallback chain (confirmed it can't throw), and
all new event-handler wiring (`navigate('/shipments/drafts')` calls, `signinRedirect`/
`signoutRedirect`, `Cancel` button's `type="button"` + `disabled` state). No concrete bug or
crash scenario found. Test suite (13/13) and production build both pass.

## Spec — 0 findings

Every acceptance criterion and Definition-of-Done item in `03-plan.md` checked directly against
the diff, including the specific edge cases from `02-technical-instructions.md`: the `NavLink`
`end`-prop nuance (`/shipments/new` correctly stays unset so `/shipments/new/:id` still
highlights), `auth.isLoading` handling, missing-profile-claim fallback, no unsaved-changes prompt
on Cancel, and the two open questions (Home nav target, Keycloak claims) handled per their stated
defaults. Nothing from the out-of-scope list was implemented. `ProtectedRoute.tsx` has zero diff.

## Standards — 2 non-gating findings

1. **CONFIRMED** — `AppShell.tsx:23`: the new user menu's login button reads "Log in", while
   `ProtectedRoute.tsx:14` labels the identical `auth.signinRedirect()` action "Log in with
   Keycloak". Same action, two different labels depending on entry point.
2. **PLAUSIBLE** — `AppShell.tsx:16`: `UserMenu` returns `null` while `auth.isLoading`, whereas
   `ProtectedRoute.tsx:8-10` is the only existing precedent for that state and renders visible
   "Loading..." text. `02-technical-instructions.md` explicitly permitted either choice, so this
   may be a deliberate, allowed divergence rather than an oversight.

Both are copy/consistency nits, not defects — non-gating per the review's severity rules
(Standards findings never gate; only CONFIRMED Correctness or CONFIRMED Spec findings do).

## Outcome

Posted as a **comment review** on PR #7 (not request-changes) — no CONFIRMED Correctness or
CONFIRMED Spec findings exist, so nothing blocks merge. The two Standards notes are left for the
author to take or leave.

This is the end of the ticket-to-code workflow for MLP-48.
