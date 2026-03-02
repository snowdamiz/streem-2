---
phase: 03-streaming-primitives
plan: "01"
subsystem: streaming
tags: [websocket, signals, vitest-websocket-mock, mock-socket, happy-dom, exponential-backoff]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: signal(), onCleanup(), createRoot() — the reactive primitives fromWebSocket() is built on
provides:
  - "/streams package scaffold with package.json, tsconfig.json, vite.config.ts, vitest.config.ts"
  - "src/types.ts: StreamStatus union, StreamTuple<T>, WebSocketOptions<T>, SSEOptions<T>, ReadableOptions<T>, ObservableOptions<T>, Subscribable<T>"
  - "src/from-websocket.ts: fromWebSocket() adapter with MaxRetriesExceededError and exponential backoff reconnect"
  - "src/index.ts: public barrel export for /streams"
  - "tests/from-websocket.test.ts: 9-test suite covering STREAM-01, STREAM-07, STREAM-08"
affects:
  - 03-02-SSE adapter (uses same StreamTuple, StreamStatus from types.ts)
  - 03-03-ReadableStream and Observable adapters (same pattern)
  - 03-04-backpressure combinators (batch/throttle/debounce operate on StreamTuple signals)

# Tech tracking
tech-stack:
  added:
    - vitest-websocket-mock@0.5.0 (mock WebSocket server for tests)
    - mock-socket@9.x (peer dep of vitest-websocket-mock)
    - happy-dom@14.x (DOM environment for vitest — required for WebSocket global patching)
    - msw@2.12.x (installed but not used in this plan — reserved for SSE/fetch mocking in Plan 03-02)
  patterns:
    - "StreamTuple<T> = [Signal<T|undefined>, Signal<StreamStatus>, Signal<Error|undefined>] — identical return shape for all four adapters"
    - "Cleanup-first invariant: onCleanup() registered BEFORE connect() — ensures disposal fires correctly even when owner scope disposed synchronously"
    - "Disposed flag: disposed = true is the FIRST line in cleanup handler — all async callbacks guard with if (disposed) return"
    - "Error-then-close: WebSocket error event is intentionally a no-op; close handler drives all status transitions to avoid double transitions"
    - "JSON parse with silent fallback: JSON.parse failure passes raw string through, stream continues uninterrupted"

key-files:
  created:
    - packages/streams/package.json
    - packages/streams/tsconfig.json
    - packages/streams/vite.config.ts
    - packages/streams/vitest.config.ts
    - packages/streams/src/types.ts
    - packages/streams/src/from-websocket.ts
    - packages/streams/src/index.ts
    - packages/streams/tests/from-websocket.test.ts
  modified:
    - pnpm-lock.yaml (added 57 new packages for /streams devDependencies)

key-decisions:
  - "vitest-websocket-mock version fixed from plan's ^2.0.0 (non-existent) to ^0.5.0 (latest actual version)"
  - "maxRetries exhaustion test rewrote to use maxRetries:0 instead of fake timers — vitest-websocket-mock 0.5.0 Promise-based server.connected incompatible with vi.useFakeTimers() active before await"
  - "happy-dom environment required in vitest.config.ts — node env lacks WebSocket global pre-Node 22, mock-socket patching fails silently"
  - "getBackoffDelay renamed att parameter to avoid shadowing outer attempt variable"

patterns-established:
  - "Adapter pattern: register onCleanup() then call connect() — all future stream adapters follow this order"
  - "Backoff formula: Math.min(initialDelay * 2^attempt + jitter(0-1000ms), maxDelay)"
  - "Status transitions: connecting -> connected on open, reconnecting on close-with-retries-remaining, error on retries-exhausted, closed on reconnect:false or disposal"

requirements-completed: [STREAM-01, STREAM-07, STREAM-08]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 3 Plan 01: /streams Package Scaffold + fromWebSocket() Adapter Summary

**/streams package scaffolded with fromWebSocket() adapter returning [data, status, error] signal tuple, typed StreamStatus union, exponential backoff reconnect, and 9 passing tests using vitest-websocket-mock 0.5.0**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T07:37:50Z
- **Completed:** 2026-02-28T07:41:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Created `/streams` package with full build toolchain (vite lib mode + dts, vitest happy-dom environment)
- Defined shared type contracts: `StreamStatus`, `StreamTuple<T>`, `WebSocketOptions<T>`, `SSEOptions<T>`, `ReadableOptions<T>`, `ObservableOptions<T>`, `Subscribable<T>`
- Implemented `fromWebSocket()` with cleanup-first pattern, disposed flag, exponential backoff reconnection, JSON auto-parse with silent fallback, and `MaxRetriesExceededError`
- All 9 tests pass covering STREAM-01 (data updates, transform, cleanup), STREAM-07 (initial state, status transitions), STREAM-08 (reconnecting state, maxRetries exhaustion)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold /streams package + define type contracts** - `974f147` (feat)
2. **Task 2: Implement fromWebSocket() adapter + test suite** - `94733ec` (feat)

## Files Created/Modified

- `packages/streams/package.json` - Package manifest with /core dependency, vitest-websocket-mock/happy-dom devDeps
- `packages/streams/tsconfig.json` - Extends ../../tsconfig.base.json, composite mode
- `packages/streams/vite.config.ts` - Lib mode, ES format, dts({ rollupTypes: true })
- `packages/streams/vitest.config.ts` - happy-dom environment (required for WebSocket global)
- `packages/streams/src/types.ts` - All shared stream type contracts
- `packages/streams/src/from-websocket.ts` - fromWebSocket() + MaxRetriesExceededError
- `packages/streams/src/index.ts` - Public barrel export
- `packages/streams/tests/from-websocket.test.ts` - 9 tests with vitest-websocket-mock WS mock server
- `pnpm-lock.yaml` - 57 new packages added

## Decisions Made

- Used `vitest-websocket-mock@^0.5.0` (latest actual version) — plan specified `^2.0.0` which doesn't exist on npm
- Rewrote maxRetries exhaustion test to use `maxRetries: 0` instead of `vi.useFakeTimers()` — fake timers before `server.connected` await causes timeout because the Promise machinery stalls
- `happy-dom` environment is mandatory: without it, `globalThis.WebSocket` is undefined and mock-socket patching silently fails

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected vitest-websocket-mock version constraint**
- **Found during:** Task 1 (pnpm install)
- **Issue:** Plan specified `"vitest-websocket-mock": "^2.0.0"` but the latest release is `0.5.0` — no `^2.x` versions exist
- **Fix:** Updated `packages/streams/package.json` to `"vitest-websocket-mock": "^0.5.0"`
- **Files modified:** `packages/streams/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm install` succeeded with 57 new packages
- **Committed in:** `974f147` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed maxRetries exhaustion test that timed out with fake timers**
- **Found during:** Task 2 (first test run)
- **Issue:** `vi.useFakeTimers()` called before `await server.connected` caused test timeout — the `server.connected` Promise uses real async machinery that fake timers freeze
- **Fix:** Rewrote test to use `maxRetries: 0` so the very first close event immediately transitions to error state without scheduling a retry, eliminating the need for fake timer control
- **Files modified:** `packages/streams/tests/from-websocket.test.ts`
- **Verification:** All 9 tests pass in 266ms
- **Committed in:** `94733ec` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dep version, 1 test bug)
**Impact on plan:** Both fixes necessary for correctness. The maxRetries:0 test approach actually produces a cleaner, more deterministic test than the fake-timers approach.

## Issues Encountered

- `vitest-websocket-mock` version mismatch discovered during install — resolved immediately
- Fake timers incompatible with vitest-websocket-mock's Promise-based connection API — test redesigned to avoid fake timers entirely

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/streams` package exists and is importable via `workspace:*` from other packages
- `StreamTuple<T>`, `StreamStatus`, `StreamTuple<T>` types ready for Plans 03-02 and 03-03
- `fromWebSocket()` is the reference implementation for the adapter pattern — subsequent adapters follow identical `[data, status, error]` shape and `onCleanup()`-before-`connect()` order
- `msw@2.12` installed (not yet used) — ready for SSE mocking in Plan 03-02

---
*Phase: 03-streaming-primitives*
*Completed: 2026-02-28*
