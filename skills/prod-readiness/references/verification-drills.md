# Verification Drills — Turning "Claimed" into "Verified"

For each readiness claim, the cheapest concrete drill that proves it. Assign these as action items instead of accepting assertions.

## Backups
- **Restore drill**: restore last night's backup into a scratch database, point a local app instance at it, log in, and open real data. Time it — that's your real RTO floor.
  - Postgres: `pg_restore -d scratch_db backup.dump` or PITR to a new instance
  - MySQL: `mysql scratch_db < backup.sql`
  - Managed (RDS/Cloud SQL): restore snapshot to a NEW instance — never in place
- Check backup age monitoring: would anyone be alerted if backups silently stopped 3 weeks ago? (This is the most common backup failure mode.)

## Rollback
- **Rollback drill (staging)**: deploy current version, deploy a trivial change, roll back using ONLY the documented procedure, measure minutes. If the procedure doesn't exist, writing it is the drill.
- **Migration compatibility check**: run the previous app version against the migrated schema (expand/contract test). If it crashes, rollback is broken regardless of the deploy tooling.
- Config rollback: can a bad env var / feature flag be reverted without a rebuild? Time that path too.

## Observability
- **Trace-a-request drill**: pick a real request ID from logs and reconstruct what happened to it across services in under 5 minutes, using only the tools on-call would have.
- **Silent-failure drill**: deploy (to staging) a change that makes 5% of one endpoint's responses 500. Does any alert fire? How long until a human would know?
- Alert inventory: for each page-worthy alert, open its runbook link. Dead links and missing runbooks are findings.

## Failure Injection (staging, 30 minutes total)
- **Dependency down**: stop the database / block the third-party API's egress. Expected: fast, clean errors and recovery when restored. Common reality: connection-pool exhaustion, 60s hangs, crash loops.
- **Dependency SLOW**: add latency (e.g., `tc qdisc` / toxiproxy, or point at a delay proxy). Slow is worse than down — this is where missing timeouts surface.
- **Kill -9 mid-traffic**: kill an instance during a load test. Expected: LB drains, zero or near-zero user-visible errors, no corrupted in-flight writes.
- **Disk full / OOM**: fill the disk or lower the memory limit. Does it degrade or corrupt?

## Load
- Minimum viable load test: script the top 2 user journeys (k6, Locust, vegeta), run at 2–3× expected peak for 15+ minutes (not 60 seconds — pools and memory leaks need time), record p95/p99 and first bottleneck.
- Soak: 1× expected load for 2+ hours watching memory/connections for slow leaks.

## Access & Break-Glass
- **New-responder drill**: someone who didn't build the system, using only the docs, must: find the dashboard, tail prod logs, restart the service, reach the cloud console. Time each. Gaps are doc findings.
- Verify at least two humans have prod access and the on-call escalation contact list is current.

## Scoring Guide
| Drill result | Status |
|---|---|
| Performed, evidence recorded (timing, screenshot, notes) | Verified |
| Procedure documented but never executed | Claimed — schedule the drill |
| No procedure | Missing — blocker at most tiers |
