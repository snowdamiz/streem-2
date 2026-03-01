---
phase: quick-3
plan: "01"
subsystem: landing
tags: [ui, landing-page, syntax-highlighting, visual-polish]
dependency_graph:
  requires: []
  provides: [highlight-utility, why-section-neutral-colors, code-syntax-highlighting]
  affects: [apps/landing]
tech_stack:
  added: []
  patterns: [regex-tokenizer, prop-innerHTML]
key_files:
  created:
    - apps/landing/src/lib/highlight.ts
  modified:
    - apps/landing/src/components/Features.tsx
    - apps/landing/src/components/CodeSample.tsx
decisions:
  - "Used single-pass combined regex with alternation to avoid double-wrapping tokens"
  - "Used \\x60 hex escape for backtick in regex to avoid TypeScript template-literal syntax conflict"
  - "Items 01+02 now share white (--color-accent), items 03+04 share light-gray (--color-accent-2) for alternating neutral pairs"
metrics:
  duration: "~5 min"
  completed: "2026-03-01"
---

# Quick Task 3: Fix Why Section Number Colors and Add Syntax Highlighting Summary

**One-liner:** Neutral-only Why section numbers (white/light-gray pairs) plus regex tokenizer-based syntax highlighting for all landing page code blocks using existing CSS token color variables.

## What Was Done

### Task 1: Create highlight utility

Created `apps/landing/src/lib/highlight.ts` with a single exported `highlight(raw: string): string` function.

The function:
1. HTML-escapes the input (`&`, `<`, `>`)
2. Applies a single-pass combined regex that matches tokens in priority order: line comments, string literals (template/single/double), keywords, function call names, numeric literals
3. Wraps each match in a `<span style="color:var(--color-token-*)">` using the CSS custom properties already defined in `global.css`

The backtick character in the regex pattern is written as `\x60` to avoid conflicting with TypeScript template-literal string syntax.

### Task 2: Fix number colors and add syntax highlighting to Features and CodeSample

**Features.tsx:**
- Added `import { highlight } from '../lib/highlight'`
- Item 02 accent: `var(--color-green)` → `var(--color-accent)` (white)
- Item 04 accent: `var(--color-amber)` → `var(--color-accent-2)` (light gray)
- Items 01+03 unchanged — result: alternating white/white, gray/gray neutral pairs
- Code blocks changed from `<code>{f.code}</code>` to `<code prop:innerHTML={highlight(f.code)} />`

**CodeSample.tsx:**
- Added `import { highlight } from '../lib/highlight'`
- All three Show panels (signals, streams, jsx) updated to use `prop:innerHTML={highlight(CODE.*)}`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 65a0087 | feat(quick-3): add syntax highlight utility for landing page code blocks |
| b2090b6 | feat(quick-3): fix Why section number colors and add syntax highlighting |

## Verification

- Build: `pnpm --filter @streem/landing build` exits 0, no TypeScript errors
- Feature 02 accent: `var(--color-accent)` confirmed in Features.tsx line 35
- Feature 04 accent: `var(--color-accent-2)` confirmed in Features.tsx line 62
- `highlight.ts` handles: comments, template/single/double-quoted strings, keywords, function calls, numbers
- `prop:innerHTML` used in Features.tsx (line 95) and all three panels in CodeSample.tsx

## Self-Check: PASSED

- `apps/landing/src/lib/highlight.ts` — FOUND
- `apps/landing/src/components/Features.tsx` — FOUND (modified)
- `apps/landing/src/components/CodeSample.tsx` — FOUND (modified)
- Commit 65a0087 — FOUND
- Commit b2090b6 — FOUND
