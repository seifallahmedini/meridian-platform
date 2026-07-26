---
name: explore-ticket
description: >
  Stage 1 of the ticket-to-code workflow. Explore a Jira ticket and the codebase before any
  planning or coding. Use when the user says "explore this ticket", "investigate MLP-123",
  "start the workflow on a ticket", "look at the ticket and the code", or pastes a Jira issue
  URL and wants engineering-grade context gathered. Reads the ticket, maps it to the repo,
  and produces an exploration report, then hands off to annotate-ticket.
---

# Stage 1 — Explore the Ticket and the Code

Gather everything an engineer would need before writing a single line of code. Produce no plan
and no code in this stage — only findings. Then hand off to `annotate-ticket`.

First, read `skills/shared/SKILL.md` (the ticket-to-code conventions) for the workspace layout,
tool mapping, and handoff rules.

## Inputs

- A Jira ticket key or URL (e.g. `MLP-18`).
- The target repository (GitHub connector, clone URL, or an already-connected folder).

If either is missing, ask for it once, then proceed.

## Step 1 — Read the ticket

1. Resolve the Atlassian `cloudId` with `getAccessibleAtlassianResources` (cache it in context).
2. Fetch the issue with `getJiraIssue` (fields: summary, description, status, priority, parent,
   labels, comments, linked issues).
3. Extract, into notes: the user story, every acceptance criterion, the parent epic, the stated
   priority, and any constraints or references already in the description or comments.
4. Note what the ticket does **not** say — gaps you will flag as open questions.

## Step 2 — Get the code

- If a GitHub connector is available, use it to browse the repo. Otherwise clone over HTTPS into
  the sandbox: `git clone <url> /tmp/<repo> && cd /tmp/<repo>`.
- Detect the stack: read `package.json` / `pyproject.toml` / `go.mod` / `pom.xml`, the README,
  and any `CONTRIBUTING`/`ARCHITECTURE` docs. Record language, framework, test runner, and how
  to run the build and tests.

## Step 3 — Map the ticket onto the code

This is the core of the stage. For each acceptance criterion, find where in the code it lands.

- Use Grep/Glob to locate the modules, routes, models, components, and tests the ticket touches.
- Identify existing patterns to follow (how similar features are structured, naming conventions,
  error handling, validation, auth, how DB access and API endpoints are written).
- List the specific files likely to be created or modified, with a one-line reason each.
- Identify integration points, shared utilities, and any migration/config implications.
- Surface risks: ambiguous requirements, missing dependencies, areas with no test coverage,
  cross-cutting concerns (permissions, rate limits, i18n), and anything that could balloon scope.

## Step 4 — Write the exploration report

Create the workspace (`workflow/<TICKET-KEY>/`) and write `00-context.json` (see conventions),
then write `01-exploration.md`:

```markdown
# Exploration — <TICKET-KEY>: <summary>

## Ticket summary
- **User story:** ...
- **Acceptance criteria:** (list)
- **Priority / epic:** ...

## Repository at a glance
- Stack, framework, test runner, build/test commands
- Relevant architecture notes

## Requirement → code map
| Acceptance criterion | Where it lands (files/modules) | Notes |
| --- | --- | --- |

## Files likely to change
- `path/to/file` — why

## Patterns & conventions to follow
- ...

## Risks & open questions
- ...
```

Keep it factual. No solutions yet — those are stage 2's job.

## Handoff

When `01-exploration.md` and `00-context.json` are written, tell the user in one line what you
found, then **invoke the `annotate-ticket` skill**, passing the ticket key and the workspace
path. Do not stop to ask permission unless a blocker in the conventions applies (missing repo
access, ticket not found, or the ticket is too ambiguous to map).
