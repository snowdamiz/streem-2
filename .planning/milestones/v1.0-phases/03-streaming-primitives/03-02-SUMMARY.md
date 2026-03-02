---
phase: 03-streaming-primitives
plan: "02"
subsystem: streams
tags: [eventsource, sse, server-sent-events, signals, cleanup, msw, mock]

requires:
  - phase: 03-01
    provides: "/streams package scaffold, fromWebSocket() adapter, types.ts (StreamTuple, StreamStatus, SSEOptions)"

provides:
  - "fromSSE() adapter using native EventSource API with JSON parse + raw string fallback"
  - "MockEventSource test harness for synchronous SSE event testing"
  - "11-test suite covering all fromSSE behaviors: JSON, raw string, transform, named events, disposal, readyState-based error distinction, withCredentials"
  - "Updated /streams barrel export including fromSSE"

affects: [03-03, 03-04, any phase using /streams SSE adapter]

tech-stack:
  added:
    - "eventsource@^4.1.0 (devDependency — available for future real-network SSE tests)"
  patterns:
    - "MockEventSource extends EventTarget — synchronous test control without network dependencies"
    - "readyState-based error distinction: EventSource.CLOSED → permanent failure, EventSource.CONNECTING → native reconnect"
    - "onCleanup(() => es.close()) — stops native reconnection on owner scope disposal"

key-files:
  created:
    - packages/streams/src/from-sse.ts
    - packages/streams/tests/from-sse.test.ts
    - packages/streams/tests/setup.ts
  modified:
    - packages/streams/src/index.ts
    - packages/streams/vitest.config.ts
    - packages/streams/package.json

key-decisions:
  - "MockEventSource over MSW sse() + eventsource npm package — MSW's FetchInterceptor does not intercept eventsource v4's fetch in happy-dom vitest environment due to CORS/streaming incompatibility; mock gives same behavioral coverage synchronously"
  - "EventSource constructor order: es created first, onCleanup registered immediately after — connection is synchronous but cleanup fires and calls es.close() if scope disposed before first event"
  - "Named events share the same handleMessage handler — all route to the same data signal regardless of event type"

patterns-established:
  - "SSE test pattern: MockEventSource captures _last instance, test calls _message/_event/_errorReconnecting/_errorClosed directly for synchronous behavioral verification"
  - "Error handler pattern: check es.readyState === EventSource.CLOSED for permanent vs temporary failure"

requirements-completed: [STREAM-02, STREAM-07]

duration: 9min
completed: 2026-02-28
---

# Phase 03 Plan 02: fromSSE() Adapter Summary

**fromSSE() adapter using native EventSource with readyState-based error distinction, named event routing to shared data signal, and synchronous MockEventSource test harness covering 11 behaviors**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-28T07:44:39Z
- **Completed:** 2026-02-28T07:53:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `fromSSE()` adapter using native `EventSource` — no custom backoff, relies on browser's native reconnect
- Correct error handling: `readyState === EventSource.CLOSED` → permanent failure (status `closed` + error signal), `readyState === EventSource.CONNECTING` → native reconnect (status `reconnecting`)
- Named event subscriptions via `options.events[]` routing to shared `handleMessage` — same data signal regardless of event type
- `onCleanup(() => { es.close(); status.set('closed') })` stops native reconnection when owner scope disposes
- 11-test suite using `MockEventSource` — extends `EventTarget`, exposes `_open/_message/_event/_errorReconnecting/_errorClosed` helpers for synchronous test control

## Task Commits

1. **Task 1: Implement fromSSE() adapter** - `dcf3620` (feat)
2. **Task 2: Write fromSSE test suite + update index.ts** - `b56fec4` (feat)

## Files Created/Modified

- `packages/streams/src/from-sse.ts` - fromSSE() adapter using native EventSource
- `packages/streams/tests/from-sse.test.ts` - 11 synchronous tests using MockEventSource
- `packages/streams/tests/setup.ts` - Vitest global setup placeholder
- `packages/streams/src/index.ts` - Added `fromSSE` barrel export
- `packages/streams/vitest.config.ts` - Added setupFiles for tests/setup.ts
- `packages/streams/package.json` - Added eventsource@4 devDependency

## Decisions Made

- **MockEventSource over MSW + eventsource npm:** The plan specified `msw/node` `sse()` handler with the `eventsource` npm package. During Task 2, discovered that `eventsource` v4's internal `fetch` is not intercepted by MSW's `FetchInterceptor` in vitest's happy-dom environment — CORS policy blocks streaming response body reads, and MSW's fetch interception doesn't reach the eventsource library. Replaced with `MockEventSource extends EventTarget` pattern that provides equivalent behavioral coverage synchronously without network dependencies.

- **onCleanup position:** EventSource constructor initiates connection synchronously. `onCleanup` is registered immediately after construction — if owner scope disposes before first event, `onCleanup` fires and `es.close()` stops the connection cleanly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MSW sse() + eventsource v4 incompatible with happy-dom streaming**
- **Found during:** Task 2 (fromSSE test suite)
- **Issue:** The plan specified using `msw/node` `setupServer()` with `sse()` handler and the `eventsource` npm package as the EventSource polyfill. In practice, happy-dom's `fetch` implementation blocks cross-origin streaming responses (CORS), so MSW intercepts the request but the response body stream is never delivered to the `eventsource` library. MSW's `FetchInterceptor` patches `globalThis.fetch` but the streaming response cannot be read via `response.body.getReader()` in the happy-dom environment. Switching to `node` vitest environment also failed — MSW `FetchInterceptor` does not successfully intercept `eventsource` v4 fetch calls in vitest's node environment either.
- **Fix:** Wrote `MockEventSource extends EventTarget` class. Test controls the instance via `_last` static property. `_message()`, `_event()`, `_errorReconnecting()`, `_errorClosed()` dispatch events synchronously. `beforeEach` replaces `globalThis.EventSource`, `afterEach` restores it. Covers all same behaviors as the planned MSW approach.
- **Files modified:** `packages/streams/tests/from-sse.test.ts`, `packages/streams/tests/setup.ts`, `packages/streams/vitest.config.ts`
- **Verification:** 11/11 tests pass, TypeScript clean
- **Committed in:** b56fec4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/incompatibility)
**Impact on plan:** No scope change. Same behavioral requirements verified. MockEventSource provides better synchronous control for signal testing than MSW + async polling would have.

## Issues Encountered

- `eventsource` v4 uses `globalThis.fetch` captured in constructor — compatible with MSW patching in theory, but happy-dom's fetch streaming is blocked by CORS, making the pattern unworkable in this vitest environment. Investigation took ~7 minutes across 3 approaches (eventsource + happy-dom, eventsource + node env, raw MSW fetch test).

## Next Phase Readiness

- `fromSSE()` ready for use in Plan 03-03 (fromReadable) and 03-04 (fromObservable)
- `/streams` barrel exports: `fromWebSocket`, `MaxRetriesExceededError`, `fromSSE`, all types
- All 20 tests passing (9 fromWebSocket + 11 fromSSE)
- MockEventSource test pattern available for any future SSE-related tests

---
*Phase: 03-streaming-primitives*
*Completed: 2026-02-28*
