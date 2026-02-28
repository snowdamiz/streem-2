# Phase 6: Landing Page (Dogfood) - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Streem's official landing page, built entirely with Streem itself, deployed to GitHub Pages. Serves as both a marketing page for developers and a live production correctness test for every v1 feature (signals, streaming adapters, `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`, Lit interop). Every integration pain found during this build is treated as a framework bug and fixed before ship.

</domain>

<decisions>
## Implementation Decisions

### Page structure & narrative
- Audience: developer-focused, minimal, code-first (think Solid.js or Astro homepage)
- Headline: "Build reactive UIs that update in microseconds" (performance-led pitch)
- Section order: Hero → Live demo → Features → Code sample → Install CTA
- Visual style: dark mode, monochromatic + accent color

### Live streaming demo
- Scenario: simulated stock ticker / price feed (no backend required)
- 5–8 tickers per table row; each row shows symbol, price, change %, and a sparkline
- Data source: simulated locally in JS — no WebSocket/SSE server; still runs through the full Streem stream pipeline
- Implementation: local Observable/Subject wrapped in the stream adapter so `batch()`, `throttle()`, and backpressure handling are still exercised
- The sparkline and individual price updates must use fine-grained signal writes (not full-list re-renders) to validate `<For>` and signal-level DOM patching under load

### Lit design system integration
- Library: Shoelace (Web Awesome — the npm package `@shoelace-style/shoelace`)
- Components used: `sl-button` for the install/CTA action, `sl-badge` for the version tag
- Integration style: seamless / invisible — no "powered by Shoelace" callout; the components just work
- Must demonstrate typed props (variant, size) and a functional click event handler via Streem's Lit bindings

### Deployment & routing
- Host: GitHub Pages, deployed via GitHub Actions on push to main
- Build: Vite static export with multiple HTML entry points (multi-page app)
- Routes: `/` (landing page) and `/docs` (developer documentation)
- `/docs` content: getting started guide + API reference for core primitives — `signal()`, `computed()`, `effect()`, `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`, and the stream adapters
- Base URL must be configured in `vite.config.ts` for the GitHub Pages path prefix

### Claude's Discretion
- Exact sparkline rendering approach (SVG path vs canvas vs a tiny library)
- CSS design tokens and typography choices (within dark mode, monochromatic + accent constraint)
- Specific accent color
- Loading skeleton design for the ticker table
- GitHub Actions workflow structure
- Error state handling in the streaming demo (`<ErrorBoundary>` placement)
- Exact `vite.config.ts` multi-page entry structure

</decisions>

<specifics>
## Specific Ideas

- The streaming demo must feel like a real use case — simulated stock prices, not random numbers labeled "messages/sec"
- The Shoelace components should feel native to the page; no visible seam between Streem-rendered elements and the web components
- The /docs route should be enough for a developer to be unblocked without visiting GitHub

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-landing-page-dogfood*
*Context gathered: 2026-02-28*
