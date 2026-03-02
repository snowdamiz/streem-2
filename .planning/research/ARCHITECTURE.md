# Architecture Research

**Domain:** JSX/TSX reactive streaming frontend framework (no custom compiler)
**Researched:** 2026-02-27
**Confidence:** HIGH (SolidJS internals via official docs; Vite JSX via official docs; stream integration via multiple verified sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  .tsx Files  │  │  Lit WC      │  │  AI Skills (SKILL.md)│   │
│  │  (components)│  │  (consumed)  │  │  + sub-skill files   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘   │
└─────────┼─────────────────┼──────────────────────────────────────┘
          │ JSX (h/jsx)      │ prop:/attr:/on: namespaces
┌─────────▼─────────────────▼──────────────────────────────────────┐
│                     Streem Runtime Layer                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   JSX Runtime (h / Fragment)              │    │
│  │  Translates JSX calls → DOM nodes + reactive bindings     │    │
│  └──────────────────────┬───────────────────────────────────┘    │
│                          │                                        │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                  Reactivity Core                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Signal   │  │  Memo    │  │  Effect  │  │  Store   │   │  │
│  │  │ (atom)   │  │ (derived)│  │(side fx) │  │ (proxy)  │   │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │  │
│  │       └─────────────┴─────────────┴──────────────┘         │  │
│  │                      Owner / Cleanup Tree                   │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                          │                                        │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                  Stream Adapters                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │fromWS()  │  │fromSSE() │  │fromStream│  │fromObs() │   │  │
│  │  │WebSocket │  │EventSrc  │  │Readable  │  │Observable│   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
          │ Vite esbuild JSX transform (jsxFactory, jsxInject)
┌─────────▼───────────────────────────────────────────────────────┐
│                     Build Layer (Vite)                           │
│  esbuild JSX transform → tsconfig jsxImportSource               │
│  vite.config.ts: esbuild.jsxFactory / jsxFragment / jsxInject   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| JSX Runtime (`h`/`jsx`) | Translates `JSX.createElement` calls into real DOM nodes; installs reactive bindings on text nodes, attributes, event listeners | Reactivity Core (reads signals during mount), DOM |
| Reactivity Core — Signal | Stores a value; tracks subscriber effects; notifies on change | Effects, Memos, JSX Runtime |
| Reactivity Core — Memo | Cached derived computation; re-runs only when dependencies change; itself acts as a read-only signal | Signals, other Memos, Effects, JSX Runtime |
| Reactivity Core — Effect | Side-effect function; auto-subscribes to signals accessed during its run; re-runs when any dependency changes | Signals, Memos, DOM (via JSX Runtime) |
| Reactivity Core — Store | Proxy over nested plain objects; synthesises signal-per-property on demand; supports deep reactive access | Signals (internally), Effects, JSX Runtime |
| Owner / Cleanup Tree | Hierarchical ownership of computations; `onCleanup` callbacks registered per scope; disposing an owner walks subtree calling all cleanups | All reactive primitives, Stream Adapters |
| Stream Adapters | Convert async push sources (WebSocket, SSE, ReadableStream, Observable) into signals; subscribe on mount, call `onCleanup` on dispose | Reactivity Core (writes signals), Owner Tree (cleanup) |
| Lit Interop Layer | Extends `JSX.IntrinsicElements` for typed custom element props; maps `prop:` / `attr:` / `on:` namespaces to DOM property/attribute/event | JSX Runtime, TypeScript declarations |
| Vite Build Config | Configures `esbuild.jsxFactory`, `jsxFragment`, `jsxInject`; sets `tsconfig.json` `jsxImportSource`; no custom transform step needed | esbuild (dev + build) |
| AI Skills Installer | Copies `SKILL.md` + sub-skill files into AI tool config dirs at `init` time; no runtime dependency | None (install-time only) |

## Recommended Project Structure

```
streem/
├── packages/
│   ├── core/                    # Reactivity primitives only (no DOM)
│   │   ├── src/
│   │   │   ├── signal.ts        # createSignal, createMemo, createEffect
│   │   │   ├── store.ts         # createStore (proxy-based deep reactivity)
│   │   │   ├── owner.ts         # createRoot, getOwner, runWithOwner, onCleanup
│   │   │   └── index.ts
│   │   └── package.json
│   ├── dom/                     # JSX runtime + DOM renderer
│   │   ├── src/
│   │   │   ├── jsx-runtime.ts   # h(), Fragment, jsx(), jsxs() — the jsxFactory
│   │   │   ├── render.ts        # render(element, container) entry point
│   │   │   ├── bindings.ts      # How reactive values bind to DOM (text, attr, events)
│   │   │   └── index.ts
│   │   └── package.json
│   ├── streams/                 # Stream-to-signal adapters (no DOM dependency)
│   │   ├── src/
│   │   │   ├── from-websocket.ts
│   │   │   ├── from-sse.ts
│   │   │   ├── from-readable.ts  # ReadableStream / fetch streams
│   │   │   ├── from-observable.ts # RxJS / TC39 Observable compat
│   │   │   └── index.ts
│   │   └── package.json
│   ├── lit/                     # Lit web component interop types + helpers
│   │   ├── src/
│   │   │   ├── intrinsic.d.ts   # JSX.IntrinsicElements augmentations
│   │   │   ├── wrap.ts          # Optional: createComponent-style wrapper util
│   │   │   └── index.ts
│   │   └── package.json
│   └── streem/                  # Meta-package: re-exports everything, user-facing
│       ├── src/
│       │   └── index.ts         # export * from '/core', /dom, etc.
│       └── package.json
├── apps/
│   └── landing/                 # Official landing page — dogfood constraint
│       ├── src/
│       ├── index.html
│       └── vite.config.ts
├── skills/                      # AI skills (progressive disclosure)
│   ├── SKILL.md                 # Root skill, routes to sub-skills
│   ├── signals.md
│   ├── streaming.md
│   ├── components.md
│   ├── lit-interop.md
│   └── install.mjs              # Copies skills into ~/.claude/skills/ etc.
├── vite.config.ts               # Workspace-level build config
└── tsconfig.base.json           # Shared: jsx, jsxImportSource settings
```

### Structure Rationale

- **packages/core/:** Zero DOM dependency. Portable. Can be tested in Node. Signals, memos, effects, owner tree all live here. Build this first — everything else depends on it.
- **packages/dom/:** Depends on core. Defines the JSX factory. The render layer that ties reactive values to DOM mutation. No streams knowledge.
- **packages/streams/:** Depends on core only. Converts push sources into signals. DOM-agnostic so it could work in non-browser contexts.
- **packages/lit/:** Thin TypeScript declarations. No runtime code needed for basic interop — just type augmentations. The `wrap.ts` helper is optional DX sugar.
- **packages/streem/:** The "streem" npm package. Re-exports everything. Users never import from sub-packages unless they want fine-grained bundle splitting.
- **apps/landing/:** Treated as a first-class consumer of the framework, not an afterthought. Pain felt here = bugs in the framework.
- **skills/:** Entirely separate from build pipeline. Install-time only. Root `SKILL.md` routes AI agents to topic-specific sub-skill files.

## Architectural Patterns

### Pattern 1: Reactive Binding via Accessor Functions

**What:** The JSX runtime distinguishes between static values and reactive values by checking whether a prop is a function. If it is, the runtime wraps it in an effect that re-runs when the accessor's signal dependencies change, updating only the target DOM node.

**When to use:** This is the core pattern for all reactive prop/attribute/text bindings in the JSX runtime. Static values are set once; accessor functions (signal getters, memos, derived expressions wrapped in `() =>`) establish live bindings.

**Trade-offs:** Extremely granular — only the exact DOM node updates. Requires users to pass `() => value` (accessor) rather than `value` (snapshot) when they want reactivity. This is the SolidJS mental model and is a deliberate design choice.

**Example:**
```typescript
// In jsx-runtime.ts (bindings.ts)
function setProperty(el: Element, key: string, value: unknown) {
  if (typeof value === 'function') {
    // Reactive: re-runs the accessor when its signals change
    createEffect(() => {
      el.setAttribute(key, String((value as () => unknown)()))
    })
  } else {
    // Static: set once
    el.setAttribute(key, String(value))
  }
}
```

### Pattern 2: Stream Adapter Lifecycle Tied to Owner

**What:** Each stream adapter (`fromWebSocket`, `fromSSE`, etc.) creates a signal, opens the stream connection, writes values as they arrive, and registers an `onCleanup` that closes the connection. The adapter must be called inside a reactive owner scope (component, effect, or explicit `createRoot`) so cleanup fires automatically when the component unmounts.

**When to use:** All stream-to-signal bridging. Never manage stream subscriptions manually in application code.

**Trade-offs:** Cleanup is automatic and tied to the component/owner tree. If called outside a reactive scope, cleanup never fires (same footgun as SolidJS effects — emit a console warning in dev mode).

**Example:**
```typescript
// packages/streams/src/from-sse.ts
export function fromSSE<T>(url: string): () => T | undefined {
  const [value, setValue] = createSignal<T | undefined>(undefined)

  const es = new EventSource(url)
  es.onmessage = (e) => setValue(JSON.parse(e.data) as T)

  // Fires when the reactive owner disposes (component unmounts, etc.)
  onCleanup(() => es.close())

  return value
}
```

### Pattern 3: Owner-Scoped Reactive Roots for Async Boundaries

**What:** When creating signals or effects inside async contexts (event handlers, promise callbacks, dynamic imports), wrap them in `createRoot` and hold the dispose reference. Use `runWithOwner` to re-attach computations to a known owner scope.

**When to use:** Anywhere reactive primitives are created outside a component or effect body — async event handlers, dynamic route components, stream callbacks.

**Trade-offs:** Slightly more verbose. Prevents the "computations created outside createRoot will never be disposed" warning and its associated memory leaks.

**Example:**
```typescript
import { createRoot, runWithOwner, getOwner } from '/core'

// In a component:
const owner = getOwner()
button.addEventListener('click', () => {
  // Attach new computations to the component's owner
  runWithOwner(owner!, () => {
    createEffect(() => { /* ... */ })
  })
})
```

### Pattern 4: Vite JSX Wiring Without a Compiler Plugin

**What:** Configure `vite.config.ts` with `esbuild.jsxFactory`, `esbuild.jsxFragment`, and `esbuild.jsxInject`. Set matching `jsx` and `jsxImportSource` in `tsconfig.json`. No Babel, no custom Vite plugin, no transform step.

**When to use:** Framework initialization / project scaffolding. This is the only configuration needed.

**Trade-offs:** Fast (esbuild native, 20-30x faster than tsc). Transpilation only — type checking must be run separately (`tsc --noEmit`). The `jsxInject` option auto-prepends the import to every `.tsx` file so users do not need `import { h } from 'streem'` at the top of every file.

**Example:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from '/dom'`,
  },
})
```
```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "/dom",
    "isolatedModules": true
  }
}
```

### Pattern 5: Lit Interop via JSX.IntrinsicElements Augmentation

**What:** Augment the framework's `JSX.IntrinsicElements` interface with typed declarations for Lit custom elements. Use `prop:` namespace for property binding (objects, arrays, complex values) and `on:` namespace for custom events. Attributes map through `attr:`.

**When to use:** Any Lit component consumption. The declaration file ships in `/lit` and is imported once (or via tsconfig `types`).

**Trade-offs:** Type-safe, zero runtime cost. Users get autocomplete on Lit props. The trade-off is that types must be written/generated per Lit component — not automatic unless a codegen tool (ts-morph or `@custom-elements-manifest/analyzer`) is run.

**Example:**
```typescript
// packages/lit/src/intrinsic.d.ts
import type { HTMLAttributes } from '/dom'

declare module '/dom' {
  namespace JSX {
    interface IntrinsicElements {
      'my-lit-button': HTMLAttributes & {
        'prop:config': ButtonConfig   // complex object → property
        label?: string                // simple string → attribute
        'on:my-click': (e: CustomEvent<ClickDetail>) => void
      }
    }
  }
}
```

## Data Flow

### Stream to DOM Update Flow

```
External Source (WebSocket / SSE / ReadableStream / Observable)
    │
    │ push event (onmessage / ondata / next)
    ▼
Stream Adapter (fromWebSocket / fromSSE / fromReadable / fromObservable)
    │
    │ calls signal setter: setValue(parsedData)
    ▼
Signal (value stored, subscriber set notified)
    │
    │ synchronous notification to all subscribers
    ▼
Effects / Memos that read the signal
    │
    │ if signal is read inside JSX binding effect...
    ▼
DOM Binding Effect (created by JSX runtime during mount)
    │
    │ calls el.textContent / el.setAttribute / el.property = ...
    ▼
DOM Node (only this exact node updates — no diffing, no re-render)
```

### Component Mount Flow

```
render(<App />, document.getElementById('root'))
    │
    │ createRoot() establishes top-level owner
    ▼
JSX Runtime h(Component, props, ...children)
    │
    │ Component function called ONCE (not on every update)
    ▼
Component body runs — signals / memos / effects / stream adapters created
    │
    │ JSX expressions that reference signals are wrapped in effects
    ▼
Real DOM nodes created and inserted
    │
    │ Reactive bindings registered (text nodes, attributes, event listeners)
    ▼
Component returns — function never called again
    │
    │ Signal changes → only bound DOM nodes update
    ▼
On unmount → owner disposed → onCleanup tree fires → streams closed
```

### Reactive Dependency Tracking

```
Signal read inside reactive scope
    │
    │ signal.getter() checks: is there a current subscriber (effect/memo)?
    │ YES → adds subscriber to signal's Set<Subscriber>
    │ NO  → returns value, no tracking
    ▼
Signal setter called with new value
    │
    │ compare new vs. old value
    │ SAME → no-op
    │ DIFFERENT → iterate signal.subscribers, call each
    ▼
Each subscriber (effect/memo) re-runs
    │
    │ before re-run: call any registered onCleanup callbacks
    │ during re-run: re-register dependencies (dynamic tracking)
    ▼
DOM update (if subscriber is a JSX binding effect)
```

### Key Data Flows

1. **Local state:** `createSignal` → read in JSX → JSX runtime wraps in effect → DOM text node or attribute updates on change.
2. **Derived state:** `createMemo` caches expensive computations derived from signals — memos only re-run when their own signal dependencies change, not every render.
3. **Stream state:** `fromWebSocket(url)` → returns signal accessor → used in JSX exactly like local state → same data flow from point 2 onward.
4. **Store state:** `createStore({...})` → returns proxy — reading `store.nested.field` auto-creates a fine-grained signal for that exact path — deep updates are surgical.
5. **Cleanup:** `onCleanup` registered inside adapters, effects, components — fires bottom-up through owner tree on dispose.

## Suggested Build Order

The dependency graph dictates this order. Each layer must exist before the next.

| Phase | What to Build | Why This Order |
|-------|---------------|----------------|
| 1 | `/core` — Signal, Memo, Effect, Store, Owner tree | Zero dependencies. Everything else imports from here. Testable in Node. |
| 2 | `/dom` — JSX runtime (`h`, `Fragment`), `render()`, DOM bindings | Needs core (effects for reactive bindings). This is what Vite's jsxFactory points to. |
| 3 | `/streams` — `fromWebSocket`, `fromSSE`, `fromReadable`, `fromObservable` | Needs core (`createSignal`, `onCleanup`). DOM-agnostic. |
| 4 | `/lit` — JSX.IntrinsicElements declarations, optional wrapper util | Needs dom (namespace extension). Purely additive — augments types only at first. |
| 5 | `streem` meta-package + Vite config scaffolding + `create-streem` CLI | Needs all packages stable. The public API surface crystallizes here. |
| 6 | `skills/` — SKILL.md + sub-skills + `install.mjs` | Needs stable API to document. Written after API is settled. |
| 7 | `apps/landing` — Dogfood site | Needs complete framework. Pain here = framework regressions. |

## Anti-Patterns

### Anti-Pattern 1: Signal Read Outside Reactive Scope

**What people do:** Call a signal getter in a plain function body, store in a `const`, use the value.

**Why it's wrong:** The value is a snapshot — it will never update. No tracking occurs outside an effect/memo/JSX context, so the DOM never reflects future changes.

**Do this instead:** Read signals inside effects, memos, or JSX template expressions. If a function needs reactive data, pass the signal accessor `() => value()` not the value itself.

```typescript
// Wrong — snapshot, never updates
const name = userName()
return <div>{name}</div>

// Right — reactive accessor passed, JSX runtime installs binding
return <div>{userName()}</div>
// or equivalently:
return <div>{() => userName()}</div>
```

### Anti-Pattern 2: Stream Adapter Called Outside Owner Scope

**What people do:** Call `fromWebSocket(url)` inside a plain event handler, module top-level, or async callback outside a reactive root.

**Why it's wrong:** The `onCleanup` registration has no owner to attach to. The WebSocket/EventSource is never closed. Memory and connection leaks accumulate.

**Do this instead:** Always call stream adapters inside a component, effect, or explicit `createRoot`. Emit a dev-mode warning if `getOwner()` is null when the adapter is called.

### Anti-Pattern 3: Destructuring Props in Component Arguments

**What people do:** `function MyComp({ title, count }: Props)` — destructures the props object at the function boundary.

**Why it's wrong:** Props in this architecture are lazy getters. Destructuring evaluates them immediately (snapshot). Reactive updates to `title` or `count` from the parent will not propagate to the component.

**Do this instead:** Accept `props` as a single object and access properties inside JSX or effects: `<h1>{props.title}</h1>`. If a default is needed, use `mergeProps`.

### Anti-Pattern 4: Creating Effects to Synchronize State (Derived State as Effect)

**What people do:** `createEffect(() => setDerived(a() + b()))` to compute derived values.

**Why it's wrong:** Creates a redundant signal write cycle. The effect runs, writes to `derived`, which triggers any downstream effects, creating a 2-step update chain.

**Do this instead:** Use `createMemo(() => a() + b())`. Memos are synchronously consistent — dependents see the updated memo in the same flush.

### Anti-Pattern 5: One Giant Package (No Package Boundaries)

**What people do:** Put signals, DOM bindings, stream adapters, and Lit types all in one package.

**Why it's wrong:** Makes the reactivity core un-importable without a DOM (breaks Node.js tests). Creates circular dependency risk. Prevents tree-shaking of unused subsystems.

**Do this instead:** Keep `/core` DOM-free. Depend on it from `/dom` and `/streams` unidirectionally. The meta-package `streem` re-exports all of them.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| WebSocket server | `fromWebSocket(url)` returns signal accessor; adapter handles open/close/reconnect | Reconnect strategy (backoff) should be a second-argument option, not baked in by default |
| SSE endpoint | `fromSSE(url)` wraps `EventSource`; `EventSource` auto-reconnects natively | SSE cannot send data back to server — pair with fetch for commands |
| ReadableStream (fetch) | `fromReadable(response.body)` reads stream chunks via reader, writes to signal | Cancel via `reader.cancel()` in `onCleanup` |
| Observable / RxJS | `fromObservable(obs$)` calls `.subscribe()`, writes `next` to signal, calls `unsubscribe()` in cleanup | Subscribe must be synchronous enough to start — use `shareReplay(1)` for late subscribers |
| Lit web components | Used in JSX as custom element tags; `/lit` provides type declarations | Property binding via `prop:`, events via `on:`, attributes via `attr:` or bare prop |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `/core` ↔ `/dom` | `dom` imports signal/effect/owner primitives from `core`. One-way. | `core` must never import from `dom` — keeps core DOM-free |
| `/core` ↔ `/streams` | `streams` imports `createSignal`, `onCleanup` from `core`. One-way. | Adapters are pure core-level constructs |
| `/dom` ↔ `/lit` | `lit` augments the `JSX` namespace declared in `dom`. One-way type-level. | No runtime coupling — lit types extend dom types |
| `streem` (meta) ↔ all packages | Re-export only. `streem/index.ts` re-exports from all sub-packages. | User-facing API boundary. Sub-package internals are not stable API. |
| Stream Adapters ↔ Owner Tree | Adapters call `onCleanup` (from `/core`) — implicitly tied to whatever reactive scope they're created in | Adapters need to be called inside reactive scope — document this clearly |

## Scaling Considerations

This is a client-side library; "scale" means app complexity, not user count.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small app (1-10 components) | Flat component files, all signals local. No stores needed. |
| Medium app (10-50 components) | Shared state in module-level `createStore` calls or context. Group related signals in stores. |
| Large app (50+ components) | Context API for dependency injection of shared stores. Lazy-load route components with `createRoot` for isolated disposal. |
| Real-time heavy (many streams) | One stream adapter per data source. Fan out to multiple signals from one adapter using a store. Avoid creating a new WebSocket per component — hoist to module scope with `createRoot` and share the signal. |

## Sources

- [SolidJS Fine-Grained Reactivity Docs](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity) — HIGH confidence (official)
- [SolidJS Intro to Reactivity](https://docs.solidjs.com/concepts/intro-to-reactivity) — HIGH confidence (official)
- [SolidJS createRoot Reference](https://docs.solidjs.com/reference/reactive-utilities/create-root) — HIGH confidence (official)
- [SolidJS onCleanup Reference](https://docs.solidjs.com/reference/lifecycle/on-cleanup) — HIGH confidence (official)
- [SolidJS getOwner Reference](https://docs.solidjs.com/reference/reactive-utilities/get-owner) — HIGH confidence (official)
- [SolidJS attr: namespace](https://docs.solidjs.com/reference/jsx-attributes/attr) — HIGH confidence (official)
- [Vite Features — JSX](https://vite.dev/guide/features) — HIGH confidence (official)
- [Custom JSX with Vite & TypeScript](https://michealpearce.dev/custom-jsx-with-vite-typescript/) — MEDIUM confidence (verified against official Vite docs)
- [Lit React Interop](https://lit.dev/docs/frameworks/react/) — HIGH confidence (official Lit docs, pattern directly applicable)
- [SolidJS Web Components Discussion](https://github.com/solidjs/solid/discussions/1123) — MEDIUM confidence (community, cross-checked with attr: docs)
- [SolidJS Owner Tree Discussions](https://github.com/solidjs/solid/discussions/719) — MEDIUM confidence (community explanations verified against official docs)
- [Signals Fine-Grained Reactivity — SitePoint](https://www.sitepoint.com/signals-fine-grained-javascript-framework-reactivity/) — MEDIUM confidence
- [WebSockets vs SSE vs Polling — RxDB](https://rxdb.info/articles/websockets-sse-polling-webrtc-webtransport.html) — MEDIUM confidence
- [Angular wsResource Pattern](https://medbenmakhlouf.medium.com/introducing-wsresource-a-new-reactive-way-to-work-with-websockets-in-angular-459e181c4168) — LOW confidence (pattern reference only, not authoritative for Streem design)

---
*Architecture research for: Streem — JSX/TSX reactive streaming frontend framework*
*Researched: 2026-02-27*
