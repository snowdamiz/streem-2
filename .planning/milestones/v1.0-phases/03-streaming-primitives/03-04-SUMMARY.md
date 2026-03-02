---
phase: 03-streaming-primitives
plan: "04"
subsystem: streams
tags: [signals, reactive, batch, throttle, debounce, backpressure, combinators]

# Dependency graph
requires:
  - phase: 03-03
    provides: fromReadable() and fromObservable() adapters, complete /streams adapter layer
  - phase: 01-reactive-core
    provides: startBatch/endBatch in reactive.ts, effect(), onCleanup(), createRoot()
provides:
  - batch() combinator in /streams for synchronous multi-signal write batching
  - throttle() combinator returning a derived signal that updates at most once per intervalMs
  - debounce() combinator returning a derived signal that updates after delayMs silence
  - startBatch/endBatch exported publicly from /core
  - Test suite covering STREAM-05 and STREAM-06 (42 total tests passing in /streams)
affects:
  - 04-lit-integration
  - 05-dev-experience
  - Any phase using /streams backpressure tools

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "batch() wraps startBatch/endBatch with try/finally — errors always call endBatch"
    - "throttle() and debounce() use effect() internally — must be called inside reactive scope"
    - "Leading-edge throttle: first value passes immediately, subsequent dropped until interval elapses"
    - "Trailing-edge debounce: output updates only after delayMs silence from source"
    - "onCleanup() inside effect clears pending setTimeout — auto-disposes with owning scope"

key-files:
  created:
    - packages/streams/src/combinators.ts
    - packages/streams/tests/combinators.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/streams/src/index.ts

key-decisions:
  - "startBatch/endBatch exported from /core/src/index.ts — were already implemented in reactive.ts as Phase 3 extension points, this plan completes the export gate"
  - "batch() uses try/finally to guarantee endBatch() is always called even when fn() throws — error propagation safe"
  - "throttle() and debounce() must be called inside a reactive scope (createRoot/component body) — same ownership invariant as effect(), documented in JSDoc"

patterns-established:
  - "Combinator pattern: all three combinators live in combinators.ts, imported by index.ts barrel"
  - "Leading-edge throttle implementation: Date.now() comparison with lastEmit captured in closure"
  - "Debounce cleanup: onCleanup() inside effect body clears timer; timer variable captured in outer closure"

requirements-completed: [STREAM-05, STREAM-06]

# Metrics
duration: 4min
completed: 2026-02-28
---

# Phase 3 Plan 04: Batch/Throttle/Debounce Combinators Summary

**batch(), throttle(), and debounce() backpressure combinators shipping in /streams, with startBatch/endBatch exposed from /core — 200 synchronous writes produce 1 effect flush (not 200)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T08:01:30Z
- **Completed:** 2026-02-28T08:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Exported startBatch and endBatch from /core/src/index.ts (previously only accessible internally in reactive.ts)
- Implemented batch(), throttle(), debounce() in packages/streams/src/combinators.ts with JSDoc documenting reactive scope requirements
- Wrote 10-test combinators.test.ts covering STREAM-05 and STREAM-06, including the 200-write single-flush proof
- All 42 /streams tests pass across 5 test files; all 40 /core tests pass; dist build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Export startBatch/endBatch + implement combinators** - `9457b40` (feat)
2. **Task 2: Write combinator test suite + run full Phase 3 tests** - `8b214e8` (test)

## Files Created/Modified
- `packages/core/src/index.ts` - Added `export { startBatch, endBatch } from './reactive.js'`
- `packages/streams/src/combinators.ts` - New file: batch(), throttle(), debounce() implementations
- `packages/streams/src/index.ts` - Added `export { batch, throttle, debounce } from './combinators.js'`
- `packages/streams/tests/combinators.test.ts` - New file: 10 tests across 3 describe blocks (batch, throttle, debounce)

## Decisions Made
- startBatch/endBatch were already fully implemented as Phase 3 extension points in reactive.ts — this plan only opened the export gate, no implementation work needed
- batch() must always call endBatch() even on error — try/finally guarantees this
- throttle() and debounce() are leading/trailing-edge respectively, matching the plan specification

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Phase 3 (Streaming Primitives) is complete: all 8 requirements (STREAM-01 through STREAM-08) satisfied across 4 plans
- /core and /streams are fully built and tested
- Phase 4 (Lit Integration) can proceed with the full streams API available: fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce

---
*Phase: 03-streaming-primitives*
*Completed: 2026-02-28*
