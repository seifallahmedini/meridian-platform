# Exploration — MLP-45: Decide the technology stack for the Meridian Logistics Platform (architecture spike)

## Ticket summary

- **User story:** As the engineering team, we need to agree on the technology stack and record
  the decision, so that all feature work (MLP-9 … MLP-17) starts on a stable, well-understood
  foundation instead of ad-hoc choices per feature.
- **Context:** This is the first requirement for the platform and a blocker for every feature
  epic. The stack must support: booking forms, real-time tracking, warehouse/dock scheduling,
  customs docs, freight audit & billing, analytics/reporting, enterprise RBAC + SSO/SCIM, and a
  public REST API + webhooks.
- **Acceptance criteria:**
  1. At least two viable stack options are compared against the platform's needs (auth/SSO,
     background jobs, realtime, reporting, public API).
  2. A decision is recorded as an ADR committed to the repo (`docs/adr/0001-tech-stack.md`),
     including rationale and rejected alternatives.
  3. The team signs off on the chosen stack.
  4. A minimal repository is scaffolded on the chosen stack (app boots, a sample module + test
     runs green, CI runs the test on push).
  5. Local setup steps are documented in the README so a new engineer can run the app and tests.
- **Priority / type:** Highest (P0) · Task, labeled `architecture`, `foundation`, `spike` ·
  5 story points. No parent epic — this ticket itself is the blocker that every epic below
  depends on.
- **Proposed stack in the ticket (to validate, not just accept):** TypeScript end-to-end,
  Next.js (App Router), tRPC (internal) + Next.js route handlers for the public REST API with
  Zod validation at every boundary, PostgreSQL via Prisma, Auth.js (app login) + WorkOS
  (enterprise SSO/SCIM), Inngest (background jobs), SSE/WebSockets via Ably or Postgres
  LISTEN/NOTIFY (realtime), Tailwind + shadcn/ui + TanStack Query/Table + Recharts (UI),
  Vitest + Playwright (testing), Vercel + Neon (hosting).
- **Out of scope (explicit in ticket):** implementing any feature from MLP-9…MLP-17; production
  infra hardening, monitoring, cost optimisation.
- **Comments:** none on the ticket yet.

## Downstream epics this decision must support

Pulled from the full MLP project backlog (`project = MLP`) to ground the stack comparison in
real requirements rather than the ticket's prose alone:

| Epic | Priority | What it needs from the stack |
| --- | --- | --- |
| MLP-9 Shipment Booking | Highest | Forms, validation, transactional writes |
| MLP-10 Carrier Management | Highest | CRUD, external carrier integrations |
| MLP-11 Real-Time Tracking | Highest | Realtime/push updates, map view (MLP-26) |
| MLP-12 Warehouse & Dock Scheduling | High | Calendar/scheduling logic (MLP-29) |
| MLP-13 Customs & Documentation | High | Document generation (MLP-32), versioned storage (MLP-33) |
| MLP-14 Freight Audit & Billing | Medium | Background jobs for invoice ingestion/matching (MLP-34, MLP-35) |
| MLP-15 Analytics & Reporting | Medium | Dashboards (MLP-38), charting, custom report builder (MLP-40) |
| MLP-16 User Management & Permissions | Highest | RBAC (MLP-41, Highest) + SSO/SCIM (MLP-42, Highest) |
| MLP-17 Notifications & Integrations | Medium | Notification centre (MLP-43), webhooks + public REST API (MLP-44) |

This confirms the ticket's own requirement list is accurate and complete — nothing in the
backlog demands a capability the proposed stack doesn't already address (e.g. no mobile-native
requirement, no non-relational/graph data need surfaced anywhere).

## Repository at a glance

**The repository is currently empty of application code.** It contains only:

- `LICENSE` (MIT)
- `.git/` — single commit (`fb1b94f Initial commit`) on `main`, remote
  `https://github.com/seifallahmedini/meridian-platform`
- `.claude/` and `ticket-to-code-marketplace/` — untracked, this automation's own tooling, not
  part of the application

There is no `package.json`, `pyproject.toml`, `go.mod`, README, `docs/adr/` directory, or CI
config. No framework, test runner, or build system to detect — this is a **greenfield** stack
decision, not a fit-into-existing-code exercise. That changes the shape of this workflow: stage 2
(annotate-ticket) and stage 3 (plan-ticket) are establishing precedent for the ~30 tickets under
MLP-9…MLP-17, not slotting into established patterns.

## Requirement → artifact map

| Acceptance criterion | Where it lands | Notes |
| --- | --- | --- |
| ≥2 viable stack options compared | `docs/adr/0001-tech-stack.md` (comparison section) | Ticket only proposes one stack — a genuine second option must be researched, not rubber-stamped |
| Decision recorded as ADR w/ rationale + rejected alternatives | `docs/adr/0001-tech-stack.md` | `docs/adr/` doesn't exist yet; no ADR template in repo — need to pick one (e.g. MADR / Nygard style) since this is ADR #1 of what will be many |
| Team signs off | Process step (Jira/ADR status field), not code | **Cannot be completed by an agent** — flag as a manual checkpoint in the plan, not an auto-checked box |
| Minimal repo scaffolded: app boots, sample module + test green, CI runs test on push | Repo root: `package.json`, app source, one sample route/module + test, `.github/workflows/ci.yml` | Entirely new; scope tightly per "Out of scope" — a health-check-style module is enough, not a real feature |
| Local setup documented in README | `README.md` | Doesn't exist yet |

## Files likely to be created

- `docs/adr/0001-tech-stack.md` — the decision record itself
- `package.json`, `tsconfig.json`, lockfile — TypeScript/Next.js project root
- `app/` (Next.js App Router) — minimal app shell
- `prisma/schema.prisma` (or equivalent) — only if Prisma/Postgres is confirmed in the ADR
- `.github/workflows/ci.yml` — CI pipeline that installs, builds, and runs tests on push
- `README.md` — local setup + how to run app/tests
- `.env.example` — placeholder env vars (DB URL, auth keys) without real secrets
- ESLint/Prettier config — baseline TS tooling, since none exists

## Patterns & conventions to follow

- None exist in-repo yet — there is nothing to be consistent with. The job here is to *set* the
  first conventions (folder layout for domain modules, where Zod schemas / tRPC routers live,
  ADR format, migration workflow) since every one of the 30+ downstream tickets will follow
  whatever is established here.
- Treat the ticket's proposed stack as a strong, well-reasoned default (it's unusually specific
  and already maps 1:1 onto the backlog's needs) — the real work is the comparison, the
  documentation, and a deliberately minimal scaffold, not re-litigating every choice from
  scratch.

## Risks & open questions

- **"≥2 viable options" needs a real alternative.** The ticket text only presents one stack. A
  credible second option (e.g. NestJS API + separate SPA, or Remix, or a single-auth-provider
  approach) must be articulated for the ADR to satisfy AC #1 rather than being pro forma.
- **Team sign-off is a human step.** Cannot be automated; the plan should surface this as an
  explicit checkpoint (e.g., post ADR as a Jira comment/PR for review) rather than something the
  implementation stage marks "done" on its own.
- **Dual auth providers (Auth.js + WorkOS).** WorkOS also supports standard auth, so running both
  Auth.js and WorkOS adds integration surface — worth confirming in the ADR that splitting is
  actually simpler than WorkOS alone, rather than accepting the split by default.
- **Realtime choice is left open in the ticket itself** ("Ably, or Postgres LISTEN/NOTIFY early
  on") — this ambiguity should be resolved to one concrete choice in the ADR, not carried
  forward unresolved.
- **Third-party services (Inngest, WorkOS, Ably, Neon, Vercel) all need accounts/keys.** The
  "minimal scaffold" sample module + CI test must not depend on live third-party credentials to
  pass — scope it to something dependency-light (e.g., a basic route + Vitest unit test, with
  Postgres/Prisma wiring present but not required for the sample test to go green).
- **No CI provider configured yet.** GitHub Actions is the natural default since the repo is
  already on GitHub — confirm this rather than assume before scaffolding `.github/workflows/`.
- **Scope discipline.** 5 points / P0 / labeled `spike` — the "Out of scope" section explicitly
  excludes implementing any MLP-9…17 feature and excludes production hardening. Stage 3 should
  keep the scaffold minimal (boots + one module + one test + CI) rather than building real
  features under this ticket.
