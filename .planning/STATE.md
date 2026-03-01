---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Quality & Polish
status: unknown
last_updated: "2026-03-01T04:17:42Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.
**Current focus:** Phase 10 — Landing Page Polish

## Current Position

Phase: 9.1 of 10 (Optimize Signal Benchmarks — COMPLETE)
Plan: 02 (completed — 2 of 2 plans done — Phase 9.1 COMPLETE)
Status: Phase 9.1 complete — ready for Phase 10
Last activity: 2026-03-01 — 09.1-02 complete (primitive-only benchmark variants added to all 3 suites for apples-to-apples comparison with Preact)

Progress: [█████░░░░░] 50% (v1.1 — 6 of 12 plans complete)

## Performance Metrics

**Velocity (v1.0 baseline):**
- Total plans completed: 21
- Average duration: ~4 min/plan
- Total execution time: ~42 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01–06 (v1.0) | 21 | ~42min | ~2min |

**v1.1 metrics:** Not started

*Updated after each plan completion*
| Phase 07 P03 | 4 | 2 tasks | 3 files |
| Phase 07-package-quality P04 | 2 | 2 tasks | 4 files |
| Phase 07 P02 | 2 | 2 tasks | 5 files |
| Phase 07-package-quality P01 | 2 | 2 tasks | 2 files |
| Phase 08-e2e-test-coverage P01 | 65 | 2 tasks | 4 files |
| Phase 08 P02 | 12 | 2 tasks | 2 files |
| Phase 09 P01 | 3 | 2 tasks | 5 files |
| Phase 09 P02 | 3 | 2 tasks | 2 files |
| Phase 09.1 P01 | 1 | 2 tasks | 5 files |
| Phase 09.1 P02 | 2 | 2 tasks | 3 files |

## Accumulated Context

### Roadmap Evolution

- Phase 9.1 inserted after Phase 9: Optimize signal benchmarks for speed (URGENT)

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: LIT-04 type augmentation not in dist/ — Phase 7 ships the fix (LIT-01)
- v1.0: HMR state preservation, E2E CLI scaffold, and performance profiling require interactive environments — Phase 8 (E2E) and Phase 9 (benchmarks) handle these
- Roadmap: Phase 8 and Phase 9 can run in parallel once Phase 7 is complete (no cross-dependency)
- Roadmap: Phase 10 depends on both Phase 7 (style objects) and Phase 9 (benchmark data for bar chart)
- [Phase 07]: Used onError prop (Approach A) for Suspense async error propagation — cleaner, testable API vs DOM event dispatch (07-03)
- [Phase 07]: Suspense onError is optional, backward-compatible fallback to console.error — no breaking change (07-03)
- [Phase 07-04]: Fixed fromReadable bug: non-cancellation errors preserve status=error (not overwritten by status=closed)
- [Phase 07-02]: CSSProperties defined as Partial<CSSStyleDeclaration> in types.ts; exported from @streem/dom and re-exported from streem meta-package
- [Phase 07-02]: docs/STYLING.md recommends CSS Modules over CSS-in-JS — zero runtime overhead, Vite-native
- [Phase 07-01]: vite-plugin-dts rollupTypes silently drops ambient declare module blocks — use beforeWriteFile hook to append them to dist/index.d.ts
- [Phase 07-01]: LIT-01 fixed: @streem/lit dist/index.d.ts now contains full JSX module augmentation for all sl-* Shoelace elements
- [Phase 08-01]: Used background expect + filesystem polling for interactive CLI testing: clack/prompts block() keeps node alive 60s in PTY mode, so we spawn expect in background and poll for directory creation
- [Phase 08-01]: Patch streem: latest to file: path after scaffold — published streem not available in local dev; test must override dependency to local build path
- [Phase 08]: Use port 5174 for demo Vite dev server in E2E tests — port 5173 used by landing page Vite server locally
- [Phase 08]: MONOREPO_ROOT path from playwright.config.ts needs 3 levels up (../../..) not 2
- [Phase 08]: fileURLToPath must be imported from node:url, not node:path
- [Phase 09-01]: tinybench Bench instance does not expose the name constructor option — suites return { bench, name } object so runner can label tables correctly
- [Phase 09-01]: createRoot() wrapper used per iteration in @streem/core benchmarks to suppress DX-02/DX-03 owner warnings, providing production-like isolation
- [Phase 09-02]: BENCHMARKS.md committed to repo root — benchmark results are readable without running code (PERF-02 requirement)
- [Phase 09-02]: pnpm bench script added to root package.json for easy discovery and reproduction
- [Phase 09.1-02]: Primitive-only variants use public API outside createRoot — prod dist strips DEV warnings so no warning overhead
- [Phase 09.1-02]: effect() primitive-only uses manual stop() dispose matching Preact's cleanup() return pattern for structurally identical comparison
- [Phase 09.1-02]: Relabeled existing @streem/core variants to '(with createRoot)' — contrast with '(primitive only)' makes scope explicit

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-01T04:17:42Z
Stopped at: Completed 09.1-02-PLAN.md (primitive-only benchmark variants added to signal/computed/effect suites — Phase 9.1 COMPLETE)
Resume file: None
