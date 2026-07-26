---
name: implement-plan
description: >
  Stage 4 (final) of the ticket-to-code workflow. Execute the implementation plan against the
  repository: branch, code the steps, run tests, open a pull request, and update the ticket. Use
  when the user says "implement the plan", "build MLP-123", "execute the plan", or right after
  plan-ticket finishes. Reads 03-plan.md, makes the changes, and reports back to Jira.
---

# Stage 4 — Implement the Plan

Execute the plan step by step, verifying as you go, and close the loop back to the ticket. This
is the only stage that writes code. It is the end of the chain.

First, read `skills/shared/SKILL.md` for the workspace layout, the tool mapping, and the Jira
priority/handoff rules.

## Inputs

- Ticket key and workspace path (passed from `plan-ticket`).
- `workflow/<TICKET-KEY>/03-plan.md`, plus `02-technical-instructions.md` and `00-context.json`.

If the plan does not exist, run `plan-ticket` first.

## Step 1 — Prepare the working tree

1. Ensure the repo is available (GitHub connector, or clone/pull in the sandbox).
2. Create the branch named in the plan from an up-to-date default branch:
   `git checkout main && git pull && git checkout -b <branch>`.
3. Confirm the build and test commands from the exploration report actually run before you start.

## Step 2 — Execute steps in order

Work one plan step at a time. For each step:

- Make the change with Edit/Write, following the conventions captured in stage 1.
- Run that step's verification (its test or command). Do not move on until it passes.
- Commit with a message referencing the ticket, e.g. `MLP-18: add booking form validation`.
- If a step reveals the plan was wrong, update `03-plan.md`, note why, and continue — keep the
  plan and reality in sync.

Never leave the tree in a broken state between commits. If you get stuck on a step, stop, write
what you tried in the implementation report, and surface the blocker rather than forcing it.

## Step 3 — Verify the whole change

- Run the full test suite and the linter/formatter; fix failures.
- Re-check every acceptance criterion and every Definition-of-Done item from the plan, marking
  each done or explaining why not.
- Do a self-review of the diff (`git diff main...HEAD`) for leftover debug code, missing error
  handling, or unintended changes.

## Step 4 — Open the pull request

- Push the branch and open a PR (GitHub connector or `gh pr create`).
- PR description: link the ticket, summarise the change, list how it was tested, and check off the
  acceptance criteria.

## Step 5 — Close the loop on Jira

- Add a comment via `addCommentToJiraIssue` under the marker
  `## 🤖 Implementation Report (ticket-to-code)` with the PR link, a summary, and test results.
- Transition the ticket to the right status (e.g. In Review): read valid transitions with
  `getTransitionsForJiraIssue`, then `transitionJiraIssue`.

## Step 6 — Write the report and finish

Save `workflow/<TICKET-KEY>/04-implementation-report.md` (what changed, files, test results, PR
link, ticket status, anything deferred). Then give the user a short final summary: PR link,
ticket status, tests passing, and any follow-ups. This ends the workflow — do not chain further.
