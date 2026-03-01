---
phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api
plan: "01"
subsystem: ui
tags: [dom, jsx, css, classnames, styles, typescript]

# Dependency graph
requires:
  - phase: 07-package-quality
    provides: CSSProperties type in types.ts and @streem/dom exports
provides:
  - ClassValue type (string | false | null | undefined | Record<string, boolean> | ClassValue[])
  - bindClass() updated to accept and resolve ClassValue (clsx-compatible)
  - resolveClassValue() exported helper for static class resolution
  - bindStyle() with prev/next key diffing and removeProperty for stale styles
  - applyProps() handling className alias, new ClassValue dispatch, classList removed
  - ClassValue exported from @streem/dom
affects:
  - 11-02 (test updates — ClassValue behavior, bindStyle diff, className alias)
  - 11-03 (CSS Modules — uses updated class API)
  - apps/landing (dogfood of className/ClassValue API)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ClassValue recursive type for clsx-compatible class prop values
    - resolveClassValue() pure helper converts ClassValue tree to space-separated string
    - bindStyle prev-key tracking for reactive style object diffing

key-files:
  created: []
  modified:
    - packages/dom/src/types.ts
    - packages/dom/src/bindings.ts
    - packages/dom/src/h.ts
    - packages/dom/src/index.ts
    - packages/dom/tests/bindings.test.ts

key-decisions:
  - "resolveClassValue exported from bindings.ts so h.ts can use it for static ClassValue resolution without duplicating logic"
  - "bindClassList removed entirely — clean break, no deprecation; classList prop removed from JSX types"
  - "bindStyle prevKeys tracks camelCase keys; removeProperty converts to kebab-case via replace(/([A-Z])/g, '-$1').toLowerCase()"
  - "className and class handled identically in applyProps — no preference expressed"

patterns-established:
  - "ClassValue: recursive union type matching clsx signature — import from @streem/dom"
  - "resolveClassValue: pure function, call for both reactive (inside bindClass effect) and static (applyProps direct setAttribute) paths"

requirements-completed: [STYLES-DX-01, STYLES-DX-02, STYLES-DX-03, STYLES-DX-04]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 11 Plan 01: Improve Styles DX — ClassValue API and bindStyle Diff Summary

**React-like ClassValue type (string/array/object/mixed) for class/className props, plus bindStyle stale-property diffing via el.style.removeProperty()**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T06:57:19Z
- **Completed:** 2026-03-01T06:59:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added recursive `ClassValue` type exported from `@streem/dom` — accepts strings, arrays, objects, and mixed nested arrays (clsx-compatible)
- Updated `bindClass()` and added `resolveClassValue()` helper so any ClassValue shape resolves to a space-separated class string reactively or statically
- Fixed `bindStyle()` to diff previous/next style keys and call `el.style.removeProperty()` for removed properties — eliminating stale inline styles bug
- Added `className` as first-class alias for `class` in `applyProps()`, removed `classList` handling entirely
- All 95 existing `@streem/dom` tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Define ClassValue type and update JSX types** - `eb8934b` (feat)
2. **Task 2: Update bindClass for ClassValue, fix bindStyle diff, remove bindClassList** - `b49e7fb` (feat)
3. **Task 3: Update applyProps for className alias and ClassValue dispatch** - `b3988c2` (feat)

## Files Created/Modified

- `packages/dom/src/types.ts` - Added ClassValue recursive type; className in JSX.IntrinsicElements; classList removed
- `packages/dom/src/bindings.ts` - resolveClassValue() helper exported; bindClass accepts () => ClassValue; bindStyle diffs prev/next keys with removeProperty; bindClassList deleted
- `packages/dom/src/h.ts` - applyProps handles 'class'|'className' identically with ClassValue; classList block removed
- `packages/dom/src/index.ts` - ClassValue added to type export
- `packages/dom/tests/bindings.test.ts` - Removed bindClassList import and tests; removed classList test in applyProps (Rule 3 auto-fix)

## Decisions Made

- Exported `resolveClassValue` from bindings.ts (not kept private) so `applyProps` in h.ts can use it for static value path without duplicating logic
- `bindClassList` deleted with no deprecation — per phase 11 context decision (clean break)
- `bindStyle` uses camelCase-to-kebab-case conversion (`key.replace(/([A-Z])/g, '-$1').toLowerCase()`) in `removeProperty()` since CSSStyleDeclaration keys are camelCase but `removeProperty()` requires kebab-case

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed bindClassList from test file imports**
- **Found during:** Task 3 (build/tsc --noEmit verification)
- **Issue:** `tests/bindings.test.ts` imported `bindClassList` which was deleted in Task 2, causing TypeScript compilation error (TS2724)
- **Fix:** Removed `bindClassList` import, deleted `describe('bindClassList', ...)` block, removed `classList accessor routes to bindClassList` test from applyProps suite
- **Files modified:** `packages/dom/tests/bindings.test.ts`
- **Verification:** `tsc --noEmit` exits 0; 95 tests pass
- **Committed in:** `b3988c2` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking import error in test file)
**Impact on plan:** Auto-fix was required for TypeScript compilation. Removed tests directly test behavior (bindClassList) that no longer exists. No scope creep — Plan 02 will add new ClassValue tests.

## Issues Encountered

None — plan executed cleanly once the blocking test import was resolved.

## Next Phase Readiness

- `ClassValue` type exported from `@streem/dom` — ready for use in Plan 02 tests and Plan 03 CSS Modules work
- `resolveClassValue` exported and available for any future utility needs
- `@streem/dom` builds successfully with full type declarations
- Plan 02 should add tests for new ClassValue behaviors: arrays, objects, mixed, className alias, bindStyle removeProperty

---
*Phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: packages/dom/src/types.ts
- FOUND: packages/dom/src/bindings.ts
- FOUND: packages/dom/src/h.ts
- FOUND: packages/dom/src/index.ts
- FOUND: .planning/phases/11-improve-styles-dx-with-react-like-classes-and-styles-api/11-01-SUMMARY.md
- FOUND commit: eb8934b (Task 1 - types.ts)
- FOUND commit: b49e7fb (Task 2 - bindings.ts)
- FOUND commit: b3988c2 (Task 3 - h.ts/index.ts/test)
- FOUND commit: 03a93d8 (docs metadata)
