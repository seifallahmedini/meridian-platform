---
name: annotate-ticket
description: >
  Stage 2 of the ticket-to-code workflow. Turn the exploration findings into concrete technical
  instructions and write them back onto the Jira ticket. Use when the user says "add technical
  instructions to the ticket", "annotate the ticket", "document the approach on a ticket", or
  right after explore-ticket finishes. Reads 01-exploration.md, posts a technical-instructions
  section to Jira, then hands off to plan-ticket.
---

# Stage 2 — Add Technical Instructions to the Ticket

Convert exploration findings into an unambiguous technical brief and publish it on the Jira
ticket so the whole team — and stage 3 — works from the same source of truth. Then hand off to
`plan-ticket`.

First, read `skills/shared/SKILL.md` for the workspace layout, the Jira tool mapping, and the
house style for posting to Jira.

## Inputs

- The ticket key and workspace path (passed from `explore-ticket`).
- `workflow/<TICKET-KEY>/01-exploration.md` and `00-context.json`.

If the exploration report does not exist, run `explore-ticket` first instead of guessing.

## Step 1 — Draft the technical instructions

From the exploration report, write instructions that a developer could follow without reopening
the codebase. Cover:

- **Approach** — the chosen implementation strategy in 2–4 sentences, and why (given the patterns
  found in stage 1).
- **Files to create/modify** — the concrete list, each with what changes and why.
- **Interfaces & contracts** — API endpoints (method, path, request/response shape), function
  signatures, data model / schema changes, events or webhooks.
- **Validation & edge cases** — input validation, error handling, empty/limit/permission cases.
- **Non-functional requirements** — performance, security/permissions, observability, i18n —
  restated as concrete expectations, not vague goals.
- **Test strategy** — what unit/integration/e2e tests to add and the key cases they must cover.
- **Out of scope** — what this ticket explicitly does not include, to prevent scope creep.
- **Open questions** — anything the product owner must confirm before or during implementation.

Save this as `workflow/<TICKET-KEY>/02-technical-instructions.md`.

## Step 2 — Publish to Jira

Post the instructions to the ticket. Prefer **appending a labelled section to the description**
so the brief travels with the ticket; use a comment instead only if the team prefers comments
(ask once if unsure).

1. Fetch the current description with `getJiraIssue`.
2. Build the section, beginning with the machine marker from the conventions:
   `## 🤖 Technical Instructions (ticket-to-code)`.
3. **Idempotency:** if that marker already exists in the description, replace the existing section
   rather than appending a duplicate.
4. Call `editJiraIssue` with `contentFormat="markdown"` and real line breaks (never literal `\n`).
   If appending to the description is not desired, call `addCommentToJiraIssue` instead.
5. Confirm the write succeeded by reading the field back.

## Step 3 — Handoff

Tell the user, in one line, that the ticket now carries technical instructions (with the link),
then **invoke the `plan-ticket` skill**, passing the ticket key and workspace path. Stop and ask
only if publishing to Jira failed or an open question is a hard blocker.
