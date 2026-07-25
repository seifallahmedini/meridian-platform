# ticket-to-code

An agentic, four-stage workflow that takes a Jira ticket from exploration all the way to shipped
code. Each stage is a **skill** that does one job well and then **hands off to the next**, so you
can run the whole chain from a single ticket or invoke any stage on its own.

```
explore-ticket  →  annotate-ticket  →  plan-ticket  →  implement-plan
```

## What each stage does

1. **explore-ticket** — Reads the Jira ticket and the repository, maps every acceptance criterion
   to the code that implements it, and writes an exploration report. No code, no plan — just
   findings.
2. **annotate-ticket** — Turns those findings into concrete technical instructions (approach,
   files, interfaces, edge cases, tests, out-of-scope) and posts them back onto the Jira ticket so
   the whole team shares one source of truth.
3. **plan-ticket** — Converts the technical instructions into an ordered, verifiable
   implementation plan with a branch name, per-step verification, a test plan, and a
   Definition of Done tied to the acceptance criteria.
4. **implement-plan** — Executes the plan: branches, codes each step, runs tests, opens a pull
   request, comments the result back on the ticket, and transitions its status.

## How the hand-off works

Every stage reads the artifact the previous stage wrote and writes its own into a per-ticket
workspace, then invokes the next skill. The files on disk — not memory — are the source of truth,
which makes any run auditable and resumable.

```
workflow/<TICKET-KEY>/
├── 00-context.json               # ticket key, repo, branch, cloudId
├── 01-exploration.md             # stage 1
├── 02-technical-instructions.md  # stage 2 (also posted to Jira)
├── 03-plan.md                    # stage 3
└── 04-implementation-report.md   # stage 4 (PR link, test results)
```

Shared conventions (workspace layout, tool mapping, priority mapping, Jira house style) live in
`skills/shared/SKILL.md` and are read by all four stages.

## How to use it

Start the chain by naming a ticket:

> "Explore MLP-18 and run the workflow."

Or drive it stage by stage:

> "Add technical instructions to MLP-18." · "Make a plan for MLP-18." · "Implement the plan for MLP-18."

## Requirements

- **Jira** via the Atlassian connector (read tickets, edit descriptions, comment, transition).
- **GitHub** via a GitHub connector, or a clone URL the sandbox can reach. For private repos,
  connect GitHub first; the workflow will tell you if it's missing and fall back to a read-only
  clone where possible.

## Tuning it for your team

- Prefer plans/instructions as **comments** instead of appended to the description? Change the
  publish step in `annotate-ticket` / `plan-ticket`.
- Different branch or commit-message conventions? Edit the plan template in `plan-ticket` and the
  commit guidance in `implement-plan`.
- Different tracker or code host? The tool mapping in `skills/shared/SKILL.md` is the single place
  to swap tools.
