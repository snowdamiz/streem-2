# Project Research Summary

**Project:** Streem — TypeScript-first JSX/TSX frontend framework with reactive signals and real-time streaming
**Domain:** Custom CSR-only frontend framework (no custom compiler, no VDOM, no SSR)
**Researched:** 2026-02-27
**Confidence:** HIGH (core stack and architecture), MEDIUM (streaming interop patterns, Lit interop tooling)

---

## Executive Summary

Streem occupies a genuine gap in the 2026 frontend landscape: every framework either adds compiler complexity (Svelte runes, Vue Vapor, React Compiler, Qwik optimizer) or treats real-time streaming as an afterthought requiring manual bridging. The research confirms this gap is real and the technical path to filling it is clear. The recommended approach is a layered monorepo with four distinct packages — `@streem/core` (DOM-free signals and owner tree), `@streem/dom` (JSX runtime), `@streem/streams` (stream adapters), and `@streem/lit` (Lit interop types) — assembled into a single `streem` meta-package. This structure is dictated by a strict dependency ordering that emerges from the architecture: nothing can be built before the reactive owner tree, because every other subsystem depends on `onCleanup` for correctness.

The technical bets are sound and low-risk. `alien-signals` (v3.1.2, the benchmark leader) provides the reactive core without any renderer coupling; Vite 7 with native esbuild JSX transform eliminates Babel and any custom compiler step; TypeScript 5.8 with `jsxImportSource` wires the whole thing together without magic. The critical constraint from v1 — no custom compiler, no rune syntax — is validated by competitor analysis (Svelte's compiler costs compound; Qwik never gained adoption due to internal-model exposure) and confirmed as a genuine differentiator for TypeScript-heavy teams and AI tooling. The "no compiler" position is not a limitation — it is the product.

The primary risks are not technical; they are ergonomic. Three failure modes dominate the pitfalls research and all three are invisible to users: signal reads silently going untracked after async boundaries, stream connections leaking on component unmount, and the component-body-runs-once mental model clash for React developers. These must be addressed in Phase 1 with dev-mode warnings, not deferred to documentation. The secondary risk is backpressure: synchronous signal propagation will freeze browsers above ~30 messages/second without `batch()`/`throttle()` primitives, which must ship with the streaming layer, not as a follow-up optimization.

---

## Key Findings

### Recommended Stack

The stack is well-determined with HIGH confidence across the board. `alien-signals` is the unambiguous choice for the reactive core — 3-5x faster than Preact Signals in computed-heavy scenarios, zero dependencies, fully framework-agnostic ESM, and already adopted by Vue 3.6 and XState. The v1/v2 API is deprecated; only v3.x applies. Vite 7 (requires Node 20.19+) with esbuild's native JSX transform handles the JSX compilation pipeline without Babel, and `vite-plugin-dts` with `rollupTypes: true` produces clean dual-publish output. For testing, Vitest 4's Browser Mode (now stable, using Playwright) is required for Lit/Shadow DOM tests — JSDOM cannot register custom elements correctly and will give false-green results. RxJS interop is opt-in via a peer dependency at `streem/rxjs`, not bundled.

**Core technologies:**
- `alien-signals ^3.1`: Reactive primitives (`signal`, `computed`, `effect`, `effectScope`) — fastest benchmark, framework-agnostic, no build plugin needed
- `TypeScript ~5.8`: Language foundation — `jsxImportSource: "streem"` wires JSX types automatically; do NOT adopt TS 7/Project Corsa until mid-2026 stability
- `Vite ^7.0`: Dev server and lib mode build — esbuild handles JSX transform natively; `vite-plugin-dts` emits `.d.ts` declarations
- Custom `jsx-runtime.ts`: The project's own JSX factory — direct DOM creation wired to signal subscriptions, no VDOM
- `vitest ^4.0` + Browser Mode + Playwright: Unit tests in `happy-dom`; real-browser tests for Shadow DOM and Lit interop
- Native browser APIs (WebSocket, EventSource, ReadableStream): Platform-native streaming — no library dependency; adapters wrap them in signals
- `rxjs ^7.8` (peer dep, opt-in): Observable interop — RxJS 8 is on hold, avoid it; native TC39 Observable is Chrome-only and spec-unstable

**Explicit exclusions:** React/ReactDOM (not the runtime), `@preact/signals` full package (renderer coupling), SolidJS primitives (require `createRoot` + Solid scheduler), Babel in the hot path, JSDOM for Lit tests, `@lit/react` (wrong interop direction), any VDOM diffing layer.

### Expected Features

The feature landscape is clearly split between non-negotiable table stakes and the genuine differentiators. The "no compiler" constraint functions as a cross-cutting dependency — every feature decision must pass the test: "does this work without a custom compiler step?"

**Must have — P1 (table stakes + core differentiators):**
- Reactive signals: `createSignal` / `createEffect` / `createMemo` — typed generics, work in any TS file, no destructuring gotcha
- Lifecycle hooks: `onMount` / `onCleanup` — without these, every stream binding is a memory leak
- Component model: function components returning JSX, typed props, children, no re-execution on signal change
- Streaming primitives: `fromWebSocket`, `fromSSE`, `fromReadable`, `fromObservable` — automatic cleanup via `onCleanup`; backpressure (`batch`, `throttle`) ships alongside
- `<Show>` and `<For>`: Reactive conditional and list rendering — JSX-native conditionals work but guided patterns prevent the most common anti-patterns
- `<ErrorBoundary>` and `<Suspense>`: Production-readiness gates; `<Suspense>` must integrate with streaming pending state
- Lit web component interop: Typed `JSX.IntrinsicElements` augmentation; `prop:` / `attr:` / `on:` namespaces; direct event listeners (not delegation)
- Vite HMR integration: Signal state and stream connections must survive hot reload of component files
- AI skills installer: `install-streem-skill.mjs` with progressive-disclosure sub-skills — unique differentiator, low implementation cost
- `create-streem` starter: Zero-friction first run
- Landing page: Dogfood proof — built concurrently with each phase, not as a final step

**Should have — P2 (post-launch additions):**
- DevTools browser extension: Signal graph inspector; add when debugging complexity is observed in dogfood usage
- Extended Observable operator compatibility: Beyond basic subscribe/unsubscribe; add if RxJS users report friction

**Defer to v2+:**
- SSR / hydration: Fundamentally changes the streaming model; explicitly out of scope for v1
- First-party router: Scope creep; recommend TanStack Router; build only if integration friction is persistent
- `bind:` shorthand / v-model: Requires careful design to avoid introducing a proto-compiler

**Confirmed anti-features (do not build):**
- Custom compiler / rune syntax: The v1 lesson. Cost compounds; breaks standard tooling and AI codegen.
- Built-in store library: Signals are already composable state; a store layer adds API surface without capability
- CSS-in-JS / scoped styles: Requires compiler or runtime injection; document Tailwind/CSS Modules instead
- Directive system: JSX operators are sufficient; directives add surface without capability
- Two-way data binding: Hidden data flow; controlled inputs are explicit and TypeScript-friendly

### Architecture Approach

The architecture follows a strict layered monorepo where each package has a single direction of dependency: `core` (zero DOM) ← `dom` (JSX runtime) ← `streams` (adapters, no DOM dep) and `dom` ← `lit` (type augmentations only). The meta-package `streem` re-exports everything. Component functions run exactly once on mount; reactivity lives in JSX expressions and effects, not in repeated function execution. The JSX runtime distinguishes static values from reactive values by checking whether a prop is a function — if it is, it wraps it in an effect that updates only the exact target DOM node. This is the SolidJS mental model and is the correct model for this architecture.

**Major components and their build order:**
1. `@streem/core` — Signal, Memo, Effect, Store, Owner/cleanup tree; zero DOM dependency; testable in Node; build first
2. `@streem/dom` — JSX runtime (`h`, `Fragment`, `render`), reactive DOM bindings; depends on core only
3. `@streem/streams` — `fromWebSocket`, `fromSSE`, `fromReadable`, `fromObservable`; depends on core only, no DOM
4. `@streem/lit` — `JSX.IntrinsicElements` augmentation for Lit custom elements; type-level only, zero runtime cost
5. `streem` meta-package — re-exports all sub-packages; the user-facing npm package
6. `skills/` — `SKILL.md` + sub-skills (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) + `install.mjs`
7. `apps/landing` — dogfood landing page; pain here is a framework regression, not a user issue

The owner/cleanup tree is the most important architectural primitive. Every stream adapter, effect, and component scope must register an owner so that `onCleanup` fires correctly on disposal. This is not optional and cannot be retrofitted — it must be in the first implementation of `@streem/core`.

### Critical Pitfalls

Ten pitfalls were identified. The following five are critical — they are silent, cause production-level failures, and are expensive to retrofit if not addressed in the correct phase.

1. **Signal reads silently untracked after async boundaries** — Any signal read after an `await` is a snapshot, not a live binding. Prevent by: read all signals synchronously before any `await`; provide a `snapshot()` utility; add a dev-mode warning when signals are read with no active owner. Must be in Phase 1 docs and runtime.

2. **Stream subscriptions not disposed on unmount** — Every `fromWebSocket`/`fromSSE` call opens a connection that must be closed. Without owner/scope tracking, subscriptions accumulate. The measured real-world impact is 47% subscription leak prevalence and 13.3 MB heap growth per session. Owner tree must be in Phase 1, stream cleanup integration must be in the streaming phase.

3. **Component body trap (reads outside JSX/effects are not reactive)** — Developers from React expect the function body to re-run. In this architecture it runs once. A signal read in the body is a snapshot. Prevent by: wrapping JSX expressions in reactive boundaries; dev-mode warning when signal is called with no reactive context; prominent docs example in the getting-started guide.

4. **Backpressure: high-frequency streams freeze the browser** — Synchronous signal propagation breaks at >30 writes/second. `batch()`, `throttle()`, and RAF-scheduled flush must ship with the initial streaming API. The landing page must include a high-frequency demo (200 msg/sec) to validate this before release.

5. **Shadow DOM event retargeting breaks JSX event delegation** — Lit components use Shadow DOM; events from inside shadow roots are retargeted. Framework event delegation (document-level listener checking `event.target`) routes incorrectly or fails silently. Use direct `addEventListener` on element refs for Lit events; provide `createLitComponent` wrapper. This must be tested in a real browser — JSDOM will not catch it.

Additional critical pitfalls: circular signal dependencies (need cycle detection with named signals, not stack overflow); TypeScript JSX namespace conflicts with `@types/react` (use module-scoped declarations, not global); Vite virtual module ID conflicts (prefix with `\0`; use `vite-plugin-inspect`).

---

## Implications for Roadmap

The dependency graph from ARCHITECTURE.md dictates a strict build order. Pitfalls add further constraints — certain correctness properties (owner tree, backpressure) cannot be retrofitted and must be in their respective foundational phases.

### Phase 1: Reactive Core
**Rationale:** Everything else depends on `@streem/core`. Signals, memos, effects, and the owner/cleanup tree are the absolute foundation. No DOM, no streams, no JSX — just the reactive graph and scope system. Building this first allows it to be tested in Node with no browser dependency, forces the correct architecture boundary, and prevents the catastrophic technical debt of retrofitting disposal later.
**Delivers:** `@streem/core` package with typed `signal()`, `computed()`, `effect()`, `createRoot()`, `onCleanup()`, `getOwner()`, `runWithOwner()`. Dev-mode warnings for signals read outside reactive scope and computations created outside owner scope.
**P1 features addressed:** Reactive signals primitives, automatic dependency tracking, derived/computed values, lifecycle hooks (`onCleanup` specifically)
**Pitfalls avoided:** Signal disposal on unmount (owner tree), circular dependency infinite loops (cycle detection), signal reads outside reactive scope (dev warnings)
**Research flag:** Standard patterns from SolidJS — well-documented, skip dedicated research phase

### Phase 2: JSX Runtime and DOM Renderer
**Rationale:** The JSX runtime is the second dependency layer. With `@streem/core` stable, the JSX factory can wire reactive bindings to real DOM nodes using the accessor-function pattern. This is where the "no VDOM" claim becomes real: components run once, JSX expressions establish live bindings via effects.
**Delivers:** `@streem/dom` package — `h()`, `Fragment`, `render()`, reactive DOM bindings for text nodes, attributes, and events. `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>` components. `onMount` lifecycle hook. Vite esbuild configuration (`jsxImportSource`) and HMR integration.
**P1 features addressed:** Component model with JSX/TSX, conditional/list rendering, error boundaries, Suspense, HMR state preservation
**Pitfalls avoided:** Component body trap (JSX expressions wrapped in effects), TypeScript JSX type conflicts (module-scoped declarations)
**Research flag:** JSX runtime internals are well-documented via SolidJS patterns — may need targeted research on Suspense + signal pending state integration

### Phase 3: Streaming Primitives
**Rationale:** Streaming is the core differentiator and must be built as a separate package (`@streem/streams`) that depends only on `@streem/core`, keeping it DOM-agnostic. Backpressure primitives must ship in this phase, not as a follow-up — retrofitting `batch()` and `throttle()` after streaming is released creates a breaking API change.
**Delivers:** `@streem/streams` — `fromWebSocket()`, `fromSSE()`, `fromReadable()`, `fromObservable()`, all with automatic `onCleanup` integration and typed connection status signals (`connected | reconnecting | error | closed`). `batch()`, `throttle()`, `debounce()` combinators. `keepLastOnReconnect` option. WebSocket exponential backoff reconnection.
**P1 features addressed:** All four streaming primitives (WebSocket, SSE, ReadableStream, Observable), Suspense as streaming loading state
**Pitfalls avoided:** Stream subscription leaks (onCleanup integration), backpressure freeze (batch/throttle), missed events on reconnect (connection status signal, Last-Event-ID for SSE), SSE auth token leakage (document cookie-based auth)
**Research flag:** May need research phase — WebSocket reconnection strategies, SSE `Last-Event-ID` server coordination, and Observable interop protocol have niche edge cases not fully covered by existing research

### Phase 4: Lit Web Component Interop
**Rationale:** Lit interop is a significant differentiator but has a hard dependency on the JSX runtime (needs the `JSX.IntrinsicElements` namespace from `@streem/dom`) and must be verified against real browser Shadow DOM behavior — not JSDOM. This phase ships primarily as TypeScript declarations with a runtime helper for the event delegation problem.
**Delivers:** `@streem/lit` — `JSX.IntrinsicElements` augmentation with `prop:` / `attr:` / `on:` namespaces. `createLitComponent` wrapper that maps JSX-style event props to direct `addEventListener` calls. CEM analyzer integration for auto-generating types from Lit component manifests. Vitest Browser Mode test suite verifying Shadow DOM event propagation.
**P1 features addressed:** Lit web component interop (typed props, correct event binding, no Shadow DOM suppression)
**Pitfalls avoided:** Shadow DOM event retargeting (direct listeners in wrapper), `any` types for Lit props (CEM-generated types), TypeScript IntelliSense gaps
**Research flag:** `createLitComponent` wrapper design and CEM tooling integration may benefit from a focused research phase — MEDIUM confidence on those specifics

### Phase 5: Package Assembly, CLI, and AI Skills
**Rationale:** The meta-package and scaffolding tools can only crystallize once the sub-package APIs are stable. The AI skills content must reflect the final API surface — writing it earlier means rewriting it when APIs change.
**Delivers:** `streem` meta-package (re-exports all sub-packages), `create-streem` starter template (Vite template with correct `jsxImportSource` config), `skills/` directory with `SKILL.md` + sub-skills + `install.mjs`. TypeDoc-generated API docs.
**P1 features addressed:** `create-streem` CLI, AI skills installer, complete user-facing API surface
**Pitfalls avoided:** API exposing internal concepts (meta-package is the stable API boundary; sub-package internals are not stable)
**Research flag:** Standard patterns — skip research phase

### Phase 6: Landing Page (Dogfood)
**Rationale:** The landing page is not a marketing afterthought — it is the primary correctness test. It must be built after Phase 5 packages are stable but built with the framework exactly as an end user would use it. Pain during this phase means framework regressions, not developer error. It validates every P1 feature under realistic conditions including a high-frequency stream demo.
**Delivers:** Official Streem landing page built with Streem — demonstrates signal-based state, live streaming demo (WebSocket or SSE at >30 msg/sec for backpressure validation), Lit component interop from a real design system, `<Suspense>` loading state, `<ErrorBoundary>` around the stream demo, conditional/list rendering, CSS Modules or Tailwind styling.
**Pitfalls validated:** Backpressure (200 msg/sec perf trace), stream reconnection (network disruption test), Lit events in real browser, HMR state preservation, TypeScript declarations in consuming project
**Research flag:** Standard — skip research phase; the dogfood loop IS the research

### Phase Ordering Rationale

- Phases 1-4 are dictated by the dependency graph: `core` before `dom`, `dom` before `lit`, `streams` after `core` but can overlap with `dom`
- Phase 3 (Streaming) must include backpressure — the pitfalls research is unambiguous that adding it later requires breaking API changes
- Phase 4 (Lit) must use Vitest Browser Mode with Playwright — JSDOM will not surface the Shadow DOM event retargeting bug
- Phase 5 (packaging) cannot precede API stability — the meta-package surface is the stable contract
- Phase 6 (landing page) is deliberately last and treated as a first-class framework correctness test, not a marketing artifact

### Research Flags

Phases likely needing deeper `/gsd:research-phase` during planning:
- **Phase 3 (Streaming):** WebSocket reconnection with exponential backoff, SSE `Last-Event-ID` gap recovery, Observable interop protocol (subscribable interface vs. full RxJS API), and backpressure batching strategy have niche correctness requirements. MEDIUM confidence on current research.
- **Phase 4 (Lit Interop):** `createLitComponent` wrapper design and CEM tooling integration are MEDIUM confidence. The `prop:` / `attr:` / `on:` namespace mapping needs validation against the actual Streem JSX runtime before finalizing.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core):** SolidJS reactive core is well-documented and directly applicable. `alien-signals` API is stable. Owner tree pattern is established.
- **Phase 2 (JSX Runtime):** esbuild JSX transform config is documented. Accessor-function binding pattern is from SolidJS. HMR configuration is Vite-standard.
- **Phase 5 (Packaging):** Vite lib mode + `vite-plugin-dts` is well-trodden. `create-streem` template is straightforward.
- **Phase 6 (Landing Page):** No research needed — this is a consuming application, not a framework subsystem.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core choices verified against official sources. `alien-signals` 3.1.2, Vite 7, Vitest 4, TypeScript 5.8 all confirmed stable. Only MEDIUM on `custom-element-jsx-integration` tooling (community tool, purpose-matched but less battle-tested). |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes confirmed via cross-framework analysis of SolidJS, Svelte 5, Vue 3, Angular signals. Differentiator positioning is pattern-based; no direct competitor data on market reception. |
| Architecture | HIGH | Layered monorepo structure and all core patterns sourced from SolidJS official docs. Owner/cleanup tree, accessor-function binding, stream adapter lifecycle — all verified. Angular WebSocket resource pattern is LOW confidence and used only as a reference. |
| Pitfalls | HIGH | All 10 pitfalls verified against official docs and multiple independent sources. Memory leak data (47% prevalence, 13.3 MB heap growth) sourced from RxJS-based app studies — applicable directionally. |

**Overall confidence:** HIGH on the foundation; MEDIUM on streaming interop edge cases and Lit interop tooling specifics.

### Gaps to Address

- **Observable interop protocol:** Current research recommends accepting the "subscribable interface" (any object with a `.subscribe()` method) rather than requiring RxJS as a peer dep. The exact API surface for `fromObservable` — especially how to handle RxJS Subjects, multicasting, and late subscribers — needs validation during Phase 3 planning.
- **Suspense + streaming pending state integration:** The mechanism by which a stream adapter signals its "pending" state to a `<Suspense>` boundary is described architecturally but not specified at the API level. This needs a concrete design decision before Phase 2 is started.
- **`createLitComponent` wrapper API design:** The wrapper must handle property vs. attribute binding and shadow DOM event mapping. The exact API (function signature, property mapping config) needs design work — current research provides the pattern but not the final shape.
- **HMR state preservation specifics:** Preserving signal state across hot updates requires either `import.meta.hot.data` or a separate state registry. The exact mechanism for the Streem context (no custom Vite plugin in v1) needs validation during Phase 2.
- **SSE auth pattern:** The recommended approach (cookie-based auth for SSE) has proxy infrastructure implications. A fetch-based SSE polyfill that supports custom headers is mentioned but not evaluated for bundle size or compatibility. Validate in Phase 3.

---

## Confirmed Technology Decisions (Final)

These are locked — do not re-evaluate during planning.

| Decision | Choice | Locked Because |
|----------|--------|----------------|
| Signals library | `alien-signals ^3.1` | Benchmark leader, framework-agnostic, adopted by Vue 3.6, no renderer coupling |
| No custom compiler | Hard constraint | V1 lesson; differentiator; validated by competitor analysis |
| No VDOM | Hard constraint | Defeats fine-grained signals; adds reconciliation overhead |
| JSX transform | esbuild via Vite 7 | Native, fastest, no Babel needed |
| TypeScript version | ~5.8 | Current stable; TS 7 is mid-2026 alpha |
| Build tool | Vite 7 lib mode + `vite-plugin-dts` | Vite-native, simpler than tsup for this project |
| Test runner | Vitest 4 | Stable browser mode; required for Lit/Shadow DOM tests |
| Observable interop | RxJS 7.8 (peer dep, opt-in) | RxJS 8 on hold; native TC39 Observable is Chrome-only |
| SSR | Out of scope for v1 | Fundamental complexity; CSR-only is a feature for SPA/dashboard use cases |
| Router | Recommend TanStack Router | Confirmed anti-feature for v1; scope creep |
| CSS | Tailwind / CSS Modules (user choice) | No framework styling; no scoped styles without compiler |

---

## Sources

### Primary (HIGH confidence — official docs)
- [alien-signals GitHub](https://github.com/stackblitz/alien-signals) — API surface, version 3.1.2
- [Vite 7.0 announcement](https://vite.dev/blog/announcing-vite7) — Vite 7 stable, Node 20.19+ requirement, ESM-only
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — Browser Mode stable status
- [TypeScript 5.8 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) — current stable
- [SolidJS Fine-Grained Reactivity Docs](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity) — owner tree, accessor patterns
- [SolidJS createRoot / onCleanup reference](https://docs.solidjs.com/reference/reactive-utilities/create-root) — disposal semantics
- [SolidJS attr: namespace](https://docs.solidjs.com/reference/jsx-attributes/attr) — Lit interop namespace pattern
- [Vite Plugin API](https://vite.dev/guide/api-plugin) — virtual module `\0` convention, transform hooks
- [RxJS 8 roadmap issue](https://github.com/ReactiveX/rxjs/issues/6367) — RxJS 8 on hold confirmed
- [Lit React Interop Docs](https://lit.dev/docs/frameworks/react/) — @lit/react is for React wrappers (confirmed wrong direction)

### Secondary (MEDIUM confidence — community, cross-checked)
- [custom-element-jsx-integration npm](https://www.npmjs.com/package/custom-element-jsx-integration) — CEM JSX type generation for non-React frameworks
- [Vitest Browser Mode vs jsdom discussion](https://github.com/vitest-dev/vitest/discussions/1607) — JSDOM failures on custom elements
- [SolidJS Owner Tree community explanations](https://github.com/solidjs/solid/discussions/719) — disposal semantics cross-checked
- [SSE production pitfalls and proxy buffering](https://sahilserver.substack.com/p/sse-in-production-from-simple-streams) — Nginx `X-Accel-Buffering: no` requirement
- [Backpressure in WebSocket streams](https://skylinecodes.substack.com/p/backpressure-in-websocket-streams) — >30 writes/second threshold
- [Angular Signals reactive context docs](https://medium.com/@eugeniyoz/angular-signals-reactive-context-and-dynamic-dependency-tracking-d2d6100568b0) — async boundary tracking loss
- [Signal-First Architectures — arxiv](https://arxiv.org/html/2506.13815v1) — 47% subscription leak prevalence data

### Tertiary (LOW confidence — reference patterns only)
- [Angular wsResource Pattern](https://medbenmakhlouf.medium.com/introducing-wsresource-a-new-reactive-way-to-work-with-websockets-in-angular-459e181c4168) — pattern reference only, not authoritative for Streem
- [SolidJS signals outside renderer discussion](https://github.com/solidjs/solid/discussions/397) — createRoot requirement, community-sourced

---

*Research completed: 2026-02-27*
*Ready for roadmap: yes*
