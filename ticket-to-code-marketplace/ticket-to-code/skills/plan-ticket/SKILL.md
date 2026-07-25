---
name: plan-ticket
description: >
  Stage 3 of the ticket-to-code workflow. Produce an ordered, step-by-step implementation plan
  from the annotated ticket. Use when the user says "make a plan for this ticket", "plan MLP-123",
  "break this into steps", or right after annotate-ticket finishes. Reads the technical
  instructions, writes 03-plan.md, optionally posts a plan summary to Jira, then hands off to
  implement-plan.
---

# Stage 3 — Build the Implementation Plan

Turn the technical instructions into a concrete, ordered plan a developer (or stage 4) can
execute step by step, with checkpoints. Produce the plan only — no code yet. Then hand off to
`implement-plan`.

First, read `skills/shared/SKILL.md` for the workspace layout and handoff rules.

## Inputs

- Ticket key and workspace path (passed from `annotate-ticket`).
- `workflow/<TICKET-KEY>/02-technical-instructions.md` (and `01-exploration.md` for reference).

If the technical instructions do not exist, run `annotate-ticket` first.

## Step 1 — Sequence the work

Decompose the ticket into small, verifiable steps in dependency order. Good steps are:

- **Small** — one coherent change, reviewable on its own.
- **Ordered** — later steps depend only on earlier ones; do foundational work (models,
  migrations, shared utilities) before the code that uses it.
- **Verifiable** — each step names how to confirm it worked (a test, a command, a manual check).

For each step capture: a title, the files touched, the change, the verification, and an estimate.

## Step 2 — Plan tests and rollout

- **Tests:** list the test files/cases to add and where they run in the sequence (favour writing
  tests alongside or before the code they cover).
- **Migrations/config:** call out schema changes, feature flags, env vars, and their order.
- **Rollout & risk:** note anything needing a flag, a backfill, or a careful deploy, plus how to
  roll back.

## Step 3 — Write the plan

Save `workflow/<TICKET-KEY>/03-plan.md`:

```markdown
# Implementation Plan — <TICKET-KEY>: <summary>

## Branch
`<type>/<TICKET-KEY>-<slug>`

## Steps
### Step 1 — <title>  (est: <S/M/L>)
- Files: `...`
- Change: ...
- Verify: ...

### Step 2 — <title>  (est: ...)
...

## Test plan
- ...

## Migrations / config
- ...

## Rollout & rollback
- ...

## Definition of done
- [ ] All acceptance criteria met (from the ticket)
- [ ] Tests added and passing
- [ ] ...
```

Tie the Definition of Done back to the ticket's acceptance criteria one-to-one.

## Step 4 — (optional) Post the plan to Jira

If the team wants the plan visible on the ticket, add it as a comment via
`addCommentToJiraIssue` under the marker `## 🤖 Implementation Plan (ticket-to-code)`
(idempotent — replace if it already exists). Otherwise keep it in the workspace only.

## Step 5 — Handoff

Summarise the plan in one line (step count, branch name), then **invoke the `implement-plan`
skill**, passing the ticket key and workspace path. Stop and ask only if the plan surfaces a
decision the user must make (e.g., a breaking API change) before coding starts.
