# Language-Specific Production Pitfalls

Load the section matching the codebase. These are the bugs that pass review and tests, then break in production.

## JavaScript / TypeScript
- **Floating promises**: async call without `await`/`.then` — errors become unhandled rejections; in serverless, work is killed mid-flight when the handler returns. Check every async call site.
- `forEach(async ...)` does NOT await — iterations race; use `for...of` or `Promise.all(map(...))` deliberately.
- `Promise.all` fail-fast vs `Promise.allSettled`: one rejection cancels nothing but loses the other results — pick intentionally.
- `parseInt` without radix on user input; `+str` vs `Number(str)` differences; `NaN !== NaN` in dedup logic.
- `JSON.parse` throws on bad input — must be wrapped at every network boundary; `JSON.stringify` drops `undefined` and throws on cycles/BigInt.
- Date: `new Date('2024-01-05')` parses as UTC midnight but `new Date(2024, 0, 5)` is local — mixed usage causes off-by-one-day bugs; month is 0-indexed.
- Money in floats: `0.1 + 0.2 !== 0.3` — require integer cents or a decimal lib.
- TypeScript trust boundaries: `as` casts and `any` at API/DB edges mean the types are wishes, not checks — runtime validation (zod etc.) needed at boundaries.
- Node: blocking the event loop (sync fs/crypto/zlib, large JSON.parse) in a request path stalls ALL requests.
- Closures capturing loop variables via `var`; stale state capture in React callbacks.

## Python
- **Mutable default args**: `def f(items=[])` shares one list across all calls.
- Late-binding closures in loops: `[lambda: i for i in range(3)]` all return 2.
- Bare `except:`/`except Exception` swallowing `KeyboardInterrupt`/cancellation or hiding real bugs; `except ... pass` is a finding.
- Naive vs aware datetimes mixed: `datetime.now()` vs `datetime.now(timezone.utc)` — comparison raises or silently misbehaves; `utcnow()` is naive and deprecated.
- GIL: threads don't parallelize CPU work; conversely, asyncio code calling a blocking lib (requests, heavy ORM call) stalls the whole event loop — look for sync calls inside `async def`.
- Class-level mutable attributes shared across instances; module-level state shared across requests in web workers.
- `is` vs `==` on strings/ints (works in tests due to interning, fails in prod).
- Float for money; `round()` is banker's rounding — use `Decimal` with explicit quantize.
- ORM: lazy-load N+1 in loops (`select_related`/`joinedload`); objects used after session close.

## Go
- **Goroutine leaks**: goroutine blocked on a channel nobody reads, or `for { select {} }` without ctx cancellation — check every `go func` for an exit path.
- Loop variable capture in goroutines (pre-1.22 semantics): `for _, v := range { go func() { use(v) } }`.
- `defer` in a loop runs at function end, not iteration end — file handles pile up.
- Nil maps panic on write; nil slice append is fine — inconsistent handling is a smell.
- Error shadowing: `err :=` inside a block shadowing outer `err`; ignored errors `_ =` on writes/closes that matter.
- Slices share backing arrays: `append` to a sub-slice can overwrite the parent; `s[a:b]` keeps the whole array alive (memory).
- `time.After` in a loop leaks timers until fire; use `time.NewTimer`/`Ticker` + Stop.
- Data races on maps and struct fields across goroutines — would `-race` pass? Ask if CI runs it.

## Java / Kotlin
- `equals`/`hashCode` broken or missing on map/set keys; mutating an object while it's a key.
- `SimpleDateFormat` is not thread-safe (classic static-field bug); use `java.time`.
- Streams: `Optional.get` without check; parallel streams on shared mutable state.
- Connection/statement leaks without try-with-resources; thread pools with unbounded queues (hidden OOM) or default `Executors.newFixedThreadPool` never shut down.
- `@Transactional` on private/self-invoked methods silently does nothing (proxy limitation).
- Lazy-loading outside session (LazyInitializationException in prod, works in tests).

## SQL / Database (any language)
- Transactions spanning network calls (holds locks during a slow HTTP request).
- Missing index on the new query's WHERE/ORDER BY — check EXPLAIN or at least the schema.
- `SELECT ... FOR UPDATE` absent on read-modify-write (lost updates); or present and causing deadlocks via inconsistent lock ordering.
- Migrations: `ADD COLUMN ... NOT NULL` without default rewrites the table; `CREATE INDEX` without `CONCURRENTLY` locks writes (Postgres); enum changes.
- Timezone: `timestamp` vs `timestamptz` (Postgres) mixed; DB server timezone assumed.
- Pagination by OFFSET on large tables (slow + skips/dupes under concurrent writes) — keyset pagination for feeds.

## Concurrency (universal checklist)
For any shared state: who writes it, from how many threads/requests, what guards it?
For any handler: what happens if it runs twice concurrently for the same entity? Same user double-clicking is enough to trigger it.
For any queue consumer: at-least-once delivery is the norm — is processing idempotent?
