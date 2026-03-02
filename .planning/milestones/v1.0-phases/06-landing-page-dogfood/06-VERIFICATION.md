---
phase: 06-landing-page-dogfood
verified: 2026-02-28T21:30:00Z
status: gaps_found
score: 3/4 must-haves verified
re_verification: false
gaps:
  - truth: "Every v1 feature — including Suspense — is exercised on the page in a meaningful way"
    status: failed
    reason: "Suspense is never imported or rendered in any runtime landing page file. TickerDemo.tsx uses Show+hasData instead, after the Suspense+stream retry-loop bug was resolved by removing Suspense entirely. The component is only mentioned in code comments and documentation strings."
    artifacts:
      - path: "apps/landing/src/components/TickerDemo.tsx"
        issue: "imports Show, For, ErrorBoundary from streem — but NOT Suspense. Two comments reference Suspense conceptually but it is not used."
      - path: "apps/landing/src/App.tsx"
        issue: "Wires all sections — none of them use Suspense at the JSX level."
    missing:
      - "A component on the landing page must actually call <Suspense> (or Suspense({...})) with a fallback and a child that uses the thrown-Promise protocol. This could be a small async section (e.g., a lazy-loaded docs preview, or the TickerTable reverted to use Suspense correctly with stream lifted outside the retry scope)."
  - truth: "Hero uses sl-badge (Lit component) for version tag — not a plain HTML span"
    status: failed
    reason: "Hero.tsx line 19 still contains a plain <span class='badge'>v0.1.0</span> with a comment reading 'sl-badge added in plan 06-03; placeholder for now'. Plan 06-03 added sl-badge only to InstallCta.tsx, not to Hero.tsx. The planned replacement was never made."
    artifacts:
      - path: "apps/landing/src/components/Hero.tsx"
        issue: "Line 18-19: placeholder span instead of <sl-badge>. Comment confirms this was deferred to 06-03 but 06-03 did not deliver it."
    missing:
      - "Replace the <span class='badge'>v0.1.0</span> in Hero.tsx with <sl-badge prop:variant='neutral' prop:pill={true}>v0.1.0</sl-badge> and import the badge component."
human_verification:
  - test: "Open http://localhost:5173 in a browser after running pnpm --filter /landing dev"
    expected: "Dark mode page loads with: (1) Hero section showing live reactive counter incrementing, (2) Ticker table showing 7 stock rows with prices updating and SVG sparklines rendering, (3) Features grid with clickable expand, (4) Code sample with copy button, (5) InstallCta section with styled Shoelace sl-button and sl-badge, (6) No visible layout or rendering artifacts"
    why_human: "Visual appearance, live streaming animation, Shoelace component styling, SVG sparkline visibility — none of these can be verified by static code analysis"
  - test: "Navigate to http://localhost:5173/docs/"
    expected: "Docs page with left-hand nav and 5 API sections (Getting Started, Signals, Components, Streams, Lit interop) — all code blocks readable"
    why_human: "Page navigation and multi-page routing correctness requires a real browser"
  - test: "Click each Shoelace sl-button in the InstallCta section"
    expected: "Both buttons respond to click events (copy text to clipboard). Shadow DOM event retargeting is bypassed via on:click."
    why_human: "Shadow DOM event handling requires a real browser with Custom Elements registered"
---

# Phase 6: Landing Page (Dogfood) Verification Report

**Phase Goal:** Streem's official landing page is live, built entirely with Streem, demonstrating signals, a live high-frequency stream, and a real Lit component from a design system — and every integration pain discovered during this build is treated as a framework bug and fixed before ship

**Verified:** 2026-02-28T21:30:00Z
**Status:** gaps_found — 2 gaps block full success criterion satisfaction
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every v1 feature (signals, streaming, Lit interop, Show, For, ErrorBoundary, **Suspense**) exercised meaningfully | FAILED | Suspense is not imported or used in any runtime file. Show, For, ErrorBoundary are used. Suspense appears only in comments and docs text. |
| 2 | Live streaming demo at 30+ msg/sec without frame drops — batch() / throttle() validated | VERIFIED | ticker.ts fires at 5ms (200 msg/sec). throttle(stream, 33) limits to ~30fps. batch() wraps all signal writes. fromObservable connects the full stream pipeline. |
| 3 | At least one Lit component from a real design system embedded with typed props and functional event handlers | VERIFIED | InstallCta.tsx uses sl-button (prop:variant, prop:size, on:click) and sl-badge (prop:variant, prop:pill) from @shoelace-style/shoelace. Types come from generated lit-elements.d.ts via IntrinsicElements augmentation. |
| 4 | 200 msg/sec WebSocket perf shows no long tasks — batch() holds under stress | UNCERTAIN (needs human) | batch() and throttle() are wired correctly in code. Actual frame-time measurement requires running the page and profiling DevTools. |

**Score:** 2/4 success criteria fully verified (Criterion 4 needs human; Criterion 1 has a confirmed gap)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/landing/src/App.tsx` | Root component wiring all sections | VERIFIED | Imports and renders Hero, TickerDemo, Features, CodeSample, InstallCta. 17 lines, substantive. |
| `apps/landing/src/components/Hero.tsx` | Hero with signal/computed demo | PARTIAL | signal(0) + computed counter with onMount interval — VERIFIED. But uses plain `<span class="badge">` instead of `<sl-badge>` for version tag. Comment says "placeholder for now". |
| `apps/landing/src/components/TickerDemo.tsx` | Live streaming ticker with all primitives | PARTIAL | fromObservable + throttle + batch + For + ErrorBoundary + Show — all VERIFIED. Suspense is absent — comments reference it but it is not imported or called. |
| `apps/landing/src/components/Features.tsx` | Features grid with Show toggle | VERIFIED | signal(expandedIdx) + Show toggling per-card code preview. Substantive. |
| `apps/landing/src/components/CodeSample.tsx` | Code section with copy button | VERIFIED | signal(copied) backing reactive copy button. Substantive. |
| `apps/landing/src/components/InstallCta.tsx` | CTA with sl-button + sl-badge | VERIFIED | Real Shoelace cherry-picked imports, prop:variant, prop:size, on:click — all present and wired. |
| `apps/landing/src/lib/ticker.ts` | Subscribable at 200 msg/sec | VERIFIED | setInterval(5ms) emitting 7-ticker TickerMessage[] arrays. No RxJS. |
| `apps/landing/src/lib/sparkline.ts` | SVG path math | VERIFIED | buildSparklinePath() — M...L path generation, 18 lines, no deps. |
| `apps/landing/src/DocsApp.tsx` | Docs page with 5 API sections | VERIFIED | 151-line file covering getting-started, signals, components, streams, lit-interop. |
| `packages/dom/src/h.ts` | SVG namespace support (SVG_TAGS + createElementNS) | VERIFIED | SVG_TAGS Set with 50+ tags. h() calls document.createElementNS(SVG_NS, tag) for known SVG tags. applyProps widened to Element. |
| `packages/dom/src/bindings.ts` | bindClass uses setAttribute (SVG-safe) | VERIFIED | bindClass calls el.setAttribute('class', ...) — not el.className. bindStyle accepts HTMLElement | SVGElement. |
| `packages/lit/src/lit-types/lit-elements.d.ts` | Generated IntrinsicElements for sl-button + sl-badge | VERIFIED | 10,080-line generated file. sl-badge at line 4208, sl-button at line 4321. IntrinsicElements extends CustomElements at line 10020. |
| `.github/workflows/deploy-landing.yml` | GitHub Pages OIDC CI/CD | VERIFIED | On push to main (apps/landing/** or packages/**). Uses actions/configure-pages@v5, upload-pages-artifact@v4, deploy-pages@v4. OIDC permissions (pages: write, id-token: write). |
| `apps/landing/vite.config.ts` | MPA with 2 HTML entries, base URL, streemHMR | VERIFIED | rollupOptions.input has main + docs entries. base = VITE_BASE_URL ?? '/streem-2/'. streemHMR() plugin loaded. viteStaticCopy for Shoelace assets. |
| `apps/landing/src/main.tsx` | setBasePath before Shoelace imports (FOUCE prevention) | VERIFIED | setBasePath('./shoelace_assets') is the very first call, before dark.css and global.css imports. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `TickerDemo.tsx` | `ticker.ts` | createTickerSource import | WIRED | createTickerSource + SYMBOLS imported and called |
| `TickerDemo.tsx` | `/streams` | fromObservable, throttle, batch imports | WIRED | All three imported from 'streem' and used in the stream pipeline |
| `TickerDemo.tsx` | sparkline | Sparkline component with d accessor | WIRED | `<path d={() => buildSparklinePath(history())} />` — reactive SVG attribute via bindAttr |
| `InstallCta.tsx` | `@shoelace-style/shoelace` | Cherry-picked component JS + /lit types | WIRED | button.js + badge.js imported; `import '/lit'` brings in IntrinsicElements augmentation |
| `h.ts` | `createElementNS` | SVG_TAGS.has(tag) check | WIRED | `const el = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag)` |
| `Hero.tsx` | `<sl-badge>` | Shoelace badge component | NOT WIRED | Hero still uses `<span class="badge">v0.1.0</span>` — sl-badge was planned but not implemented here |
| `landing/src` | `Suspense` | Any import + usage | NOT WIRED | Suspense is not imported anywhere in apps/landing/src at runtime |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LAND-01 | 06-01, 06-03 | Landing page deployed, all v1 features demonstrated | PARTIAL | Signals, streaming, Show, For, ErrorBoundary, Lit interop all demonstrated. Suspense missing from runtime. Build exits 0. |
| LAND-02 | 06-02 | 200 msg/sec stream without frame drops | VERIFIED (code) | ticker.ts at 5ms, throttle(stream, 33), batch() — pipeline is correct. Perf trace needs human. |
| LAND-03 | 06-01, 06-03 | Real Lit component from design system with typed props + events | VERIFIED | sl-button + sl-badge from @shoelace-style/shoelace in InstallCta. Typed via generated lit-elements.d.ts. on:click wired via addEventListener (Shadow DOM safe). |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/landing/src/components/Hero.tsx` | 18 | Comment: "sl-badge added in plan 06-03; placeholder for now" with plain `<span>` still present | WARNING | sl-badge replacement was planned and listed in 06-03-SUMMARY but was not actually committed to Hero.tsx. The SUMMARY claimed it was done; it was not. |
| `apps/landing/src/components/TickerDemo.tsx` | 17, 78 | Comments reference Suspense protocol that was ultimately removed | INFO | Comments are stale — describe an implementation path that was abandoned. Not blocking but misleading. |
| `.planning/phases/06-landing-page-dogfood/.continue-here.md` | — | Plan 06-03 Task 3 status is "in_progress" — visual checkpoint approval is still formally pending | WARNING | The 06-03-SUMMARY.md was written assuming user approval, but approval has not been recorded in the workflow state. |

---

## Human Verification Required

### 1. Full Visual Page Check

**Test:** Run `pnpm --filter /landing dev` and open http://localhost:5173

**Expected:**
- Dark mode page with hero headline, live counter incrementing (count/doubled signals)
- Ticker table showing 7 stock symbols with prices updating in real time and SVG sparklines rendering as polylines
- Features grid with 4 cards that expand code snippets on click
- Code sample section with working copy button
- InstallCta section with two styled Shoelace sl-button elements and one sl-badge version tag

**Why human:** Visual appearance, animation, Shoelace theming, sparkline rendering, and layout correctness cannot be verified statically.

### 2. Performance Profile at 200 msg/sec

**Test:** Open DevTools Performance tab, record 5 seconds while the page is open with the ticker running.

**Expected:** No long tasks (frames blocked > 16ms). The batch()+throttle(33ms) pipeline should prevent frame drops.

**Why human:** Frame-time measurement requires browser DevTools profiling under real conditions.

### 3. Shoelace Shadow DOM Event Test

**Test:** Click the "npm create streem@latest" and "Install AI skill" sl-button elements.

**Expected:** Both buttons trigger their on:click handlers (clipboard write). No event swallowing due to Shadow DOM retargeting.

**Why human:** Shadow DOM event dispatch requires Custom Elements to be registered in a real browser.

### 4. /docs Route Navigation

**Test:** Navigate to http://localhost:5173/docs/ and click each sidebar nav link.

**Expected:** 5 sections (Getting Started, Signals, Components, Streams, Lit interop) all render with readable code blocks and anchor navigation works.

**Why human:** Multi-page Vite MPA routing and anchor scrolling requires a real browser.

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 (Blocking — LAND-01 criterion): Suspense not used on the landing page**

The ROADMAP success criterion #1 explicitly requires "every v1 feature (signals, streaming, Lit interop, `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`) is exercised on the page in a meaningful way, not as a toy demo."

`<Suspense>` is not imported or rendered anywhere in the live landing page. During development, TickerDemo was designed to use Suspense with the thrown-Promise protocol, but the implementation was replaced with `Show` + `hasData` signal after a bug where Suspense's retry-on-resolve behavior caused infinite stream re-creation. The fix removed Suspense entirely rather than restructuring it.

The component works (93 /dom tests pass including suspense.test.ts) — it simply is not exercised on the page.

**Gap 2 (Minor — LAND-01 partial): Hero sl-badge replacement not made**

Hero.tsx line 18-19 contains a stale placeholder comment ("sl-badge added in plan 06-03") with a plain `<span class="badge">v0.1.0</span>`. Plan 06-03 added sl-badge to InstallCta.tsx but did not update Hero.tsx. The 06-03-SUMMARY.md summary text implies it was done ("sl-badge (version tag)") but the code does not reflect this — a discrepancy between the SUMMARY's claims and the actual codebase state.

**What the phase DID deliver (passing):**

- Complete Streem landing page application building and deploying correctly
- Live 200 msg/sec simulated ticker with throttle+batch backpressure
- All of: signal, computed, effect, onMount, Show, For, ErrorBoundary, fromObservable, throttle, batch
- Real Shoelace sl-button + sl-badge in InstallCta with TypeScript-typed prop:/on: bindings
- Generated lit-elements.d.ts IntrinsicElements for all 56 Shoelace components
- SVG namespace fix (createElementNS) making SVG a first-class JSX citizen in /dom
- GitHub Actions Pages deployment workflow with OIDC (no PAT)
- /docs route with 5-section API reference
- All 93 /dom tests passing after the SVG fix

---

_Verified: 2026-02-28T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
