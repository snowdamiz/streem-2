---
phase: 09-performance-benchmarks
plan: 02
subsystem: testing
tags: [tinybench, benchmarks, signals, solid-js, preact, performance, BENCHMARKS.md]

# Dependency graph
requires:
  - phase: 09-performance-benchmarks/09-01
    provides: apps/bench package with tinybench suites for signal, computed, and effect
provides:
  - BENCHMARKS.md at repository root with committed ops/sec results for all 9 benchmark cases
  - bench script in root package.json for easy re-running
affects: [10-landing-page-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [BENCHMARKS.md documents methodology, environment, and reproduction steps for committed benchmark results]

key-files:
  created:
    - BENCHMARKS.md
  modified:
    - package.json

key-decisions:
  - "BENCHMARKS.md committed to repo root — benchmark results are readable without running code (PERF-02 requirement)"
  - "pnpm bench script added to root package.json for easy discovery and reproduction"
  - "Environment documented: Node v25.3.0, Apple M4, 2026-03-01 — results are machine-specific, methodology is reproducible"

patterns-established:
  - "Benchmark results pattern: BENCHMARKS.md at repo root, committed, with methodology + environment + reproduction steps"

requirements-completed: [PERF-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 9 Plan 02: Performance Benchmarks Summary

**BENCHMARKS.md committed to repository root with ops/sec tables for all 9 benchmark cases (3 primitives x 3 libraries), environment metadata, and reproduction instructions**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T03:52:39Z
- **Completed:** 2026-03-01T03:55:10Z
- **Tasks:** 2
- **Files modified:** 2 (BENCHMARKS.md created, package.json modified)

## Accomplishments
- Built fresh /core dist, ran benchmark suite end-to-end
- Created BENCHMARKS.md (80 lines) with all 9 ops/sec result tables, environment metadata (Node v25.3.0, Apple M4, macOS, 2026-03-01), methodology, and reproduction steps
- Added `"bench": "node apps/bench/run.mjs"` to root package.json scripts
- Committed BENCHMARKS.md and package.json — `pnpm bench` works from repository root

## Results Summary (2026-03-01, Node v25.3.0, Apple M4)

**signal read+write:**
- /core: ~9.1M ops/sec
- @preact/signals-core: ~46.2M ops/sec
- solid-js: ~23.0M ops/sec

**computed re-evaluation:**
- /core: ~3.5M ops/sec
- @preact/signals-core: ~19.3M ops/sec
- solid-js: ~14.7M ops/sec

**effect re-run:**
- /core: ~3.3M ops/sec
- @preact/signals-core: ~13.2M ops/sec
- solid-js: ~22.6M ops/sec

## Task Commits

Both tasks were committed in a single atomic commit (plan specified joint commit):

1. **Task 1: Run benchmarks and write BENCHMARKS.md** - `28be842` (feat)
2. **Task 2: Add bench script to package.json** - `28be842` (feat — same commit per plan spec)

## Files Created/Modified
- `BENCHMARKS.md` - Committed benchmark results with methodology, environment, ops/sec tables for all 9 cases, and reproduction instructions
- `package.json` - Added `"bench": "node apps/bench/run.mjs"` to scripts section

## Decisions Made
- Committed BENCHMARKS.md and package.json in a single commit as specified by plan Task 2 action (single meaningful commit for both files)
- Library versions documented: @preact/signals-core 1.13.0, solid-js 1.9.11 (actual installed versions, not placeholder "1.x")
- Interpretation section added explaining why /core is slower — correctness-first design with owner tracking and DX diagnostics, not algorithmic inefficiency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PERF-01 and PERF-02 both satisfied: benchmark suite runs and results are committed
- Phase 9 complete — all 2 plans done
- Phase 10 (landing page polish) can proceed — benchmark data available if bar chart needed
- /core ops/sec baseline established for future optimization tracking

---

## Self-Check

**Files created/modified:**
- BENCHMARKS.md: exists at /Users/sn0w/Documents/dev/streem-2/BENCHMARKS.md
- package.json: contains "bench" script
- 09-02-SUMMARY.md: this file

**Commits:**
- 28be842: feat(bench): add signal benchmark suite and committed results (PERF-01, PERF-02)

**Self-Check: PASSED**

---
*Phase: 09-performance-benchmarks*
*Completed: 2026-03-01*
