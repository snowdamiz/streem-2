---
phase: 12-add-full-tailwind-support-if-not-already-supported
plan: "01"
subsystem: ui
tags: [tailwind, tailwindcss, css-modules, vite, landing-page, dogfood]

# Dependency graph
requires:
  - phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api
    provides: ClassValue array/object patterns and CSS Modules integration in landing components

provides:
  - Tailwind CSS v4 installed and wired in apps/landing via @tailwindcss/vite plugin
  - "@import tailwindcss" as first entry in global.css
  - Landing components augmented with Tailwind utility classes alongside CSS Modules
  - Verified: Tailwind v4 + CSS Modules coexist without conflict in Vite build

affects: [12-02-create-streem-template]

# Tech tracking
tech-stack:
  added: ["@tailwindcss/vite: latest", "tailwindcss: latest"]
  patterns:
    - "Tailwind v4 plugin-only setup: @tailwindcss/vite in vite.config.ts, @import tailwindcss in CSS entry — no postcss.config.js, no tailwind.config.js"
    - "CSS coexistence: Tailwind utility classes combined with CSS Module classes using ClassValue array syntax: class={[styles.hero, 'py-24 text-center']}"
    - "ClassValue static arrays are safe for Tailwind class scanning — no dynamic computed class names in landing page"

key-files:
  created: []
  modified:
    - apps/landing/package.json
    - apps/landing/vite.config.ts
    - apps/landing/src/styles/global.css
    - apps/landing/src/components/Hero.tsx
    - apps/landing/src/components/Features.tsx
    - apps/landing/src/components/CodeSample.tsx
    - apps/landing/src/components/InstallCta.tsx
    - apps/landing/src/components/TickerDemo.tsx
    - pnpm-lock.yaml

key-decisions:
  - "Tailwind plugin placed before streemHMR() in vite.config.ts plugins array — Tailwind processes CSS before HMR plugin"
  - "@import tailwindcss placed as first line of global.css — must precede all other CSS rules"
  - "No safelist required: all Tailwind class strings in landing components are static string literals (scannable at build time)"
  - "Tailwind utility classes go in jsx-runtime CSS chunk (where global.css lands) — separate from main CSS chunk that contains CSS Module hashed classes"
  - "ClassValue array syntax confirmed: class={[styles.hero, 'py-24 text-center']} is safe — Tailwind scans static string literals in arrays"

patterns-established:
  - "Tailwind v4 + CSS Modules coexistence pattern: CSS Module classes handle scoped component styles; Tailwind utilities handle structural spacing/layout"
  - "No postcss.config.js or tailwind.config.js needed for Tailwind v4 — fully plugin-driven via @tailwindcss/vite"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 12 Plan 01: Tailwind CSS v4 Integration — Landing Page Dogfood Summary

**Tailwind CSS v4 integrated into the landing page via @tailwindcss/vite plugin, coexisting with CSS Modules — utility classes present in build output, no config files needed**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T07:27:27Z
- **Completed:** 2026-03-01T07:30:23Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Installed `@tailwindcss/vite` and `tailwindcss` as devDependencies, ran pnpm install cleanly (21 packages added)
- Wired `tailwind()` plugin first in vite.config.ts plugins array (before streemHMR)
- Added `@import "tailwindcss"` as first line of global.css with coexistence comment
- Applied Tailwind utility classes to all 5 landing components (Hero, Features, CodeSample, InstallCta, TickerDemo) using ClassValue array syntax alongside existing CSS Module classes
- `pnpm --filter /landing build` exits 0 with both Tailwind utilities (py-24, py-20, gap-6, grid, text-center, mb-4/5/12, etc.) and CSS Module hashed classes present in output

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @tailwindcss/vite and wire plugin into landing vite.config.ts** - `449e5d3` (chore)
2. **Task 2: Add Tailwind CSS v4 @import to global.css and apply utility classes to landing components** - `04e804b` (feat)

**Plan metadata:** *(to be committed)*

## Files Created/Modified

- `apps/landing/package.json` - Added @tailwindcss/vite and tailwindcss devDependencies
- `apps/landing/vite.config.ts` - Import tailwind from '@tailwindcss/vite'; register tailwind() first in plugins array
- `apps/landing/src/styles/global.css` - @import "tailwindcss" as first line with coexistence comment
- `apps/landing/src/components/Hero.tsx` - py-24 text-center on header; mb-4/mb-5/mb-12 on badge/headline/subtitle
- `apps/landing/src/components/Features.tsx` - py-20 on section; grid gap-6 sm:grid-cols-2 on features grid
- `apps/landing/src/components/CodeSample.tsx` - py-20 on section; mb-3 on section-label div
- `apps/landing/src/components/InstallCta.tsx` - py-20 text-center on section; mt-3 flex gap-4 justify-center flex-wrap on actions div
- `apps/landing/src/components/TickerDemo.tsx` - py-20 on section
- `pnpm-lock.yaml` - Updated with new Tailwind packages

## Decisions Made

- Tailwind v4 is plugin-only — no `postcss.config.js` or `tailwind.config.js` needed (per CONTEXT.md decision)
- Tailwind plugin placed before `streemHMR()` in plugins array so Tailwind processes CSS first
- `@import "tailwindcss"` placed as absolute first line of global.css (before :root tokens)
- No safelist needed — all Tailwind class strings are static string literals, safe for build-time scanning
- Tailwind utility output lands in the jsx-runtime CSS chunk (where global.css is imported); CSS Module hashed classes land in main CSS chunk — both present in the build

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build succeeded on first attempt with all expected utility classes confirmed present in output.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tailwind v4 dogfood integration proven on the real landing page
- Ready for Plan 12-02: wire Tailwind v4 into the create-streem default template (App.tsx already uses Tailwind classes from context session work; needs @tailwindcss/vite wired in template vite.config.ts)

---
*Phase: 12-add-full-tailwind-support-if-not-already-supported*
*Completed: 2026-03-01*
