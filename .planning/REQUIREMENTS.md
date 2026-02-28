# Requirements: Streem

**Defined:** 2026-02-27
**Core Value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.

## v1 Requirements

### Reactive Signals

- [x] **SIGNAL-01**: Developer can create a typed reactive signal with an initial value using `signal()` from a plain TypeScript file — no build plugin required
- [x] **SIGNAL-02**: Developer can derive computed values that auto-update using `computed()` without manual dependency arrays
- [x] **SIGNAL-03**: Developer can create side effects that auto-track their reactive dependencies using `effect()` without dependency arrays
- [x] **SIGNAL-04**: Developer can scope reactive computations using `createRoot()` so that all nested effects and signals are disposed when the root is disposed
- [x] **SIGNAL-05**: Developer can register cleanup callbacks using `onCleanup()` that fire when the containing reactive scope is disposed

### Component Model

- [ ] **COMP-01**: Developer can write components as TypeScript functions returning JSX with fully typed props
- [ ] **COMP-02**: Component function body runs exactly once on mount; reactivity lives in JSX expressions and effects, not in repeated function re-execution
- [ ] **COMP-03**: Developer can use `onMount()` to run code after a component is first mounted to the DOM
- [ ] **COMP-04**: Developer can render conditional content with a `<Show>` component that preserves reactive tracking inside the true branch
- [ ] **COMP-05**: Developer can render lists with a `<For>` component that fine-grain-updates individual items without re-rendering the whole list
- [ ] **COMP-06**: Developer can catch errors thrown by child components using `<ErrorBoundary>` and render fallback UI
- [ ] **COMP-07**: Developer can show a loading fallback while async or stream-backed signals are in a pending state using `<Suspense>`

### JSX Runtime

- [ ] **JSX-01**: Developer configures Streem's JSX runtime via `jsxImportSource: "streem"` in `tsconfig.json` with no Babel or custom compiler step required
- [ ] **JSX-02**: Reactive signal values used in JSX update only the exact affected DOM node — no full component re-render triggered
- [ ] **JSX-03**: Vite dev server preserves signal state and stream connection state across hot module reloads of component files

### Streaming Primitives

- [ ] **STREAM-01**: Developer can bind a WebSocket connection to a signal using `fromWebSocket()` — connection is automatically closed via `onCleanup()` when the component unmounts
- [ ] **STREAM-02**: Developer can bind a Server-Sent Events stream to a signal using `fromSSE()` — connection is automatically closed via `onCleanup()` when the component unmounts
- [ ] **STREAM-03**: Developer can bind a WHATWG `ReadableStream` (Fetch API) to a signal using `fromReadable()` — stream is automatically cancelled via `onCleanup()` when the component unmounts
- [ ] **STREAM-04**: Developer can bind an Observable or RxJS source to a signal using `fromObservable()` — subscription is automatically unsubscribed via `onCleanup()` when the component unmounts
- [ ] **STREAM-05**: Developer can batch multiple synchronous signal writes using `batch()` to prevent browser freeze on high-frequency streams (>30 messages/second)
- [ ] **STREAM-06**: Developer can throttle or debounce signal updates from streams using `throttle()` and `debounce()` combinators
- [ ] **STREAM-07**: Each stream adapter exposes a typed connection-status signal reflecting the current state (`connected | reconnecting | error | closed`)
- [ ] **STREAM-08**: WebSocket adapter automatically reconnects with exponential backoff on connection loss

### Lit Web Component Interop

- [ ] **LIT-01**: Developer can import and render Lit web components in TSX files with TypeScript-typed props — no runtime wrapper library required
- [ ] **LIT-02**: Lit component property bindings use a `prop:` namespace prefix in JSX to route values to element properties rather than HTML attributes
- [ ] **LIT-03**: Lit component event listeners attach directly to the element ref (not via JSX event delegation) to prevent Shadow DOM event retargeting failures
- [ ] **LIT-04**: Developer can auto-generate JSX `IntrinsicElements` type declarations for Lit components by running the Custom Elements Manifest analyzer against the component source

### Developer Experience

- [ ] **DX-01**: Developer can bootstrap a new Streem project using `create-streem` (or `npm create streem@latest`) with a Vite template that has correct `jsxImportSource` config and TypeScript setup out of the box
- [x] **DX-02**: Dev-mode runtime emits a console warning when a signal is read outside any reactive tracking context (likely a snapshot bug)
- [x] **DX-03**: Dev-mode runtime emits a console warning when a reactive computation is created without an active owner scope (likely a disposal bug)

### AI Skills Installer

- [ ] **SKILL-01**: Developer can run `install-streem-skill.mjs` to copy Streem's `SKILL.md` and sub-skill files into their AI tool directories (Claude, Codex, Copilot, Gemini, Windsurf, OpenCode)
- [ ] **SKILL-02**: Streem skill files use progressive disclosure — a root `SKILL.md` routes to topic sub-skills (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`)

### Landing Page (Dogfood)

- [ ] **LAND-01**: Official Streem landing page is built using Streem itself — every v1 feature must be used in production on the page before the framework ships
- [ ] **LAND-02**: Landing page includes a live streaming demo (WebSocket or SSE) operating at >30 messages/second to validate backpressure handling under realistic conditions
- [ ] **LAND-03**: Landing page includes at least one Lit web component from a real design system to validate the Lit interop story in a production context

## v2 Requirements

### DevTools

- **DEVT-01**: Browser extension for inspecting the live signal dependency graph
- **DEVT-02**: Signal value history view for debugging reactive updates

### Observable Interop

- **OBS-01**: Extended RxJS operator compatibility beyond basic `subscribe`/`unsubscribe` (multicasting, subjects, late subscribers)
- **OBS-02**: Native TC39 Observable support when spec stabilizes and cross-browser support is confirmed

### Server-Side Rendering

- **SSR-01**: Framework can render components to HTML strings on the server
- **SSR-02**: Client-side hydration attaches signal reactivity to server-rendered HTML without full re-render

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom compiler / rune syntax | v1 lesson: DX overhead compounds without proportional value; breaks standard tooling and AI codegen; Svelte 5's compiler is a cautionary example |
| Server-side rendering | Fundamentally changes the streaming model; CSR-only is a valid v1 constraint for SPA/dashboard use cases |
| First-party router | Scope creep; TanStack Router covers this well; build only if persistent integration friction is observed |
| Built-in store library | Signals with `createRoot` are already composable state; a store layer adds API surface without new capability |
| CSS-in-JS / scoped styles | Requires either a compiler transform or runtime style injection; document Tailwind and CSS Modules instead |
| Directive system (v-if, x-bind style) | JSX operators (`{condition && <X />}`, `.map()`) and `<Show>`/`<For>` components are sufficient; directives add surface without capability |
| Two-way data binding (`bind:` shorthand) | Controlled inputs are explicit and TypeScript-friendly; `bind:` shorthand requires careful design to avoid introducing a proto-compiler |
| Virtual DOM / VDOM diffing | Defeats the purpose of fine-grained signals — VDOM adds reconciliation overhead that signals eliminate |
| `@lit/react` or React wrappers for Lit | Wrong interop direction; Streem consumes Lit components as plain custom elements, not React-wrapped components |
| Generating or wrapping Lit components | Interop is consume-only: use Lit components in Streem, not compile Streem components to Lit |

## Traceability

| Requirement | Phase | Phase Name | Status |
|-------------|-------|------------|--------|
| SIGNAL-01 | Phase 1 | Reactive Core | Pending |
| SIGNAL-02 | Phase 1 | Reactive Core | Pending |
| SIGNAL-03 | Phase 1 | Reactive Core | Pending |
| SIGNAL-04 | Phase 1 | Reactive Core | Implemented (01-01) |
| SIGNAL-05 | Phase 1 | Reactive Core | Implemented (01-01) |
| DX-02 | Phase 1 | Reactive Core | Pending |
| DX-03 | Phase 1 | Reactive Core | Pending |
| COMP-01 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-02 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-03 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-04 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-05 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-06 | Phase 2 | JSX Runtime and Component Model | Pending |
| COMP-07 | Phase 2 | JSX Runtime and Component Model | Pending |
| JSX-01 | Phase 2 | JSX Runtime and Component Model | Pending |
| JSX-02 | Phase 2 | JSX Runtime and Component Model | Pending |
| JSX-03 | Phase 2 | JSX Runtime and Component Model | Pending |
| STREAM-01 | Phase 3 | Streaming Primitives | Pending |
| STREAM-02 | Phase 3 | Streaming Primitives | Pending |
| STREAM-03 | Phase 3 | Streaming Primitives | Pending |
| STREAM-04 | Phase 3 | Streaming Primitives | Pending |
| STREAM-05 | Phase 3 | Streaming Primitives | Pending |
| STREAM-06 | Phase 3 | Streaming Primitives | Pending |
| STREAM-07 | Phase 3 | Streaming Primitives | Pending |
| STREAM-08 | Phase 3 | Streaming Primitives | Pending |
| LIT-01 | Phase 4 | Lit Web Component Interop | Pending |
| LIT-02 | Phase 4 | Lit Web Component Interop | Pending |
| LIT-03 | Phase 4 | Lit Web Component Interop | Pending |
| LIT-04 | Phase 4 | Lit Web Component Interop | Pending |
| DX-01 | Phase 5 | Package Assembly, CLI, and AI Skills | Pending |
| SKILL-01 | Phase 5 | Package Assembly, CLI, and AI Skills | Pending |
| SKILL-02 | Phase 5 | Package Assembly, CLI, and AI Skills | Pending |
| LAND-01 | Phase 6 | Landing Page (Dogfood) | Pending |
| LAND-02 | Phase 6 | Landing Page (Dogfood) | Pending |
| LAND-03 | Phase 6 | Landing Page (Dogfood) | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-28 after 01-01 execution (SIGNAL-04, SIGNAL-05 implemented)*
