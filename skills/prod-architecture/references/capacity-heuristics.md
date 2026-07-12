# Capacity Heuristics — When Does This Actually Break?

Order-of-magnitude numbers for calibrating findings to real scale. Use these to answer "triggers at what load?" instead of flagging everything as a scaling risk. All numbers are rough defaults on modest hardware — actual limits depend on workload; present them as estimates.

## Rules of Thumb by Component

**Single Postgres/MySQL instance (4–8 vCPU, SSD)**
- Comfortable: low thousands of simple queries/sec; hundreds of writes/sec with indexes
- A well-indexed single instance serves most apps to ~100K daily active users
- Breaks first: connection count (Postgres default 100; each connection ≈ several MB — pooler like pgbouncer needed well before query throughput matters), then unindexed queries on tables past ~10M rows, then write contention on hot rows (counters, inventory)
- Read replicas buy read scale cheaply; sharding is a last resort — flag premature sharding as a finding too

**Redis (single node)**
- ~50–100K+ ops/sec; single-threaded — one slow command (KEYS, SMEMBERS on a huge set, large MGET) stalls everyone
- Memory is the real limit: verify maxmemory + eviction policy are set; unbounded cache = eventual OOM

**Single app instance**
- Node/Go/JVM handling IO-bound work: hundreds to thousands of req/sec per instance
- Python/Ruby sync workers: roughly (workers × 1/avg-latency) req/sec — 8 workers × 200ms ≈ 40 req/sec per box; this surprises people
- Breaks first: one slow downstream call exhausting the worker/connection pool (this, not CPU, is the usual first outage)

**Queues (SQS/RabbitMQ/Kafka)**
- Throughput is rarely the issue below tens of thousands msg/sec; consumer lag and poison messages are — check DLQ config and max-receive counts before worrying about broker scale

**Object storage + CDN**
- Effectively infinite for static assets; the finding is when assets/user uploads are served from the app instead

## Traffic Math (for "expected load" reality checks)
- 1M requests/day ≈ 12 req/sec average, plan ~3–5× for peak ≈ 40–60 req/sec — a single decent instance handles this; multi-region for this is over-engineering
- 10K DAU with 50 requests each ≈ 500K req/day ≈ 6 req/sec average
- Rule: design for ~10× current, no more. Flag both under-provisioning AND premature scale-out (microservices/Kafka/sharding at <10 req/sec) — complexity is also a production risk

## Payload/Volume Thresholds Worth Flagging
- API responses > ~1MB or list endpoints without pagination: problems by 10K rows
- In-memory processing of "all rows": fine at 10K, incident at 10M — ask table growth rate
- Fan-out per request > ~10 sequential downstream calls: latency = sum; parallelize or batch
- Logs at high-cardinality per request (multiple lines/req at 100 req/sec ≈ tens of GB/day): retention costs surprise

## Latency Budget Reference
- Same-AZ network hop: ~0.5–1ms; cross-region: 60–150ms — chatty cross-region designs are findings
- SSD DB query (indexed): 1–10ms; cache hit: <1ms — caching a 2ms query adds complexity for nothing; caching a 200ms aggregate is a win
- A p99 budget of 500ms fits roughly: 1 DB round trip + 1 cache + 1 external call with a 300ms timeout — count the hops in the hot path against the stated budget

## How to Use in Findings
Bad: "This won't scale."
Good: "Orders are counted with `SELECT COUNT(*)` per page view (`orders/views.py:88`). Fine at your current ~2K orders; at ~1M rows this is a 100ms+ table scan per request. Trigger: roughly 6–12 months at stated growth. Fix now if cheap (counter cache), else schedule."
