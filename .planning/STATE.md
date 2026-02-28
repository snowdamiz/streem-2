---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-02-28T17:49:00.000Z"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 18
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.
**Current focus:** Phase 5 - Package Assembly, CLI, and AI Skills — In Progress (1 of 3 plans done: 05-02)

## Current Position

Phase: 5 of 6 (Package Assembly, CLI, and AI Skills) — IN PROGRESS
Plan: 2 of 3 in current phase (05-02 complete)
Status: 05-02 complete — create-streem CLI scaffolder with @clack/prompts + 6-file Vite+Streem template.
Last activity: 2026-02-28 — Completed 05-02: create-streem package, CLI entry, template files

Progress: [██████████████░░] 88% (16 of 18 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 4min
- Total execution time: 42min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-reactive-core | 3 | 14min | 5min |
| 02-jsx-runtime-and-component-model | 5/5 | 25min | 5min |
| 03-streaming-primitives | 4/4 | 18min | 5min |
| 04-lit-web-component-interop | 3/3 | 16min | 5min |

**Recent Trend:**
- Last 5 plans: 6min, 3min, 9min, 4min, 1min
- Trend: consistent

*Updated after each plan completion*
| Phase 04-lit-web-component-interop P03 | 13 | 2 tasks | 8 files |
| Phase 05-package-assembly-cli-and-ai-skills P02 | 102s | 2 tasks | 10 files |

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
- [Phase 03-04]: startBatch/endBatch exported from @streem/core/src/index.ts — were implemented as Phase 3 extension points in reactive.ts; plan 03-04 opens the export gate
- [Phase 03-04]: batch() uses try/finally to guarantee endBatch() always called even when fn() throws — error propagation safe
- [Phase 03-04]: throttle() and debounce() must be called inside a reactive scope (createRoot/component body) — same ownership invariant as effect(), documented in JSDoc
- [Phase 04]: prop: reactive branch calls effect() directly (not bindAttr) — bindAttr calls setAttribute which defeats Lit property binding
- [Phase 04]: on: branch must precede existing on* handler — both match startsWith('on'); on: has priority via early return
- [Phase 04-02]: Lit is devDependency only — zero Lit runtime in @streem/lit dist; peerDependencies are @streem/core and @streem/dom
- [Phase 04-02]: declare module target is '@streem/dom/jsx-runtime' not '@streem/dom' — must match TypeScript's jsxImportSource subpath resolution exactly
- [Phase 04-02]: observeLitProp uses camelCase→kebab-case + '-changed' as default event name; optional event override for non-standard dispatch
- [Phase 04-02]: bindLitProp uses el[propName] = value (not setAttribute) — property assignment preserves array/object/boolean type fidelity
- [Phase 04-03]: Lit static properties with constructor init (not class field initializers) avoids class-field-shadowing in Vitest browser mode
- [Phase 04-03]: @vitest/browser must be installed separately from @vitest/browser-playwright for browser mode transformation pipeline to work
- [Phase 04-03]: generateJsxTypes() from @wc-toolkit/jsx-types returns string and writes to disk when outdir+fileName provided; post-process to add declare module wrapper
- [Phase 05-02]: Template package.json uses "streem": "latest" (not workspace:*) — prevents install failures outside monorepo
- [Phase 05-02]: Template tsconfig.json is standalone (no extends) — user projects won't have tsconfig.base.json from the monorepo
- [Phase 05-02]: Template jsxImportSource is "streem" (meta-package) not "@streem/dom" — consistent with published API surface

### Pending Todos

None yet.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 05-02-PLAN.md — create-streem CLI scaffolder with @clack/prompts, 6-file Vite+Streem template (index.html, package.json, tsconfig.json, vite.config.ts, src/main.tsx, src/App.tsx). 2 tasks, 10 files.
Resume file: None
