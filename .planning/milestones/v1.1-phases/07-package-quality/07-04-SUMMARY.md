---
phase: 07-package-quality
plan: "04"
subsystem: testing
tags: [vitest, streams, fromReadable, fromWebSocket, fromObservable, edge-cases]

# Dependency graph
requires:
  - phase: 03-streaming-primitives
    provides: fromReadable, fromWebSocket, fromObservable implementations with error paths
provides:
  - ReadableStream controller.error() path test coverage for fromReadable
  - Cancel-during-reconnect-backoff test coverage for fromWebSocket
  - Error-after-values test coverage for fromObservable
  - Bug fix: fromReadable non-cancellation errors now preserve status=error (not overwritten to closed)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test the pump() catch block by calling controller.error() on a ReadableStream"
    - "Test reconnect timer cleanup by disposing owner during 5s+ backoff window"
    - "Synchronous observable pattern for error-after-values: call next() then error() in subscribe()"

key-files:
  created: []
  modified:
    - packages/streams/src/from-readable.ts
    - packages/streams/tests/from-readable.test.ts
    - packages/streams/tests/from-websocket.test.ts
    - packages/streams/tests/from-observable.test.ts

key-decisions:
  - "Fixed fromReadable bug: non-cancellation errors were overwriting status=error with status=closed — now only cancellation errors set status=closed"

patterns-established:
  - "Status=error must persist after non-cancellation stream errors — closing should not overwrite error state"

requirements-completed: [TEST-04]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 7 Plan 04: Streams Edge Case Tests Summary

**Three missing error-path tests added for @streem/streams: ReadableStream controller.error(), WebSocket cancel-during-reconnect, and Observable error-after-values — plus a bug fix in fromReadable that was overwriting status=error with status=closed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T23:50:26Z
- **Completed:** 2026-02-28T23:51:57Z
- **Tasks:** 2
- **Files modified:** 4 (3 test files, 1 source file)

## Accomplishments
- Added fromReadable test: `controller.error()` fires pump() catch block, setting `status=error` and populating error signal
- Added fromWebSocket test: disposing owner during reconnect backoff (5000ms timer) immediately sets `status=closed`
- Added fromObservable test: observable emitting 3 values then calling `observer.error()` preserves last data value and sets `status=error`
- Fixed bug in `from-readable.ts`: non-cancellation errors no longer get overwritten to `status=closed`
- Total streams tests: 45 (up from 42)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fromReadable stream-error test and fromWebSocket cancel-during-reconnect test** - `074c84d` (test + fix)
2. **Task 2: Add fromObservable error-after-values test** - `6ec05c2` (test)

## Files Created/Modified
- `packages/streams/src/from-readable.ts` - Bug fix: non-cancellation catch now only sets closed if not already in error state
- `packages/streams/tests/from-readable.test.ts` - Added controller.error() test case
- `packages/streams/tests/from-websocket.test.ts` - Added cancel-during-reconnect-backoff test case
- `packages/streams/tests/from-observable.test.ts` - Added error-after-values test case

## Decisions Made
- Fixed the underlying bug in fromReadable rather than adjusting the test expectations — the status=error state must be preserved for correct error handling by consumers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed fromReadable status=error overwritten to status=closed**
- **Found during:** Task 1 (fromReadable stream-error test)
- **Issue:** The pump() catch block sets `status.set('error')` then unconditionally sets `status.set('closed')` — the error state was immediately overwritten, making status=error unreachable for consumers
- **Fix:** Changed the logic so `status.set('closed')` only runs in the `else` branch (cancellation errors), not after non-cancellation errors
- **Files modified:** `packages/streams/src/from-readable.ts`
- **Verification:** All 45 streams tests pass with the fix applied
- **Committed in:** `074c84d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Bug fix was necessary for the new test to be meaningful — without it the test would have been testing incorrect behavior. No scope creep.

## Issues Encountered
- The fromReadable error path test initially failed because of the bug above. The source code's catch block unconditionally overwrote `status=error` with `status=closed`, meaning the test's assertion `expect(status()).toBe('error')` would always fail. Applied Rule 1 fix to make the implementation match the documented intent.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 45 streams tests green; TEST-04 requirement satisfied
- No blockers for remaining phase 07 plans

---
*Phase: 07-package-quality*
*Completed: 2026-02-28*
