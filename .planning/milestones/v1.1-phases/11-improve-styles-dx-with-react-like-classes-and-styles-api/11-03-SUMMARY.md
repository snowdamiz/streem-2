---
phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api
plan: "03"
subsystem: ui
tags: [dom, jsx, css-modules, landing, typescript, vite]

# Dependency graph
requires:
  - phase: 11-01
    provides: ClassValue type and updated applyProps for class/className

provides:
  - Five CSS Module files (Hero, Features, CodeSample, TickerDemo, InstallCta) with extracted component styles
  - vite-env.d.ts ambient declaration in apps/landing and create-streem template
  - Shared section typography classes (.section-label, .section-title, .section-sub) in global.css
  - jsx-runtime.ts updated: class prop accepts ClassValue instead of string, className added, classList removed
  - Landing app TypeScript + Vite build passes with CSS Modules

affects:
  - apps/landing (now CSS Modules, no inline style blocks)
  - packages/dom/src/jsx-runtime.ts (fixed class prop type)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS Modules co-located with components: import styles from './Component.module.css'
    - ClassValue array syntax for multiple class names: class={[styles.foo, styles.bar]}
    - Shared global typography classes in global.css; component-specific classes in module files

key-files:
  created:
    - apps/landing/src/components/Hero.module.css
    - apps/landing/src/components/Features.module.css
    - apps/landing/src/components/CodeSample.module.css
    - apps/landing/src/components/TickerDemo.module.css
    - apps/landing/src/components/InstallCta.module.css
    - apps/landing/src/vite-env.d.ts
    - packages/create-streem/templates/default/src/vite-env.d.ts
  modified:
    - apps/landing/src/components/Hero.tsx
    - apps/landing/src/components/Features.tsx
    - apps/landing/src/components/CodeSample.tsx
    - apps/landing/src/components/TickerDemo.tsx
    - apps/landing/src/components/InstallCta.tsx
    - apps/landing/src/styles/global.css
    - packages/dom/src/jsx-runtime.ts

key-decisions:
  - "Shared presentational classes (.section-label, .section-title, .section-sub) moved to global.css — used across 3 components, duplication in modules avoided"
  - "jsx-runtime.ts class prop type changed from string|(() => string) to ClassValue|(()=>ClassValue) to match types.ts — was the root cause of TS2322 build errors"
  - "TickerSkeleton uses string concatenation for two module classes (tickerTable + tickerSkeleton) as it is a static function, not a reactive component"

patterns-established:
  - "CSS Modules: co-locate .module.css with .tsx component, use camelCase class names, import as styles object"
  - "Global utility classes (container, section-label, section-title, section-sub) remain as plain string class attributes, not CSS Module references"
  - "ClassValue array syntax for combining module classes: class={[styles.base, styles.modifier]}"

requirements-completed: [STYLES-DX-05]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 11 Plan 03: CSS Modules Migration for Landing Components Summary

**Five landing page components migrated from inline style blocks to co-located CSS Module files with ClassValue array support and vite-env.d.ts ambient declarations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T07:04:59Z
- **Completed:** 2026-03-01T07:08:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- All 5 landing components (Hero, Features, CodeSample, TickerDemo, InstallCta) now import from `.module.css` files — zero inline `<style>` blocks remain
- Created `vite-env.d.ts` with `*.module.css` ambient declaration in both `apps/landing/src/` and `packages/create-streem/templates/default/src/`
- Added shared `.section-label`, `.section-title`, `.section-sub` typography to `global.css` — used by 3 components without module duplication
- Fixed `jsx-runtime.ts` `class` prop type mismatch (string vs ClassValue) that was blocking TypeScript compilation
- Landing app `pnpm --filter @streem/landing build` exits 0; all 105 `@streem/dom` tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CSS Modules type declarations** - `b67aea9` (chore)
2. **Task 2: Migrate all landing components to CSS Modules** - `3a92ceb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/landing/src/vite-env.d.ts` - CSS Modules ambient declaration (`*.module.css` -> `Record<string, string>`)
- `packages/create-streem/templates/default/src/vite-env.d.ts` - Same declaration for scaffolded projects
- `apps/landing/src/components/Hero.module.css` - Hero component styles (hero, heroBadge, heroHeadline, heroSub, heroDemo, demoLabel, demoValues, demoCell, demoValue, accent, demoCaption, heroInstall, installCmd)
- `apps/landing/src/components/Hero.tsx` - Uses import styles + styles.xxx; array [styles.demoValue, styles.accent] for combined class
- `apps/landing/src/components/Features.module.css` - Features styles (featuresSection, featuresGrid, featureCard, featureIcon, featureTitle, featureDesc, featureCode)
- `apps/landing/src/components/Features.tsx` - CSS Module import; section-label/section-title remain global strings
- `apps/landing/src/components/CodeSample.module.css` - Code sample styles (codeSection, codeWrapper, codeHeader, codeFilename, copyBtn, codeBlock)
- `apps/landing/src/components/CodeSample.tsx` - CSS Module import; section-* remain global strings
- `apps/landing/src/components/TickerDemo.module.css` - Ticker styles (tickerSection, tickerTable, tickerRow, tickerSymbol, tickerPrice, tickerChange, tickerSparkline, skeletonCell, skeletonWide, tickerSkeleton)
- `apps/landing/src/components/TickerDemo.tsx` - CSS Module import; TickerSkeleton uses string concatenation for two combined classes
- `apps/landing/src/components/InstallCta.module.css` - CTA styles (ctaSection, ctaBadge, ctaTitle, ctaSub, ctaActions, ctaFootnote)
- `apps/landing/src/components/InstallCta.tsx` - CSS Module import
- `apps/landing/src/styles/global.css` - Added .section-label, .section-title, .section-sub as global shared typography
- `packages/dom/src/jsx-runtime.ts` - Fixed `class` prop from `string | (() => string)` to `ClassValue | (() => ClassValue)`; added `className`; removed `classList`

## Decisions Made

- Shared presentational classes (`.section-label`, `.section-title`, `.section-sub`) moved to `global.css` rather than duplicated in each module. These appear in 3 components and follow the same design token pattern as `.container`.
- `packages/dom/src/jsx-runtime.ts` had a duplicate inline JSX namespace with outdated `class: string` type. Plan 01 updated `types.ts` correctly but left `jsx-runtime.ts` stale. Fixed inline declaration to match, then rebuilt dom and streem packages.
- `TickerSkeleton` uses string concatenation (`styles.tickerTable + ' ' + styles.tickerSkeleton`) for the two-class case since it is a static (non-reactive) function — ClassValue array syntax also works here but string concatenation is simpler for static cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale class prop type in jsx-runtime.ts**
- **Found during:** Task 2 (landing app build verification)
- **Issue:** `tsc --noEmit` failed with TS2322 on `class={[styles.demoValue, styles.accent]}` — `packages/dom/src/jsx-runtime.ts` had `class?: string | (() => string)` (old type). Plan 01 updated `types.ts` but `jsx-runtime.ts` has its own duplicate inline JSX namespace with the old signature.
- **Fix:** Updated `jsx-runtime.ts` to import `ClassValue` from `types.ts` and changed `class?:` to `ClassValue | (() => ClassValue)`, added `className?:`, removed `classList?:`. Rebuilt `@streem/dom` and `streem` packages.
- **Files modified:** `packages/dom/src/jsx-runtime.ts`
- **Verification:** `pnpm --filter @streem/landing build` exits 0; 105 dom tests pass
- **Committed in:** `3a92ceb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in jsx-runtime.ts class prop type)
**Impact on plan:** Required fix — the ClassValue array syntax from Plan 01 was unusable in landing TSX until the jsx-runtime.ts type was corrected. No scope creep.

## Issues Encountered

None beyond the auto-fixed jsx-runtime.ts type bug above.

## Next Phase Readiness

- Phase 11 is now complete — all 3 plans done
- `@streem/dom` dist now has correct ClassValue types in jsx-runtime
- CSS Modules pattern is proven with the landing page dogfood
- Future components can follow the established pattern: co-located `.module.css`, camelCase class names, `import styles from './Foo.module.css'`

---
*Phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api*
*Completed: 2026-03-01*
