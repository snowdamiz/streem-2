---
phase: 02-jsx-runtime-and-component-model
plan: "05"
subsystem: ui
tags: [vite, hmr, tsx, jsx, signal, hot-reload, demo]

# Dependency graph
requires:
  - phase: 02-04
    provides: ErrorBoundary, Suspense, full component model
provides:
  - HMR signal state registry (registerForHMR, getRestoredValue, saveToHotData, canRestoreState, saveSignalCount, clearHMRRegistry)
  - streemHMR() Vite plugin using hotUpdate hook for .tsx/.jsx files
  - apps/demo/ with jsxImportSource: "/dom", signal HMR pattern, Show, For, onMount
  - Fixed JSX.IntrinsicElements in jsx-runtime.d.ts (vite-plugin-dts namespace rollup fix)
affects:
  - Phase 3 (stream adapters integrate with HMR registry when ready)
  - Phase 5 (dev tooling builds on HMR infrastructure)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - HMR signal state preservation via import.meta.hot.data (mutate properties, never re-assign)
    - clearHMRRegistry() test isolation pattern (beforeEach reset for module-level Map)
    - JSX namespace declared inline in jsx-runtime.ts (not re-exported) to survive vite-plugin-dts rollupTypes

key-files:
  created:
    - packages/dom/src/hmr.ts
    - packages/dom/src/hmr-plugin.ts
    - packages/dom/tests/hmr.test.ts
    - apps/demo/package.json
    - apps/demo/tsconfig.json
    - apps/demo/vite.config.ts
    - apps/demo/index.html
    - apps/demo/src/main.tsx
    - apps/demo/src/App.tsx
  modified:
    - packages/dom/src/index.ts
    - packages/dom/src/jsx-runtime.ts
    - packages/dom/src/components.ts

key-decisions:
  - "JSX namespace declared inline in jsx-runtime.ts source (not re-exported from types.ts) — vite-plugin-dts rollupTypes silently drops re-exported namespace members"
  - "IntrinsicElements.children typed as unknown to accept reactive accessor arrays like [string, () => number] from mixed JSX children"
  - "ForProps.children return type widened to Node | Node[] | null | undefined to match JSX.Element (which includes null/undefined)"
  - "Signal write API uses count.set(value) not count(value) — Signal<T> interface has .set() method, not callable setter"

patterns-established:
  - "HMR dispose pattern: import.meta.hot.dispose((data) => { data.key = signal() }) — mutate properties only"
  - "HMR accept pattern: import.meta.hot.accept() after dispose registration"
  - "clearHMRRegistry() in test beforeEach — required for module-level Map isolation"
  - "streemHMR() plugin uses hotUpdate hook (not deprecated handleHotUpdate)"

requirements-completed:
  - JSX-03

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 2 Plan 05: HMR Integration and Demo App Summary

**Vite HMR signal state preservation via import.meta.hot.data registry, streemHMR() plugin, and apps/demo proving the full Phase 2 JSX stack with reactive DOM and hot-reload**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T05:50:35Z
- **Completed:** 2026-02-28T05:56:30Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- HMR runtime registry (hmr.ts) with 6 exports: registerForHMR, getRestoredValue, saveToHotData, canRestoreState, saveSignalCount, clearHMRRegistry — unit-tested with 9 tests using beforeEach isolation
- streemHMR() Vite plugin using the Vite 6+/7 hotUpdate hook (not deprecated handleHotUpdate) to propagate HMR for .tsx/.jsx component files
- apps/demo app proving jsxImportSource: "/dom" compiles TSX, signal-driven reactive DOM works, and HMR save/restore pattern is usable end-to-end
- Fixed vite-plugin-dts rollupTypes bug that silently dropped JSX.IntrinsicElements from jsx-runtime.d.ts by inlining the namespace declaration

## Task Commits

Each task was committed atomically:

1. **Task 1: HMR runtime registry and Vite plugin** - `722479c` (feat)
2. **Task 2: Demo app with jsxImportSource, signal HMR, Show, For** - `1bdab10` (feat)

**Plan metadata:** (docs commit hash recorded after state update)

## Files Created/Modified

- `packages/dom/src/hmr.ts` - HMR state registry with 6 exported functions
- `packages/dom/src/hmr-plugin.ts` - streemHMR() Vite plugin using hotUpdate hook
- `packages/dom/src/index.ts` - Added HMR and plugin exports
- `packages/dom/src/jsx-runtime.ts` - Inlined JSX namespace (fixed vite-plugin-dts rollup issue); widened children type
- `packages/dom/src/components.ts` - Widened ForProps.children return type to accept JSX.Element
- `packages/dom/tests/hmr.test.ts` - 9 unit tests for HMR registry functions
- `apps/demo/package.json` - /demo workspace app
- `apps/demo/tsconfig.json` - jsxImportSource: "/dom", jsx: react-jsx
- `apps/demo/vite.config.ts` - plugins: [streemHMR()]
- `apps/demo/index.html` - Entry HTML with #app mount point
- `apps/demo/src/main.tsx` - render() call wiring App into DOM
- `apps/demo/src/App.tsx` - Demo with signal, Show, For, onMount, HMR dispose/accept

## Decisions Made

- **JSX namespace inlining:** vite-plugin-dts with rollupTypes silently strips re-exported namespace members (`export type { JSX } from './types.js'` produces empty `JSX {}` in dist). Fixed by declaring the namespace inline in jsx-runtime.ts source so rollup sees it directly.
- **children: unknown in IntrinsicElements:** TypeScript checks inline JSX children as an array against the `children` prop type. Mixed reactive children like `["Count: ", () => count()]` form `(string | (() => number))[]` which can't be assigned to typed Element unions. Using `unknown` accommodates Streem's reactive child pattern.
- **ForProps.children nullable return:** JSX elements can return `null | undefined` (JSX.Element type includes them). ForProps.children return type widened from `Node | Node[]` to `Node | Node[] | null | undefined` to allow `(item) => <li>{item.name}</li>` without TypeScript errors.
- **Signal write API:** The Signal<T> interface exposes `.set(value)` not a callable setter. App.tsx uses `count.set(count() + 1)` per the established pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vite-plugin-dts rollupTypes silently dropping JSX namespace**
- **Found during:** Task 2 (demo app TypeScript compilation)
- **Issue:** `export type { JSX } from './types.js'` in jsx-runtime.ts caused vite-plugin-dts to produce `export declare namespace JSX {}` (empty) in dist/jsx-runtime.d.ts, breaking TypeScript JSX type checking in all consumers
- **Fix:** Inlined the full JSX namespace declaration directly in jsx-runtime.ts so rollup sees it as a local declaration
- **Files modified:** packages/dom/src/jsx-runtime.ts
- **Verification:** dist/jsx-runtime.d.ts now contains full IntrinsicElements interface; tsc --noEmit passes on apps/demo
- **Committed in:** 1bdab10 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed App.tsx using wrong signal write API**
- **Found during:** Task 2 (adapting plan template to actual Signal<T> interface)
- **Issue:** Plan template used `count(count() + 1)` (callable setter) but Signal<T> uses `count.set(value)` method
- **Fix:** Updated App.tsx to use `count.set(count() + 1)` per the Signal interface established in Phase 1
- **Files modified:** apps/demo/src/App.tsx
- **Verification:** TypeScript check passes; matches /core Signal<T> interface
- **Committed in:** 1bdab10 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed IntrinsicElements children type too narrow for reactive JSX**
- **Found during:** Task 2 (TypeScript errors in demo app)
- **Issue:** IntrinsicElements.children typed as `Element | Element[]` which doesn't accept `(string | (() => number))[]` from `<p>Count: {() => count()}</p>`
- **Fix:** Widened children to `unknown` to accommodate Streem's reactive accessor child pattern
- **Files modified:** packages/dom/src/jsx-runtime.ts
- **Verification:** `{() => count()}` inline JSX children compile without errors
- **Committed in:** 1bdab10 (Task 2 commit)

**4. [Rule 1 - Bug] Fixed ForProps.children return type to accept JSX.Element**
- **Found during:** Task 2 (TypeScript error TS2322 at For usage in App.tsx)
- **Issue:** ForProps.children typed as `(item: T, index: () => number) => Node | Node[]` but `(item) => <li>...</li>` returns JSX.Element which includes `null | undefined`
- **Fix:** Widened return type to `Node | Node[] | null | undefined`
- **Files modified:** packages/dom/src/components.ts
- **Verification:** For component usage in App.tsx compiles correctly
- **Committed in:** 1bdab10 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (4 bugs — all pre-existing issues surfaced by the demo app's TypeScript compilation requirement)
**Impact on plan:** All fixes necessary for correctness. The signal write API fix and JSX type fixes were required for the demo to compile. No scope creep.

## Issues Encountered

- The plan template for App.tsx used `count(count() + 1)` (callable signal setter) which doesn't match the actual Signal<T> API from /core which uses `.set()`. Fixed in implementation.
- vite-plugin-dts rollupTypes strips re-exported TypeScript namespaces — a known limitation discovered when fixing the JSX type chain.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: all 5 plans executed, 131 tests passing, full JSX component model with HMR
- Phase 3 (Streaming) can integrate stream connection state with the HMR registry (registerForHMR pattern is ready)
- apps/demo provides a working integration test environment for Phase 3 stream adapters

---
*Phase: 02-jsx-runtime-and-component-model*
*Completed: 2026-02-28*

## Self-Check: PASSED

All created files confirmed present on disk. All commits confirmed in git history.

- packages/dom/src/hmr.ts: FOUND
- packages/dom/src/hmr-plugin.ts: FOUND
- packages/dom/tests/hmr.test.ts: FOUND
- apps/demo/src/App.tsx: FOUND
- Commit 722479c (Task 1): FOUND
- Commit 1bdab10 (Task 2): FOUND
- Commit 59449fc (docs): FOUND
