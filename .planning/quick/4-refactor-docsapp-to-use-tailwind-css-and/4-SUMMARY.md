---
phase: quick-4
plan: 4
subsystem: ui
tags: [tailwind, docs, refactor, components, jsx]

requires: []
provides:
  - DocsApp.tsx slim shell with Tailwind utility classes (no inline style block)
  - apps/landing/src/docs/ directory with 10 component files
  - DocSection and Code shared primitives
  - 9 section files (GettingStarted, Signals, Components, Streams, LitInterop, Patterns, Styling, TypeScript, Performance)
  - global.css updated with .nav-icon rule, .docs-link rule, and safelist entry
affects: [docs, landing]

tech-stack:
  added: []
  patterns:
    - "Section-per-file: each docs section lives in its own file under apps/landing/src/docs/"
    - "Tailwind utility classes for layout/typography rather than inline <style> blocks"
    - "DocSection and Code as shared primitives imported by all section files"

key-files:
  created:
    - apps/landing/src/docs/DocSection.tsx
    - apps/landing/src/docs/GettingStartedSection.tsx
    - apps/landing/src/docs/SignalsSection.tsx
    - apps/landing/src/docs/ComponentsSection.tsx
    - apps/landing/src/docs/StreamsSection.tsx
    - apps/landing/src/docs/LitInteropSection.tsx
    - apps/landing/src/docs/PatternsSection.tsx
    - apps/landing/src/docs/StylingSection.tsx
    - apps/landing/src/docs/TypeScriptSection.tsx
    - apps/landing/src/docs/PerformanceSection.tsx
  modified:
    - apps/landing/src/DocsApp.tsx
    - apps/landing/src/styles/global.css

key-decisions:
  - "DocSection and Code primitives in a shared DocSection.tsx — all sections import from one place"
  - "pre.className removal from Code component — pre base styles already handled by global.css @layer base"
  - ".nav-icon and .docs-link moved to global.css as named classes (not convertable to pure Tailwind — stroke-linecap/stroke-linejoin have no Tailwind utility)"
  - "Tailwind v4 @source inline safelist used for dynamic nav link class composition"

patterns-established:
  - "Section-per-file pattern: one export per section file, named export matching filename"
  - "DocSection wraps section layout; Code wraps syntax-highlighted pre/code blocks"

requirements-completed: []

duration: 5min
completed: 2026-03-02
---

# Quick Task 4: Refactor DocsApp Summary

**DocsApp.tsx split from 442 lines into 10 focused files under apps/landing/src/docs/ with all styling migrated to Tailwind v4 utility classes**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T00:18:33Z
- **Completed:** 2026-03-02T00:23:00Z
- **Tasks:** 2 of 3 (3rd is human-verify checkpoint)
- **Files modified:** 12

## Accomplishments

- Extracted all 9 section component functions from DocsApp.tsx into individual files under `apps/landing/src/docs/`
- Created `DocSection.tsx` shared primitives (DocSection wrapper, Code syntax block) used by all 9 sections
- Replaced all `doc-section`, `doc-section-title`, `doc-section-subtitle`, `docs-link` CSS class usages with Tailwind utility classes
- Removed 136-line inline `<style>` block from DocsApp.tsx entirely
- Moved `.nav-icon` and `.docs-link` rules to `global.css` (required for rules that cannot be expressed as Tailwind utilities)
- Added `@source inline(...)` safelist entry for dynamic nav link class composition
- DocsApp.tsx reduced from 442 lines to 94 lines
- TypeScript and Vite build both pass cleanly

## Task Commits

1. **Task 1: Create apps/landing/src/docs/ with shared primitives and all 9 section files** - `af06c0c` (feat)
2. **Task 2: Rewrite DocsApp.tsx — thin shell with Tailwind classes, no inline style block** - `d05c7ca` (feat)

## Files Created/Modified

- `apps/landing/src/docs/DocSection.tsx` - Shared DocSection wrapper and Code primitive used by all sections
- `apps/landing/src/docs/GettingStartedSection.tsx` - Getting started section content
- `apps/landing/src/docs/SignalsSection.tsx` - Signals API reference section
- `apps/landing/src/docs/ComponentsSection.tsx` - Components API reference section
- `apps/landing/src/docs/StreamsSection.tsx` - Streams API reference section
- `apps/landing/src/docs/LitInteropSection.tsx` - Lit interop reference section
- `apps/landing/src/docs/PatternsSection.tsx` - Common patterns section
- `apps/landing/src/docs/StylingSection.tsx` - Styling guide section
- `apps/landing/src/docs/TypeScriptSection.tsx` - TypeScript guide section
- `apps/landing/src/docs/PerformanceSection.tsx` - Performance guide section
- `apps/landing/src/DocsApp.tsx` - Slim orchestrator shell (442 → 94 lines, no style block)
- `apps/landing/src/styles/global.css` - Added .nav-icon, .docs-link rules + safelist entry

## Decisions Made

- `DocSection.tsx` shared primitive removes the `pre.className = 'doc-pre'` assignment in the `Code` component — the `pre` base styles are already applied via `@layer base` in global.css, so no extra class is needed.
- `.nav-icon` and `.docs-link` remain as named CSS classes in global.css because `stroke-linecap` and `stroke-linejoin` have no corresponding Tailwind utilities, making a pure-utility approach impossible for these rules.
- `@source inline("hover:text-text hover:bg-white/5 text-text bg-white/8")` safelist ensures dynamically composed nav link classes are always emitted by Tailwind v4's scanner.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Human verification required: open docs app at localhost and verify nav layout, icons, active state, section switching, mobile breakpoint, and absence of inline style tag
- Build confirmed clean — TypeScript and Vite both exit 0

---
*Phase: quick-4*
*Completed: 2026-03-02*
