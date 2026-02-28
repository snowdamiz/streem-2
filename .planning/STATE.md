---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-28T07:58:30Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 12
  completed_plans: 11
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.
**Current focus:** Phase 3 - Streaming Primitives — IN PROGRESS (3 of 4 plans done)

## Current Position

Phase: 3 of 6 (Streaming Primitives) — IN PROGRESS
Plan: 3 of 4 in current phase (03-01, 03-02, 03-03 complete)
Status: 03-03 complete — fromReadable() + fromObservable() adapters — 32 tests passing (9 WS + 11 SSE + 5 readable + 7 observable)
Last activity: 2026-02-28 — Completed 03-03: ReadableStream adapter (getReader() + async loop) and Subscribable<T> structural adapter (no RxJS dep), 12 new tests

Progress: [█████████░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 4min
- Total execution time: 38min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-reactive-core | 3 | 14min | 5min |
| 02-jsx-runtime-and-component-model | 5/5 | 25min | 5min |
| 03-streaming-primitives | 3/4 | 14min | 5min |

**Recent Trend:**
- Last 5 plans: 7min, 5min, 6min, 3min, 9min
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
- 02-01: tsconfig.json for @streem/dom omits explicit rootDir — tests/ alongside src/ requires TypeScript to infer rootDir (mirrors @streem/core pattern, avoids TS6059)
- 02-01: @streem/core in dependencies (not devDependencies) for @streem/dom — it is a runtime import consumed by h() and render()
- 02-01: applyProps() in Plan 02-01 handles static attributes only — reactive binding dispatch deferred to Plan 02-02 as specified in plan
- 02-01: jsx-dev-runtime re-exports production runtime in Phase 2 — source location enrichment deferred to Phase 5
- 02-02: Signal write API is .set(value) not callable setter — confirmed from signal.ts source; tests must use signal.set()
- 02-02: MutationObserver in happy-dom is async — structural node identity check (same Text reference, correct nodeValue) is the correct surgical update verification in happy-dom
- 02-02: bindEvent uses onCleanup() directly (not effect()) — event handlers are intentionally non-reactive per CONTEXT.md locked decision
- [Phase 02-03]: onMount implemented without effect() wrapper — direct fn() call avoids reactive tracking; onCleanup() registers cleanup on owner
- [Phase 02-03]: Show/For return DocumentFragment instead of Comment anchor — fragment-first DOM insertion pattern required for initial render timing
- [Phase 02-03]: Show children accepts render function () => Node for createRoot scope isolation per shown state
- [Phase 02-04]: ErrorBoundary uses simple synchronous try/catch (not anchor-based) — returns child/fallback Node directly; in-place DOM swap deferred to Phase 3
- [Phase 02-04]: Suspense uses queueMicrotask for initial render — anchor-based; required for async DOM swap on Promise resolve
- [Phase 02-04]: Non-Promise error re-throw from Suspense is async (microtask) in Phase 2 — synchronous propagation to parent ErrorBoundary is Phase 3 scope
- [Phase 02-04]: Phase 2 rejection policy: console.error for rejected Promises in Suspense; full async ErrorBoundary propagation awaits createResource protocol in Phase 3
- [Phase 02-04]: ErrorBoundary MUST check instanceof Promise before error catch — critical invariant for ErrorBoundary > Suspense > children nesting
- [Phase 02-05]: JSX namespace declared inline in jsx-runtime.ts (not re-exported from types.ts) — vite-plugin-dts rollupTypes silently strips re-exported namespace members
- [Phase 02-05]: IntrinsicElements.children typed as unknown to accept reactive accessor arrays from mixed JSX children (e.g. [string, () => number])
- [Phase 02-05]: ForProps.children return type widened to Node | Node[] | null | undefined to match JSX.Element (nullable)
- [Phase 02-05]: HMR dispose pattern: mutate import.meta.hot.data properties — never re-assign the data object itself
- [Phase 03-01]: vitest-websocket-mock version fixed to ^0.5.0 (plan specified ^2.0.0 which doesn't exist on npm)
- [Phase 03-01]: maxRetries exhaustion test uses maxRetries:0 — fake timers incompatible with vitest-websocket-mock 0.5.0 Promise-based server.connected API
- [Phase 03-01]: happy-dom environment required for @streem/streams vitest — node env lacks WebSocket global pre-Node 22, mock-socket patching fails silently
- [Phase 03-01]: Adapter pattern established: onCleanup() registered BEFORE connect(); all stream adapters follow this cleanup-first invariant
- [Phase 03-streaming-primitives]: MockEventSource over MSW sse() + eventsource v4 — eventsource v4 fetch not intercepted by MSW FetchInterceptor in happy-dom vitest environment due to CORS streaming; MockEventSource extends EventTarget gives synchronous behavioral coverage
- [Phase 03-streaming-primitives]: [Phase 03-02]: Named SSE events share handleMessage handler — options.events[] each addEventListener with same function, all route to same data signal
- [Phase 03-03]: reader.cancel().catch(() => {}) required — cancel() may itself reject if stream already closed; naked await would bubble unhandled
- [Phase 03-03]: Cancellation error suppression checks err.name=AbortError AND message contains cancel/cancelled/canceled — environment-neutral detection
- [Phase 03-03]: Subscribable<T> defined once in types.ts — from-observable.ts imports, does not re-declare; single source of truth
- [Phase 03-03]: status='connecting' initialized before source.subscribe() — synchronous observables emit next() during subscribe(), setting 'connected' immediately; correct behavior

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3: WebSocket reconnection strategy, SSE `Last-Event-ID` recovery, and Observable interop protocol are MEDIUM confidence — consider a research phase before planning Phase 3
- Phase 3: createResource API design decision needed before Phase 3 planning (Suspense integration protocol defined; implementation awaits)
- Phase 4: `createLitComponent` wrapper API design and CEM tooling integration are MEDIUM confidence — may benefit from targeted research before planning Phase 4

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 03-03-PLAN.md — fromReadable() + fromObservable() adapters. 32 tests passing across all four adapters.
Resume file: None
