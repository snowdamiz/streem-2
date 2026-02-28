---
phase: 06-landing-page-dogfood
plan: "03"
subsystem: ui
tags: [shoelace, lit, web-components, jsx, svg, github-actions, github-pages]

requires:
  - phase: 06-01
    provides: Vite MPA scaffold, setBasePath for Shoelace, HTML entries
  - phase: 06-02
    provides: All landing page sections including TickerDemo with sparklines

provides:
  - InstallCta section with real sl-button + sl-badge (Shoelace dark theme)
  - Generated JSX IntrinsicElements for sl-button and sl-badge (typed prop: bindings)
  - GitHub Actions deploy workflow (.github/workflows/deploy-landing.yml)
  - SVG namespace fix in @streem/dom JSX runtime (h.ts + bindings.ts)
  - Visual verification of full landing page end-to-end

affects: [lit-interop, deploy, dom, jsx-runtime]

tech-stack:
  added: []
  patterns:
    - Shoelace components typed via generated lit-elements.d.ts (prop:variant, prop:size, on:click)
    - SVG JSX via createElementNS — no innerHTML workaround needed
    - GitHub Pages OIDC deployment (no gh-pages token required)

key-files:
  created:
    - apps/landing/src/components/InstallCta.tsx
    - .github/workflows/deploy-landing.yml
  modified:
    - packages/lit/src/lit-types/lit-elements.d.ts
    - apps/landing/src/App.tsx
    - packages/dom/src/h.ts
    - packages/dom/src/bindings.ts
    - apps/landing/src/components/TickerDemo.tsx

key-decisions:
  - "SVG elements require createElementNS — added SVG_TAGS set to h.ts; document.createElement produces HTMLUnknownElement for svg/path/circle etc."
  - "SVGElement.className is SVGAnimatedString not writable string — className assignment replaced with setAttribute('class') in both h.ts and bindings.ts"
  - "bindStyle widened to HTMLElement | SVGElement — SVGElement has CSSStyleDeclaration via ElementCSSInlineStyle mixin"
  - "Sparkline Suspense workaround replaced with plain JSX <svg>/<path> with reactive d accessor"
  - "GitHub Pages uses OIDC (pages: write + id-token: write) — no PAT required"

patterns-established:
  - "SVG JSX: h() detects SVG_TAGS and uses createElementNS — all SVG/HTML coexist in same JSX tree"
  - "Reactive SVG attributes: d={() => buildSparklinePath(data())} — goes through bindAttr like any other reactive prop"

requirements-completed:
  - LAND-01
  - LAND-03

duration: ~30min (including bug fix session from prior checkpoint)
completed: 2026-02-28
---

# Plan 06-03: Summary

**Shoelace sl-button/sl-badge with typed JSX props, GitHub Pages CI/CD, and SVG namespace fix enabling real JSX sparklines**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-02-28
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `InstallCta.tsx` ships with real Shoelace `sl-button` (primary CTA + install-skill) and `sl-badge` (version tag), styled in dark theme with `prop:variant`, `prop:size`, `on:click` — all TypeScript-typed via generated IntrinsicElements
- GitHub Actions workflow deploys landing to GitHub Pages on push to main via OIDC (no token required)
- SVG namespace support added to `@streem/dom` JSX runtime — `h()` now calls `createElementNS` for known SVG tags; sparkline workaround removed entirely

## Task Commits

1. **Task 1: Shoelace types + InstallCta** — `17df212` (feat)
2. **Task 2: GitHub Actions deploy workflow** — `6ca04ae` (feat)
3. **Task 3: Visual verification + SVG fix** — `1d5dfa5` (fix) — approved by user

## Files Created/Modified

- `apps/landing/src/components/InstallCta.tsx` — CTA section with sl-button + sl-badge
- `packages/lit/src/lit-types/lit-elements.d.ts` — Generated JSX IntrinsicElements for Shoelace
- `apps/landing/src/App.tsx` — Replaced InstallCtaStub with real InstallCta
- `.github/workflows/deploy-landing.yml` — GitHub Pages OIDC deployment
- `packages/dom/src/h.ts` — SVG_TAGS set + createElementNS, applyProps widened to Element
- `packages/dom/src/bindings.ts` — bindClass uses setAttribute; bindStyle accepts SVGElement
- `apps/landing/src/components/TickerDemo.tsx` — Sparkline uses proper JSX instead of innerHTML

## Decisions Made

- `SVGElement.className` is `SVGAnimatedString` — not writable as a string. All class assignment in `h.ts` and `bindClass` now uses `setAttribute('class', ...)` which works identically for HTML and SVG.
- SVG tag detection uses a static `SVG_TAGS` Set in `h.ts`. Ambiguous tags (`a`, `script`, `style`, `title`) are excluded; they default to the HTML namespace.
- GitHub Pages deployment uses OIDC permissions (`pages: write`, `id-token: write`) — no personal access token or `gh-pages` branch needed.

## Deviations from Plan

### Auto-fixed Issues

**1. SVG namespace — innerHTML workaround replaced with proper fix**
- **Found during:** Visual verification (Task 3)
- **Issue:** `document.createElement('svg')` creates `HTMLUnknownElement`; sparkline was a workaround using `innerHTML` parsing instead of fixing the root cause
- **Fix:** Added `SVG_TAGS` set to `h.ts`; `h()` uses `createElementNS(SVG_NS, tag)` for all known SVG elements. `applyProps` widened from `HTMLElement` to `Element`. `className` assignment replaced with `setAttribute`. `Sparkline` component rewritten as plain `<svg>/<path>` JSX.
- **Files modified:** `packages/dom/src/h.ts`, `packages/dom/src/bindings.ts`, `apps/landing/src/components/TickerDemo.tsx`
- **Verification:** 93 `@streem/dom` tests pass; `@streem/landing build` exits 0

---

**Total deviations:** 1 auto-fixed (framework limitation identified and resolved)
**Impact on plan:** Fix improves `@streem/dom` correctness — SVG is now a first-class citizen in the JSX runtime.

## Issues Encountered

None beyond what was already resolved before the checkpoint (stream singleton bug, bindStyle cssText, history cycle, original SVG workaround).

## User Setup Required

To enable live deployment: go to the GitHub repo → Settings → Pages → Source: **GitHub Actions**. The workflow will trigger on the next push to `main`.

## Next Phase Readiness

Phase 6 is the final phase of milestone v1.0. The landing page is built with Streem (dogfood complete), all v1 features are demonstrated, and the deploy pipeline is wired. Ready for milestone close or `/gsd:verify-work`.

---
*Phase: 06-landing-page-dogfood*
*Completed: 2026-02-28*
