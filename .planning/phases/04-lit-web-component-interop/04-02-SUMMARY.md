---
phase: 04-lit-web-component-interop
plan: "02"
subsystem: ui
tags: [lit, web-components, jsx, typescript, signals, shadow-dom]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: signal, effect, onCleanup APIs used by bindLitProp and observeLitProp
  - phase: 02-jsx-runtime-and-component-model
    provides: "@streem/dom/jsx-runtime module path being augmented by base-custom-element-types.d.ts"

provides:
  - "@streem/lit package with bindLitProp and observeLitProp runtime utilities"
  - "base-custom-element-types.d.ts JSX augmentation for all hyphenated custom element tags"
  - "lit-types/ directory scaffold for CEM-generated element types"

affects: [04-03-PLAN.md, any future plan using custom elements in TSX]

# Tech tracking
tech-stack:
  added:
    - "@custom-elements-manifest/analyzer ^0.10.5"
    - "@wc-toolkit/jsx-types latest"
    - "lit ^3.0.0 (devDependency only — no runtime dependency)"
    - "tsx latest"
    - "playwright ^1.0.0"
  patterns:
    - "peerDependencies for @streem/* packages — workspace:* keeps coupling explicit"
    - "Lit as devDependency only — zero Lit runtime in dist output"
    - "observeLitProp: event-driven pull pattern with camelCase→kebab-case conversion"
    - "bindLitProp: effect()-based property sync (not setAttribute — preserves types)"
    - "declare module '@streem/dom/jsx-runtime' augmentation path for JSX custom element types"

key-files:
  created:
    - packages/lit/package.json
    - packages/lit/tsconfig.json
    - packages/lit/vite.config.ts
    - packages/lit/vitest.config.ts
    - packages/lit/src/index.ts
    - packages/lit/src/bind-lit-prop.ts
    - packages/lit/src/observe-lit-prop.ts
    - packages/lit/src/base-custom-element-types.d.ts
    - packages/lit/src/lit-types/.gitkeep
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Lit is devDependency only — no Lit runtime in @streem/lit production bundle; peerDependencies are @streem/core and @streem/dom"
  - "observeLitProp uses event-driven pull — listens for '{propName}-changed' CustomEvents with detail.value; camelCase automatically converted to kebab-case"
  - "bindLitProp uses el[propName] = value (not setAttribute) — property assignment preserves array/object/boolean type fidelity"
  - "declare module target is exactly '@streem/dom/jsx-runtime' — matches TypeScript's jsxImportSource subpath resolution, not '@streem/dom'"
  - "ObserveLitPropOptions.event override allows non-standard event names for components that dispatch 'change', 'update', etc."

patterns-established:
  - "Custom element JSX types: template literal [tag: `${string}-${string}`] catch-all in IntrinsicElements"
  - "Namespace prefix index signatures: [key: `prop:${string}`], [key: `attr:${string}`], [key: `on:${string}`]"
  - "onCleanup() called AFTER addEventListener — cleanup-first invariant from Phase 3 streams"

requirements-completed: [LIT-01, LIT-02, LIT-03]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 04 Plan 02: @streem/lit Package Scaffold Summary

**@streem/lit package with bindLitProp (effect-based property sync) and observeLitProp (event-driven pull to Signal) plus base JSX types for all custom elements via @streem/dom/jsx-runtime augmentation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-28T08:47:21Z
- **Completed:** 2026-02-28T08:49:08Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Scaffolded @streem/lit package with complete infrastructure (package.json, tsconfig.json, vite.config.ts, vitest.config.ts)
- Implemented observeLitProp with camelCase-to-kebab-case auto-conversion, optional event override, and onCleanup-based listener removal
- Implemented bindLitProp using effect() for reactive JS property sync (preserves type fidelity vs setAttribute)
- Created base-custom-element-types.d.ts augmenting @streem/dom/jsx-runtime with hyphenated tag catch-all (part/slot/exportparts + prop:/attr:/on: index signatures)
- Build exits 0, dist/index.js contains zero Lit runtime imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create @streem/lit package scaffold and infrastructure** - `1a4a0fc` (chore)
2. **Task 2: Implement bindLitProp, observeLitProp, base types, and package exports** - `e0019a4` (feat)

**Plan metadata:** (final docs commit)

## Files Created/Modified

- `packages/lit/package.json` - Package manifest; peerDeps @streem/core + @streem/dom; Lit as devDep only
- `packages/lit/tsconfig.json` - Extends tsconfig.base.json; jsx: react-jsx; jsxImportSource: @streem/dom
- `packages/lit/vite.config.ts` - Lib mode ES build; externals: @streem/core, @streem/dom; rollupTypes: true
- `packages/lit/vitest.config.ts` - Node environment; name: @streem/lit
- `packages/lit/src/index.ts` - Barrel export for bindLitProp, observeLitProp, ObserveLitPropOptions
- `packages/lit/src/bind-lit-prop.ts` - effect()-based property assignment; no setAttribute
- `packages/lit/src/observe-lit-prop.ts` - CustomEvent listener with camelCase→kebab-case + onCleanup
- `packages/lit/src/base-custom-element-types.d.ts` - declare module '@streem/dom/jsx-runtime' augmentation
- `packages/lit/src/lit-types/.gitkeep` - Placeholder for CEM-generated element types

## Decisions Made

- Lit is devDependency only — zero Lit runtime in dist (bundle stays lean for consumers)
- declare module target is '@streem/dom/jsx-runtime' not '@streem/dom' — this is the exact path TypeScript resolves from `jsxImportSource: "@streem/dom"`
- observeLitProp converts camelCase propName to kebab-case + '-changed' as default event name (standard Lit convention)
- bindLitProp uses el[propName] = value property assignment (not setAttribute) to preserve array/object/boolean type fidelity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm --filter @streem/lit test` exits with code 1 because no test files exist yet — this is expected vitest behavior for an empty test suite. The plan's done criteria only required build success, not test passage.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- @streem/lit package is built and ready; bindLitProp and observeLitProp are importable from '@streem/lit'
- base-custom-element-types.d.ts provides JSX type foundation for all custom element usage in TSX
- Ready for Plan 04-03: CEM tooling integration and element-specific type generation

---
*Phase: 04-lit-web-component-interop*
*Completed: 2026-02-28*
