---
phase: 06-landing-page-dogfood
plan: "01"
subsystem: ui
tags: [vite, shoelace, streem, mpa, landing-page, tsx, css]

# Dependency graph
requires:
  - phase: 05-package-assembly-cli-and-ai-skills
    provides: streem meta-package with streemHMR Vite plugin and jsx-runtime exports
  - phase: 04-lit-web-component-interop
    provides: "@streem/lit workspace package for Shoelace Lit component bindings"
provides:
  - "@streem/landing workspace app with package.json, tsconfig, vite.config"
  - "MPA Vite config with two HTML entry points (/ and /docs)"
  - "Dark mode global CSS with FOUCE prevention for Shoelace custom elements"
  - "main.tsx with setBasePath-first ordering preventing Shoelace FOUCE"
  - "Stub App.tsx and DocsApp.tsx that compile cleanly with jsxImportSource: streem"
affects:
  - 06-02-landing-page-content
  - 06-03-docs-page-and-deployment

# Tech tracking
tech-stack:
  added:
    - "@shoelace-style/shoelace ^2.20.1 — Lit-based design system (sl-button, sl-badge)"
    - "vite-plugin-static-copy — copies Shoelace /assets to dist/shoelace_assets"
  patterns:
    - "MPA Vite config: rollupOptions.input with named main and docs entries"
    - "setBasePath called as first side-effect import in main entry — FOUCE prevention invariant"
    - "Standalone tsconfig (no extends) with jsxImportSource: streem"
    - "process.env.VITE_BASE_URL ?? '/streem-2/' for GitHub Pages base URL"

key-files:
  created:
    - apps/landing/package.json
    - apps/landing/tsconfig.json
    - apps/landing/vite.config.ts
    - apps/landing/index.html
    - apps/landing/docs/index.html
    - apps/landing/src/main.tsx
    - apps/landing/src/docs.tsx
    - apps/landing/src/App.tsx
    - apps/landing/src/DocsApp.tsx
    - apps/landing/src/styles/global.css
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "tsconfig.json standalone (no extends from root tsconfig.base.json) — matches create-streem template pattern; user projects won't have monorepo root tsconfig"
  - "setBasePath must be called before ANY Shoelace component import — first import in main.tsx, before even CSS imports to guarantee registration order"
  - "viteStaticCopy targets shoelace /dist/assets to dist/shoelace_assets/ — setBasePath path must match"
  - "BASE_URL defaults to /streem-2/ for GitHub Pages; override via VITE_BASE_URL env var for custom domain"

patterns-established:
  - "FOUCE prevention: sl-button:not(:defined), sl-badge:not(:defined) { visibility: hidden } in global.css"
  - "Dark mode via sl-theme-dark class on html element (Shoelace pattern)"

requirements-completed: [LAND-01, LAND-02, LAND-03]

# Metrics
duration: 139s
completed: 2026-02-28
---

# Phase 06 Plan 01: Landing App Scaffold Summary

**Vite MPA scaffold for @streem/landing with Shoelace integration, dark mode CSS, and FOUCE-safe setBasePath ordering**

## Performance

- **Duration:** 139s (about 2 min)
- **Started:** 2026-02-28T19:57:59Z
- **Completed:** 2026-02-28T20:00:18Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- @streem/landing workspace app with correct pnpm workspace deps (streem, @streem/lit, @shoelace-style/shoelace)
- Vite MPA config with two rollupOptions.input entries (main: index.html, docs: docs/index.html) and viteStaticCopy for Shoelace assets
- main.tsx with setBasePath as the first side-effect call before any Shoelace component import
- Dark mode global.css with CSS design tokens and FOUCE prevention for sl-button/sl-badge custom elements
- Build verified: `pnpm --filter @streem/landing build` exits 0, dist/ contains main + docs JS bundles and 2053 Shoelace assets

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json, tsconfig.json, and vite.config.ts** - `bac182d` (feat)
2. **Task 2: Create HTML entry points, TSX entry files, and global CSS** - `b99fed3` (feat)

## Files Created/Modified
- `apps/landing/package.json` - @streem/landing workspace app with streem, @streem/lit, @shoelace-style/shoelace dependencies
- `apps/landing/tsconfig.json` - Standalone tsconfig with jsxImportSource: "streem", jsx: "react-jsx"
- `apps/landing/vite.config.ts` - MPA config: base URL, streemHMR, viteStaticCopy, rollupOptions with main+docs entries
- `apps/landing/index.html` - Landing page entry with sl-theme-dark class
- `apps/landing/docs/index.html` - Docs page entry with sl-theme-dark class
- `apps/landing/src/main.tsx` - Landing entry: setBasePath first, then dark.css, global.css, render(App)
- `apps/landing/src/docs.tsx` - Docs entry: global.css, render(DocsApp)
- `apps/landing/src/App.tsx` - Stub landing component (skeleton for plan 06-02)
- `apps/landing/src/DocsApp.tsx` - Stub docs component (skeleton for plan 06-02/06-03)
- `apps/landing/src/styles/global.css` - Dark mode tokens, reset, FOUCE prevention, layout utilities, code block styles
- `pnpm-lock.yaml` - Updated with @shoelace-style/shoelace and vite-plugin-static-copy

## Decisions Made
- Standalone tsconfig (no extends) to match create-streem template pattern — user projects won't have monorepo root tsconfig
- setBasePath called before any other Shoelace-related import in main.tsx — strict ordering required for FOUCE prevention
- viteStaticCopy copies to `shoelace_assets` which matches the setBasePath('./shoelace_assets') call
- BASE_URL defaults to '/streem-2/' for GitHub Pages subdirectory hosting; overrideable via VITE_BASE_URL env var

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all packages installed cleanly, tsc --noEmit passed, vite build succeeded on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- apps/landing scaffold is ready for plan 06-02 to add real landing page content (Hero, Features, StreamingDemo, InstallCta sections)
- Shoelace is installed and base path configured — sl-button and sl-badge can be used immediately
- Both HTML entry points exist and build cleanly; stub components ready to be replaced with real content
- No blockers.

---
*Phase: 06-landing-page-dogfood*
*Completed: 2026-02-28*
