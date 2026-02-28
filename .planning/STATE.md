# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.
**Current focus:** Phase 1 - Reactive Core (COMPLETE)

## Current Position

Phase: 1 of 6 (Reactive Core) — COMPLETE
Plan: 3 of 3 in current phase (all plans complete)
Status: Phase 1 complete — ready for Phase 2
Last activity: 2026-02-28 — Completed 01-03: full Vitest test suite (40 tests) + onCleanup bug fix

Progress: [███░░░░░░░] 15%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 5min
- Total execution time: 14min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-reactive-core | 3 | 14min | 5min |

**Recent Trend:**
- Last 5 plans: 6min, 4min, 4min
- Trend: consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Drop rune/compiler approach — standard TSX + Vite; no custom transform
- Roadmap: `alien-signals ^3.1` chosen as reactive core (benchmark leader, framework-agnostic)
- Roadmap: Phase 3 (Streaming) depends only on Phase 1 — can parallelize with Phase 2 if needed
- Roadmap: Backpressure (`batch`, `throttle`, `debounce`) ships with Phase 3, not as follow-up
- Roadmap: Lit interop tests must use Vitest Browser Mode + Playwright — JSDOM will not surface Shadow DOM event retargeting failures
- 01-01: reactive.ts uses OwnerRef structural interface to avoid circular import with owner.ts; getCurrentOwner lives in owner.ts
- 01-01: createEffectNode(fn, owner) accepts owner as parameter — prevents circular dependency, makes injection explicit
- 01-01: disposeEffect exported from reactive.ts for use by Plan 01-02 signal.ts effect() wrapper
- 01-01: packages/core devDependencies use version ranges not workspace:* (workspace:* is for internal packages only)
- 01-02: signal.ts imports notifySubscribers from reactive.ts for use in setter — public wrapper never reimplements reactive graph logic
- 01-02: computed() and effect() both register onCleanup() on owner AND return manual dispose fn — dual-path disposal
- 01-02: if (import.meta.env.DEV) guards written inline, never assigned to intermediate variable — tree-shaking safe
- 01-03: onCleanup() inside effect body must register on effect.cleanupFns (per-run), not owner.cleanups (disposal-only) — required EffectCleanupRef bridge interface
- 01-03: setCurrentEffectCleanupTarget() exported from owner.ts, called by reactive.ts runEffect() — import direction owner→reactive preserved (no circular dep)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Suspense + streaming pending-state integration needs a concrete API design decision before Phase 2 starts (see research SUMMARY.md)
- Phase 3: WebSocket reconnection strategy, SSE `Last-Event-ID` recovery, and Observable interop protocol are MEDIUM confidence — consider a research phase before planning Phase 3
- Phase 4: `createLitComponent` wrapper API design and CEM tooling integration are MEDIUM confidence — may benefit from targeted research before planning Phase 4

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 01-03-PLAN.md — Phase 1 (Reactive Core) complete. All 7 requirements have passing tests. Ready for Phase 2.
Resume file: None
