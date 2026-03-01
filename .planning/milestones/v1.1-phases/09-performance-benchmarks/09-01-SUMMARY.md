---
phase: 09-performance-benchmarks
plan: 01
subsystem: testing
tags: [tinybench, benchmarks, signals, solid-js, preact, performance]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: signal, computed, effect, createRoot primitives in @streem/core dist
provides:
  - apps/bench package with tinybench benchmark suites for signal, computed, and effect
  - Reproducible ops/sec comparison between @streem/core, @preact/signals-core, and solid-js
affects: [10-landing-page-polish]

# Tech tracking
tech-stack:
  added: [tinybench@2.9.0, @preact/signals-core@1.8.0, solid-js@1.9.0]
  patterns: [each suite returns { bench, name } object — tinybench Bench does not store name on instance]

key-files:
  created:
    - apps/bench/package.json
    - apps/bench/run.mjs
    - apps/bench/suites/signal.mjs
    - apps/bench/suites/computed.mjs
    - apps/bench/suites/effect.mjs
  modified: []

key-decisions:
  - "tinybench Bench does not expose a name property — suites return { bench, name } object instead of bare bench"
  - "Used createRoot() wrapper in @streem/core benchmarks to suppress DX-02/DX-03 owner warnings — production-like isolation per iteration"
  - "SolidJS createEffect is async/batched — effect runs are scheduled, not immediate; benchmark measures scheduling overhead"

patterns-established:
  - "Suite pattern: export async function run() returning { bench, name } for uniform runner interface"
  - "Runner pattern: destructure { bench, name } from each suite, pass both to printResults()"

requirements-completed: [PERF-01]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 9 Plan 01: Performance Benchmarks Summary

**tinybench benchmark suite comparing @streem/core signal/computed/effect ops/sec against @preact/signals-core and solid-js across 9 benchmark cases**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T03:47:44Z
- **Completed:** 2026-03-01T03:50:10Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments
- Created apps/bench ESM package with tinybench, @preact/signals-core, solid-js, and @streem/core workspace dep
- Implemented three benchmark suites: signal read+write, computed re-evaluation, and effect re-run
- All 9 benchmark cases (3 libs x 3 primitives) run successfully with `node apps/bench/run.mjs`
- Output prints formatted markdown tables with ops/sec, avg latency, and sample counts

## Sample Results (2026-03-01, Node v25.3.0)

**signal read+write:**
- @streem/core: ~8.9M ops/sec
- @preact/signals-core: ~46.6M ops/sec
- solid-js: ~21.4M ops/sec

**computed re-evaluation:**
- @streem/core: ~3.2M ops/sec
- @preact/signals-core: ~19.0M ops/sec
- solid-js: ~14.2M ops/sec

**effect re-run:**
- @streem/core: ~3.3M ops/sec
- @preact/signals-core: ~13.0M ops/sec
- solid-js: ~21.8M ops/sec

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold apps/bench package** - `4bd1b4f` (chore)
2. **Task 2: Write benchmark suites and run.mjs** - `5440132` (feat)

## Files Created/Modified
- `apps/bench/package.json` - ESM package with tinybench, @preact/signals-core, solid-js, @streem/core workspace dependencies
- `apps/bench/run.mjs` - Entry point importing all suites, prints markdown tables with ops/sec results
- `apps/bench/suites/signal.mjs` - Signal read+write benchmark for all three libraries
- `apps/bench/suites/computed.mjs` - Computed/memo re-evaluation benchmark for all three libraries
- `apps/bench/suites/effect.mjs` - Effect re-run benchmark for all three libraries

## Decisions Made
- tinybench Bench class does not store the `name` option as an instance property — suites return `{ bench, name }` object so the runner can label tables correctly (auto-fix applied during execution)
- createRoot() wrapper used per benchmark iteration to suppress DX-02/DX-03 owner warnings in @streem/core, providing production-like isolation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed bench.name returning undefined in printResults**
- **Found during:** Task 2 (Write benchmark suites and run.mjs)
- **Issue:** tinybench Bench instance does not expose the `name` constructor option — `bench.name` was `undefined`, causing tables to show `## undefined` headings
- **Fix:** Changed each suite's `run()` to return `{ bench, name: suiteName }` instead of bare `bench`; updated `run.mjs` to destructure `{ bench, name }` and pass `name` explicitly to `printResults(name, bench)`
- **Files modified:** apps/bench/run.mjs, apps/bench/suites/signal.mjs, apps/bench/suites/computed.mjs, apps/bench/suites/effect.mjs
- **Verification:** Re-ran `node apps/bench/run.mjs` — all three section headings now show correct names
- **Committed in:** 5440132 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Required for correct table output. No scope creep.

## Issues Encountered
None beyond the bench.name deviation handled above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PERF-01 satisfied: reproducible benchmark suite ready to run with `node apps/bench/run.mjs`
- Benchmark results available for Phase 10 landing page bar chart (if needed)
- @streem/core is measurably slower than competitors — correctness-first design; optimization is future work

---
*Phase: 09-performance-benchmarks*
*Completed: 2026-03-01*
