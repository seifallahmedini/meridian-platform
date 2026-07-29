---
name: ticket-to-code-conventions
description: >
  Shared conventions for the ticket-to-code workflow. This is a reference loaded by the five
  workflow skills (explore-ticket, annotate-ticket, plan-ticket, implement-plan, code-review). Not
  usually invoked directly by the user. Use when you need the handoff contract, the workspace
  layout, the Jira/GitHub tool mapping, or the priority mapping shared across the workflow stages.
---

# Ticket-to-Code — Shared Conventions

This file is the contract every stage of the workflow relies on. Read it whenever you run any
`ticket-to-code` skill so the five stages stay consistent and can hand off to each other cleanly.

## The five stages

```
explore-ticket  →  annotate-ticket  →  plan-ticket  →  implement-plan  →  code-review
   (stage 1)          (stage 2)          (stage 3)        (stage 4)          (stage 5)
```

Each stage reads the artifact the previous stage wrote, does its work, writes its own artifact,
and then **invokes the next skill** to continue the chain. A stage never assumes facts that are
not written down in the workspace — the artifacts on disk are the source of truth, not memory.

## Workspace layout

All intermediate artifacts live in a per-ticket workspace folder so a run is fully auditable and
resumable. Create it under the outputs directory:

```
workflow/<TICKET-KEY>/
├── 00-context.json            # ticket key, repo, branch, cloudId, timestamps (written by stage 1)
├── 01-exploration.md          # stage 1 output: ticket + code findings
├── 02-technical-instructions.md  # stage 2 output: the text posted back to the ticket
├── 03-plan.md                 # stage 3 output: ordered implementation plan
├── 04-implementation-report.md   # stage 4 output: what was built, PR link, test results
└── 05-code-review.md          # stage 5 output: review findings, PR review state
```

`<TICKET-KEY>` is the Jira key, e.g. `MLP-18`. Always use the real key so parallel runs on
different tickets never collide.

### 00-context.json shape

Stage 1 writes this; later stages read it instead of re-deriving values.

```json
{
  "ticketKey": "MLP-18",
  "ticketUrl": "https://<site>.atlassian.net/browse/MLP-18",
  "cloudId": "<atlassian cloud id>",
  "repo": { "provider": "github", "url": "<repo url>", "defaultBranch": "main" },
  "workBranch": "feature/MLP-18-single-shipment-booking",
  "startedAt": "<ISO timestamp>"
}
```

## Tool mapping

The workflow targets Jira + GitHub but is written so the tools can be swapped.

| Category        | This stack | Tools used                                                            |
| --------------- | ---------- | --------------------------------------------------------------------- |
| Issue tracker   | Jira       | `getJiraIssue`, `editJiraIssue`, `addCommentToJiraIssue`, `transitionJiraIssue`, `getTransitionsForJiraIssue` (Atlassian MCP) |
| Code host       | GitHub     | GitHub MCP connector if available; otherwise `git`/`gh` in the sandbox (`gh pr diff`, `gh pr review`) |
| Local code work | Sandbox    | Bash (`git`, build/test runners), Read, Grep, Glob, Edit, Write        |

If the GitHub connector is not connected, tell the user once, then fall back to cloning over
HTTPS in the sandbox for read/explore. Never handle raw tokens in plain text — prefer the
connector or an existing authenticated `gh` session.

## Priority mapping (Jira)

P0 → Highest, P1 → High, P2 → Medium, P3 → Low.

## Handoff rules

1. Finish your artifact **before** invoking the next skill.
2. Pass the ticket key and workspace path to the next skill so it can pick up without re-asking.
3. If a stage cannot complete (missing connector, ambiguous ticket, failing build), stop the
   chain, write what you have, and surface the blocker to the user rather than guessing.
4. Every stage that touches Jira must be idempotent — check whether the comment/description
   section already exists before adding a duplicate.

## House style for what gets posted to Jira

Use real markdown with actual line breaks (never literal `\n`). When calling `editJiraIssue` or
`addCommentToJiraIssue`, pass `contentFormat="markdown"`. Wrap machine-generated sections in a
labelled header so re-runs can find and replace them, e.g. a section that begins with
`## 🤖 Technical Instructions (ticket-to-code)`.
