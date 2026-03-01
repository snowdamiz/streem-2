---
phase: 07-package-quality
plan: "03"
subsystem: testing
tags: [vitest, suspense, error-boundary, async, dom]

# Dependency graph
requires:
  - phase: 03-streaming-primitives
    provides: Suspense component implementation with thrown-Promise protocol
  - phase: 02-jsx-runtime-and-component-model
    provides: ErrorBoundary component with synchronous error isolation
provides:
  - Suspense onError prop for async error propagation to outer ErrorBoundary scope
  - 3 nested ErrorBoundary test cases covering isolation, escalation, and sibling independence
  - 3 Suspense onError prop test cases covering rejection callback, console.error bypass, and fallback
affects:
  - 07-package-quality (remaining plans)
  - future phases using Suspense with error handling

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Suspense onError prop: bridge between async rejection and outer ErrorBoundary scope"
    - "Phase 3 rejection handler: props.onError(err) ?? console.error fallback pattern"

key-files:
  created:
    - packages/dom/tests/error-boundary.test.ts (nested boundary describe block added)
    - packages/dom/tests/suspense.test.ts (async error propagation describe block added)
  modified:
    - packages/dom/src/components.ts

key-decisions:
  - "Used onError prop (Approach A) for async error propagation — cleaner, testable API vs DOM event dispatch"
  - "onError is optional and backward-compatible: omitting it preserves console.error behavior"

patterns-established:
  - "Async errors from Suspense are bridged via onError prop rather than DOM events or global handlers"

requirements-completed:
  - TEST-03

# Metrics
duration: 4min
completed: 2026-02-28
---

# Phase 7 Plan 03: Suspense Async Error Propagation and Nested ErrorBoundary Tests Summary

**Suspense onError prop (Approach A) bridges async Promise rejections to outer ErrorBoundary scope; 6 new tests (3 nested ErrorBoundary + 3 onError) bring total to 99 passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T23:50:24Z
- **Completed:** 2026-02-28T23:54:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added optional `onError?: (err: unknown) => void` prop to `SuspenseProps`
- Wired rejection handler to call `props.onError(err)` when provided, else `console.error` (backward compatible)
- Added 3 nested ErrorBoundary tests: inner catches own error without outer triggering, outer catches escaped errors, sibling boundaries are independent
- Added 3 Suspense async error propagation tests: onError called on rejection, console.error bypassed when onError provided, console.error fires when onError omitted
- All 93 original tests continue to pass; total is now 99

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Suspense onError prop for async error propagation** - `488196e` (feat)
2. **Task 2: Add nested ErrorBoundary and Suspense async error propagation tests** - `a77c13b` (test)

## Files Created/Modified
- `packages/dom/src/components.ts` - Added `onError` prop to `SuspenseProps`, updated rejection handler, updated JSDoc to Phase 3
- `packages/dom/tests/error-boundary.test.ts` - Added `ErrorBoundary — nested boundaries` describe block (3 tests)
- `packages/dom/tests/suspense.test.ts` - Added `Suspense — async error propagation via onError` describe block (3 tests)

## Decisions Made
- Used `onError` prop (Approach A) over DOM error events (Approach B): cleaner API, straightforward to test, no browser-specific plumbing needed
- `onError` is optional with backward-compatible fallback to `console.error` — no breaking change to existing Suspense usage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TEST-03 requirement fulfilled: nested ErrorBoundary, Suspense async error propagation, and For keyed list reordering all have coverage
- `SuspenseProps.onError` is ready for use by future `createResource` integration (Phase 3+ note in plan context)
- All 99 @streem/dom tests green; no regressions

---
*Phase: 07-package-quality*
*Completed: 2026-02-28*

## Self-Check: PASSED

- FOUND: packages/dom/src/components.ts
- FOUND: packages/dom/tests/error-boundary.test.ts
- FOUND: packages/dom/tests/suspense.test.ts
- FOUND: .planning/phases/07-package-quality/07-03-SUMMARY.md
- FOUND commit: 488196e (feat: Suspense onError prop)
- FOUND commit: a77c13b (test: nested ErrorBoundary + Suspense async error propagation)
