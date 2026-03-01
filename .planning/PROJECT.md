# Streem

## What This Is

Streem is a TypeScript-first, JSX/TSX front-end framework built around reactive signals and real-time data streams. It ships as four packages (`@streem/core`, `@streem/dom`, `@streem/streams`, `@streem/lit`) plus a `streem` meta-package, a `create-streem` CLI scaffolder, and a progressive-disclosure AI skills system. The official landing page (`apps/landing`) is built with the framework itself. It targets developers who want fine-grained reactivity (signals, no VDOM diffing) with first-class support for WebSockets, SSE, fetch streams, and observable-style sources — without the complexity of a custom compiler. Styling via CSS Modules and Tailwind CSS v4 is documented and pre-configured in the default template.

## Core Value

Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.

## Requirements

### Validated

- ✓ JSX/TSX authoring with no custom compiler (Vite-powered) — v1.0
- ✓ Fine-grained reactive signals for local and shared state — v1.0
- ✓ First-class streaming primitives: WebSocket, SSE, fetch streams, Observable/RxJS-compatible sources — v1.0
- ✓ Native Lit component interop: import and use Lit web components in TSX with typed props — v1.0
- ✓ AI agent skills installer: script copies SKILL.md + sub-skills into developer AI tools during project init — v1.0
- ✓ Framework skills written with progressive disclosure (SKILL.md → sub-skill files) — v1.0
- ✓ Landing page built with Streem (dogfood proof + official public site) — v1.0
- ✓ CSR-only (browser rendering, no SSR) — v1.0
- ✓ TypeScript IntrinsicElements for all sl-* Shoelace elements in @streem/lit dist/ (vite-plugin-dts beforeWriteFile) — v1.1
- ✓ E2E Playwright test: `npm create streem@latest` CLI scaffold produces a buildable project — v1.1
- ✓ E2E Playwright test: Vite HMR preserves signal state across hot reload — v1.1
- ✓ Reactive core benchmarked (ops/sec) against SolidJS and Preact signals; BENCHMARKS.md committed with methodology — v1.1
- ✓ CSSProperties type exported from @streem/dom and streem meta-package; style prop accepts object — v1.1
- ✓ CSS Modules documented as recommended styling pattern (docs/STYLING.md) — v1.1
- ✓ ClassValue API (string/array/object/mixed) for class/className props; bindStyle stale-key diffing via removeProperty() — v1.1
- ✓ Landing page components migrated from inline style blocks to CSS Modules (dogfood proof) — v1.1
- ✓ Tailwind CSS v4 pre-configured in create-streem default template; proven coexisting with CSS Modules — v1.1

## Current Milestone: v1.2 Documentation & DX Polish

**Goal:** Transform the docs from a functional draft into a polished, on-brand experience that makes Streem easy to learn and trust.

**Target features:**
- Docs site visual overhaul — match landing page theme (dark, consistent, cohesive)
- Logo wired into docs nav (logo.svg already in public/)
- Syntax highlighting on all code blocks in docs
- LAND-01: Benchmark bar chart dogfood component on landing page (deferred from v1.1)
- Expand existing doc sections (more examples, edge cases, TypeScript tips)
- New doc sections: Patterns/recipes, Styling guide, TypeScript guide, Performance/best practices
- Mobile responsiveness for docs layout

### Active

- [ ] LAND-01: Bar chart dogfood component on landing page rendering benchmark comparison data (deferred from v1.1)
- [ ] DOCS-01: Docs site visual design matches landing page theme (dark, consistent, on-brand)
- [ ] DOCS-02: Logo.svg displayed in docs nav header
- [ ] DOCS-03: Syntax highlighting applied to all code blocks in docs
- [ ] DOCS-04: Existing doc sections expanded (more examples, edge cases, TypeScript tips)
- [ ] DOCS-05: Patterns/recipes section added to docs
- [ ] DOCS-06: Styling guide section added to docs (folds in docs/STYLING.md content)
- [ ] DOCS-07: TypeScript guide section added to docs
- [ ] DOCS-08: Performance/best practices section added to docs
- [ ] DOCS-09: Docs layout is responsive and readable on mobile

### Out of Scope

- Custom compiler / rune syntax — v1 lesson: DX overhead compounds without proportional value; breaks standard tooling and AI codegen; Svelte 5's compiler is a cautionary example
- Server-side rendering — Fundamentally changes the streaming model; CSR-only is a valid v1 constraint for SPA/dashboard use cases
- First-party router — Scope creep; TanStack Router covers this well; build only if persistent integration friction is observed
- Built-in store library — Signals with `createRoot` are already composable state; a store layer adds API surface without new capability
- CSS-in-JS / scoped styles runtime — Tailwind CSS v4 and CSS Modules are the documented patterns; no runtime style injection needed
- Directive system (v-if, x-bind style) — JSX operators and `<Show>`/`<For>` components are sufficient
- Two-way data binding (`bind:` shorthand) — Controlled inputs are explicit and TypeScript-friendly
- Virtual DOM / VDOM diffing — Defeats the purpose of fine-grained signals
- `@lit/react` or React wrappers for Lit — Wrong interop direction
- Generating or wrapping Lit components — Interop is consume-only

## Context

**v1.1 shipped 2026-03-01.** 6 phases (7, 8, 9, 9.1, 11, 12), 16 plans, 96 files changed over 2 days.

**v1.0 shipped 2026-02-28.** 6 phases, 21 plans, ~17,684 lines TypeScript/TSX, 186 files.

Tech stack: TypeScript, JSX/TSX (jsxImportSource: "streem"), Vite + tsup, Vitest (Node + Browser/Playwright), pnpm workspaces, Shoelace web components, GitHub Actions (Pages deployment), Tailwind CSS v4 (@tailwindcss/vite), CSS Modules.

Packages:
- `@streem/core` — push-pull reactive graph: signal(), computed(), effect(), createRoot(), onCleanup(), dev-mode warnings; O(1) batchedEffects dedup; lazy Owner init
- `@streem/dom` — JSX runtime: h(), render(), reactive DOM bindings, Show/For/ErrorBoundary/Suspense, Vite HMR; ClassValue API; bindStyle diff; CSSProperties
- `@streem/streams` — fromWebSocket(), fromSSE(), fromReadable(), fromObservable(), batch(), throttle(), debounce()
- `@streem/lit` — bindLitProp(), observeLitProp(), CEM type generation tooling; full sl-* IntrinsicElements in dist/
- `streem` — meta-package barrel re-exporting all primitives
- `create-streem` — CLI scaffolder (npm create streem@latest), now includes Tailwind CSS v4 pre-configured
- `apps/landing` — official landing page (deployed via GitHub Actions to GitHub Pages); CSS Modules + Tailwind v4

**Known tech debt from v1.1:**
- LAND-01: Bar chart dogfood component on landing page not built (Phase 10 skipped; deferred to v1.2)

## Constraints

- **Tech Stack:** TypeScript, JSX/TSX, Vite — no custom compiler or transform step beyond standard JSX
- **Rendering:** CSR only — no Node.js server runtime requirement for the framework itself
- **Interop direction:** Lit interop is consume-only (Lit → Streem, not Streem → Lit)
- **Signals:** Must not require a build plugin to work — signals should be plain TS imports

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Drop rune/compiler approach | v1 proved the complexity/reward ratio is unfavorable | ✓ Good — standard TSX works cleanly, no friction |
| Vite as build foundation | Ecosystem, HMR, plugin support — no bespoke toolchain | ✓ Good — HMR plugin straightforward via hotUpdate hook |
| CSR-only for v1 | Keeps scope tight; SSR adds significant complexity | ✓ Good — no SSR pressure encountered |
| Progressive disclosure for AI skills | Root SKILL.md routes to sub-skills rather than one monolithic doc | ✓ Good — install script verified against 6 tool dirs |
| pnpm workspaces monorepo | All packages share node_modules, faster CI | ✓ Good — workspace protocol prevented version drift |
| external @streem/core in streams build | Prevents reactive singleton duplication across packages | ✓ Good — fixed a real production bug (reactive context lost across package boundary) |
| CEM analyzer for Lit type generation | Auto-generate IntrinsicElements from source, not manual hand-roll | ✓ Good — full Shoelace component catalog typed |
| SVG createElement via innerHTML | SVGElement namespace requires document.createElementNS — JSX factory needed special case | ✓ Good — sparkline renders correctly |
| Reactive signals outside Suspense scope | Streaming signals must be lifted above Suspense boundary to prevent retry-loop on reconnect | ✓ Good — ticker table skeleton bug fixed |
| vite-plugin-dts beforeWriteFile hook for ambient types | rollupTypes (api-extractor) silently drops declare module augmentation blocks | ✓ Good — @streem/lit dist/ now contains full sl-* IntrinsicElements |
| ClassValue recursive union type for class props | Matches clsx API signature; string/array/object all accepted without runtime dependency | ✓ Good — className and class both accepted; classList removed cleanly |
| bindStyle prev-key tracking for removeProperty() | Reactive style updates must remove stale CSS properties or they persist on the element | ✓ Good — stale keys cleaned up correctly in diff |
| Tailwind CSS v4 plugin-only config | No postcss.config.js or tailwind.config.js needed — fully plugin-driven via @tailwindcss/vite | ✓ Good — zero config files, works with CSS Modules simultaneously |
| batchedEffects Set for O(1) dedup | Array.includes is O(n) per flush; Set.add deduplicates in O(1) | ✓ Good — ~12% signal throughput improvement in benchmarks |
| Lazy Owner children/cleanups init (null vs []) | No empty array allocation on createRoot that never registers children | ✓ Good — reduces GC pressure in heavy signal graphs |
| Phase 10 skipped; bar chart deferred to v1.2 | CSS Modules goal absorbed by Phase 11; bar chart non-blocking for v1.1 quality goals | — Deferred — LAND-01 active requirement for next milestone |

---
*Last updated: 2026-03-01 after v1.2 milestone started*
