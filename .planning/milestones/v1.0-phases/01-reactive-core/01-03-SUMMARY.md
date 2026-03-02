---
phase: 01-reactive-core
plan: "03"
subsystem: testing
tags: [typescript, vitest, signals, reactive, tdd, node, dev-warnings]

requires:
  - phase: 01-reactive-core/01-01
    provides: "push-pull reactive graph (createSignalNode, createComputedNode, createEffectNode, disposeEffect, trackRead, notifySubscribers, getCurrentSubscriber) and owner tree (createRoot, onCleanup, getOwner, runWithOwner)"
  - phase: 01-reactive-core/01-02
    provides: "public signal(), computed(), effect() API with DX-02/DX-03 dev warnings, Signal<T> and Owner types in index.ts"

provides:
  - "packages/core/tests/signal.test.ts — 16 tests covering SIGNAL-01, SIGNAL-02, SIGNAL-03"
  - "packages/core/tests/owner.test.ts — 11 tests covering SIGNAL-04, SIGNAL-05"
  - "packages/core/tests/dev-warnings.test.ts — 13 tests covering DX-02, DX-03"
  - "packages/core/vitest.config.ts — per-package vitest config (node environment)"
  - "All 7 Phase 1 requirements have passing test coverage (40 tests, pnpm test exits 0)"
  - "Implementation bug fix: onCleanup() inside effect bodies now correctly registers on effect.cleanupFns"

affects:
  - all downstream phases (test patterns and suite structure established here)

tech-stack:
  added: []
  patterns:
    - "TDD red-green: write failing tests first (RED commit), then fix implementation (GREEN commit)"
    - "Dev warning tests use vi.spyOn(console, 'warn').mockImplementation() in beforeEach + mockRestore() in afterEach"
    - "Effect cleanup tests: sequence array captures run/cleanup order to verify cleanup-before-rerun ordering"
    - "All tests use createRoot() to avoid DX-02/DX-03 warnings polluting unrelated test assertions"
    - "Diamond dependency test: evalCount delta verifies single evaluation per dependency change"

key-files:
  created:
    - packages/core/tests/signal.test.ts
    - packages/core/tests/owner.test.ts
    - packages/core/tests/dev-warnings.test.ts
    - packages/core/vitest.config.ts
  modified:
    - packages/core/src/owner.ts
    - packages/core/src/reactive.ts

key-decisions:
  - "onCleanup() inside effect body must register on effect.cleanupFns (per-run), not owner.cleanups (disposal-only) — fix required EffectCleanupRef structural interface in owner.ts"
  - "setCurrentEffectCleanupTarget() exported from owner.ts, called by reactive.ts runEffect() — avoids circular import (reactive imports owner, not vice versa)"
  - "SIGNAL-01 tests read signals outside createRoot by design — intentionally trigger DX-02 to test that the signal values are correct regardless of context; warnings are expected stderr"

patterns-established:
  - "Pattern: EffectCleanupRef structural interface bridges reactive.ts and owner.ts without circular deps — same pattern as OwnerRef"
  - "Pattern: setCurrentEffectCleanupTarget set/restored around effect.fn() call in runEffect — analogous to currentSubscriber save/restore"

requirements-completed:
  - SIGNAL-01
  - SIGNAL-02
  - SIGNAL-03
  - SIGNAL-04
  - SIGNAL-05
  - DX-02
  - DX-03

duration: 4min
completed: 2026-02-28
---

# Phase 01 Plan 03: Reactive Core Test Suite Summary

**40-test Vitest suite covering all 7 Phase 1 requirements (SIGNAL-01 through SIGNAL-05, DX-02, DX-03) with a bug fix to onCleanup() enabling correct per-effect-run cleanup callbacks**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-28T03:43:34Z
- **Completed:** 2026-02-28T03:47:11Z
- **Tasks:** 2 (RED + GREEN, no refactor needed)
- **Files modified:** 6 (4 created: test files + vitest.config; 2 modified: owner.ts + reactive.ts)

## Accomplishments

- Written 40 tests across 3 files covering all 7 Phase 1 requirements — pnpm test exits 0 at root and within packages/core
- Found and fixed a correctness bug in onCleanup(): callbacks registered inside effect bodies were silently lost instead of firing before each re-run
- Established test patterns for dev-warning verification (vi.spyOn + mockImplementation + mockRestore) and cleanup-ordering verification (sequence arrays)

## Task Commits

Each TDD phase committed atomically:

1. **RED: Failing test suite** - `8ee4636` (test)
2. **GREEN: Implementation fix + all tests passing** - `994cf2b` (feat)

**Plan metadata:** (recorded in final commit)

_Note: No refactor commit needed — implementation was clean after bug fix._

## Files Created/Modified

- `packages/core/tests/signal.test.ts` — 16 tests: SIGNAL-01 (signal read/write), SIGNAL-02 (computed lazy eval, caching, diamond dep), SIGNAL-03 (effect auto-track, conditional deps, dispose, equality check)
- `packages/core/tests/owner.test.ts` — 11 tests: SIGNAL-04 (createRoot dispose, nested roots, isolation, idempotency), SIGNAL-05 (onCleanup per-run, disposal, ordering, cleanup-before-run)
- `packages/core/tests/dev-warnings.test.ts` — 13 tests: DX-02 (named/anon signal outside context, no warn inside effect/computed/root), DX-03 (effect/computed outside root, no warn inside root)
- `packages/core/vitest.config.ts` — Per-package vitest config: environment 'node', name '/core'
- `packages/core/src/owner.ts` — Added EffectCleanupRef interface, currentEffectCleanupTarget global, setCurrentEffectCleanupTarget() and getCurrentEffectCleanupTarget() exports; fixed onCleanup() to prioritize effect's cleanupFns when inside effect body
- `packages/core/src/reactive.ts` — Added import of setCurrentEffectCleanupTarget from owner.ts; updated runEffect() to set/restore currentEffectCleanupTarget around effect.fn() invocation

## Decisions Made

- `onCleanup()` inside an effect body must register on `effect.cleanupFns` (not `owner.cleanups`) — the `cleanupFns` array is what `runEffect` fires before each re-run, making the "cleanup before re-run" contract work correctly
- Used a structural `EffectCleanupRef` interface (just `cleanupFns: (() => void)[]`) in owner.ts to avoid circular import — same pattern as existing `OwnerRef` in reactive.ts
- `setCurrentEffectCleanupTarget()` is exported from owner.ts and imported by reactive.ts, keeping the import direction one-way (reactive.ts imports owner.ts, never vice versa)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed onCleanup() callback registration inside effect bodies**
- **Found during:** GREEN phase (3 failing tests in SIGNAL-05: onCleanup re-run behavior)
- **Issue:** `onCleanup()` registered callbacks on `currentOwner.cleanups` (disposal-only) regardless of whether it was called inside an effect body. Callbacks never fired before effect re-runs; they only fired on root disposal.
- **Fix:** Added `currentEffectCleanupTarget` global in owner.ts (set by reactive.ts's `runEffect` before calling `effect.fn()`). `onCleanup()` now registers on `effect.cleanupFns` when inside an effect body, falling back to `owner.cleanups` otherwise.
- **Files modified:** `packages/core/src/owner.ts`, `packages/core/src/reactive.ts`
- **Verification:** All 3 previously failing SIGNAL-05 tests now pass; all 40 tests pass
- **Committed in:** `994cf2b` (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Bug fix essential for correctness of SIGNAL-05 requirement. The contract "onCleanup fires before each re-run" is a core SIGNAL-05 spec item. No scope creep.

## Issues Encountered

None beyond the Rule 1 auto-fix documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 7 Phase 1 requirements have green test coverage — `/core` is fully tested and ready for downstream use
- Phase 2 (Component Model) and Phase 3 (Streaming) can both depend on `/core` with confidence
- No blockers

## Self-Check: PASSED

All created files verified present. Both task commits verified in git log.

- `packages/core/tests/signal.test.ts` — FOUND
- `packages/core/tests/owner.test.ts` — FOUND
- `packages/core/tests/dev-warnings.test.ts` — FOUND
- `packages/core/vitest.config.ts` — FOUND
- `packages/core/src/owner.ts` — FOUND (modified)
- `packages/core/src/reactive.ts` — FOUND (modified)
- Commit `8ee4636` (RED: failing tests) — FOUND
- Commit `994cf2b` (GREEN: all tests pass) — FOUND

---
*Phase: 01-reactive-core*
*Completed: 2026-02-28*
