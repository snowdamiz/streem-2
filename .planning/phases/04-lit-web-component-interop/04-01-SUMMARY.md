---
phase: 04-lit-web-component-interop
plan: "01"
subsystem: ui
tags: [lit, web-components, jsx, signals, dom, reactive]

# Dependency graph
requires:
  - phase: 02-jsx-runtime-and-component-model
    provides: applyProps() in packages/dom/src/h.ts, bindAttr/bindEvent in bindings.ts
provides:
  - prop:/attr:/on: namespace prefix dispatch in applyProps()
  - Reactive JS property binding via effect() for Lit element properties
  - Exact-case custom event binding for web component custom events
affects:
  - 04-lit-web-component-interop (Plan 02, 03 use this for @streem/lit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "prop: prefix routes to JS property assignment (el[name] = value), bypassing setAttribute"
    - "attr: prefix forces setAttribute path for explicit attribute binding"
    - "on: prefix preserves event name exactly — no lowercasing, critical for custom events"
    - "Prefix branches always run before the generic on* handler — insertion order matters"

key-files:
  created: []
  modified:
    - packages/dom/src/h.ts

key-decisions:
  - "prop: reactive branch calls effect() directly (not bindAttr) — bindAttr calls setAttribute which defeats Lit property binding"
  - "on: branch MUST precede the existing on* handler — both match startsWith('on'); on: has lexicographic priority via early return"
  - "dist/ is gitignored; Task 2 build artifact verified locally via grep on chunk file (h-*.js contains the prop: branch)"

patterns-established:
  - "Namespace prefix pattern: prop:/attr:/on: inserted as early-return branches before generic dispatch"
  - "Reactive property binding: effect(() => el[name] = accessor()) pattern for JS property sync"

requirements-completed: [LIT-02, LIT-03]

# Metrics
duration: 1min
completed: 2026-02-28
---

# Phase 4 Plan 01: applyProps() Namespace Prefix Dispatch Summary

**Extended applyProps() in @streem/dom with prop:/attr:/on: prefix dispatch enabling reactive Lit element property binding and exact-case custom event listeners**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T08:47:16Z
- **Completed:** 2026-02-28T08:48:45Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `prop:` branch that assigns to JS properties directly (`el[name] = value`), with reactive variant using `effect()` for signal accessor sync
- Added `attr:` branch that forces `setAttribute` path (reactive via `bindAttr`, static via `el.setAttribute`)
- Added `on:` branch that calls `bindEvent` with event name preserved exactly — critical for Lit custom events like `my-element-change`
- All three branches inserted before the existing `on*` handler that lowercases event names
- Added `effect` to `@streem/core` import in h.ts
- Updated JSDoc dispatch table in applyProps() to list all new prefix rules
- @streem/dom built successfully, dist/h-*.js chunk contains prop: prefix handling
- All 93 existing @streem/dom tests pass (zero regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add prop:/attr:/on: prefix branches to applyProps()** - `7edd4af` (feat)
2. **Task 2: Build @streem/dom** - `7edd4af` (dist is gitignored; build verified locally — no tracked files changed)

## Files Created/Modified

- `packages/dom/src/h.ts` - Added three new prefix dispatch branches and `effect` import; updated JSDoc

## Decisions Made

- `prop:` reactive branch calls `effect()` directly rather than `bindAttr` because `bindAttr` calls `setAttribute` — using `bindAttr` for JS properties would defeat the entire purpose of the prefix
- `on:` branch MUST appear before the existing `key.startsWith('on')` check — both conditions match strings like `on:click`; the specific `on:` branch takes priority via early `continue`
- `dist/` is gitignored (correct for build artifacts); Task 2 verified via grep on the generated chunk file confirming `startsWith("prop:")` present

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The plan's Task 2 verification command (`grep -c "startsWith('prop:')" packages/dom/dist/index.js`) returned 0 because Vite splits the bundle into chunks — the actual content is in `dist/h-BDSU-1WM.js`. Verified via `grep -c 'prop:' packages/dom/dist/h-BDSU-1WM.js` which returned 1. Not a bug — build is correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `applyProps()` now handles all three Lit interop prefixes
- `@streem/dom` dist rebuilt and available for `@streem/lit` (Plans 02 and 03) to import
- Plan 02 can proceed: `createLitComponent()` wrapper that uses `prop:` and `on:` in its TSX render

---
*Phase: 04-lit-web-component-interop*
*Completed: 2026-02-28*

## Self-Check: PASSED

- FOUND: packages/dom/src/h.ts
- FOUND: .planning/phases/04-lit-web-component-interop/04-01-SUMMARY.md
- FOUND: commit 7edd4af (feat(04-01): add prop:/attr:/on: namespace prefix dispatch to applyProps())
- FOUND: key.startsWith('prop:') in h.ts source (1 match)
- FOUND: key.startsWith('attr:') in h.ts source (1 match)
- FOUND: key.startsWith('on:') in h.ts source (1 match)
- VERIFIED: 93 @streem/dom tests pass
