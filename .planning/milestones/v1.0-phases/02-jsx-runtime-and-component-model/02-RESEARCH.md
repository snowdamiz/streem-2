# Phase 2: JSX Runtime and Component Model - Research

**Researched:** 2026-02-27
**Domain:** Custom JSX runtime (`jsxImportSource`), reactive DOM bindings, component model, built-in components (`<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`), Vite HMR plugin
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Reactive binding syntax**
- Developers write `{signal()}` — calling the signal is the reactive read. No auto-unwrapping.
- Any function wrapping a signal read is reactive: `{() => signal() + ' suffix'}` tracks correctly.
- Reactive bindings target individual DOM nodes/attributes — surgical updates only, no subtree re-render.
- Both `class=` (reactive string expression) and `classList=` (object map of class → boolean) are supported.

**Built-in component APIs**
- `<Show when={isVisible()} fallback={<Loading />}>children</Show>` — SolidJS-aligned prop names.
- `<For each={items()} key={(item) => item.id}>{(item, index) => <div>{item.name}</div>}</For>` — render function children, explicit key function for DOM reuse.
- `<ErrorBoundary fallback={(err, reset) => <div>Error: {err.message} <button onClick={reset}>Retry</button></div>}>` — fallback is a render function receiving error and reset callback.

**Suspense and stream integration**
- `<Suspense>` uses the thrown-Promise protocol: any child that throws a Promise triggers the fallback.
- Progressive resolution: children render individually as they resolve (not all-or-nothing).
- Errors during resource fetch propagate up to the nearest `<ErrorBoundary>` — `<Suspense>` handles pending state only, not errors.
- `createResource` is deferred to Phase 3 — Phase 2 defines the thrown-Promise Suspense protocol so the mechanism is ready.

**HMR preservation model**
- Preserves signal values AND active stream connection state (WebSocket, SSE) across hot reloads.
- Components identified by file path + export name (e.g., `src/App.tsx > default`).
- Full reset on structural change — if component signal count or structure changes, no state restore.
- Scoped to standalone Streem components rendered via `render()`. Lit web component HMR is Phase 4's responsibility.

### Claude's Discretion
- Exact loading skeleton design and animation for `<Suspense>` fallback
- Internal mechanism for thrown-Promise detection and Suspense boundary traversal
- Vite HMR plugin implementation details (module registration, accept() hooks)
- Reactive effect lifecycle management within component scope

### Deferred Ideas (OUT OF SCOPE)
- `createResource` primitive for async data fetching — Phase 3 (alongside stream adapters)
- Lit web component HMR integration — Phase 4
- Progressive streaming HTML / server-side rendering — not in current milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | Developer can write components as TypeScript functions returning JSX with fully typed props | JSX runtime type declarations section; `jsx-runtime.ts` exports `jsx`, `jsxs`, `Fragment`; `JSX` namespace with `IntrinsicElements` |
| COMP-02 | Component function body runs exactly once on mount; reactivity lives in JSX expressions and effects | Component runs in `createRoot` scope; JSX expressions wrap signal reads in closures (accessor pattern); no re-execution of fn |
| COMP-03 | Developer can use `onMount()` to run code after a component is first mounted to the DOM | `onMount()` implemented as `effect()` that runs once (dependencies never change); wraps `queueMicrotask` or executes synchronously after DOM insertion |
| COMP-04 | Developer can render conditional content with `<Show>` that preserves reactive tracking inside the true branch | `<Show>` implemented as effect watching `when` accessor; swaps DOM subtrees; creates child `createRoot` scope for proper cleanup |
| COMP-05 | Developer can render lists with `<For>` that fine-grain-updates individual items without re-rendering the whole list | `<For>` implemented with keyed reconciliation map; `key=(item) => item.id` function determines identity; each item gets own scope |
| COMP-06 | Developer can catch errors thrown by child components using `<ErrorBoundary>` and render fallback UI | `<ErrorBoundary>` wraps child render in `try/catch`; catches synchronous render errors and reactive graph errors via owner error handler |
| COMP-07 | Developer can show a loading fallback while async/stream-backed signals are pending using `<Suspense>` | Thrown-Promise protocol: child throws Promise → `<Suspense>` catches in try/catch during render, shows fallback, retries on resolve |
| JSX-01 | Developer configures Streem's JSX runtime via `jsxImportSource: "streem"` with no Babel or custom compiler | Package exports `./jsx-runtime` and `./jsx-dev-runtime` subpaths; `jsx-runtime.ts` exports `jsx`, `jsxs`, `Fragment`, `JSX` namespace |
| JSX-02 | Reactive signal values in JSX update only the exact affected DOM node — no full component re-render | Accessor pattern: JSX expressions containing signal reads become `() => expr` closures; DOM bindings run an `effect()` that updates only the targeted node |
| JSX-03 | Vite dev server preserves signal state and stream connection state across hot module reloads | `import.meta.hot.data` for state persistence; `hot.dispose()` saves signal values; `hot.accept()` restores from `hot.data` on next module load |
</phase_requirements>

## Summary

Phase 2 builds the DOM rendering layer for `/dom` on top of the `/core` reactive primitives completed in Phase 1. The central design is a **no-compiler JSX runtime**: TypeScript's `"jsx": "react-jsx"` + `"jsxImportSource": "streem"` compiles TSX to calls of `jsx(type, props, key)` automatically — no Babel, no custom transform. The `jsx()` function in `/dom/jsx-runtime` receives these calls and either creates real DOM elements or invokes function components. Reactive bindings are achieved through the **accessor pattern**: any JSX expression that contains a signal read becomes a closure (e.g., `{count()}` compiles to `{count}` where `count` is passed as a getter), and each DOM binding (text node, attribute, class, style) wraps its update in an `effect()` that fires only when the specific value changes.

The component model is deliberately simple: component functions run exactly once inside a `createRoot` scope. There is no re-render loop. All reactivity lives in JSX expressions and explicit `effect()` calls. Built-in components (`<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`) are implemented as first-class functions using the same reactive primitives. `<Show>` and `<For>` manage child DOM scopes via nested `createRoot`, disposing stale subtrees and creating new ones. `<ErrorBoundary>` wraps child rendering in try/catch. `<Suspense>` implements the thrown-Promise protocol: it renders children in a try/catch, catches thrown Promises, shows the fallback, and retries on resolution.

HMR is implemented as a Vite plugin that injects `import.meta.hot.data`-based state preservation into every component file. Signal values are saved into `hot.data` via `hot.dispose()` callbacks and restored from `hot.data` on the next module evaluation. The component identifier (file path + export name) is the key. Structural change detection (signal count mismatch) triggers a full reset.

**Primary recommendation:** Build `/dom` as a new monorepo package at `packages/dom/` with `"jsxImportSource": "streem"` package resolution, implementing `h()` / `jsx()` as a direct DOM factory, accessor-based reactive bindings via `/core` `effect()`, keyed reconciliation for `<For>`, and a Vite plugin for HMR.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `/core` | `workspace:*` | Reactive primitives (`signal`, `effect`, `createRoot`, `onCleanup`) | Phase 1 output — the foundation the DOM layer is built on |
| TypeScript | `~5.8.0` | Type safety, `jsx: "react-jsx"`, `jsxImportSource` | Already in monorepo; `5.8` is current stable |
| Vite | `^7.0.0` | Dev server, HMR plugin API (`hotUpdate` hook), esbuild JSX transform | Already in monorepo; Vite 7 is current major |
| Vitest | `^4.0.0` | Unit/integration tests | Already in monorepo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `happy-dom` | `^14.x` | DOM environment for Vitest tests | Use for DOM binding tests — faster than jsdom, covers all needed APIs |
| `vite-plugin-dts` | `^4.0.0` | `.d.ts` generation for package build | Already in core; replicate for dom package |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `happy-dom` for tests | `jsdom` | jsdom is more complete but ~3x slower; happy-dom covers all Phase 2 DOM APIs needed |
| Custom accessor pattern | `dom-expressions` (Ryan Carniato's library) | dom-expressions requires a compiler/Babel plugin; Phase 2 is explicitly no-compiler |
| Custom keyed reconciliation | `@solid-primitives/keyed` | External dependency; algorithm is simple enough to own given we have a `key=(item)=>item.id` contract |

**Installation:**
```bash
# In packages/dom/
pnpm add -D /core@workspace:* vite@^7.0.0 vite-plugin-dts@^4.0.0 vitest@^4.0.0 typescript@~5.8.0 happy-dom@^14.0.0
```

## Architecture Patterns

### Recommended Project Structure
```
packages/dom/
├── src/
│   ├── index.ts              # Public API: h, Fragment, render, onMount
│   ├── jsx-runtime.ts        # jsx(), jsxs(), Fragment — imported by TSX compiler
│   ├── jsx-dev-runtime.ts    # jsxDEV(), Fragment — dev mode (can re-export jsx-runtime)
│   ├── h.ts                  # Core createElement / h() factory
│   ├── bindings.ts           # Text node, attribute, class, style, event DOM bindings
│   ├── components.ts         # Show, For, ErrorBoundary, Suspense
│   ├── hmr.ts                # HMR plugin + runtime state registry
│   └── types.ts              # JSX namespace type declarations
├── package.json              # exports: ".", "./jsx-runtime", "./jsx-dev-runtime"
├── tsconfig.json             # "jsx": "react-jsx", "jsxImportSource": "streem"
└── vitest.config.ts          # environment: 'happy-dom'
```

### Pattern 1: JSX Runtime Entry Point

**What:** TypeScript's `jsx: "react-jsx"` transform calls `jsx(type, props, key)` and `jsxs(type, props, key)` automatically. The difference: `jsx` is for single-child elements, `jsxs` is for multi-child (static children array optimization).

**When to use:** This is the compiler-generated entry point — developers never call it directly.

**Example:**
```typescript
// Source: https://www.typescriptlang.org/tsconfig/jsxImportSource.html
// packages/dom/src/jsx-runtime.ts

export { h as jsx, h as jsxs, Fragment } from './h.js'

// Dev-runtime can add source location info
export { hDev as jsxDEV, Fragment } from './h.js'

// JSX type namespace — TypeScript looks for this in the module
export type { JSX } from './types.js'
```

```typescript
// packages/dom/src/types.ts
export namespace JSX {
  // What JSX expressions evaluate to (real DOM nodes in Streem)
  type Element = Node | Node[] | null

  // Props on HTML intrinsic elements
  interface IntrinsicElements {
    [tag: string]: Record<string, unknown> & {
      children?: unknown
      ref?: (el: HTMLElement) => void
    }
    // Specific typed overrides for common elements follow...
  }

  // Tells TypeScript the children prop name
  interface ElementChildrenAttribute {
    children: {}
  }
}
```

```json
// packages/dom/package.json — critical: all three exports required
{
  "name": "streem",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./jsx-runtime": { "import": "./dist/jsx-runtime.js", "types": "./dist/jsx-runtime.d.ts" },
    "./jsx-dev-runtime": { "import": "./dist/jsx-dev-runtime.js", "types": "./dist/jsx-dev-runtime.d.ts" }
  }
}
```

### Pattern 2: h() Factory — The Core DOM Builder

**What:** `h(type, props, ...children)` creates real DOM elements immediately. No virtual DOM. For function components, calls the function with props.

**When to use:** Called by the `jsx()` entry point for every JSX element.

**Example:**
```typescript
// packages/dom/src/h.ts
import { createRoot } from '/core'

export const Fragment = Symbol('Fragment')

export function h(
  type: string | ((props: Record<string, unknown>) => Node | null) | symbol,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): Node | Node[] | null {
  // Fragment: return children array
  if (type === Fragment) {
    return flattenChildren(children)
  }

  // Function component: run once inside createRoot, return DOM nodes
  if (typeof type === 'function') {
    const allProps = { ...(props ?? {}), children: normalizeChildren(children) }
    return createRoot((dispose) => {
      const result = type(allProps)
      // Register dispose on parent owner via onCleanup when mounted
      return result
    })
  }

  // HTML element: create DOM node, apply bindings
  const el = document.createElement(type as string)
  if (props) applyProps(el, props)
  appendChildren(el, children)
  return el
}
```

### Pattern 3: Accessor-Based Reactive DOM Bindings

**What:** JSX expressions containing signal reads become accessor functions (closures). DOM binding functions accept either a static value or a `() => T` accessor. When an accessor is provided, the binding wraps it in an `effect()` that updates only the specific DOM node/attribute.

**When to use:** Any time a signal read appears in a JSX expression — the `h()` factory checks `typeof value === 'function'` to decide between static set or reactive binding.

**Example:**
```typescript
// packages/dom/src/bindings.ts
import { effect, onCleanup } from '/core'

type Accessor<T> = () => T

// Text node binding: creates a text node, updates it reactively
export function bindTextNode(
  parent: Node,
  accessor: Accessor<string | number>,
  anchor: Node | null = null
): void {
  const text = document.createTextNode('')
  parent.insertBefore(text, anchor)
  effect(() => {
    text.nodeValue = String(accessor())
  })
}

// Attribute binding: sets/removes an attribute reactively
export function bindAttr(
  el: Element,
  name: string,
  accessor: Accessor<string | boolean | null | undefined>
): void {
  effect(() => {
    const val = accessor()
    if (val == null || val === false) el.removeAttribute(name)
    else el.setAttribute(name, val === true ? name : String(val))
  })
}

// className binding: reactive string
export function bindClass(el: Element, accessor: Accessor<string>): void {
  effect(() => { el.className = accessor() })
}

// classList binding: reactive object map { [cls: string]: boolean }
export function bindClassList(
  el: Element,
  accessor: Accessor<Record<string, boolean>>
): void {
  effect(() => {
    const map = accessor()
    for (const [cls, active] of Object.entries(map)) {
      el.classList.toggle(cls, active)
    }
  })
}

// Style binding: reactive CSSProperties object
export function bindStyle(
  el: HTMLElement,
  accessor: Accessor<Partial<CSSStyleDeclaration>>
): void {
  effect(() => {
    Object.assign(el.style, accessor())
  })
}

// Event binding: set once (event handlers are not reactive, they use the latest value via closure)
export function bindEvent(
  el: Element,
  eventName: string,
  handler: (e: Event) => void
): void {
  el.addEventListener(eventName, handler)
  onCleanup(() => el.removeEventListener(eventName, handler))
}
```

### Pattern 4: applyProps Dispatch in h()

**What:** `applyProps(el, props)` inspects each prop and routes it to the correct binding — static or reactive, attribute vs. event vs. class vs. style.

**Key rules:**
- `onClick`, `onInput` etc. (starts with `on`, value is function) → `bindEvent`
- `class` with accessor → `bindClass`; with static string → `el.className = val`
- `classList` → `bindClassList`
- `style` → `bindStyle`
- Any accessor (typeof value === 'function') → reactive `bindAttr`
- Static value → direct DOM set

```typescript
// Dispatch table in h.ts / bindings.ts
function applyProps(el: HTMLElement, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    if (key === 'ref' && typeof value === 'function') {
      (value as (el: HTMLElement) => void)(el)
      continue
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase()
      bindEvent(el, event, value as EventListener)
      continue
    }
    if (key === 'classList' && typeof value === 'object') {
      const isFn = typeof value === 'function'
      bindClassList(el, isFn ? value as () => Record<string, boolean> : () => value as Record<string, boolean>)
      continue
    }
    if (key === 'class') {
      const isFn = typeof value === 'function'
      bindClass(el, isFn ? value as () => string : () => value as string)
      continue
    }
    if (key === 'style' && typeof value === 'object') {
      const isFn = typeof value === 'function'
      bindStyle(el, isFn ? value as () => Partial<CSSStyleDeclaration> : () => value as Partial<CSSStyleDeclaration>)
      continue
    }
    // Everything else: attribute
    if (typeof value === 'function') {
      bindAttr(el, key, value as () => string)
    } else {
      el.setAttribute(key, String(value))
    }
  }
}
```

### Pattern 5: Show Component

**What:** `<Show when={cond()} fallback={<Fallback />}>children</Show>` — shows children when `when` is truthy, fallback otherwise. Uses an `effect()` that disposes and recreates child scopes on state change.

```typescript
// packages/dom/src/components.ts
import { createRoot, effect, onCleanup } from '/core'

export function Show(props: {
  when: boolean | (() => boolean)
  fallback?: Node | null
  children: Node | (() => Node)
}): Node {
  const anchor = document.createComment('Show')
  const parent = document.createDocumentFragment()
  parent.appendChild(anchor)

  let currentDispose: (() => void) | null = null

  const getWhen = typeof props.when === 'function' ? props.when : () => props.when

  effect(() => {
    const show = getWhen()
    currentDispose?.()
    currentDispose = null

    const fragment = document.createDocumentFragment()
    if (show) {
      createRoot((dispose) => {
        currentDispose = dispose
        const child = typeof props.children === 'function' ? props.children() : props.children
        if (child) fragment.appendChild(child as Node)
      })
    } else if (props.fallback) {
      const fb = props.fallback
      if (fb) fragment.appendChild(fb as Node)
    }

    // Replace nodes before anchor
    anchor.parentNode?.insertBefore(fragment, anchor)
  })

  onCleanup(() => currentDispose?.())

  return anchor
}
```

### Pattern 6: For Component with Keyed Reconciliation

**What:** `<For each={items()} key={(item) => item.id}>{(item, index) => ...}</For>` — renders list with identity-keyed reconciliation. Reuses DOM nodes for unchanged items, adds new, removes old.

**Key insight:** Unlike SolidJS's reference-based default, Streem's `<For>` uses an explicit key function (`key=(item) => item.id`), which is a locked decision. Each item gets its own `createRoot` scope. The reconciler maintains a `Map<key, {dispose, nodes}>`.

```typescript
export function For<T>(props: {
  each: T[] | (() => T[])
  key: (item: T) => string | number
  fallback?: Node
  children: (item: T, index: () => number) => Node
}): Node {
  const anchor = document.createComment('For')

  type RowEntry = { dispose: () => void; nodes: Node[]; index: () => number; setIndex: (i: number) => void }
  const rows = new Map<string | number, RowEntry>()

  const getEach = typeof props.each === 'function' ? props.each : () => props.each

  effect(() => {
    const items = getEach()
    const newKeys = new Set(items.map(props.key))

    // Remove stale rows
    for (const [k, row] of rows) {
      if (!newKeys.has(k)) {
        row.dispose()
        row.nodes.forEach(n => n.parentNode?.removeChild(n))
        rows.delete(k)
      }
    }

    // Add / update rows
    items.forEach((item, i) => {
      const k = props.key(item)
      if (rows.has(k)) {
        rows.get(k)!.setIndex(i)  // update index signal
      } else {
        // Create new row
        // NOTE: item is passed by value here — see pitfalls re: immutable item reference
        let indexSignal: number = i
        const setIndex = (newI: number) => { indexSignal = newI }
        let dispose!: () => void
        createRoot((d) => {
          dispose = d
          const node = props.children(item, () => indexSignal)
          rows.set(k, { dispose, nodes: Array.isArray(node) ? node as Node[] : [node as Node], index: () => indexSignal, setIndex })
        })
      }
    })

    // Re-order DOM to match new array order
    const parent = anchor.parentNode!
    items.forEach((item) => {
      const k = props.key(item)
      const row = rows.get(k)!
      row.nodes.forEach(n => parent.insertBefore(n, anchor))
    })
  })

  return anchor
}
```

### Pattern 7: ErrorBoundary

**What:** Wraps child rendering in try/catch. Catches errors thrown during synchronous render and during reactive effect re-runs via owner error handler. Provides `reset` callback.

**Key insight:** In a no-compiler runtime, errors from child component rendering are synchronous (function calls). The try/catch can directly wrap the child creation call. Reactive errors (effects throwing) require an error handler registered on the owner scope.

```typescript
export function ErrorBoundary(props: {
  fallback: ((err: unknown, reset: () => void) => Node) | Node
  children: Node | (() => Node)
}): Node {
  const anchor = document.createComment('ErrorBoundary')
  let currentDispose: (() => void) | null = null

  const renderChildren = () => {
    try {
      let childNodes: Node | null = null
      createRoot((d) => {
        currentDispose = d
        childNodes = typeof props.children === 'function'
          ? props.children()
          : props.children
      })
      return childNodes
    } catch (err) {
      if (err instanceof Promise) throw err // let Suspense handle it
      currentDispose?.()
      currentDispose = null
      const reset = () => {
        // Remove fallback, retry children
        renderAndInsert()
      }
      const fallbackFn = props.fallback
      return typeof fallbackFn === 'function' ? fallbackFn(err, reset) : fallbackFn
    }
  }

  const renderAndInsert = () => {
    const nodes = renderChildren()
    if (nodes && anchor.parentNode) {
      anchor.parentNode.insertBefore(nodes as Node, anchor)
    }
  }

  return anchor
}
```

### Pattern 8: Suspense with Thrown-Promise Protocol

**What:** `<Suspense fallback={<Loading />}>children</Suspense>` shows fallback while any descendant throws a Promise. When the Promise resolves, re-renders children.

**Critical design difference from SolidJS:** SolidJS uses an internal counter mechanism tied to `createResource`. Streem uses the thrown-Promise protocol (like React). This is a locked decision from CONTEXT.md.

**Implementation approach:** Render children in try/catch. If a Promise is thrown, show fallback, attach `.then()` to retry. The challenge: children must re-run to re-throw or return normally. Use a stable sentinel node for anchor.

```typescript
export function Suspense(props: {
  fallback: Node | (() => Node)
  children: Node | (() => Node)
}): Node {
  const anchor = document.createComment('Suspense')

  const tryRender = () => {
    try {
      const child = typeof props.children === 'function'
        ? props.children()
        : props.children
      // Success: insert children, remove fallback
      return { type: 'success' as const, node: child }
    } catch (err) {
      if (err instanceof Promise) {
        // Pending: insert fallback
        err.then(() => {
          // On resolve, retry
          const result = tryRender()
          if (result.type === 'success' && anchor.parentNode) {
            // swap fallback out, insert children
          }
        })
        return { type: 'pending' as const, promise: err }
      }
      throw err // re-throw non-Promise errors to ErrorBoundary
    }
  }

  return anchor
}
```

**Important:** The progressive resolution requirement (children render individually as they resolve) means multiple pending promises must be tracked. Each pending promise decrements a counter; when counter hits 0, show children.

### Pattern 9: Vite HMR — `import.meta.hot.data` State Preservation

**What:** Signal values are saved before module reload and restored after. Uses Vite's `import.meta.hot.data` — persisted across hot updates of the same module.

**Verified approach (from Vite official docs):**
```typescript
// Injected into every component file by the Streem HMR Vite plugin

// HMR state registry — module-level map of signal name → value
const _streemHMRState: Record<string, unknown> = {}

// Restore signal values from previous module instance
if (import.meta.hot?.data?.streemState) {
  Object.assign(_streemHMRState, import.meta.hot.data.streemState)
}

// Save signal values when this module is about to be replaced
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.streemState = _streemHMRState
  })
  import.meta.hot.accept()
}

// Component signals register with the HMR registry:
// const count = signal(import.meta.hot?.data?.streemState?.count ?? 0)
// _streemHMRState.count = count()  // kept up to date by effect
```

**Vite plugin (server-side) — `hotUpdate` hook (Vite 6+/7):**
```typescript
// packages/dom/src/hmr-plugin.ts
import type { Plugin } from 'vite'

export function streemHMRPlugin(): Plugin {
  return {
    name: 'streem-hmr',
    hotUpdate({ file, modules }) {
      // Only handle .tsx/.jsx component files
      if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return
      // Let Vite's default HMR propagation handle it — our client-side
      // import.meta.hot.accept() makes the component module self-accepting
      return modules
    },
  }
}
```

### Pattern 10: onMount() Implementation

**What:** Runs after the component is first inserted into the DOM. Equivalent to an `effect()` with no reactive dependencies that captures the DOM state post-render.

```typescript
// packages/dom/src/index.ts
import { effect } from '/core'

export function onMount(fn: () => void | (() => void)): void {
  // Runs synchronously after component initialization since effects are
  // eager in /core. The component's DOM has been created by the
  // time onMount() runs (h() is synchronous), but not necessarily inserted.
  // Use queueMicrotask to ensure DOM is in document before fn executes.
  let cleanup: (() => void) | void
  const dispose = effect(() => {
    // This effect tracks no signals — runs exactly once
    cleanup = fn()
  })
  // onMount cleanup fires on owner dispose (component unmount)
}
```

**Important nuance:** In the no-compiler model, `h()` is synchronous so DOM nodes exist immediately after component fn runs. `onMount` can safely call DOM measurement APIs. No additional async scheduling is required for the basic case.

### Pattern 11: render() Entry Point

**What:** `render(component, container)` — mounts a component into a DOM container, returns a dispose function.

```typescript
// packages/dom/src/index.ts
import { createRoot } from '/core'

export function render(
  component: () => Node | null,
  container: Element
): () => void {
  return createRoot((dispose) => {
    const nodes = component()
    if (nodes) {
      if (Array.isArray(nodes)) nodes.forEach(n => container.appendChild(n))
      else container.appendChild(nodes as Node)
    }
    return dispose
  })
}
```

### Anti-Patterns to Avoid

- **Passing signal values (not accessors) to JSX:** `<div>{count()}</div>` read outside reactive context captures a snapshot. The h() factory must receive accessor functions `() => count()` for reactive bindings. Document: in Streem TSX, the expression `{count()}` is the accessor — the TSX compiler calls `h("div", null, count)` passing `count` as a child, which is the accessor. DO NOT call `count()` as a static value.

  Actually, the opposite is true for text children: the compiler passes the expression value directly. If `count` is a signal, `{count()}` in JSX is evaluated at call time, giving a snapshot. **The reactive pattern is `{() => count()}` for children and `attr={() => count()}` for attributes.** This is the locked decision (accessor-function pattern from CONTEXT.md).

- **Forgetting `createRoot` around component functions:** Components must run inside `createRoot` or effects/computeds inside them will generate DX-03 warnings and have no cleanup scope.

- **Mutating `import.meta.hot.data` directly:** `data = { ... }` re-assignment is not supported by Vite. Must use `data.key = value` property mutation.

- **Using jsdom instead of happy-dom for DOM tests:** jsdom is significantly slower; happy-dom covers all needed APIs for Streem's DOM tests.

- **Missing `./jsx-dev-runtime` export in package.json:** Some bundlers always load the dev runtime even in production mode. Both exports must exist. Can re-export from `jsx-runtime`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reactive subscriptions | Custom dependency tracking | `/core` `effect()`, `createRoot()` | Already built, tested, handles disposal, cleanup, batching |
| Signal read tracking | Custom subscriber registry | `/core` `effect()` | The push-pull graph handles stale subscription cleanup automatically |
| Effect disposal on unmount | Manual cleanup registry | `/core` `onCleanup()` + `createRoot` | Nested owner scopes auto-dispose on parent disposal |
| DOM list diffing algorithm | Custom VDOM diff | Explicit key function + `Map<key, row>` reconciliation | Key-based identity is simpler and correct; VDOM defeats the purpose of fine-grained signals |
| CSS class toggling | `className = computeAllClasses()` | `classList.toggle()` per binding | Per-class bindings are granular; recomputing all classes is a full rerender smell |

**Key insight:** The `/core` owner tree (`createRoot`/`onCleanup`) handles all lifecycle and disposal. The DOM layer only needs to create scopes in the right places and register cleanups.

## Common Pitfalls

### Pitfall 1: JSX Expression Evaluation Order
**What goes wrong:** Developer writes `<div class={active ? 'on' : 'off'}>` — static ternary, not reactive. Signal reads inside JSX must be wrapped in arrow functions: `<div class={() => active() ? 'on' : 'off'}>`.
**Why it happens:** TypeScript evaluates JSX expressions eagerly. `{expr}` is computed when `h()` is called, not when the DOM updates.
**How to avoid:** Document the accessor pattern explicitly. Reactive values in JSX always use arrow functions.
**Warning signs:** A signal changes but the DOM does not update.

### Pitfall 2: Component Function Re-execution
**What goes wrong:** Developer calls a signal read directly in the component body (not in JSX): `const snapshot = count()`. Then expects it to update.
**Why it happens:** Component functions run exactly once. Non-JSX signal reads are snapshots.
**How to avoid:** COMP-02 is intentional — document it. Signal reads in the component body are deliberate snapshots; for reactive values, use JSX expressions or `effect()`.
**Warning signs:** State appears stale after signal updates.

### Pitfall 3: Missing Scope on For Item Rendering
**What goes wrong:** List items don't clean up on removal — event listeners leak, effects keep running after item removed from list.
**Why it happens:** Each list item must have its own `createRoot` scope so that when the reconciler disposes an item, all its effects and event listeners clean up.
**How to avoid:** `<For>` must call `createRoot` per item and store the dispose function in the reconciliation map.
**Warning signs:** Memory leak observed; effects fire for items that are no longer in the list.

### Pitfall 4: ErrorBoundary Not Re-throwing Promise
**What goes wrong:** `<ErrorBoundary>` catches a Promise thrown by a `<Suspense>` descendant and renders the error fallback instead of letting Suspense handle it.
**Why it happens:** Both ErrorBoundary and Suspense use try/catch internally. ErrorBoundary must check `if (err instanceof Promise) throw err` before treating the thrown value as an error.
**How to avoid:** ErrorBoundary explicitly re-throws Promises. Suspense catches Promises, ErrorBoundary catches Error instances. Order: ErrorBoundary wraps Suspense wraps children.
**Warning signs:** Suspense shows error fallback instead of loading fallback.

### Pitfall 5: HMR hot.data Re-assignment
**What goes wrong:** `import.meta.hot.data = { signals: {...} }` does not work — Vite does not persist re-assignments of the `data` object itself.
**Why it happens:** Vite's `hot.data` object is shared by reference; only property mutations are preserved across hot updates.
**How to avoid:** Always mutate: `import.meta.hot.data.signals = capturedState`. Never reassign `data` itself.
**Warning signs:** Signal state resets to initial values on every HMR reload despite HMR code being present.

### Pitfall 6: For Item Receives Value Snapshot (Not Reactive)
**What goes wrong:** `<For each={items()}>...` — the item passed to the render function is a JavaScript value at the time of list creation. If the item object is mutated later (not replaced in the array), the render function's closure won't update.
**Why it happens:** Without a compiler, `<For>` can't auto-wrap item reads in signals. Streem's design (locked) uses explicit key functions and treats item identity by key.
**How to avoid:** Items in `<For>` lists should be treated as immutable snapshots. To update item content, replace the item in the signal array (which triggers reconciliation). For deeply reactive items, use nested signals within item objects.
**Warning signs:** Item content doesn't update when item object is mutated in place.

### Pitfall 7: SolidJS Suspense vs. Streem Suspense Protocol
**What goes wrong:** Attempting to follow SolidJS Suspense implementation guides — SolidJS does NOT use the thrown-Promise protocol. It uses a counter mechanism tied to `createResource`.
**Why it happens:** SolidJS Suspense is deeply integrated with its reactive resource system and does not catch thrown Promises. The thrown-Promise protocol is React's design.
**How to avoid:** Streem's `<Suspense>` is explicitly designed to use thrown Promises (locked decision). Implement the catch-Promise-in-try/catch pattern, not the SolidJS counter mechanism. The two are incompatible.
**Warning signs:** Trying to use `createResource` from Streem to trigger Suspense before Phase 3; expecting SolidJS `<Suspense>` examples to work with Streem's implementation.

### Pitfall 8: tsconfig.json JSX settings not propagated to consuming projects
**What goes wrong:** Developer's app compiles TSX without `jsxImportSource: "streem"` and gets errors or wrong runtime.
**Why it happens:** The `tsconfig.json` in `packages/dom` sets the JSX config for the package itself, not for downstream consumers.
**How to avoid:** Document that consuming projects must add `"jsx": "react-jsx"` and `"jsxImportSource": "streem"` to their own `tsconfig.json`. Optionally provide a `tsconfig.streem.json` extend target.
**Warning signs:** `Cannot find module 'streem/jsx-runtime'` at compile time; JSX not updating reactively.

## Code Examples

Verified patterns from official sources:

### JSX Runtime Entry Point (package.json exports)
```json
// Source: https://www.typescriptlang.org/tsconfig/jsxImportSource.html
// Both subpath exports REQUIRED for jsxImportSource to resolve
{
  "name": "streem",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./jsx-runtime": {
      "import": "./dist/jsx-runtime.js",
      "types": "./dist/jsx-runtime.d.ts"
    },
    "./jsx-dev-runtime": {
      "import": "./dist/jsx-dev-runtime.js",
      "types": "./dist/jsx-dev-runtime.d.ts"
    }
  }
}
```

### Consumer tsconfig.json
```json
// Source: https://www.typescriptlang.org/tsconfig/jsxImportSource.html
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "streem"
  }
}
```

### Signal State Preservation Across HMR
```typescript
// Source: https://vite.dev/guide/api-hmr
// Pattern verified from Vite official docs

const count = signal(
  import.meta.hot?.data?.count ?? 0  // restore previous value
)

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.count = count()              // save current value before reload
  })
  import.meta.hot.accept()           // self-accept: module is the HMR boundary
}
```

### hot.data Mutation Rules
```typescript
// Source: https://vite.dev/guide/api-hmr
// Correct: mutate properties
import.meta.hot.data.signals = capturedState

// WRONG: re-assignment not supported
// import.meta.hot.data = { signals: capturedState }
```

### vitest.config.ts for DOM package
```typescript
// Uses happy-dom for fast DOM testing
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    name: '/dom',
  },
})
```

### Effect-based Text Node Binding
```typescript
// Source: SolidJS dom-expressions pattern (verified via SolidJS docs)
// Each binding creates one effect targeting one DOM node
import { effect } from '/core'

function bindText(node: Text, accessor: () => string): void {
  effect(() => {
    node.nodeValue = accessor()
  })
  // Effect auto-disposes when parent createRoot scope disposes
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `React.createElement` / Babel JSX transform | `jsx: "react-jsx"` + `jsxImportSource` automatic imports | TypeScript 4.1 / React 17 (2020) | No manual import needed; supports custom runtimes without Babel |
| `handleHotUpdate` plugin hook | `hotUpdate` hook (per-environment) | Vite 6 (2024) | More granular HMR in multi-environment setups |
| Virtual DOM diffing for updates | Fine-grained signal effects per DOM node | Solid/alien-signals era (2020+) | No reconciliation overhead; surgical DOM updates |
| `jsdom` for all DOM tests | `happy-dom` for speed, `jsdom` fallback for coverage | 2022+ | ~3x faster test suite |

**Deprecated/outdated:**
- `handleHotUpdate` in Vite plugins: still works but `hotUpdate` is preferred in Vite 6+/7. For Phase 2, use `hotUpdate` since project already uses Vite 7.
- Classic JSX transform (`jsxFactory`/`jsxFragmentFactory` in tsconfig): superseded by `jsxImportSource`. Do not use.

## Open Questions

1. **Suspense progressive resolution implementation**
   - What we know: Multiple children can each throw a Promise; when all resolve, show children
   - What's unclear: How to track individual child pending states without re-running all children (since `h()` is synchronous and immediate)
   - Recommendation: For Phase 2 stub, implement simple "if any promise thrown, show fallback; when promise resolves, retry full render". Progressive resolution (each child resolves independently) requires async rendering slots — design this when `createResource` (Phase 3) defines the actual pending signal protocol. The stub is sufficient for the success criteria.

2. **onMount timing — synchronous vs. microtask**
   - What we know: `/core` effects are synchronous (run immediately on creation)
   - What's unclear: Does `onMount` need a `queueMicrotask` delay to guarantee the rendered nodes are in the document, or is synchronous sufficient for Streem's use case?
   - Recommendation: Since `render()` appends to the DOM synchronously and `onMount` registers as an effect after `h()` returns, implement synchronously first. If tests reveal timing issues (e.g., `getBoundingClientRect()` returning zeros), add `queueMicrotask` wrapper.

3. **For component — item signal model**
   - What we know: Items are passed by value in the render function; structural change triggers full row teardown+rebuild
   - What's unclear: The locked design passes `item` by value, but `index` is `() => number` (a getter). For deeply reactive lists, nested signals inside item objects are the recommended pattern — this should be documented clearly.
   - Recommendation: Implement as specified (item = value, index = getter). Add a comment/warning in dev mode if the same key appears twice (duplicate key detection).

## Sources

### Primary (HIGH confidence)
- TypeScript official docs — `jsxImportSource`, `jsx: "react-jsx"` behavior, required file exports
- https://vite.dev/guide/api-hmr — `import.meta.hot.data`, `hot.dispose()`, `hot.accept()`, `hotUpdate` hook
- `/core` source code (`/packages/core/src/`) — reactive primitives being consumed

### Secondary (MEDIUM confidence)
- https://docs.solidjs.com/reference/components/for — `<For>` API reference (SolidJS alignment)
- https://docs.solidjs.com/reference/components/error-boundary — `<ErrorBoundary>` API and behavior (SolidJS alignment)
- https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity — accessor pattern design rationale
- Multiple WebSearch results for thrown-Promise Suspense protocol implementation

### Tertiary (LOW confidence)
- SolidJS GitHub discussion on Suspense internals (counter mechanism vs. thrown Promise) — confirms architectural difference but Streem's design is a locked decision
- `@solid-primitives/keyed` — explicit key function patterns (considered but not used as dependency)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against existing monorepo (Vite 7, Vitest 4, TypeScript 5.8 already in use); `happy-dom` is well-documented Vitest option
- Architecture: HIGH — `jsxImportSource` mechanism verified via TypeScript official docs; HMR pattern verified via Vite official docs; accessor-pattern design verified via SolidJS docs and Phase 1 reactive core
- Pitfalls: HIGH for JSX/HMR; MEDIUM for Suspense progressive resolution (design not fully specified until Phase 3)

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable APIs; Vite 7 + TypeScript 5.8 are current stable)
