# Streem

## What This Is

Streem is a TypeScript-first, JSX/TSX front-end framework built around reactive signals and real-time data streams. It ships as four packages (`@streem/core`, `@streem/dom`, `@streem/streams`, `@streem/lit`) plus a `streem` meta-package, a `create-streem` CLI scaffolder, and a progressive-disclosure AI skills system. The official landing page (`apps/landing`) is built with the framework itself. It targets developers who want fine-grained reactivity (signals, no VDOM diffing) with first-class support for WebSockets, SSE, fetch streams, and observable-style sources — without the complexity of a custom compiler.

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

## Current Milestone: v1.1 Quality & Polish

**Goal:** Resolve known v1.0 gaps and surface Streem's performance story publicly.

**Target features:**
- Fix LIT-04: ship JSX IntrinsicElements for sl-* elements in @streem/lit dist/
- E2E tests: Playwright coverage for create-streem CLI scaffold flow and HMR signal state preservation
- Performance benchmarks: reactive core vs SolidJS/Preact signals, documented internally
- Landing page benchmark bar chart: dogfooded Streem component showing perf comparison
- Additional unit test coverage: @streem/dom and @streem/streams edge cases

### Active

- [ ] LIT-04: JSX IntrinsicElements for sl-* elements in @streem/lit dist/
- [ ] E2E Playwright tests for create-streem CLI scaffold
- [ ] E2E Playwright tests for HMR signal state preservation
- [ ] Reactive core performance benchmarks vs SolidJS/Preact signals
- [ ] Landing page benchmark bar chart component (Streem dogfood)
- [ ] Additional unit coverage for @streem/dom and @streem/streams edge cases

### Out of Scope

- Custom compiler / rune syntax — v1 lesson: DX overhead compounds without proportional value; breaks standard tooling and AI codegen; Svelte 5's compiler is a cautionary example
- Server-side rendering — Fundamentally changes the streaming model; CSR-only is a valid v1 constraint for SPA/dashboard use cases
- First-party router — Scope creep; TanStack Router covers this well; build only if persistent integration friction is observed
- Built-in store library — Signals with `createRoot` are already composable state; a store layer adds API surface without new capability
- CSS-in-JS / scoped styles — Requires either a compiler transform or runtime style injection; document Tailwind and CSS Modules instead
- Directive system (v-if, x-bind style) — JSX operators and `<Show>`/`<For>` components are sufficient
- Two-way data binding (`bind:` shorthand) — Controlled inputs are explicit and TypeScript-friendly
- Virtual DOM / VDOM diffing — Defeats the purpose of fine-grained signals
- `@lit/react` or React wrappers for Lit — Wrong interop direction
- Generating or wrapping Lit components — Interop is consume-only

## Context

**v1.0 shipped 2026-02-28.** 6 phases, 21 plans, ~17,684 lines TypeScript/TSX, 186 files.

Tech stack: TypeScript, JSX/TSX (jsxImportSource: "streem"), Vite + tsup, Vitest (Node + Browser/Playwright), pnpm workspaces, Shoelace web components, GitHub Actions (Pages deployment).

Packages:
- `@streem/core` — push-pull reactive graph: signal(), computed(), effect(), createRoot(), onCleanup(), dev-mode warnings
- `@streem/dom` — JSX runtime: h(), render(), reactive DOM bindings, Show/For/ErrorBoundary/Suspense, Vite HMR
- `@streem/streams` — fromWebSocket(), fromSSE(), fromReadable(), fromObservable(), batch(), throttle(), debounce()
- `@streem/lit` — bindLitProp(), observeLitProp(), CEM type generation tooling
- `streem` — meta-package barrel re-exporting all primitives
- `create-streem` — CLI scaffolder (npm create streem@latest)
- `apps/landing` — official landing page (deployed via GitHub Actions to GitHub Pages)

**Key v1 lesson:** Drop the rune/compiler approach entirely — standard TSX via Vite is the right call.

**Known tech debt from v1.0:**
- LIT-04 type augmentation not in dist/: JSX IntrinsicElements for sl-* elements fall back to catch-all (runtime unaffected)
- Phase 6 VERIFICATION.md predates final sl-badge/Suspense fixes — documentation staleness only
- HMR, E2E CLI, and performance profiling require interactive environments — not statically verifiable

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

---
*Last updated: 2026-02-28 after v1.1 milestone start*
