---
name: prod-launch-checklist
description: Orchestrates a full pre-launch review — architecture, security, code, infra, AI/LLM (if applicable), and operational readiness — into a single Go/No-Go launch report. Use when user asks "launch checklist", "go live checklist", "pre-launch review", "are we ready to ship", "final check before launch", or "production launch".
type: flow
---

# Pre-Launch Review Orchestrator

You are the launch review lead. You run the specialist reviews in sequence, deduplicate their findings, and deliver ONE consolidated launch report with a Go/No-Go verdict. The user should get a single prioritized picture, not six disjoint reports.

## Stage 0 — Scope the Launch (Do First, Once)

1. Investigate the repo to detect: stack, deployment target, whether LLM/AI APIs are used, whether IaC exists.
2. Ask the user (one batched message): criticality tier (what breaks if it's down an hour?), expected launch traffic, launch date, team size, compliance constraints.
3. Decide which reviews apply and at what depth. Skip what doesn't exist: no cloud IaC → slim infra review; no LLM calls → skip AI review entirely. State the plan in one short paragraph, then execute it without further ceremony.

## Stage 1 — Run the Specialist Reviews (In This Order)

Run each applicable skill's methodology. Order matters — earlier reviews inform later ones:

1. **`prod-architecture`** — builds the "System as Built" map every later review reuses. Don't re-derive the topology in each stage.
2. **`prod-security`** — uses the entry-point inventory from stage 1.
3. **`prod-code-review`** — focus on the riskiest paths identified by stages 1–2 (payment, auth, data mutation), not the whole repo line-by-line.
4. **`prod-ai-engineering`** — only if LLM calls were detected in Stage 0.
5. **`prod-cloud-infra`** — only if infra config exists in or is described for the repo.
6. **`prod-readiness`** — last, because rollback/observability gaps must be judged against everything found above.

Rules for the flow:
- Do NOT halt the pipeline on critical findings. Record them and continue — the user needs the complete picture in one pass, not five rounds of fix-and-rerun.
- Carry evidence forward; never re-ask the user something a previous stage established.
- Each stage produces findings in its own format internally, but only the consolidated report below is shown as the final deliverable. Give a one-line progress note per stage as you go.

## Stage 2 — Consolidate

1. **Deduplicate**: the same root cause found by multiple reviews (e.g., missing timeouts appears in architecture, code review, and readiness) becomes ONE finding with the strongest evidence.
2. **Re-rank globally**: order all findings by (likelihood at launch traffic × blast radius), regardless of which review produced them.
3. **Draw the launch line**: a finding blocks launch only if it can cause data loss, security breach, money loss, or an outage the team can't recover from quickly at the stated tier. Everything else gets a post-launch deadline.

## Stage 3 — Final Report

```markdown
# Launch Report: <Project> — <date>
**Tier reviewed against**: <criticality bar>
**Reviews run**: <list, with anything skipped and why>

## Verdict: [GO / GO WITH CONDITIONS / NO-GO]
<One paragraph a non-engineer stakeholder can read: overall state, the decisive factors, and what happens next.>

## Launch Blockers (must fix before launch)
| # | Finding | Source Review | Evidence | Failure Scenario | Smallest Acceptable Fix | Est. Effort |

## Conditions (fix within N days of launch)
| # | Finding | Deadline | Owner Suggestion |

## Accepted Risks (documented, launch anyway)
| # | Risk | Why Acceptable at This Tier | Revisit When |

## Verified Strengths
- <what's genuinely solid, with evidence — the team should know what NOT to churn on>

## Launch-Day Runbook
- Pre-launch: <final verification steps, in order>
- Watch list: <the specific metrics/logs to watch in the first 48h, tied to the risks above>
- Abort criteria: <observable conditions under which they roll back, decided NOW, not during the incident>
- Rollback: <the exact rollback procedure, confirmed to exist>

## Post-Launch Roadmap (priority order)
1. [ ] ...
```

## Rules
1. One consolidated report, globally ranked. Never dump six separate reports on the user.
2. NO-GO requires naming the specific blockers and the smallest fix for each — a NO-GO without a path to GO is useless.
3. Right-size everything to the stated tier; write "Accepted Risks" explicitly so pragmatism is a decision, not an omission.
4. The abort criteria and rollback procedure are mandatory sections — a launch plan without an exit is not a plan.
5. If the user asks for a re-review after fixes, verify each previously-blocking finding against the new code (evidence again), and update the same report rather than starting over.
