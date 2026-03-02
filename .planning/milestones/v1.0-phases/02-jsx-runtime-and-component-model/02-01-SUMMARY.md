---
phase: 02-jsx-runtime-and-component-model
plan: "01"
subsystem: ui
tags: [jsx, tsx, dom, happy-dom, vitest, vite, typescript]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: createRoot, onCleanup, signal, effect — used by h() for component scope and event cleanup

provides:
  - "/dom package with ./jsx-runtime and ./jsx-dev-runtime exports for jsxImportSource resolution"
  - "h() DOM factory: creates real DOM elements, runs function components once in createRoot scope"
  - "Fragment symbol for JSX <> </> syntax"
  - "render() entry point: mounts component tree into DOM container, returns dispose"
  - "JSX namespace types: IntrinsicElements, Element, ElementChildrenAttribute for TypeScript IntelliSense"
  - "applyProps() with static prop/attribute application and event listener registration with cleanup"

affects:
  - 02-02-reactive-dom-bindings
  - 02-03-component-primitives
  - 02-04-builtin-components
  - 02-05-vite-hmr

# Tech tracking
tech-stack:
  added:
    - happy-dom ^14.0.0 (DOM environment for Vitest tests)
    - vite-plugin-dts ^4.0.0 (TypeScript declaration generation for library build)
  patterns:
    - "jsxImportSource: /dom in tsconfig to route TSX compilation through package's own jsx-runtime"
    - "Three-entry Vite lib build: index, jsx-runtime, jsx-dev-runtime as separate ES module outputs"
    - "Function components run exactly once inside createRoot() — no re-render, reactivity via effect()"
    - "h() as unified factory: html elements, function components, and Fragment all handled in single fn"

key-files:
  created:
    - packages/dom/package.json
    - packages/dom/tsconfig.json
    - packages/dom/vite.config.ts
    - packages/dom/vitest.config.ts
    - packages/dom/src/types.ts
    - packages/dom/src/h.ts
    - packages/dom/src/render.ts
    - packages/dom/src/jsx-runtime.ts
    - packages/dom/src/jsx-dev-runtime.ts
    - packages/dom/src/index.ts
    - packages/dom/tests/scaffold.test.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Remove explicit rootDir from tsconfig.json: tests/ alongside src/ requires TypeScript to infer rootDir rather than constrain it — mirrors /core pattern"
  - "/core placed in dependencies (not devDependencies) in package.json since it is a runtime workspace package consumed by h() and render()"
  - "applyProps() in Plan 02-01 handles static attributes only — reactive binding dispatch deferred to Plan 02-02 as specified"
  - "jsx-dev-runtime re-exports production runtime in Phase 2 — source location enrichment deferred to Phase 5"

patterns-established:
  - "Pattern: workspace packages in dependencies, external tooling in devDependencies"
  - "Pattern: tsconfig include=[src, tests] without explicit rootDir — avoids TS6059 error"
  - "Pattern: onCleanup(dispose) inside createRoot to wire component disposal to parent owner"

requirements-completed: [JSX-01, COMP-01]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 2 Plan 01: JSX Runtime and Component Model Scaffold Summary

**/dom package with jsx-runtime entry point, real-DOM h() factory using createRoot scope for components, render() mount function, and JSX namespace types — all verified by 5 happy-dom tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T05:20:23Z
- **Completed:** 2026-02-28T05:23:38Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Scaffolded /dom package with three package.json exports (`"."`, `"./jsx-runtime"`, `"./jsx-dev-runtime"`) so `jsxImportSource: "/dom"` resolves correctly in TypeScript
- Implemented h() factory creating real DOM nodes, running function components exactly once inside createRoot scope with onCleanup wiring, and flattening Fragment children
- Built render() that mounts a component function into a DOM container inside a root createRoot scope and returns a dispose function
- Added JSX namespace types (IntrinsicElements, ElementChildrenAttribute, IntrinsicAttributes) for TypeScript IntelliSense on TSX files
- All 5 scaffold tests pass in happy-dom environment with TypeScript compiling cleanly (tsc --noEmit exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Package scaffold** - `66f068d` (chore)
2. **Task 2: JSX runtime source files** - `53fd19d` (feat)

## Files Created/Modified

- `packages/dom/package.json` - Package metadata with three exports and workspace:* /core dep
- `packages/dom/tsconfig.json` - TypeScript config with jsx: react-jsx and jsxImportSource: /dom
- `packages/dom/vite.config.ts` - Vite lib build with three entry points and dts plugin
- `packages/dom/vitest.config.ts` - Vitest config with happy-dom environment
- `packages/dom/src/types.ts` - JSX namespace type declarations
- `packages/dom/src/h.ts` - Core DOM factory: h(), Fragment, applyProps()
- `packages/dom/src/render.ts` - render() entry point returning dispose
- `packages/dom/src/jsx-runtime.ts` - JSX runtime entry: exports jsx, jsxs, Fragment
- `packages/dom/src/jsx-dev-runtime.ts` - JSX dev runtime entry: exports jsxDEV, Fragment
- `packages/dom/src/index.ts` - Public API barrel: h, Fragment, render
- `packages/dom/tests/scaffold.test.ts` - 5 scaffold tests covering element creation, children, components, Fragment, render
- `pnpm-lock.yaml` - Updated with happy-dom and /core workspace link

## Decisions Made

- Removed `rootDir: "./src"` from tsconfig.json because including `tests/` alongside `src/` causes TS6059. TypeScript infers rootDir correctly without it, matching the /core pattern.
- `/core` placed in `dependencies` (not `devDependencies`) since it is a runtime import consumed by h() and render() in production code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed explicit rootDir from tsconfig.json**
- **Found during:** Task 2 (JSX runtime source files — tsc --noEmit verification)
- **Issue:** Plan specified `rootDir: "./src"` but tsconfig.json includes both `src` and `tests`. TypeScript error TS6059: "File is not under rootDir" because test file is outside declared rootDir.
- **Fix:** Removed the `rootDir` compiler option from packages/dom/tsconfig.json. TypeScript infers rootDir from included directories, identical to how /core is configured.
- **Files modified:** packages/dom/tsconfig.json
- **Verification:** `pnpm --filter /dom exec tsc --noEmit` exits 0; all 5 tests still pass
- **Committed in:** 53fd19d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — rootDir conflict)
**Impact on plan:** Auto-fix necessary for TypeScript compilation. No scope creep — follows established /core pattern.

## Issues Encountered

None beyond the rootDir deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /dom package structure is complete and all success criteria are met
- Plan 02-02 can add reactive binding dispatch to applyProps() by importing from a new bindings.ts
- Plan 02-03 can implement onMount() and other component lifecycle primitives
- Root vitest.config.ts glob `'packages/*/vitest.config.ts'` automatically discovers packages/dom tests

## Self-Check: PASSED

All files found:
- packages/dom/package.json: FOUND
- packages/dom/tsconfig.json: FOUND
- packages/dom/vite.config.ts: FOUND
- packages/dom/vitest.config.ts: FOUND
- packages/dom/src/types.ts: FOUND
- packages/dom/src/h.ts: FOUND
- packages/dom/src/render.ts: FOUND
- packages/dom/src/jsx-runtime.ts: FOUND
- packages/dom/src/jsx-dev-runtime.ts: FOUND
- packages/dom/src/index.ts: FOUND
- packages/dom/tests/scaffold.test.ts: FOUND

All commits found:
- 66f068d: FOUND
- 53fd19d: FOUND

---
*Phase: 02-jsx-runtime-and-component-model*
*Completed: 2026-02-28*
