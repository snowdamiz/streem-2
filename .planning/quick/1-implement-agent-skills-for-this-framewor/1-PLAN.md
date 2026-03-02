---
phase: quick-1
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - .agents/skills/streem/SKILL.md
  - .agents/skills/streem/skills/signals/SKILL.md
  - .agents/skills/streem/skills/lifecycle/SKILL.md
  - .agents/skills/streem/skills/components/SKILL.md
  - .agents/skills/streem/skills/streams/SKILL.md
  - .agents/skills/streem/skills/stream-combinators/SKILL.md
  - .agents/skills/streem/skills/lit/SKILL.md
autonomous: true
requirements:
  - SKILLS-01
must_haves:
  truths:
    - "Top-level SKILL.md exists with routing rules to sub-skills"
    - "All 6 sub-skills exist with accurate API docs"
    - "Each sub-skill has TypeScript examples matching the actual codebase"
    - "Progressive disclosure: top-level loads automatically, sub-skills on demand"
  artifacts:
    - path: ".agents/skills/streem/SKILL.md"
      provides: "Auto-loaded entry point with routing to sub-skills"
    - path: ".agents/skills/streem/skills/signals/SKILL.md"
      provides: "signal(), computed(), effect(), isSignal() docs"
    - path: ".agents/skills/streem/skills/lifecycle/SKILL.md"
      provides: "createRoot(), onCleanup(), onMount(), getOwner(), runWithOwner() docs"
    - path: ".agents/skills/streem/skills/components/SKILL.md"
      provides: "h/JSX, Fragment, render(), Show, For, ErrorBoundary, Suspense docs"
    - path: ".agents/skills/streem/skills/streams/SKILL.md"
      provides: "fromWebSocket(), fromSSE(), fromReadable(), fromObservable(), StreamTuple docs"
    - path: ".agents/skills/streem/skills/stream-combinators/SKILL.md"
      provides: "batch(), throttle(), debounce() docs"
    - path: ".agents/skills/streem/skills/lit/SKILL.md"
      provides: "bindLitProp(), observeLitProp() docs"
  key_links:
    - from: ".agents/skills/streem/SKILL.md"
      to: ".agents/skills/streem/skills/*/SKILL.md"
      via: "routing rules by topic"
      pattern: "read.*skills/"
---

<objective>
Create agent skills for the streem reactive UI framework using progressive disclosure.

Purpose: Enable Claude agents to correctly use streem's APIs without searching the codebase.
Output: Top-level SKILL.md entry point + 6 focused sub-skills with accurate TypeScript docs.
</objective>

<execution_context>
@/Users/sn0w/.claude/get-shit-done/workflows/execute-plan.md
@/Users/sn0w/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

**Package structure:**
- `streem` (main, re-exports all below)
- `/core` — `packages/core/src/`
- `/dom` — `packages/dom/src/`
- `/streams` — `packages/streams/src/`
- `/lit` — `packages/lit/src/`

**Key codebase facts (extracted from source):**

`/core` exports: `signal`, `computed`, `effect`, `isSignal`, `createRoot`, `onCleanup`, `getOwner`, `runWithOwner`, `startBatch`, `endBatch`, `Signal` (type), `Owner` (type)

`/dom` exports: `h`, `Fragment`, `render`, `onMount`, `Show`, `For`, `ErrorBoundary`, `Suspense`, `streemHMR` (Vite plugin), HMR utilities

`/streams` exports: `fromWebSocket`, `fromSSE`, `fromReadable`, `fromObservable`, `batch`, `throttle`, `debounce`, `StreamTuple` (type), `StreamStatus` (type)

`/lit` exports: `bindLitProp`, `observeLitProp`

**Signal interface:**
```typescript
interface Signal<T> {
  get value(): T
  set value(v: T)
  set(value: T): void
}
```

**StreamTuple type:**
```typescript
type StreamStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'
type StreamTuple<T> = [
  data: Signal<T | undefined>,
  status: Signal<StreamStatus>,
  error: Signal<Error | undefined>,
]
```

**computed() returns:** `() => T` (a getter function, not a Signal)

**effect() returns:** `() => void` (a dispose function)

**JSX config:** `jsxImportSource: '/dom'` in tsconfig/vite config

**prop: prefix** — forces JS property assignment (bypasses setAttribute), used for Lit elements
**on: prefix** — addEventListener without lowercasing (for custom events like `on:my-event`)
**attr: prefix** — forces setAttribute path explicitly
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write top-level streem SKILL.md</name>
  <files>.agents/skills/streem/SKILL.md</files>
  <action>
    Create `.agents/skills/streem/SKILL.md` — the auto-loaded entry point.

    Structure:
    ```markdown
    ---
    name: streem
    description: Reactive UI library — signals, JSX, streaming
    auto_load: true
    ---

    # streem

    Reactive UI framework with signals and streams as first-class primitives.

    ## Packages

    | Package | Import | Contents |
    |---------|--------|----------|
    | `streem` | `import { ... } from 'streem'` | Re-exports everything |
    | `/core` | `import { ... } from '/core'` | Signals, effects, scopes |
    | `/dom` | configured via jsxImportSource | JSX factory, render, components |
    | `/streams` | `import { ... } from '/streams'` | Stream adapters, combinators |
    | `/lit` | `import { ... } from '/lit'` | Lit/custom element interop |

    ## Sub-skills (load on demand)

    | Sub-skill | File | When to load |
    |-----------|------|--------------|
    | signals | `skills/signals/SKILL.md` | signal(), computed(), effect(), isSignal() |
    | lifecycle | `skills/lifecycle/SKILL.md` | createRoot(), onCleanup(), onMount(), getOwner(), runWithOwner() |
    | components | `skills/components/SKILL.md` | h/JSX, render(), Show, For, ErrorBoundary, Suspense |
    | streams | `skills/streams/SKILL.md` | fromWebSocket(), fromSSE(), fromReadable(), fromObservable() |
    | stream-combinators | `skills/stream-combinators/SKILL.md` | batch(), throttle(), debounce() |
    | lit | `skills/lit/SKILL.md` | bindLitProp(), observeLitProp() |

    ## Routing rules

    - User asks about state, reactivity, signal, computed, effect → read `skills/signals/SKILL.md`
    - User asks about scope, cleanup, mount, owner, async reactive → read `skills/lifecycle/SKILL.md`
    - User asks about JSX, components, render, Show, For, ErrorBoundary, Suspense → read `skills/components/SKILL.md`
    - User asks about WebSocket, SSE, streams, fromWebSocket, fromSSE → read `skills/streams/SKILL.md`
    - User asks about batch, throttle, debounce, high-frequency → read `skills/stream-combinators/SKILL.md`
    - User asks about Lit, custom elements, web components, bindLitProp → read `skills/lit/SKILL.md`
    ```
  </action>
  <verify>File exists: `ls .agents/skills/streem/SKILL.md`</verify>
  <done>Top-level SKILL.md created with routing table to all 6 sub-skills</done>
</task>

<task type="auto">
  <name>Task 2: Write signals, lifecycle, and components sub-skills</name>
  <files>
    .agents/skills/streem/skills/signals/SKILL.md
    .agents/skills/streem/skills/lifecycle/SKILL.md
    .agents/skills/streem/skills/components/SKILL.md
  </files>
  <action>
    Create three sub-skill files. Use the exact API signatures from the codebase.

    **`.agents/skills/streem/skills/signals/SKILL.md`:**
    ```markdown
    ---
    name: streem/signals
    description: signal(), computed(), effect(), isSignal()
    ---

    # Signals

    Import from `/core` or `streem`.

    ## Signal interface

    ```typescript
    interface Signal<T> {
      get value(): T          // reactive read — tracks dependency when inside effect/computed
      set value(v: T)         // write via setter
      set(value: T): void     // write via method
    }
    ```

    ## signal(initialValue, options?)

    Creates reactive state. Reading `.value` inside an effect or computed registers a dependency.

    ```typescript
    import { signal } from '/core'

    const count = signal(0)
    const name = signal('alice', { name: 'name' }) // named for dev warnings

    count.value          // read
    count.set(1)         // write method
    count.value = 1      // write setter (equivalent)
    ```

    ## computed(fn)

    Creates a lazy derived value. Returns a **getter function** (`() => T`), not a Signal.
    Re-evaluates only when read after a dependency changes (pull-based).

    Must be called inside a reactive scope (createRoot or component body).

    ```typescript
    import { signal, computed } from '/core'

    createRoot((dispose) => {
      const count = signal(0)
      const doubled = computed(() => count.value * 2)  // returns () => T

      console.log(doubled())  // 0 — call it like a function
      count.set(3)
      console.log(doubled())  // 6
    })
    ```

    **NOTE:** `computed()` returns `() => T`, not `Signal<T>`. Call it as `doubled()` not `doubled.value`.

    ## effect(fn)

    Creates a reactive side effect. Runs immediately, re-runs when dependencies change.
    Returns a **dispose function** (`() => void`).

    Must be called inside a reactive scope (createRoot or component body).
    `onCleanup()` inside fn fires before each re-run and on dispose.

    ```typescript
    import { signal, effect, onCleanup } from '/core'

    createRoot((dispose) => {
      const url = signal('/api/data')

      const stop = effect(() => {
        const controller = new AbortController()
        fetch(url.value, { signal: controller.signal })
        onCleanup(() => controller.abort())  // runs before re-run + on dispose
      })

      url.set('/api/other')  // triggers cleanup then re-run
      stop()                 // manual dispose
    })
    ```

    ## isSignal(value)

    Type guard — returns `true` if value is a `Signal` created by `signal()`.

    ```typescript
    import { isSignal } from '/core'

    isSignal(count)    // true
    isSignal(42)       // false
    isSignal(doubled)  // false — computed returns a function, not a Signal
    ```

    ## Rules

    - Always create signals inside a reactive scope or at module level (module-level is fine — no owner needed for signals themselves, only for effects/computeds)
    - `computed()` and `effect()` MUST be inside a scope — they warn in dev if not
    - `computed()` is lazy (pull-based) — not pushed on every change
    - `effect()` is eager — runs immediately on creation
    ```

    ---

    **`.agents/skills/streem/skills/lifecycle/SKILL.md`:**
    ```markdown
    ---
    name: streem/lifecycle
    description: createRoot(), onCleanup(), onMount(), getOwner(), runWithOwner()
    ---

    # Lifecycle & Scope

    Import from `/core` or `streem`. `onMount` is from `/dom`.

    ## createRoot(fn)

    Creates a reactive owner scope. All effects/computeds created inside are automatically
    disposed when `dispose()` is called. Bottom-up disposal (children before parents).

    ```typescript
    import { createRoot, signal, effect } from '/core'

    const dispose = createRoot((dispose) => {
      const count = signal(0)
      effect(() => console.log(count.value))
      return dispose  // return dispose for external control
    })

    dispose()  // stops all effects, fires all onCleanup callbacks
    ```

    ## onCleanup(fn)

    Registers a teardown callback on the current scope.

    - Inside an `effect` body → fires **before each re-run** and on dispose
    - Inside a `createRoot` (not effect) → fires on scope dispose only
    - Outside any scope → silently dropped (intentional, not a bug)

    ```typescript
    effect(() => {
      const ws = new WebSocket(url.value)
      onCleanup(() => ws.close())  // closes before re-run when url changes
    })
    ```

    ## onMount(fn)

    Runs `fn` once when the component's DOM is ready (synchronous — `h()` creates DOM immediately).
    If `fn` returns a cleanup function, it fires on component unmount.

    Import from `/dom`.

    ```typescript
    import { onMount } from '/dom'

    function MyComponent() {
      onMount(() => {
        // DOM exists here — component is mounted
        const timer = setInterval(() => { ... }, 1000)
        return () => clearInterval(timer)  // cleanup on unmount
      })
      return <div>...</div>
    }
    ```

    **NOTE:** Signal reads inside `onMount` are snapshots (no reactive tracking), because
    `onMount` does not run inside an `effect`. Use explicit `effect()` for reactive subscriptions.

    ## getOwner() / runWithOwner(owner, fn)

    Capture and re-attach reactive scope across async boundaries.

    ```typescript
    import { getOwner, runWithOwner, effect } from '/core'

    createRoot(() => {
      const owner = getOwner()

      // Later, in an async callback:
      setTimeout(() => {
        runWithOwner(owner!, () => {
          effect(() => { ... })  // properly owned — will be disposed with root
        })
      }, 1000)
    })
    ```

    `runWithOwner` throws (dev) or no-ops (prod) if the owner is already disposed.
    Use this to avoid "reactive computation created after component unmount" bugs.

    ## Owner interface

    ```typescript
    interface Owner {
      parent: Owner | null
      children: Owner[] | null
      cleanups: (() => void)[] | null
      disposed: boolean
    }
    ```
    ```

    ---

    **`.agents/skills/streem/skills/components/SKILL.md`:**
    ```markdown
    ---
    name: streem/components
    description: h/JSX, Fragment, render(), Show, For, ErrorBoundary, Suspense
    ---

    # Components & JSX

    Import from `/dom` or configure via `jsxImportSource`.

    ## TSConfig / Vite setup

    ```json
    // tsconfig.json
    { "compilerOptions": { "jsxImportSource": "/dom" } }
    ```

    ```typescript
    // vite.config.ts
    import { defineConfig } from 'vite'
    export default defineConfig({
      esbuild: { jsxImportSource: '/dom' }
    })
    ```

    ## Component model

    Component functions run **exactly once**. Reactivity comes from passing signal accessors
    into JSX — not from re-running the component.

    ```typescript
    function Counter() {
      const count = signal(0)
      // CORRECT: accessor () => count.value tracks reactively
      return <div onClick={() => count.set(c => c + 1)}>{() => count.value}</div>
      //                                                  ^-- accessor function, not count.value directly
    }
    ```

    ## JSX prop binding

    | Prop syntax | Behavior |
    |-------------|----------|
    | `value={42}` | Static setAttribute |
    | `value={() => sig.value}` | Reactive attribute — updates on change |
    | `value={sig}` | Reactive attribute — Signal instance auto-wrapped |
    | `prop:value={accessor}` | JS property assignment (use for Lit/custom elements) |
    | `attr:disabled={accessor}` | Force setAttribute path |
    | `onClick={handler}` | addEventListener('click', handler) — lowercased |
    | `on:my-event={handler}` | addEventListener('my-event', handler) — case preserved |
    | `class={() => cls}` | Reactive class binding |
    | `style={() => obj}` | Reactive style binding (CSSStyleDeclaration partial) |
    | `ref={el => ...}` | DOM ref callback — called with element on mount |

    ## render(component, container)

    Mounts a component into a DOM element. Returns a dispose function.

    ```typescript
    import { render } from '/dom'

    const dispose = render(() => <App />, document.getElementById('app')!)
    // dispose() — unmounts and cleans up all effects
    ```

    ## Show

    Conditional rendering. Children re-create on each show/hide transition.

    ```typescript
    <Show when={() => isLoggedIn.value} fallback={<Login />}>
      {() => <Dashboard />}
    </Show>
    ```

    Props: `when: boolean | (() => boolean)`, `fallback?`, `children`

    ## For

    Keyed list rendering with fine-grained reconciliation. Only creates/destroys rows
    for keys that appear/disappear. Existing keys update their index ref only.

    ```typescript
    <For each={() => items.value} by={(item) => item.id}>
      {(item, index) => <li>{item.name} — position {() => index()}</li>}
    </For>
    ```

    Props: `each: T[] | (() => T[])`, `by: (item: T) => string | number`, `fallback?`, `children: (item, index: () => number) => Node`

    **NOTE:** `index` is a getter function `() => number`, not a number directly. Call `index()`.

    ## ErrorBoundary

    Catches synchronous render errors. Re-throws Promises so Suspense above can catch them.

    ```typescript
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {String(err)}</div>}>
      {() => <RiskyComponent />}
    </ErrorBoundary>
    ```

    Props: `fallback: (err: unknown, reset: () => void) => Node | Node[] | null`, `children`

    ## Suspense

    Catches thrown Promises (thrown-Promise protocol). Shows fallback while pending.

    ```typescript
    <Suspense fallback={<Spinner />}>
      {() => <AsyncComponent />}
    </Suspense>
    ```

    Props: `fallback`, `children`, `onError?: (err: unknown) => void`

    **NOTE:** `Suspense` returns a `Comment` anchor node (not a DocumentFragment like `Show`/`For`).
    The anchor must be in the DOM before children insert (handled internally via queueMicrotask).
    ```
  </action>
  <verify>
    <automated>ls .agents/skills/streem/skills/signals/SKILL.md .agents/skills/streem/skills/lifecycle/SKILL.md .agents/skills/streem/skills/components/SKILL.md</automated>
  </verify>
  <done>Three sub-skill files exist with accurate API docs matching codebase source</done>
</task>

<task type="auto">
  <name>Task 3: Write streams, stream-combinators, and lit sub-skills</name>
  <files>
    .agents/skills/streem/skills/streams/SKILL.md
    .agents/skills/streem/skills/stream-combinators/SKILL.md
    .agents/skills/streem/skills/lit/SKILL.md
  </files>
  <action>
    Create three more sub-skill files.

    **`.agents/skills/streem/skills/streams/SKILL.md`:**
    ```markdown
    ---
    name: streem/streams
    description: fromWebSocket(), fromSSE(), fromReadable(), fromObservable() — StreamTuple pattern
    ---

    # Stream Adapters

    Import from `/streams` or `streem`.

    ## StreamTuple pattern

    All four adapters return the same shape:

    ```typescript
    type StreamStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'

    type StreamTuple<T> = [
      data: Signal<T | undefined>,
      status: Signal<StreamStatus>,
      error: Signal<Error | undefined>,
    ]
    ```

    Destructure as:
    ```typescript
    const [data, status, error] = fromWebSocket<MyMessage>('/ws')
    ```

    All three are `Signal` instances — read `.value` inside effects/computed.

    ## fromWebSocket(url, options?)

    WebSocket adapter with exponential backoff reconnection.

    ```typescript
    import { fromWebSocket } from '/streams'

    createRoot(() => {
      const [data, status, error] = fromWebSocket<PriceUpdate>('wss://api.example.com/prices', {
        transform: (raw) => raw as PriceUpdate,  // optional transform after JSON.parse
        reconnect: {
          maxRetries: 10,     // default: 10
          initialDelay: 1000, // default: 1000ms
          maxDelay: 30000,    // default: 30000ms
        },
        // reconnect: false   // disable reconnection
      })

      effect(() => {
        if (status.value === 'connected') {
          console.log('Latest price:', data.value)
        }
      })
    })
    ```

    **Reconnect behavior:** Exponential backoff with jitter. After `maxRetries`, status → 'error'.
    Pass `reconnect: false` for one-shot connections.

    Cleanup is automatic — `onCleanup()` closes the socket when the owning scope disposes.

    ## fromSSE(url, options?)

    Server-Sent Events adapter. Browser handles reconnection natively.

    ```typescript
    import { fromSSE } from '/streams'

    createRoot(() => {
      const [data, status] = fromSSE<LogEntry>('/api/logs', {
        events: ['log', 'error'],       // additional named event types (optional)
        withCredentials: false,          // default: false
        transform: (raw) => raw as LogEntry,
      })

      effect(() => console.log(data.value))
    })
    ```

    ## fromReadable(stream, options?)

    Web Streams `ReadableStream` adapter.

    ```typescript
    import { fromReadable } from '/streams'

    createRoot(() => {
      const readable = response.body!
      const [data, status, error] = fromReadable<string>(readable, {
        transform: (chunk) => chunk,
      })
    })
    ```

    ## fromObservable(observable, options?)

    RxJS / TC39 Observable adapter. Uses structural typing — no RxJS runtime dependency.

    ```typescript
    import { fromObservable } from '/streams'
    import { interval } from 'rxjs'

    createRoot(() => {
      const [data] = fromObservable<number>(interval(1000))
      effect(() => console.log(data.value))
    })
    ```

    The `Subscribable` interface is structurally compatible with RxJS 7/8, xstream, and TC39 Observable.

    ## Rules

    - ALL adapters must be called inside a reactive scope (`createRoot` or component body)
    - `onCleanup()` is registered automatically — no manual cleanup needed
    - `data.value` is `T | undefined` (undefined until first message arrives)
    - Check `status.value === 'connected'` before trusting `data.value`
    ```

    ---

    **`.agents/skills/streem/skills/stream-combinators/SKILL.md`:**
    ```markdown
    ---
    name: streem/stream-combinators
    description: batch(), throttle(), debounce() — high-frequency signal control
    ---

    # Stream Combinators

    Import from `/streams` or `streem`.

    ## batch(fn)

    Groups multiple signal writes into a single flush. All effects run once after `fn`
    completes, not after each individual write. Use inside high-frequency message handlers
    (>30 msg/sec).

    ```typescript
    import { batch } from '/streams'

    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data)
      batch(() => {
        priceSignal.set(msg.price)
        volumeSignal.set(msg.volume)
        timestampSignal.set(msg.timestamp)
      })
      // Effects run once here, after all three writes
    })
    ```

    Returns `void`. Does not need to be inside a reactive scope (it's just synchronous batching).

    ## throttle(source, intervalMs)

    Returns a new `Signal<T>` that updates at most once per `intervalMs`. Leading-edge:
    first value passes immediately, subsequent values dropped until interval elapses.

    Must be called inside a reactive scope.

    ```typescript
    import { throttle } from '/streams'
    import { signal } from '/core'

    createRoot(() => {
      const rawPrice = signal(0)
      const throttledPrice = throttle(rawPrice, 100)  // max 10 updates/sec

      effect(() => console.log(throttledPrice.value))  // fires at most every 100ms
    })
    ```

    ## debounce(source, delayMs)

    Returns a new `Signal<T>` that updates after `delayMs` of silence (trailing-edge).
    Each new source value resets the timer. Use for search inputs, resize handlers.

    Must be called inside a reactive scope.

    ```typescript
    import { debounce } from '/streams'
    import { signal } from '/core'

    createRoot(() => {
      const query = signal('')
      const debouncedQuery = debounce(query, 300)  // fires 300ms after last keystroke

      effect(() => {
        if (debouncedQuery.value) fetchResults(debouncedQuery.value)
      })
    })
    ```

    ## Summary

    | Combinator | Input | Output | Scope needed? |
    |------------|-------|--------|---------------|
    | `batch(fn)` | `() => void` | `void` | No |
    | `throttle(sig, ms)` | `Signal<T>` | `Signal<T>` | Yes |
    | `debounce(sig, ms)` | `Signal<T>` | `Signal<T>` | Yes |
    ```

    ---

    **`.agents/skills/streem/skills/lit/SKILL.md`:**
    ```markdown
    ---
    name: streem/lit
    description: bindLitProp(), observeLitProp() — Lit web component interop
    ---

    # Lit / Custom Element Interop

    Import from `/lit`.

    ## Why this package exists

    Lit elements use JS properties (not HTML attributes) for complex data. Using `setAttribute`
    destroys type information. `bindLitProp` uses `el[propName] = value` (property assignment)
    to preserve arrays, objects, numbers, and booleans.

    In JSX, use the `prop:` prefix instead of calling `bindLitProp` directly:

    ```typescript
    // Preferred — use prop: prefix in JSX (same effect)
    <my-chart prop:data={() => chartData.value} prop:config={staticConfig} />

    // Manual usage (outside JSX)
    import { bindLitProp } from '/lit'
    bindLitProp(el, 'data', () => chartData.value)
    ```

    ## bindLitProp(el, propName, accessor)

    Creates a reactive `effect()` that keeps `el[propName]` in sync with `accessor()`.
    Must be called inside a reactive scope.

    ```typescript
    import { bindLitProp } from '/lit'

    createRoot(() => {
      const el = document.querySelector('my-element') as Record<string, unknown>
      const items = signal([1, 2, 3])

      bindLitProp(el, 'items', () => items.value)
      // Equivalent to: effect(() => { el.items = items.value })
    })
    ```

    ## observeLitProp(el, propName, initialValue, options?)

    Creates a `Signal<T>` that updates when the element dispatches property-change events.

    **Default event name:** camelCase → kebab-case + `-changed`
    - `'myValue'` → `'my-value-changed'`
    - `'count'` → `'count-changed'`

    The event must have `bubbles: true, composed: true` (to cross Shadow DOM) and
    `detail: { value: T }`.

    ```typescript
    import { observeLitProp } from '/lit'

    createRoot(() => {
      const el = document.querySelector('my-counter')!
      const count = observeLitProp(el, 'count', 0)
      // Listens for 'count-changed' events on el

      const value = observeLitProp(el, 'selectedItem', null, { event: 'selection-changed' })
      // Override event name

      effect(() => console.log(count.value))
    })
    ```

    Cleanup is automatic — the event listener is removed when the owning scope disposes.

    ## Interface

    ```typescript
    interface ObserveLitPropOptions {
      event?: string  // Override the listened event name
    }

    function bindLitProp(
      el: Record<string, unknown>,
      propName: string,
      accessor: () => unknown,
    ): void

    function observeLitProp<T>(
      el: EventTarget,
      propName: string,
      initialValue: T,
      options?: ObserveLitPropOptions,
    ): Signal<T>
    ```
    ```
  </action>
  <verify>
    <automated>ls .agents/skills/streem/skills/streams/SKILL.md .agents/skills/streem/skills/stream-combinators/SKILL.md .agents/skills/streem/skills/lit/SKILL.md</automated>
  </verify>
  <done>Three more sub-skill files exist covering all stream and Lit APIs accurately</done>
</task>

</tasks>

<verification>
After all tasks, verify the full skill tree exists:

```bash
find .agents/skills/streem -name "SKILL.md" | sort
```

Expected output:
```
.agents/skills/streem/SKILL.md
.agents/skills/streem/skills/components/SKILL.md
.agents/skills/streem/skills/lifecycle/SKILL.md
.agents/skills/streem/skills/lit/SKILL.md
.agents/skills/streem/skills/signals/SKILL.md
.agents/skills/streem/skills/stream-combinators/SKILL.md
.agents/skills/streem/skills/streams/SKILL.md
```
</verification>

<success_criteria>
- 7 SKILL.md files exist under `.agents/skills/streem/`
- Top-level SKILL.md has `auto_load: true` and routing table
- Each sub-skill accurately documents the actual API (signal interface, StreamTuple, computed returns function not Signal, etc.)
- No invented APIs — all examples match packages/*/src/ source
</success_criteria>

<output>
After completion, create `.planning/quick/1-implement-agent-skills-for-this-framewor/1-SUMMARY.md`
</output>
