---
name: code-review
description: >
  Stage 5 (final) of the ticket-to-code workflow. Reviews the pull request implement-plan opened:
  hunts for concrete bugs/regressions in the diff, and checks it against both the repo's coding
  standards and the ticket's spec (acceptance criteria / Definition of Done). Use when the user
  says "review the PR", "code review MLP-123", "review the implementation", or right after
  implement-plan finishes. Reads 03-plan.md and the diff, posts findings as PR review comments,
  and gates the workflow on confirmed high-severity findings.
---

# Stage 5 — Code Review

Review the change implement-plan just shipped before the workflow calls itself done. This stage
never edits code — it only finds and reports problems, and decides whether the workflow is
actually finished.

First, read `skills/shared/SKILL.md` for the workspace layout, the tool mapping, and the handoff
rules.

## Inputs

- Ticket key, workspace path, and PR URL/number (passed from `implement-plan`).
- `workflow/<TICKET-KEY>/03-plan.md` (Definition of Done / acceptance criteria),
  `02-technical-instructions.md`, `01-exploration.md` (repo conventions), and the PR diff.

If the PR does not exist yet, run `implement-plan` first.

## Step 1 — Pin the diff and the sources

- Diff: `git diff <default-branch>...HEAD` (three-dot, against the merge-base), or the PR diff via
  the GitHub connector / `gh pr diff <PR>`.
- Commit list: `git log <default-branch>..HEAD --oneline`.
- Standards sources: `CLAUDE.md`/`AGENTS.md`, `CONTRIBUTING.md`, `docs/adr/`, and lint/format
  configs (note what tooling already enforces so you don't re-check it).
- Spec source: the ticket's acceptance criteria plus the Definition of Done in `03-plan.md` and
  the approach in `02-technical-instructions.md`.

## Step 2 — Run three review passes in parallel

Spawn three `general-purpose` sub-agents in a **single message** so none of them pollute each
other's context:

1. **Correctness** — hunt for concrete bugs and regressions in the diff itself: logic errors,
   unhandled edge cases, broken error handling, race conditions, off-by-ones. Every finding needs
   a concrete failure scenario (inputs/state → wrong output or crash), not a style nit.
2. **Standards** — does the diff follow this repo's documented standards? Cite the standard (file
   + rule) for every finding; skip anything the formatter/linter already enforces.
3. **Spec** — does the diff satisfy every acceptance criterion and Definition-of-Done item in the
   plan? Report requirements that are missing or partial, scope creep not asked for, and
   requirements that look implemented but are wrong. Quote the ticket/plan line for each finding.

Give each sub-agent the diff command, the commit list, and only the sources relevant to its axis.
Ask each one to report in the shape `ReportFindings` expects — file, line, summary, failure
scenario, category, and a CONFIRMED/PLAUSIBLE verdict — so you can aggregate directly in the next
step.

## Step 3 — Verify and aggregate

Spot-check the diff yourself for anything a sub-agent marked CONFIRMED before trusting it —
sub-agents can be wrong, and this stage exists to catch mistakes, not multiply them. Drop findings
that don't hold up; downgrade anything you can't personally verify to PLAUSIBLE. Merge the three
lists, most severe first, then call `ReportFindings` once with the verified list (empty array if
nothing survives).

Treat as **high-severity** (gating): any CONFIRMED Correctness finding, or any CONFIRMED Spec
finding saying an acceptance criterion is unmet or implemented wrong. Standards findings and
anything only PLAUSIBLE are non-gating — worth reporting, not worth blocking on.

## Step 4 — Post the review to the PR

Post the findings as review comments on the pull request (GitHub connector, or `gh pr review`):

- If any high-severity finding exists: request changes (`gh pr review <PR> --request-changes
  --body ...`), attaching each finding as an inline comment on its file/line where possible.
- Otherwise: leave a comment review (`gh pr review <PR> --comment --body ...`) summarising what
  was checked, plus any non-gating Standards/PLAUSIBLE notes for the author to consider.

## Step 5 — Write the report

Save `workflow/<TICKET-KEY>/05-code-review.md`: the aggregated findings (mirroring what
`ReportFindings` reported), the overall verdict (changes requested / clean), and a link to the PR
review.

## Step 6 — Gate and finish

- **High-severity findings exist:** stop the chain here. Do not report the ticket as done or
  transition it further. Summarise the blocking findings for the user and tell them to fix the PR
  and re-run `code-review` (or continue in `implement-plan`) before the ticket can be considered
  complete.
- **No high-severity findings:** this is the true end of the ticket-to-code workflow. Give the
  user a short final summary — PR review state, findings count per axis, ticket status — and stop.
  Do not chain further.
