# Feature Research

**Domain:** JSX/TSX frontend framework with reactive signals and real-time streaming (CSR-only)
**Researched:** 2026-02-27
**Confidence:** HIGH (for table stakes from cross-framework analysis) / MEDIUM (for differentiators — pattern-based, not direct competitor data)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any JSX/TSX framework must have or developers will not adopt. Missing any of these = developers assume the framework is incomplete or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reactive signals primitives (`createSignal`, `createEffect`, `createMemo`) | All major frameworks (Svelte 5, Solid, Vue 3, Angular, Preact) now ship signals-first. Developers entering the signals ecosystem expect `signal`/`computed`/`effect` as the baseline API — not just `useState` clones. | MEDIUM | Core to the value proposition. Must work without any build plugin — plain TS imports only. Gotcha: no destructuring on stores/props or reactivity breaks (same rule as Solid). |
| Component model with JSX/TSX support | Developers expect to write components as functions returning JSX. TSX file extension, typed props, children. Anything else raises a "why?" that the framework must answer. | LOW | Standard Vite JSX transform covers this. No custom compiler needed. |
| TypeScript-first API | 48.8% of professional devs use TypeScript (SO 2025); surpassed JS on GitHub in Aug 2025. Untyped framework APIs are a non-starter for adoption. Streem targeting developers who "want fine-grained reactivity" skews toward TypeScript-heavy teams. | LOW | All exported primitives must have precise generics. `Signal<T>`, `Computed<T>`, etc. Not "TS compatible" — TS-first. |
| Automatic dependency tracking in effects | Developers coming from Solid/Vue/Svelte expect effects to track their reactive dependencies automatically, without dependency arrays. Manual dep arrays (React-style) are perceived as friction in a signals framework. | MEDIUM | This is one of the core ergonomic wins that makes signals compelling over React hooks. |
| Derived/computed values (memo) | Every signals framework ships this. It is the reactive spreadsheet cell model: derived values that re-compute only when their sources change. Without it, developers hand-roll derived state incorrectly. | LOW | Standard computed/memo primitive. Should be lazy (pull-based). |
| Conditional rendering and list rendering primitives | React developers expect `{condition && <X />}` and `.map()` for lists. Signal-based frameworks often need special primitives here (`<Show>`, `<For>`) to avoid reactivity bugs. Without guidance, developers will write broken patterns. | MEDIUM | Need either clear documentation that native JSX conditionals work, or explicit `Show`/`For` components if needed for correctness. Solid requires these; must decide Streem's model. |
| Props typing and children support | Typed props with defaults, optional vs. required props, typed children. Developers expect this to "just work" with TypeScript and JSX. | LOW | Standard JSX/TS generics. `FC<Props>` pattern or equivalent. |
| Lifecycle hooks (`onMount`, `onCleanup`) | Every framework ships mount/unmount equivalent. Developers need to attach event listeners, start subscriptions, and clean them up. Without `onCleanup`, resource leaks are guaranteed. | LOW | Two functions. Critical for stream subscriptions to not leak. |
| Error boundaries | Production apps crash. Developers expect a way to catch component-tree errors and show fallback UI. Missing this = framework is not production-ready. React, Solid, Vue all have this. | MEDIUM | Can be a component (`<ErrorBoundary>`). Not complex to implement, but necessary. |
| Suspense / async loading boundaries | Loading states for async data are a daily need. Developers expect `<Suspense fallback={<Spinner />}>` pattern. All major frameworks ship this. Especially important for a streaming-first framework. | MEDIUM | Deep synergy with streaming primitives — a `<Suspense>` boundary that works with stream-backed signals is table stakes for the streaming value proposition. |
| HMR (Hot Module Replacement) during development | Vite provides this. Frameworks must integrate with Vite's HMR to preserve signal state on component edits. Without it, developers lose state on every save, which is painful in a signals framework. | MEDIUM | Vite plugin integration. Solid has `vite-plugin-solid`; Streem needs equivalent or documented HMR behavior. |
| Bundle size that is not embarrassing | Solid is ~7kb, Svelte compiles to tiny output, Vue is ~34kb. A signals framework that ships 150kb runtime will be mocked. Developers check `npm bundle-phobia` before adopting. | LOW (design constraint) | No VDOM = natural advantage. The signals runtime should be small. |
| Clear, runnable starter / `create` command | Every modern framework ships `npm create [framework]@latest`. Without a zero-friction start, developers don't explore. | LOW | CLI or Vite template. Can be minimal but must exist. |
| Documentation with examples | Not optional for open source adoption. Developers need to self-serve. Framework without docs is evaluated as abandoned. | MEDIUM (ongoing) | Covered by the AI skills installer — but must also have web-readable docs. |

---

### Differentiators (Competitive Advantage)

Features that set Streem apart from React, Solid, Svelte, Vue, and Qwik. These are the reasons a developer chooses Streem over an established alternative.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| First-class streaming primitives (WebSocket, SSE, ReadableStream, Observable) | No other CSR framework treats streams as first-class reactive sources. React requires hand-rolling `useEffect`/`useState` pairs. Solid has `createResource` for async but no stream-specific primitives. Angular uses RxJS but requires `toSignal` bridging. Streem eliminates the bridge: `stream.bind(signal)` just works. | HIGH | This is the core differentiator. The 2025 pattern in Angular/RxJS is: stream async data → bridge to signals. Streem collapses this to one step. All four stream types must bind without manual subscription management in userland. |
| Observable/RxJS-compatible source binding | The dominant 2025 pattern for real-time Angular apps is Observables for async + signals for UI — connected via `toSignal`. Streem making Observable sources natively bindable means Angular developers migrating can bring their observable streams. Also opens the door to RxJS operators as transform pipeline. | MEDIUM | Observable interop without requiring RxJS as a peer dependency. Accept the interop protocol (subscribable interface), not the library. |
| No custom compiler / no rune syntax | Every other signals framework adds compiler magic: Svelte 5 requires runes in `.svelte` files, Svelte 6 is adding a Rust compiler, Qwik has an optimizer, Vue Vapor is compiler-driven. Streem's `v1 lesson` is directly relevant here: compiler complexity has a cost that didn't pay off. A framework that is plain TypeScript imports with standard Vite JSX is genuinely unusual and appeals to developers burned by framework-specific transforms. | LOW (this is the constraint, not the build cost) | Differentiator is absence of complexity. Must be communicated clearly in docs/landing page: "no magic, no compiler, no runes." |
| Lit web component interop (consume-only) | Design systems built on Lit are increasingly common (Salesforce, GitHub, Adobe). A frontend framework with first-class typed Lit interop lets teams drop in their Lit component library without wrapper components or ref hacks. React's Lit interop requires `@lit-labs/react`. Streem's native TSX + typed props interop is cleaner. | MEDIUM | Consume-only direction (Lit → Streem). Focus on: typed props that respect Lit's property/attribute distinction, correct event binding, no Shadow DOM suppression. |
| AI agent skills installer | No other frontend framework ships a structured skill document for AI coding assistants at install time. Given that TypeScript + typed codebases improve AI code generation by ~20% (2025 data), and Streem targets experienced developers using AI tools, this is a genuine DX differentiator. `npx create-streem` copies SKILL.md + sub-skills into the developer's AI tool directories. | LOW | The progressive disclosure model (root SKILL.md routes to sub-skills: components, signals, streaming, Lit interop) is the right design. Sub-skills are independently loadable context. |
| Streaming primitives that work as Suspense sources | Combining streams + Suspense means developers can write `<Suspense fallback={<Loading />}><LiveData stream={ws} /></Suspense>` and the boundary manages loading state automatically as the stream delivers data. This is not available in any competitor today without manual orchestration. | HIGH | Requires tight integration between streaming primitives and Suspense boundaries. High value for the landing page (live demo) and for real-world chat/dashboard/feed UIs. |
| Signals that work in any TS file (not component-scoped) | Vue 3 and Solid already do this; Svelte 5 is restricted to `.svelte` files. Streem, built as plain TS primitives, naturally achieves this. Emphasizing it explicitly positions Streem against Svelte's limitation and appeals to developers who want reactive business logic outside components. | LOW (natural from the architecture) | Document this explicitly. Signals in services, stores, utilities — same primitives, no special file extension. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build. These create complexity, scope creep, or contradict the v1 lesson.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Custom compiler / rune syntax | "Svelte-style DX looks ergonomic; could Streem have `$signal` syntax?" | This is exactly v1's mistake. A custom compiler adds a transform step, breaks standard TypeScript tooling, requires ongoing maintenance, confuses AI coding assistants, and creates a non-standard debugging experience. Svelte 6 is moving to Rust for their compiler — the cost compounds. The `v1 lesson` is a primary constraint. | Standard `createSignal()` / `signal()` imports. Explicit beats magic for TypeScript developers. |
| Server-side rendering (SSR) | "React and Next.js do SSR; does Streem?" | SSR requires a Node.js server runtime, hydration logic, serialization of signal state, and significantly complicates the streaming model (streaming SSR and streaming WebSocket/SSE interact in non-obvious ways). CSR-only keeps the scope tight and the v1 footprint achievable. | Explicitly document as out of scope for v1. The CSR-only constraint is a feature for developers building SPAs and dashboards. |
| Built-in router | "Every framework ships a router." | A router brings opinions about navigation, data loading, code splitting, nested layouts, search params, and history management. It is a framework-within-a-framework. SolidJS's Ryan Carniato deliberately kept routing out of Solid core because it "brings a lot more opinions around app structure, data fetching, cache invalidation." For v1, this is true scope creep. | Document TanStack Router or Solid Router as the recommended integration. Supply a minimal example in the starter template. The dogfood landing page is single-page and does not need routing anyway. |
| Built-in global state management / store library | "Vuex/Pinia/Zustand pattern — where is the store?" | Signals are already a composable state primitive. A separate store layer on top adds API surface, a migration path to manage, and duplicates reactivity. The 2025 consensus is that signals-first frameworks handle global state via shared signal modules, not dedicated store libraries. | Document the pattern: export signals from a shared module, import them in components. This is the idiomatic approach in Solid and Angular's new signals model. |
| Two-way data binding (v-model style) | "Vue's `v-model` is convenient for forms." | Two-way binding creates hidden data flow that is hard to trace, especially in a framework positioning around explicit, traceable reactivity. It is also a compiler feature in Vue/Svelte — adding it without a compiler requires either a directive system or a wrapper that obscures what is happening. | Controlled inputs: `value={signal()}` + `onInput={e => setSignal(e.target.value)}`. Explicit, debuggable, works with TypeScript's type narrowing. Can extract into a `useInput` helper. |
| CSS-in-JS / scoped styles system | "Svelte and Vue have scoped `<style>` blocks." | Scoped styles require either a compiler transform (contradicts no-compiler constraint) or a runtime CSS injection approach that has specificity issues and poor devtools experience. CSS-in-JS libraries have been declining in the React ecosystem since 2022 due to runtime cost. | Document Tailwind CSS or CSS Modules as the styling approach. Standard, zero-runtime, excellent TypeScript tooling. The landing page should demonstrate this pattern. |
| Directive system (v-if, v-for, x-bind style) | "Directives are ergonomic for template logic." | Directives require either a compiler (to transform `v-if` to conditional expressions) or a runtime directive registry that mirrors what JSX already provides natively. They add API surface without capability. | JSX conditionals (`{condition && <X />}`) and `<Show>` / `<For>` components are sufficient. Standard JSX operators are already familiar to the target audience. |
| Opinionated form handling library | "React Hook Form, Formik equivalents?" | Form state management at the framework level is highly opinionated, domain-specific, and not core to the signals+streaming value proposition. Third-party libraries already solve this well. | Document compatibility with TanStack Form or custom signal-based patterns. Do not ship form primitives in core. |
| Animations / transition system | "Svelte's built-in transitions are loved." | Animations are a non-trivial subsystem (enter/exit coordination, spring physics, keyframes) that are entirely orthogonal to signals and streaming. Every major framework that ships animations has them as a separate package. | Document compatibility with Motion (formerly Framer Motion) or the Web Animations API. The landing page can use CSS transitions. |
| GraphQL / data-fetching layer | "Apollo or urql style integration?" | Opinionated data fetching ties Streem to a specific backend contract. The streaming primitives already cover WebSocket/SSE subscriptions. REST and GraphQL queries can be handled by fetch + signals pattern, or by third-party libraries. | Show examples: `createResource`-equivalent for async fetch, streaming for real-time. Let developers bring their own data fetching strategy. |

---

## Feature Dependencies

```
[TypeScript-first API]
    └──required by──> [Reactive signals primitives]
    └──required by──> [Lit web component interop]
    └──required by──> [Streaming primitives]

[Reactive signals primitives]
    └──required by──> [Derived/computed values]
    └──required by──> [Automatic dependency tracking]
    └──required by──> [Streaming primitives] (streams bind to signals)
    └──required by──> [Context / shared state pattern]

[Lifecycle hooks (onMount, onCleanup)]
    └──required by──> [Streaming primitives] (stream cleanup on unmount)
    └──required by──> [Lit web component interop] (event listener cleanup)

[Streaming primitives]
    └──enhances──> [Suspense / async loading boundaries]
    └──required by──> [Observable/RxJS-compatible binding]

[Component model with JSX/TSX]
    └──required by──> [Error boundaries]
    └──required by──> [Suspense / async loading boundaries]
    └──required by──> [Conditional/list rendering primitives]

[Vite HMR integration]
    └──enhances──> [Developer experience during landing page build]

[AI skills installer]
    └──enhances──> [Onboarding DX for all other features]
    └──no hard dependency on any runtime feature]
```

### Dependency Notes

- **Streaming primitives require lifecycle hooks:** All four stream types (WebSocket, SSE, ReadableStream, Observable) open connections that must be cleaned up. `onCleanup` is the mechanism. Without it, every stream binding is a memory leak.
- **Suspense enhances streaming:** Suspense boundaries can display loading state while a stream has not yet delivered its first value. This requires streaming primitives to signal their "pending" state to the Suspense boundary.
- **Lit interop requires TypeScript-first API:** Lit components expose typed properties. The interop layer must generate or accept TypeScript type definitions for Lit element properties to provide the typed-props DX claimed in PROJECT.md.
- **No-compiler constraint is a cross-cutting dependency:** Every feature decision must be validated against "does this work without a custom compiler step?" — signals as TS imports, JSX via standard transform, no rune syntax, no directive compiler.

---

## MVP Definition

### Launch With (v1)

Minimum viable for the Streem open source release and dogfood landing page.

- [ ] `createSignal` / `signal` — typed reactive primitive, works in any TS file
- [ ] `createEffect` / `effect` — auto-tracked effects, no dependency arrays
- [ ] `createMemo` / `computed` — lazy derived values
- [ ] `onMount` / `onCleanup` — lifecycle for subscriptions and DOM events
- [ ] Component model: function components returning JSX, typed props, children
- [ ] Streaming primitives: bind WebSocket, SSE, ReadableStream, and Observable sources to signals — with automatic cleanup via `onCleanup`
- [ ] `<Show>` and `<For>` (or documented JSX-native equivalent) for safe conditional and list rendering
- [ ] `<ErrorBoundary>` — catch errors in component subtrees
- [ ] `<Suspense>` — loading fallback for async/stream-backed signals
- [ ] Lit web component interop — consume Lit elements in TSX with typed props and correct event binding
- [ ] AI skills installer — `install-streem-skill.mjs` copies SKILL.md + sub-skills into developer AI tool directories
- [ ] Vite plugin or documented HMR integration — preserve signal state on component hot reload
- [ ] `create-streem` starter template (or Vite template) — zero-friction first run
- [ ] Landing page built with Streem — dogfoods all v1 features, proves the stack

### Add After Validation (v1.x)

Add these once core is shipped and real-world friction is observed.

- [ ] `<Transition>` / stream-to-Suspense coordination — add when landing page animations reveal gaps
- [ ] DevTools integration — browser extension for inspecting signal graph; add when debugging complexity is observed in dogfood usage
- [ ] More complete Observable operator compatibility — extend Observable binding beyond subscribe/unsubscribe if RxJS users report friction
- [ ] Type-safe Lit element auto-discovery — if manually writing Lit prop types proves painful, generate them from Lit's metadata

### Future Consideration (v2+)

Defer until product-market fit is established.

- [ ] SSR / hydration — explicitly out of scope for v1; reconsider when CSR-only becomes a blocker for target use cases
- [ ] Router (first-party) — current position: recommend TanStack Router; build only if integration friction is consistently reported
- [ ] Svelte-like `bind:` shorthand — only if the controlled input pattern is universally complained about; requires careful design to avoid introducing a proto-compiler

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Reactive signals (`createSignal`, `createEffect`, `createMemo`) | HIGH | MEDIUM | P1 |
| Streaming primitives (WebSocket, SSE, ReadableStream, Observable) | HIGH | HIGH | P1 |
| TypeScript-first API | HIGH | LOW | P1 |
| Lifecycle hooks (`onMount`, `onCleanup`) | HIGH | LOW | P1 |
| Component model + JSX/TSX | HIGH | LOW | P1 |
| Lit web component interop | HIGH | MEDIUM | P1 |
| `<ErrorBoundary>` | MEDIUM | MEDIUM | P1 |
| `<Suspense>` + stream loading state | HIGH | HIGH | P1 |
| AI skills installer | HIGH | LOW | P1 |
| Conditional/list rendering (`<Show>`, `<For>`) | MEDIUM | LOW | P1 |
| Vite HMR integration | HIGH | MEDIUM | P1 |
| `create-streem` starter template | MEDIUM | LOW | P1 |
| Landing page (dogfood proof) | HIGH | MEDIUM | P1 |
| Observable operator compatibility | MEDIUM | MEDIUM | P2 |
| DevTools browser extension | HIGH | HIGH | P2 |
| `<Transition>` / animation helpers | LOW | HIGH | P3 |
| SSR / hydration | MEDIUM | HIGH | P3 |
| First-party router | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | React 19 | Solid 1.x | Svelte 5 | Vue 3 | Qwik | Streem (v1) |
|---------|----------|-----------|----------|-------|------|-------------|
| Signals / fine-grained reactivity | Compiler memoization (not true signals) | Native signals | Runes (compiler-required) | `ref`/`reactive` (signals-like) | Signals | Native signals, plain TS imports |
| No custom compiler | No (React Compiler) | Yes (JSX transform only) | No (rune compiler) | Partial (optional Vapor) | No (optimizer) | Yes — hard constraint |
| First-class streaming (WS/SSE/Observable) | No (manual `useEffect`) | No (`createResource` for async only) | No | No | No | Yes — core differentiator |
| Lit web component interop | Via `@lit-labs/react` wrapper | Via JSX namespaced props | Standard HTML | Standard HTML | Standard HTML | Native TSX with typed props |
| TypeScript-first | Good | Good | Good | Good | Good | Strong (all primitives generic) |
| Works in non-component TS files | Yes (hooks: no; signals: N/A) | Yes | No (runes: `.svelte` files only) | Yes | Partial | Yes |
| Lifecycle hooks | `useEffect` + cleanup fn | `onMount`, `onCleanup` | `onMount`, `onDestroy` | `onMounted`, `onUnmounted` | `useVisibleTask$` | `onMount`, `onCleanup` |
| `<Suspense>` | Yes | Yes | Partial | Yes | Yes (resumable) | Yes |
| `<ErrorBoundary>` | Yes | Yes | Partial | Yes | Yes | Yes |
| AI skills installer | No | No | No | No | No | Yes (unique) |
| SSR support | Yes (Next.js) | Yes (SolidStart) | Yes (SvelteKit) | Yes (Nuxt) | Yes (native) | No (v1) |
| Built-in router | No (React Router) | No (separate pkg) | Yes (SvelteKit) | No (Vue Router) | Yes (Qwik City) | No (recommend TanStack Router) |

---

## Dogfood Constraint Analysis

The landing page must be built with Streem. Features that make the landing page painful are framework bugs, not missing features.

**What the landing page needs from the framework:**
- Signal-based reactive state (counter, demo interactions)
- At least one live streaming demo (WebSocket or SSE feed — this is the centerpiece)
- A Lit component demonstrating interop (real-world component from a design system)
- Conditional rendering (feature toggle sections, demo state)
- List rendering (feature list, testimonials, etc.)
- Error boundaries (around the streaming demo — stream may fail)
- Suspense (loading state while stream connects)
- Styled with CSS Modules or Tailwind (no framework-provided styling)
- Static-ish content that is fast on first load (CSR is fine; landing page is not SEO-critical)

**Anti-features validated by dogfood test:**
- Router: not needed for a single-page landing page — confirms anti-feature status
- SSR: landing page works fine as CSR — confirms out-of-scope for v1
- Custom compiler: would have made the landing page harder to build, not easier — confirms v1 lesson

---

## Sources

- SolidJS documentation: [Signals](https://docs.solidjs.com/concepts/signals), [Fine-grained reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity), [Solid Router](https://docs.solidjs.com/solid-router)
- [SolidJS Creator on Confronting Web Framework Complexity](https://thenewstack.io/solidjs-creator-on-confronting-web-framework-complexity/)
- [How JS Meta-Framework SolidStart Became Router Agnostic](https://thenewstack.io/how-js-meta-framework-solidstart-became-router-agnostic/)
- [Svelte 5 2025 Review: Runes and Other Exciting New Features](https://www.scalablepath.com/javascript/svelte-5-review)
- [Svelte in 2025: The Compile-Time Rebel That's Quietly Conquering Frontend](https://dev.to/krish_kakadiya_5f0eaf6342/svelte-in-2025-the-compile-time-rebel-thats-quietly-conquering-frontend-1n84)
- [JavaScript Framework Trends in 2026](https://www.nucamp.co/blog/javascript-framework-trends-in-2026-what-s-new-in-react-next.js-vue-angular-and-svelte)
- [SolidJS for React Developers](https://marmelab.com/blog/2025/05/28/solidjs-for-react-developper.html)
- [Sharing Signals and Stores: Context API in SolidJS](https://www.thisdot.co/blog/sharing-signals-and-stores-context-api-in-solidjs)
- [Angular & RxJS in 2025: The Expert's Playbook](https://dev.to/cristiansifuentes/angular-rxjs-in-2025-the-experts-playbook-signals-rxjs-8-and-interop-28ed)
- [Reactive + Functional UI Patterns in TypeScript and F#](https://developersvoice.com/blog/frontend/reactive-functional-ui-patterns/)
- [Lit for React Developers — Google Codelabs](https://codelabs.developers.google.com/codelabs/lit-2-for-react-devs)
- [Lit Framework Interoperable Component Libraries](https://dev.to/reggi/framework-interoperable-component-libraries-using-lit-web-components-43ac)
- [React – Lit interop docs](https://lit.dev/docs/frameworks/react/)
- [Hooks vs. Signals: The great reactivity convergence explained](https://blog.logrocket.com/signals-vs-hooks-reactivity-models/)
- [JavaScript Frameworks — Heading into 2025](https://dev.to/this-is-learning/javascript-frameworks-heading-into-2025-hkb)
- [JavaScript Frameworks — Heading into 2026](https://dev.to/this-is-learning/javascript-frameworks-heading-into-2026-2hel)
- [Trends That Defined JavaScript in 2025](https://thenewstack.io/trends-that-defined-javascript-in-2025/)
- [SPA Routing Best Practices](https://docsallover.com/blog/ui-ux/spa-routing-and-navigation-best-practices/)
- [Signal-First Architectures: Rethinking Front-End Reactivity](https://arxiv.org/html/2506.13815v1)
- [Optimizing JavaScript Delivery: Signals v React Compiler](https://redmonk.com/kholterhoff/2025/05/13/javascript-signals-react-compiler/)
- [JavaScript Framework Showdown: React vs. Vue vs. SolidJS in 2025](https://dev.to/hamzakhan/javascript-framework-showdown-react-vs-vue-vs-solidjs-in-2025-hpc)

---
*Feature research for: Streem — JSX/TSX frontend framework with reactive signals and real-time streaming*
*Researched: 2026-02-27*
