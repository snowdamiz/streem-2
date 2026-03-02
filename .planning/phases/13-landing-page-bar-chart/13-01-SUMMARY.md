---
phase: 13-landing-page-bar-chart
plan: 01
subsystem: ui
tags: [svg, chart, signals, computed, landing-page, benchmark, dogfood]

# Dependency graph
requires: []
provides:
  - "BenchmarkChart SVG component comparing Streem/Preact/SolidJS primitive ops/sec"
  - "Landing page BenchmarkChart section between TickerDemo and CodeSample"
affects: [landing-page, docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BarGroup sub-component for reactive per-bar hover opacity via computed()"
    - "Inline SVG chart with viewBox scaling — no charting library"
    - "Component returns Node via 'as unknown as Node' cast pattern"

key-files:
  created:
    - apps/landing/src/components/BenchmarkChart.tsx
  modified:
    - apps/landing/src/App.tsx

key-decisions:
  - "Used BarGroup sub-component to scope per-bar computed() reactivity cleanly"
  - "computed() returns () => T not a Signal — called as function in style accessors"
  - "JSX arrays typed as (Node | Node[] | null)[] to avoid JSX.Element undefined issue"
  - "maxOps anchored to 46_847_878 (signal primitive only) for proportional bar heights"
  - "Y-axis ticks at 0, 10M, 20M, 30M, 40M — spans full data range"

patterns-established:
  - "SVG dogfood pattern: use signal/computed for interactivity, no third-party chart lib"
  - "BarGroup sub-component: encapsulates computed() scope per reactive element"

requirements-completed: [LAND-01]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 13 Plan 01: BenchmarkChart Component Summary

**Grouped SVG bar chart comparing Streem/Preact/SolidJS primitive ops/sec, dogfooded with Streem signal/computed for hover interactivity — no charting library**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-01T21:47:54Z
- **Completed:** 2026-03-01T21:51:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `BenchmarkChart.tsx` — a 251-line SVG grouped bar chart with 3 clusters (signal/computed/effect), each showing Streem, Preact, SolidJS bars with exact ops/sec values from BENCHMARKS.md
- Dogfooded `signal` and `computed` from `streem` to drive per-bar hover opacity (non-hovered bars fade to 0.35 opacity via `computed()`)
- Wired `<BenchmarkChart />` into `App.tsx` between `<TickerDemo />` and `<CodeSample />`
- Full build exits 0 with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BenchmarkChart component** - `d90788d` (feat)
2. **Task 2: Wire BenchmarkChart into App.tsx** - `d954d45` (feat)

## Files Created/Modified

- `apps/landing/src/components/BenchmarkChart.tsx` - SVG grouped bar chart with signal/computed dogfood
- `apps/landing/src/App.tsx` - Added BenchmarkChart import and JSX usage

## Decisions Made

- Used a `BarGroup` sub-component so each bar gets its own `computed()` scope for reactive opacity — this keeps the signal reactivity clean and isolated per bar
- `computed()` in this codebase returns `() => T` (a function), not a Signal with `.value` — called as `getOpacity()` in style accessors, not `getOpacity.value`
- Typed element arrays as `(Node | Node[] | null)[]` to satisfy TypeScript since `JSX.Element = Node | Node[] | null | undefined` and `undefined` is not directly assignable; inner `.map()` callbacks cast with `as unknown as Node`
- `maxOps = 46_847_878` (signal primitive only — the highest value) used as the proportional anchor
- Y-axis grid lines at 0, 10M, 20M, 30M, 40M ops/sec provide readable reference scale

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript JSX element array type mismatch**
- **Found during:** Task 1 (BenchmarkChart component)
- **Issue:** Initial implementation used `JSX.Element[]` but the `JSX` namespace from `/dom` defines `JSX.Element = Node | Node[] | null | undefined` — the `undefined` made it incompatible with arrays expected to hold rendered nodes; also `computed()` returns `() => T` not a Signal with `.value`
- **Fix:** Changed array types to `(Node | Node[] | null)[]`, added `as unknown as Node` casts on `.map()` returns, called computed result as function `getOpacity()` instead of `getOpacity.value`, refactored to `BarGroup` sub-component for clean scoping
- **Files modified:** `apps/landing/src/components/BenchmarkChart.tsx`
- **Verification:** `npx tsc --noEmit` passes clean; build exits 0
- **Committed in:** d90788d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript type correction)
**Impact on plan:** Necessary for TypeScript correctness; no scope creep, final component matches plan spec exactly.

## Issues Encountered

- `computed()` API returns `() => T` (function) not `Signal<T>` — identified from `packages/core/src/signal.ts` source inspection. Plan's pseudocode showed `.value` access but actual API is function call. Fixed immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LAND-01 satisfied: BenchmarkChart is visible on the landing page between TickerDemo and CodeSample
- Phase 13 Plan 02 can proceed (remaining plans in phase 13)
- No blockers

---
*Phase: 13-landing-page-bar-chart*
*Completed: 2026-03-01*
