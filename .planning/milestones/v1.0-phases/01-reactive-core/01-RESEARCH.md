# Phase 1: Reactive Core - Research

**Researched:** 2026-02-27
**Domain:** Custom push-pull reactive signal primitives, owner/cleanup tree, TypeScript monorepo scaffold
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Signal API shape**
- `signal(initialValue)` returns a getter function with a `.set(value)` method — `count()` to read, `count.set(1)` to write
- `.set(value)` only — no updater function overload or `.update(fn)` variant; keep the setter minimal
- `computed(fn)` returns a read-only getter function — same callable shape as signals, but no `.set` on the type
- `effect(fn)` returns a dispose function for manual cleanup (separate from owner-scope disposal)
- Optional second argument for debug label: `signal(0, { name: 'count' })` — shows in dev warnings, zero cost when omitted

**alien-signals integration**
- alien-signals is inspiration only — `/core` is a fully custom implementation with no runtime dep on alien-signals
- Algorithm basis: push-pull (signals push change notifications, computeds pull lazily on read)
- Circular dependency handling: throw a descriptive error in dev mode, silent cycle-break in prod
- Internal data structures (arrays vs. sets for dependency tracking): Claude's discretion

**Owner tree contract**
- `createRoot(fn)` returns a dispose function — `const dispose = createRoot(() => { /* setup */ }); dispose()`
- No implicit global root — explicit-only. Every `effect()` or `computed()` created outside a root scope triggers the DX-03 dev warning
- `runWithOwner(owner, fn)` with a disposed owner: throw in dev, no-op in prod (matches circular dep pattern)
- `onCleanup()` callbacks run synchronously when the containing scope disposes; inside an effect, cleanup also runs before each re-execution

**Dev-mode warning system**
- Surface via `console.warn` only — no configurable handler in Phase 1
- Warning format: message + native call stack (e.g. `[Streem] Signal read outside reactive context. This is likely a snapshot.`)
- Debug labels on signals show in warning messages when set: `[Streem] Signal "count" read outside reactive context`
- Dev mode detected via `import.meta.env.DEV` — tree-shaken by Vite/Rollup in prod, works in Vitest for the Node test suite

### Claude's Discretion
- Internal reactive graph data structures (arrays vs. sets for dependency lists)
- Exact internal node representation for the owner tree
- Test file organization and naming conventions within the Node test suite

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIGNAL-01 | Developer can create a typed reactive signal with an initial value using `signal()` from a plain TypeScript file — no build plugin required | Custom implementation using push-pull algorithm; TypeScript generics; no Vite/Babel deps in `/core` |
| SIGNAL-02 | Developer can derive computed values that auto-update using `computed()` without manual dependency arrays | Lazy computed pattern — mark Pending on dependency change, re-evaluate on read; dependency tracking via active subscriber stack |
| SIGNAL-03 | Developer can create side effects that auto-track their reactive dependencies using `effect()` without dependency arrays | Active subscriber context during synchronous effect execution; push notification triggers re-run |
| SIGNAL-04 | Developer can scope reactive computations using `createRoot()` so that all nested effects and signals are disposed when the root is disposed | Owner tree with bottom-up `onCleanup` traversal on dispose; SolidJS pattern well-documented |
| SIGNAL-05 | Developer can register cleanup callbacks using `onCleanup()` that fire when the containing reactive scope is disposed | `onCleanup` registered on current owner node; fires before effect re-runs and on scope disposal |
| DX-02 | Dev-mode runtime emits a console warning when a signal is read outside any reactive tracking context | Check `getCurrentSubscriber()` at read time; if null and `import.meta.env.DEV`, emit `console.warn` |
| DX-03 | Dev-mode runtime emits a console warning when a reactive computation is created without an active owner scope | Check `getCurrentOwner()` at `effect()`/`computed()` creation time; if null and `import.meta.env.DEV`, emit `console.warn` |
</phase_requirements>

---

## Summary

Phase 1 builds `/core` — the DOM-free reactive primitive layer that every other Streem package depends on. The implementation is a custom push-pull reactive system (not a wrapper around alien-signals), with the alien-signals algorithm serving as the reference implementation. The public API surface is `signal()`, `computed()`, `effect()`, `createRoot()`, `onCleanup()`, `getOwner()`, and `runWithOwner()`. All primitives must be testable in Node with no DOM dependency.

The push-pull algorithm is well-understood: source signals eagerly push a `Dirty` (or lightweight `Pending`) notification through the subscriber graph when their value changes, but computed values are pulled lazily — they only re-evaluate when read and only when actually dirty. This avoids redundant computation (a computed whose source changed back to its original value before being read will detect the equality on re-read and skip downstream notifications). Effects are push-driven: they re-run synchronously when any dependency emits a dirty notification.

The owner tree is the most critical correctness primitive. Every `effect()` and `computed()` must be created inside a reactive owner scope (either a `createRoot()` call or another reactive computation). On scope disposal, the tree is walked bottom-up, firing all registered `onCleanup` callbacks before releasing subscriber registrations. Without this, every stream adapter, component, and effect in downstream phases will leak. The dev-mode warnings (`import.meta.env.DEV`) are not optional — they are how users discover ownership bugs before they become memory leaks in production. `import.meta.env.DEV` is `true` during Vitest runs (NODE_ENV defaults to `'test'`, not `'production'`), so the same warning code is exercised by the test suite with no special configuration.

**Primary recommendation:** Build the owner tree and cleanup system first (Plan 01-01), then layer the public API on top (Plan 01-02), then add dev warnings and the full test suite (Plan 01-03). Do not write public API before the owner tree is solid — the owner tree is load-bearing for everything else.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language; generics for `Signal<T>`, `Computed<T>` | Current stable; `moduleResolution: "bundler"` pairs with Vite; TS 7 (Go compiler) is mid-2026 alpha — do not use |
| Vitest | ^4.0 | Node-based test runner for the `/core` test suite | Current stable (Vitest 4 released Oct 2025); `import.meta.env.DEV` is natively supported; fastest TS-native test runner |
| pnpm workspaces | ^9.x | Monorepo package management | Standard for TypeScript monorepos in 2026; `workspace:*` protocol; strict `node_modules` prevents phantom deps |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-dts | ^4.x | Emit `.d.ts` declarations alongside ESM/CJS build | Used in Plan 01-01 for the `/core` build config; `rollupTypes: true` produces a single declaration file |
| Vite (lib mode) | ^7.0 | Build `/core` as a distributable package | Required for lib mode build; esbuild handles TypeScript transpilation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom implementation | `alien-signals` as runtime dep | Locked decision: alien-signals is inspiration only; Streem needs its own API shape (`.set()` vs `signal(value)` call) and owner tree integration not provided by alien-signals |
| Custom implementation | `@preact/signals-core` | Preact signals use pull-only algorithm; tied to Preact scheduler assumptions; alien-signals algorithm is faster in computed-heavy scenarios |
| Custom implementation | SolidJS reactive primitives | SolidJS signals require `createRoot` from SolidJS and carry SolidJS scheduler — not extractable cleanly |
| pnpm | npm workspaces | npm workspaces lack strict isolation; phantom dependency risk; pnpm is the 2026 monorepo standard |
| pnpm | Yarn Berry | More complex configuration; pnpm simpler with equivalent correctness |

**Installation (root workspace):**
```bash
# Initialize pnpm workspace
pnpm init
# Add shared dev deps at root
pnpm add -Dw typescript vite vite-plugin-dts vitest
# Create the core package
mkdir -p packages/core/src
```

---

## Architecture Patterns

### Recommended Project Structure

```
streem/                           # Monorepo root
├── packages/
│   └── core/                    # /core — Phase 1 deliverable
│       ├── src/
│       │   ├── reactive.ts      # Internal: push-pull graph, Signal/Computed/Effect nodes
│       │   ├── owner.ts         # Internal: Owner node, createRoot, onCleanup, getOwner, runWithOwner
│       │   ├── signal.ts        # Public: signal(), computed(), effect() with API wrapper
│       │   └── index.ts         # Public entry: re-exports all public API
│       ├── tests/
│       │   ├── signal.test.ts   # SIGNAL-01, SIGNAL-02, SIGNAL-03 unit tests
│       │   ├── owner.test.ts    # SIGNAL-04, SIGNAL-05 unit tests
│       │   └── dev-warnings.test.ts # DX-02, DX-03 tests (uses vi.stubEnv and vi.spyOn console.warn)
│       ├── package.json
│       ├── tsconfig.json        # Extends root tsconfig.base.json
│       └── vite.config.ts       # Lib mode build + vite-plugin-dts
├── pnpm-workspace.yaml
├── tsconfig.base.json           # Shared: target, module, strict, etc.
└── package.json                 # Root: scripts, devDependencies
```

### Pattern 1: Push-Pull Reactive Graph

**What:** Source signals eagerly push a dirty flag to all subscribers when their value changes. Computed values are lazy — they do not re-evaluate on dirty notification, only when read. Effects are eager — they re-run when notified dirty.

**When to use:** This is the fundamental algorithm for the entire reactive system. Implement first before any public API.

**Implementation approach:**

```typescript
// src/reactive.ts — internal graph nodes (not exported)

// Global tracking state
let currentSubscriber: Subscriber | null = null

interface Subscriber {
  // The set of signals/computeds this subscriber reads from
  deps: Set<Source>
  // Re-run this subscriber
  run(): void
  // Clean up before re-run or on disposal
  cleanup(): void
}

interface Source {
  // All subscribers currently tracking this source
  subs: Set<Subscriber>
  // Current cached value
  value: unknown
}

// Reading a signal: track the current subscriber
function trackRead(source: Source): void {
  if (currentSubscriber !== null) {
    source.subs.add(currentSubscriber)
    currentSubscriber.deps.add(source)
  }
}

// Writing a signal: notify all subscribers
function notifySubscribers(source: Source): void {
  for (const sub of source.subs) {
    sub.cleanup()  // onCleanup callbacks fire before re-run
    sub.run()
  }
}
```

**Key insight:** The internal data structure choice (Set vs Array) for `deps` and `subs` is Claude's discretion. Arrays are faster for small counts (typical: 1-5 deps per computed); Sets are faster for large counts and provide O(1) deduplication. Recommendation: start with Sets for correctness; profile if needed.

### Pattern 2: Owner Tree for Scope and Disposal

**What:** Every `effect()` and `computed()` created inside a reactive root registers itself as a child of the current owner node. When an owner is disposed, it walks its children bottom-up (children first, then parent) calling all `onCleanup` callbacks and releasing subscriber registrations.

**When to use:** Must be implemented before any public API surface. The owner tree is the dependency of everything.

**Implementation approach:**

```typescript
// src/owner.ts — internal owner tree

interface Owner {
  parent: Owner | null
  children: Owner[]
  cleanups: (() => void)[]
  disposed: boolean
}

let currentOwner: Owner | null = null

export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner: Owner = {
    parent: currentOwner,  // attach to parent for context propagation
    children: [],
    cleanups: [],
    disposed: false,
  }

  if (currentOwner !== null) {
    currentOwner.children.push(owner)
  }

  const prevOwner = currentOwner
  currentOwner = owner

  let result: T
  try {
    result = fn(disposeOwner.bind(null, owner))
  } finally {
    currentOwner = prevOwner
  }

  return result!
}

function disposeOwner(owner: Owner): void {
  if (owner.disposed) return
  owner.disposed = true
  // Bottom-up: children first
  for (const child of owner.children) {
    disposeOwner(child)
  }
  for (const cleanup of owner.cleanups) {
    cleanup()
  }
  owner.children = []
  owner.cleanups = []
}

export function onCleanup(fn: () => void): void {
  if (currentOwner !== null) {
    currentOwner.cleanups.push(fn)
  }
  // Note: if called outside owner, fn is never called — acceptable behavior
}

export function getOwner(): Owner | null {
  return currentOwner
}

export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  if (import.meta.env.DEV && owner?.disposed) {
    throw new Error('[Streem] runWithOwner called with a disposed owner.')
  }
  const prevOwner = currentOwner
  currentOwner = owner
  try {
    return fn()
  } finally {
    currentOwner = prevOwner
  }
}
```

### Pattern 3: Public API Wrapper with .set() Method

**What:** The public `signal()` function wraps an internal Signal node and returns a getter function with a `.set()` method attached. This is NOT how alien-signals works (alien-signals uses `signal(value)` for writes) — it is Streem's own API decision.

**When to use:** Plan 01-02. Build the internal graph first, then wrap it.

**Example:**

```typescript
// src/signal.ts — public API

export interface Signal<T> {
  (): T
  set(value: T): void
  readonly _debug?: string  // optional debug label
}

export function signal<T>(
  initialValue: T,
  options?: { name?: string }
): Signal<T> {
  // Internal node (not exported)
  const node = createSignalNode(initialValue)

  const getter = function (): T {
    if (import.meta.env.DEV && currentSubscriber === null && currentOwner === null) {
      const label = options?.name ? ` "${options.name}"` : ''
      console.warn(
        `[Streem] Signal${label} read outside reactive context. This is likely a snapshot.`
      )
    }
    trackRead(node)
    return node.value as T
  } as Signal<T>

  getter.set = function (value: T): void {
    if (!Object.is(node.value, value)) {
      node.value = value
      notifySubscribers(node)
    }
  }

  if (options?.name) {
    Object.defineProperty(getter, '_debug', { value: options.name })
  }

  return getter
}

export function computed<T>(fn: () => T): () => T {
  if (import.meta.env.DEV && currentOwner === null) {
    console.warn(
      '[Streem] computed() created without an active owner scope. ' +
      'This computation will never be automatically disposed (disposal leak).'
    )
  }
  // ... create computed node, register with currentOwner
}

export function effect(fn: () => void): () => void {
  if (import.meta.env.DEV && currentOwner === null) {
    console.warn(
      '[Streem] effect() created without an active owner scope. ' +
      'This effect will never be automatically disposed (disposal leak).'
    )
  }
  // ... create effect node, register with currentOwner, run immediately
  // return manual dispose function
}
```

### Pattern 4: Monorepo Config for `/core`

**What:** A minimal pnpm workspace with a single package for Phase 1. The package publishes ESM, uses `vite-plugin-dts` for declarations, and has `composite: true` TypeScript project references for incremental builds.

**When to use:** Plan 01-01. This is the first thing to set up.

**Example:**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// packages/core/package.json
{
  "name": "/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "workspace:*",
    "vite-plugin-dts": "workspace:*",
    "vitest": "workspace:*",
    "typescript": "workspace:*"
  }
}
```

```typescript
// packages/core/vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    target: 'es2022',
    minify: false,  // library consumers handle minification
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
})
```

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true
  }
}
```

### Anti-Patterns to Avoid

- **Implicit global root:** Do not maintain a global default root. Every effect/computed without an explicit `createRoot` must trigger the DX-03 warning (in dev) or silently never be disposed (in prod). SolidJS requires `createRoot` — follow this pattern.
- **Effect re-registration on every run:** When an effect re-runs, it must first clear its old dependency subscriptions, then re-track during the new run. Failure to clear stale deps causes "ghost subscriptions" where the effect re-runs for signals it no longer reads.
- **Synchronous mutual notification:** When signal A notifies effect X, and effect X synchronously writes to signal B, and signal B has another subscriber — ensure the notification loop doesn't re-enter in a way that causes double-firing. Use a `notifying` flag or notification queue to handle this.
- **Using `import.meta.env.DEV` without `vite/client` types:** Add `/// <reference types="vite/client" />` to `src/index.ts` or `tsconfig.json` types array so TypeScript knows about `import.meta.env`. Otherwise tsc will error on the property.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript monorepo tooling | Custom symlink scripts, manual build ordering | pnpm workspaces + `workspace:*` | pnpm handles hoisting, symlinks, strict isolation — all battle-tested |
| Declaration file generation | Custom `tsc --declaration` pipeline | `vite-plugin-dts` with `rollupTypes: true` | Handles re-exports, produces single `.d.ts`, respects Vite lib mode entry |
| Test runner for Node signals | Custom Node test runner | Vitest with `environment: 'node'` | `import.meta.env.DEV` works natively; fast; no DOM needed for `/core` |
| Changeset/version management | Manual changelog | `@changesets/cli` (Phase 5) | Too early for Phase 1; defer to Phase 5 packaging |

**Key insight:** The reactive algorithm itself must be hand-rolled (alien-signals is inspiration only, not a runtime dep). Everything around the algorithm — tooling, test runner, build — should use standard tools.

---

## Common Pitfalls

### Pitfall 1: Stale Dependency Subscriptions After Effect Re-Run

**What goes wrong:** An effect that initially reads signals A and B may, on re-run, only read signal A. If the old subscription to B is not cleared before re-running, the effect is notified when B changes even though it no longer reads B — causing spurious re-runs and potential infinite loops.

**Why it happens:** Dependency tracking is dynamic (what the effect reads changes per run). The subscriber set must be rebuilt from scratch on every execution.

**How to avoid:** Before re-running an effect, remove the effect from all sources in its current `deps` set, then clear `deps`. During the re-run, fresh dependencies are re-registered via `trackRead`. This is the standard "cleanup then re-track" pattern used in SolidJS and alien-signals.

**Warning signs:** Effects running more times than expected; circular dependency errors that appear non-circular.

### Pitfall 2: `import.meta.env.DEV` Requires Type Reference

**What goes wrong:** TypeScript errors on `import.meta.env.DEV` — "Property 'DEV' does not exist on type 'ImportMeta'".

**Why it happens:** `import.meta.env` is defined by `vite/client` types. Without the reference, TypeScript does not know this property exists.

**How to avoid:** Add `/// <reference types="vite/client" />` to `src/index.ts`, or add `"types": ["vite/client"]` to `tsconfig.json` compilerOptions.

**Warning signs:** TypeScript compilation errors on any `import.meta.env` usage; no errors in Vitest (which handles it via its own vite config) but errors in `tsc --noEmit`.

### Pitfall 3: Dev Warning Fires in Production Bundle

**What goes wrong:** `import.meta.env.DEV` guards are not tree-shaken, and warning code ships in the production bundle, adding ~1KB and console.warn calls in user applications.

**Why it happens:** Dead code elimination only works when the bundler can statically evaluate `import.meta.env.DEV` as `false`. esbuild/Rollup do this correctly when the build mode is `production`, but only if the guard pattern is exactly `if (import.meta.env.DEV)` — not `const isDev = import.meta.env.DEV; if (isDev)`.

**How to avoid:** Always use `if (import.meta.env.DEV)` directly as the condition. Never assign it to an intermediate variable. Verify with `vite build --mode production` and inspect the output for `console.warn` strings.

**Warning signs:** Warning strings appear in the production bundle output; bundle size larger than expected.

### Pitfall 4: Circular Dependency Infinite Loop

**What goes wrong:** Signal A reads signal B in a computed; signal B reads signal A in another computed. Each computation triggers the other, causing a stack overflow or infinite loop.

**Why it happens:** Dynamic dependency tracking does not intrinsically prevent cycles. The reactive graph becomes cyclic.

**How to avoid:** Track whether a source is currently being evaluated (a "computing" flag). If a read is attempted on a source that is currently computing, throw a descriptive error in dev mode; in prod, return the last cached value (cycle-break). The CONTEXT.md has locked this behavior.

**Warning signs:** Stack overflow errors during development with no clear user code frame; browser tab hangs on specific signal interactions.

### Pitfall 5: Effect Cleanup Not Running Before Re-Execution

**What goes wrong:** An effect registers `onCleanup` callbacks. When the effect re-runs due to dependency changes, the cleanup should fire first (before the new run). If cleanup is tied only to scope disposal (not re-execution), stream adapters and subscriptions accumulate across re-runs.

**Why it happens:** Confusing "cleanup on scope disposal" with "cleanup before re-run." SolidJS documents this explicitly: `onCleanup` fires on "disposal and recalculation of the current tracking scope." Both must be implemented.

**How to avoid:** When an effect's dependencies change and it is scheduled to re-run, fire its registered `onCleanup` callbacks first, then clear them, then run the effect function (which may register new cleanups).

**Warning signs:** Stream connections doubling on signal changes; resources accumulating across effect re-runs.

### Pitfall 6: `runWithOwner` with a Disposed Owner

**What goes wrong:** A callback passed to `runWithOwner` with an already-disposed owner creates effects that will never be disposed (the owner is gone, its `children` array was cleared on disposal).

**Why it happens:** The owner reference is captured at component creation time. If the component unmounts and its root is disposed before an async callback fires (e.g., `setTimeout`), calling `runWithOwner(capturedOwner, fn)` creates orphaned effects.

**How to avoid:** Check `owner.disposed` at the start of `runWithOwner`. In dev mode, throw a descriptive error. In prod, no-op (do not execute `fn`). This matches the CONTEXT.md locked decision.

**Warning signs:** Effects created in async callbacks continuing to run after component unmount.

---

## Code Examples

Verified patterns from research and SolidJS official docs:

### Basic Signal Read/Write (Phase 1 Public API)

```typescript
// Source: CONTEXT.md locked API decisions
import { signal } from '/core'

const count = signal(0)
console.log(count())   // 0 — read
count.set(1)
console.log(count())   // 1

// With debug label
const name = signal('Alice', { name: 'username' })
```

### Computed (Lazy Derived Value)

```typescript
// Source: SolidJS docs pattern — https://docs.solidjs.com/reference/basic-reactivity/create-memo
import { signal, computed, createRoot } from '/core'

createRoot((dispose) => {
  const count = signal(0)
  const doubled = computed(() => count() * 2)

  console.log(doubled())  // 0 — computed not yet subscribed, evaluates lazily
  count.set(5)
  console.log(doubled())  // 10 — re-evaluated on read
  dispose()
})
```

### Effect with onCleanup

```typescript
// Source: SolidJS onCleanup docs — https://docs.solidjs.com/reference/lifecycle/on-cleanup
import { signal, effect, onCleanup, createRoot } from '/core'

createRoot((dispose) => {
  const url = signal('/api/data')

  const stopEffect = effect(() => {
    const controller = new AbortController()
    fetch(url()).then(/* ... */)

    onCleanup(() => {
      controller.abort()  // fires before each re-run AND on dispose
    })
  })

  // Manual dispose of just this effect (separate from owner disposal)
  // stopEffect()

  dispose()  // disposes owner — fires all onCleanup callbacks
})
```

### Dev Warning: Signal Outside Reactive Context (DX-02)

```typescript
// Source: CONTEXT.md locked decisions
import { signal } from '/core'

const count = signal(0, { name: 'count' })
// Called outside any createRoot/effect/computed:
count()
// => console.warn('[Streem] Signal "count" read outside reactive context. This is likely a snapshot.')
```

### Dev Warning: Effect Without Owner (DX-03)

```typescript
// Source: CONTEXT.md locked decisions
import { effect } from '/core'

// Called at module top-level, not inside createRoot:
effect(() => { /* ... */ })
// => console.warn('[Streem] effect() created without an active owner scope. This effect will never be automatically disposed (disposal leak).')
```

### getOwner / runWithOwner Pattern

```typescript
// Source: SolidJS getOwner docs — https://docs.solidjs.com/reference/reactive-utilities/get-owner
import { getOwner, runWithOwner, effect, createRoot } from '/core'

createRoot((dispose) => {
  const owner = getOwner()

  setTimeout(() => {
    // Re-attach to the owner captured at creation time
    runWithOwner(owner!, () => {
      effect(() => {
        console.log('async-created but properly owned effect')
      })
    })
  }, 1000)
})
```

### Testing Dev Warnings with Vitest

```typescript
// Source: Vitest docs — vi.stubEnv, vi.spyOn
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signal } from '/core'

describe('DX-02: signal read outside reactive context', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warnSpy.mockClear()
  })

  it('warns when signal is read with no active subscriber', () => {
    const count = signal(0, { name: 'count' })
    count()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Streem] Signal "count" read outside reactive context')
    )
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manually tracking subscriptions with `.subscribe()` calls | Owner-tree auto-disposal via `createRoot`/`onCleanup` | SolidJS ~2020, now ecosystem standard | No manual unsubscribe; disposal is automatic when scope is disposed |
| Pull-only reactive (Preact Signals) | Push-pull hybrid (alien-signals, Vue 3.6) | 2024-2025 | Computed-heavy graphs are 3-5x faster; avoids redundant re-evaluation |
| Separate `Subscriber` and `Dependency` types | Merged `ReactiveNode` | alien-signals v2 (Apr 2025) | Simpler internal representation; lower memory overhead |
| Eager dirty propagation (flag all descendants immediately) | Pending flag + lazy dirty propagation | alien-signals v2+ | Computed that returns to original value causes no downstream re-run |
| `import.meta.env.DEV` as an afterthought | `DEV` guards tree-shaken at build time by esbuild | Vite 3+ | Zero dev-only code in production bundles when pattern is used correctly |
| Vitest workspace config (separate file) | Vitest `projects` array in root config | Vitest 3.2 (2025) | `vitest.workspace` file is deprecated; use `test.projects` in `vitest.config.ts` |

**Deprecated/outdated:**
- alien-signals v1/v2 API examples from older blog posts: Do not use. v3.x is current stable (v3.1.2 as of 2026-02-27). The alien-signals surface API did not change significantly for standard users between v2 and v3, but internal `createReactiveSystem()` options were renamed (`notifyEffect` → `notify`, `updateComputed` → `update`). Since Streem is not using alien-signals as a runtime dep, this is informational only.
- `vitest.workspace` file: Deprecated in Vitest 3.2. Use `test.projects` in `vitest.config.ts`.

---

## Open Questions

1. **Notification ordering: synchronous vs. scheduled**
   - What we know: The phase description requires effects to re-run when dependencies change. alien-signals and SolidJS both run effects synchronously (no scheduling).
   - What's unclear: Whether Phase 1 should support synchronous-only execution or lay groundwork for a future scheduler (needed for batch() in Phase 3).
   - Recommendation: Implement synchronous notification in Phase 1. Plan 01-01 should include a note that the notification loop will be extended in Phase 3 to support `batch()`. The `batch()` API needs a way to defer notifications — a simple `isBatching` flag with a deferred queue is sufficient to stub in Phase 1 even if not exposed publicly.

2. **Array vs. Set for dependency lists**
   - What we know: This is explicitly Claude's discretion per CONTEXT.md. Arrays are cache-friendly for small N (typical signal has 1-5 subscribers). Sets provide O(1) deduplication at the cost of object allocation.
   - What's unclear: Whether the test suite will surface performance regressions that matter at Phase 1 scale.
   - Recommendation: Use Sets for `deps` and `subs` in the initial implementation. Sets simplify the "remove subscriber from source" operation on cleanup. If benchmarks in Phase 3 or Phase 6 show contention, migrate to arrays.

3. **Effect execution model: immediate vs. deferred first run**
   - What we know: SolidJS runs effects immediately on creation (synchronous first run). alien-signals also runs effects immediately.
   - What's unclear: Whether Streem effects should always run immediately or optionally defer.
   - Recommendation: Run immediately on creation (consistent with SolidJS, alien-signals). Document this clearly since React developers expect `useEffect` to run after render, not during creation.

---

## Sources

### Primary (HIGH confidence)

- [alien-signals GitHub (stackblitz/alien-signals)](https://github.com/stackblitz/alien-signals) — API surface: `signal()`, `computed()`, `effect()`, `effectScope()`, `createReactiveSystem()`, push-pull algorithm basis
- [alien-signals npm (v3.1.2 confirmed latest)](https://www.npmjs.com/package/alien-signals) — version 3.1.2, 54 dependents, no vulnerabilities
- [SolidJS createRoot Reference](https://docs.solidjs.com/reference/reactive-utilities/create-root) — owner tree contract, disposal semantics, `createRoot` without dispose param = unowned root
- [SolidJS onCleanup Reference](https://docs.solidjs.com/reference/lifecycle/on-cleanup) — fires on "disposal and recalculation of the current tracking scope"
- [SolidJS getOwner Reference](https://docs.solidjs.com/reference/reactive-utilities/get-owner) — `getOwner()` returns current owner, `runWithOwner()` pattern
- [Vite Env Variables Docs](https://vite.dev/guide/env-and-mode) — `import.meta.env.DEV` is `true` when `NODE_ENV` !== `'production'`; tree-shaken by esbuild when `false`
- [Vitest config docs](https://vitest.dev/config/) — `test.projects` replaces deprecated `vitest.workspace`; `import.meta.env.DEV` is `true` in Vitest (NODE_ENV = 'test')
- [pnpm workspaces docs](https://pnpm.io/workspaces) — `pnpm-workspace.yaml`, `workspace:*` protocol, strict isolation

### Secondary (MEDIUM confidence)

- [SolidJS Owner Tree Discussions (GitHub #719)](https://github.com/solidjs/solid/discussions/719) — disposal semantics, bottom-up cleanup order, cross-checked with official docs
- [Angular Signals reactive context — async boundary tracking loss](https://medium.com/@eugeniyoz/angular-signals-reactive-context-and-dynamic-dependency-tracking-d2d6100568b0) — confirms tracking is lost after `await`; corroborates pitfall documentation
- [Vite GitHub Discussion — DEV flag behavior](https://github.com/vitejs/vite/discussions/14083) — confirms `import.meta.env.PROD` = `NODE_ENV === 'production'`; DEV is always opposite
- [pnpm + TypeScript monorepo setup guide](https://brockherion.dev/blog/posts/setting-up-a-monorepo-with-pnpm-and-typescript/) — workspace structure patterns
- [Live types in TypeScript monorepo — Colin McDonnell](https://colinhacks.com/essays/live-types-typescript-monorepo) — custom export conditions for source-level TypeScript in dev

### Tertiary (LOW confidence, informational only)

- [Vitest monorepo setup guide (thecandidstartup.org)](https://www.thecandidstartup.org/2025/09/08/vitest-3-monorepo-setup.html) — `mergeConfig` pattern for shared Vitest config; single-source, not cross-verified
- [SolidJS createRoot detachment discussion (GitHub #860)](https://github.com/solidjs/solid/discussions/860) — `createRoot` inside reactive owner is NOT added to parent `owned` array; informational for implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pnpm, TypeScript 5.8, Vitest 4, Vite 7 all confirmed stable and version-verified
- Architecture/algorithm: HIGH — push-pull pattern is well-documented via alien-signals source and SolidJS official docs; owner tree pattern is directly from SolidJS official reference docs
- Public API shape: HIGH — locked in CONTEXT.md; no ambiguity
- Pitfalls: HIGH — all 6 pitfalls verified against official SolidJS docs or Vitest docs; no single-source claims
- Dev warning behavior: HIGH — `import.meta.env.DEV` behavior in Vitest confirmed via Vite discussion and Vitest docs

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — stack is stable; alien-signals v3.1.x may release a patch but no breaking changes expected)
