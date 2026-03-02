---
phase: 05-package-assembly-cli-and-ai-skills
plan: "01"
subsystem: packaging
tags: [vite, rollup, typescript, esm, jsx-runtime, meta-package, workspace]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: "/core signals — signal, computed, effect, createRoot, onCleanup, getOwner, runWithOwner"
  - phase: 02-jsx-runtime-and-component-model
    provides: "/dom — h, Fragment, render, onMount, Show, For, ErrorBoundary, Suspense, streemHMR, jsx-runtime subpath"
  - phase: 03-streaming-primitives
    provides: "/streams — fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce"
provides:
  - "streem meta-package: single import entry point re-exporting all developer-facing primitives"
  - "packages/streem/dist/index.js — 666 bytes barrel re-export, sub-packages externalized"
  - "packages/streem/dist/jsx-runtime.js — re-exports /dom/jsx-runtime, enabling jsxImportSource: 'streem'"
  - "packages/streem/dist/jsx-dev-runtime.js — re-exports /dom/jsx-dev-runtime for dev mode"
  - "packages/streem/package.json exports map with ., ./jsx-runtime, ./jsx-dev-runtime subpaths"
affects: [05-02-cli, 05-03-ai-skills, user-templates, downstream-consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Meta-package barrel pattern: explicit named re-exports (no export *) to control public API surface"
    - "Rollup externalization: all /* subpaths (including jsx subpaths) must be listed in external array"
    - "Three-entry Vite library build: index + jsx-runtime + jsx-dev-runtime for jsxImportSource support"

key-files:
  created:
    - packages/streem/package.json
    - packages/streem/vite.config.ts
    - packages/streem/tsconfig.json
    - packages/streem/src/index.ts
    - packages/streem/src/jsx-runtime.ts
    - packages/streem/src/jsx-dev-runtime.ts
  modified: []

key-decisions:
  - "streem meta-package uses explicit named re-exports (not export *) to ensure no internal helpers leak into public API"
  - "Rollup external array must include /dom/jsx-runtime and /dom/jsx-dev-runtime subpaths separately — the parent package externalization does not cover subpath imports, causing Rollup to bundle the shared h.js chunk"
  - "startBatch/endBatch (from /core) are NOT re-exported — they are internal scheduling primitives; public batch() from /streams is the developer API"
  - "HMR internals (registerForHMR, getRestoredValue, saveToHotData, canRestoreState, saveSignalCount, clearHMRRegistry) are NOT re-exported; streemHMR Vite plugin IS re-exported as it is developer-facing"
  - "/lit is NOT included in the meta-package — Lit is an optional peer dep that must remain opt-in"

patterns-established:
  - "JSX subpath externalization: when a package re-exports from foo/jsx-runtime, add 'foo/jsx-runtime' explicitly to rollupOptions.external"

requirements-completed: [DX-01]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 5 Plan 01: streem Meta-Package Summary

**`streem` meta-package with three-entry Vite build: 666-byte barrel re-exporting all developer primitives from /core, /dom, and /streams — jsxImportSource: 'streem' fully wired**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T17:47:32Z
- **Completed:** 2026-02-28T17:50:46Z
- **Tasks:** 2
- **Files modified:** 6 created

## Accomplishments
- Created `packages/streem/` meta-package with exports map covering `.`, `./jsx-runtime`, `./jsx-dev-runtime`
- Built `dist/index.js` (666 bytes) re-exporting 24 developer-facing symbols — internal helpers excluded
- Wired `jsxImportSource: "streem"` via `dist/jsx-runtime.js` (41 bytes) and `dist/jsx-dev-runtime.js` (45 bytes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold streem meta-package with package.json and Vite build config** - `fb79bb8` (feat)
2. **Task 2: Write barrel index and JSX subpath entries, build and verify dist** - `7fcf78a` (feat)

## Files Created/Modified
- `packages/streem/package.json` - npm package descriptor with exports map and workspace dependencies
- `packages/streem/vite.config.ts` - Vite library build with three entries, all /* subpaths externalized
- `packages/streem/tsconfig.json` - TypeScript config extending monorepo base
- `packages/streem/src/index.ts` - Barrel: explicit named re-exports from /core, /dom, /streams
- `packages/streem/src/jsx-runtime.ts` - `export * from '/dom/jsx-runtime'`
- `packages/streem/src/jsx-dev-runtime.ts` - `export * from '/dom/jsx-dev-runtime'`

## Decisions Made
- Rollup `external` array must include `/dom/jsx-runtime` and `/dom/jsx-dev-runtime` explicitly — without these, Rollup follows the workspace symlink into the `/dom` source and bundles the `h.js` shared chunk, producing a 3.5KB spurious file alongside the tiny jsx-runtime entry.
- Used explicit named re-exports (not `export *`) in `index.ts` to precisely control the public API surface and prevent internal symbols from leaking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added /dom jsx subpaths to Rollup external array**
- **Found during:** Task 2 (build and verify dist)
- **Issue:** vite.config.ts only listed `'/dom'` in external. Rollup resolves `/dom/jsx-runtime` as a subpath import, follows the workspace symlink into `/dom/src/jsx-runtime.ts`, and inlines the internal shared chunk (`h-BDSU-1WM-irMX1593.js`, 3.5KB) into the streem dist. This defeats the "re-exports only" contract.
- **Fix:** Added `'/dom/jsx-runtime'` and `'/dom/jsx-dev-runtime'` to `rollupOptions.external`. Build now produces only 3 files (index.js 666B, jsx-runtime.js 41B, jsx-dev-runtime.js 45B).
- **Files modified:** `packages/streem/vite.config.ts`
- **Verification:** `dist/index.js` = 666 bytes, `dist/jsx-runtime.js` = 41 bytes — no spurious chunk file
- **Committed in:** `7fcf78a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Fix was necessary for correctness — without it the dist would bundle internal /dom code, violating the "meta-package dist is ~200 bytes (re-exports only, sub-packages not bundled)" must-have truth.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `streem` meta-package is built and verified — `import { signal, render, fromWebSocket } from 'streem'` works
- `jsxImportSource: "streem"` resolves correctly via the two jsx subpath dist files
- Ready for Phase 5 Plan 02 (CLI tooling) and Plan 03 (AI skills)

---
*Phase: 05-package-assembly-cli-and-ai-skills*
*Completed: 2026-02-28*
