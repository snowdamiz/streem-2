---
phase: 07-package-quality
plan: "01"
subsystem: ui
tags: [typescript, vite, vite-plugin-dts, jsx, lit, shoelace, custom-elements]

# Dependency graph
requires: []
provides:
  - "@streem/lit dist/index.d.ts includes JSX module augmentations for all sl-* custom elements"
  - "vite.config.ts beforeWriteFile hook appends ambient .d.ts to rolled-up output"
  - "TypeScript users of @streem/lit get autocomplete for sl-button, sl-badge, and all Shoelace elements"
affects:
  - "06-landing-page-dogfood (consumer of @streem/lit types)"
  - "future packages using @streem/lit"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use vite-plugin-dts beforeWriteFile hook to append ambient .d.ts declarations to rolled-up dist/index.d.ts"
    - "Triple-slash references in index.ts to make ambient .d.ts visible to TypeScript compiler"

key-files:
  created: []
  modified:
    - "packages/lit/src/index.ts"
    - "packages/lit/vite.config.ts"

key-decisions:
  - "Used vite-plugin-dts beforeWriteFile hook to append ambient declarations instead of relying on rollupTypes to auto-include them — rollupTypes (api-extractor) silently drops declare module augmentation blocks from ambient .d.ts files that are not in the module graph"
  - "Triple-slash references alone do not cause rollupTypes to include ambient .d.ts content — the beforeWriteFile approach is the correct solution for shipping module augmentations in a rolled-up dist"

patterns-established:
  - "Ambient type augmentation pattern: read ambient .d.ts files at build time in vite.config.ts and append via beforeWriteFile hook"

requirements-completed: [LIT-01]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 7 Plan 01: @streem/lit JSX Type Augmentation Fix Summary

**vite.config.ts beforeWriteFile hook appends base-custom-element-types.d.ts and lit-elements.d.ts to dist/index.d.ts, giving TypeScript users full Shoelace sl-* element autocomplete via @streem/lit**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T23:50:28Z
- **Completed:** 2026-02-28T23:52:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `dist/index.d.ts` now contains 2 `declare module '@streem/dom/jsx-runtime'` blocks covering all sl-* custom elements
- `sl-button`, `sl-badge`, and all other Shoelace element props are now type-checked (variant, size, disabled, etc.)
- Build exits 0, no TypeScript regressions in src/
- No manual triple-slash references needed in consumer code

## Task Commits

Each task was committed atomically:

1. **Task 1: Add triple-slash references and configure dts include** - `c9aec4d` (feat)
2. **Task 2: Use beforeWriteFile hook to append ambient declarations** - `55ddcae` (feat)

## Files Created/Modified
- `packages/lit/src/index.ts` - Added `/// <reference path>` directives for both ambient .d.ts files
- `packages/lit/vite.config.ts` - Added `readFileSync` imports, ambient file reads, and `beforeWriteFile` hook to append module augmentations to dist/index.d.ts

## Decisions Made
- **Triple-slash + rollupTypes was insufficient:** `rollupTypes: true` uses `@microsoft/api-extractor` which silently ignores `declare module` augmentations from ambient `.d.ts` files not reachable via the module graph. Triple-slash references in `index.ts` did not cause them to be included either.
- **beforeWriteFile hook is the correct solution:** Reading the ambient `.d.ts` files at build time and appending them to the rolled-up output via the `beforeWriteFile` hook guarantees they appear in `dist/index.d.ts` regardless of api-extractor behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Triple-slash + include approach did not include declare module blocks in rollupTypes output**
- **Found during:** Task 2 (verify dist/index.d.ts)
- **Issue:** After Task 1 changes, `grep -c "declare module '@streem/dom/jsx-runtime'" dist/index.d.ts` returned 0. `rollupTypes` (api-extractor) strips ambient `declare module` augmentations from the output.
- **Fix:** Updated `vite.config.ts` to read ambient `.d.ts` files via `readFileSync` at build time and append them to the rolled-up `index.d.ts` using the `beforeWriteFile` plugin hook.
- **Files modified:** `packages/lit/vite.config.ts`
- **Verification:** `grep -c "declare module '@streem/dom/jsx-runtime'"` returns 2, `grep -c "sl-button"` returns 8.
- **Committed in:** `55ddcae` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in initial approach)
**Impact on plan:** Required second iteration on vite.config.ts. Final outcome matches plan success criteria exactly. No scope creep.

## Issues Encountered
- `rollupTypes: true` with triple-slash references was not sufficient to include ambient `declare module` blocks — api-extractor drops them. The plan's primary strategy required an adaptation to use the `beforeWriteFile` hook, which is equivalent in outcome.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LIT-01 complete: `@streem/lit` now ships correct TypeScript types for all sl-* custom elements
- Plan 07-02 and subsequent plans can proceed independently
- Consumers of `@streem/lit` get full autocomplete without any manual type imports

---
*Phase: 07-package-quality*
*Completed: 2026-02-28*
