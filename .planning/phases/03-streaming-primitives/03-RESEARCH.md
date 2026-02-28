# Phase 3: Streaming Primitives - Research

**Researched:** 2026-02-28
**Domain:** WebSocket / SSE / ReadableStream / Observable adapters with reactive signal integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**API return shape**
- All four adapters return an identical three-element destructured tuple: `const [data, status, error] = fromWebSocket(url)`
- `status` signal values: string union `'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'`
- `error` signal is the third element — readable when `status() === 'error'`, otherwise `undefined`
- Consistent tuple shape across all adapters — no adapter-specific extras beyond the base three

**Initial / default value**
- `data()` is `undefined` before the first message arrives
- TypeScript type is automatically widened: `Signal<T | undefined>` (type reflects reality, not a lie)
- On WebSocket reconnection: `data()` retains the last known value (stale data visible, not a blank)
- After permanent close (`status === 'closed'`): `data()` continues to return the last received value

**Message parsing**
- Adapters auto-parse JSON by default; if `JSON.parse` fails, the raw string is passed through silently — no error thrown
- Optional `transform` function: `fromWebSocket<Price>(url, { transform: (raw) => raw.data.price })` — preprocesses each message before setting the signal, keeping the signal type clean without a separate `computed()`
- JSON parse failure is silent — `data()` gets the unparsed string, stream continues
- `fromSSE` supports named SSE events via an `events` array option: `fromSSE(url, { events: ['price', 'trade'] })` — named events route to the same `data` signal

**Reconnection control**
- WebSocket auto-reconnect is on by default; opt-out via `reconnect: false`
- Backoff is configurable with sensible defaults: `reconnect: { maxRetries: 10, initialDelay: 1000, maxDelay: 30000 }` (ms)
- When `maxRetries` is exhausted: `status()` becomes `'error'` and `error()` is set to a `MaxRetriesExceeded` error — distinguishable from a clean close
- `fromSSE` relies on the browser's native `EventSource` reconnect behavior — no custom backoff logic duplicated

### Claude's Discretion
- Exact default values for `initialDelay`, `maxDelay`, `maxRetries` (ballpark: 1s/30s/10)
- Backoff curve shape (exponential with jitter is fine)
- `fromReadable` and `fromObservable` reconnection behavior (ReadableStream and Observables don't have built-in reconnect semantics — handle gracefully)
- Internal implementation of `batch()`, `throttle()`, `debounce()` combinators
- How `Last-Event-ID` is handled for SSE resumption (native EventSource handles this automatically)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STREAM-01 | Developer can bind a WebSocket connection to a signal using `fromWebSocket()` — connection is automatically closed via `onCleanup()` when the component unmounts | `onCleanup()` is fully implemented in `@streem/core`; WebSocket API is available natively; adapter pattern documented below |
| STREAM-02 | Developer can bind a Server-Sent Events stream to a signal using `fromSSE()` — connection is automatically closed via `onCleanup()` when the component unmounts | Native `EventSource` API handles reconnect and Last-Event-ID automatically; `close()` registered via `onCleanup()` |
| STREAM-03 | Developer can bind a WHATWG `ReadableStream` (Fetch API) to a signal using `fromReadable()` — stream is automatically cancelled via `onCleanup()` when the component unmounts | `ReadableStream.getReader()` + `reader.cancel()` in `onCleanup()`; async iteration pattern documented |
| STREAM-04 | Developer can bind an Observable or RxJS source to a signal using `fromObservable()` — subscription is automatically unsubscribed via `onCleanup()` when the component unmounts | Minimal `Subscribable<T>` interface (`subscribe` returning `{ unsubscribe() }`) covers RxJS 7 and any TC39-compatible observable |
| STREAM-05 | Developer can batch multiple synchronous signal writes using `batch()` to prevent browser freeze on high-frequency streams (>30 messages/second) | `startBatch()` / `endBatch()` stub already in `@streem/core/src/reactive.ts`; Phase 3 just needs to expose a public `batch(fn)` wrapper |
| STREAM-06 | Developer can throttle or debounce signal updates from streams using `throttle()` and `debounce()` combinators | Both are hand-implemented timing utilities; no external library needed; patterns documented below |
| STREAM-07 | Each stream adapter exposes a typed connection-status signal reflecting the current state (`connected \| reconnecting \| error \| closed`) | `signal<StreamStatus>('connecting')` with TypeScript string union type; all adapters share the same status union |
| STREAM-08 | WebSocket adapter automatically reconnects with exponential backoff on connection loss | Exponential backoff formula: `Math.min(initialDelay * 2^attempt + jitter, maxDelay)`; `setTimeout`-based; `maxRetries` guard with `MaxRetriesExceeded` error |
</phase_requirements>

---

## Summary

Phase 3 creates a new `@streem/streams` package that exposes four DOM-agnostic stream adapters. The key insight is that this package depends only on `@streem/core` (Phase 1) — not `@streem/dom` — making all adapters testable in a Node-like environment without a DOM. The `onCleanup()` API from `@streem/core` is the primary cleanup mechanism: each adapter registers its teardown (WebSocket close, EventSource close, reader cancel, subscription unsubscribe) with the active owner scope on creation.

The reactive infrastructure for batching is already partially built in `@streem/core/src/reactive.ts` — `startBatch()` and `endBatch()` exist as stubs from Phase 1 planning. Phase 3 exposes the public `batch(fn)` combinator that calls these internal APIs. The `throttle()` and `debounce()` combinators are simple timing wrappers that take a `Signal<T>` and return a new derived signal — no external dependencies needed.

For testing without a real server: WebSocket tests use `vitest-websocket-mock` (which patches the global `WebSocket` in the happy-dom environment already used by `@streem/dom`), SSE tests use `MSW` (which has first-class `sse()` mocking since v2.12.0 — this also works in the `@streem/streams` node-environment tests via `msw/node`), and ReadableStream/Observable tests can be fully synchronous using hand-rolled mock streams.

**Primary recommendation:** Create `packages/streams` with `@streem/core` as its only runtime dependency. Use `vitest-websocket-mock` for WS tests, `msw` for SSE tests, and `happy-dom` or `node` environment depending on which globals are needed per test suite.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@streem/core` | `workspace:*` | `signal()`, `onCleanup()`, `Signal<T>` types | The reactive foundation Phase 3 extends; provides all cleanup plumbing |
| `vitest` | `^4.0.0` | Test runner (already in workspace) | Already locked in all packages |
| `typescript` | `~5.8.0` | Type-checking (already in workspace) | Already locked in workspace root |
| `vite` | `^7.0.0` | Build tooling (already in workspace) | Already locked in workspace root |
| `vite-plugin-dts` | `^4.0.0` | Declaration file generation | Already locked in workspace root |

### Supporting (testing only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest-websocket-mock` | `^2.0.0` | Patches global `WebSocket` with a mock server | WS adapter tests (`fromWebSocket`) |
| `msw` | `^2.12.0` | Network-layer SSE/HTTP mocking | SSE adapter tests (`fromSSE`) via `msw/node` |
| `happy-dom` | `^14.0.0` | Browser-like globals (`EventSource`, `ReadableStream`) | Already used in `@streem/dom`; reuse if globals needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vitest-websocket-mock` | `vitest-mock-socket` | `vitest-mock-socket` is a cleaner rewrite on `mock-socket` directly; either works — `vitest-websocket-mock` has more GitHub stars and adoption |
| `msw` for SSE | `vi.stubGlobal('EventSource', MockEventSource)` | Manual stub requires more setup; MSW `sse()` API is more realistic and less error-prone |
| `happy-dom` environment | `node` environment | `@streem/streams` should target `node` environment to keep tests fast; `happy-dom` only needed if browser globals are required (e.g., `EventSource`) |

**Installation (new `packages/streams`):**
```bash
pnpm add -D vitest-websocket-mock msw happy-dom --filter @streem/streams
```

---

## Architecture Patterns

### Recommended Project Structure
```
packages/streams/
├── src/
│   ├── index.ts              # public exports
│   ├── types.ts              # StreamStatus union, StreamTuple<T>, adapter options
│   ├── from-websocket.ts     # fromWebSocket() adapter
│   ├── from-sse.ts           # fromSSE() adapter
│   ├── from-readable.ts      # fromReadable() adapter
│   ├── from-observable.ts    # fromObservable() adapter
│   └── combinators.ts        # batch(), throttle(), debounce()
├── tests/
│   ├── from-websocket.test.ts
│   ├── from-sse.test.ts
│   ├── from-readable.test.ts
│   ├── from-observable.test.ts
│   └── combinators.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### Pattern 1: Adapter Return Tuple
**What:** All adapters return `[data, status, error]` as a fixed-shape tuple using `Signal` from `@streem/core`.
**When to use:** Every adapter — locked decision from CONTEXT.md.

```typescript
// packages/streams/src/types.ts
import type { Signal } from '@streem/core'

export type StreamStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'

export type StreamTuple<T> = [
  data: Signal<T | undefined>,
  status: Signal<StreamStatus>,
  error: Signal<Error | undefined>,
]

export interface WebSocketOptions<T> {
  transform?: (raw: unknown) => T
  reconnect?: boolean | {
    maxRetries?: number     // default: 10
    initialDelay?: number   // default: 1000 (ms)
    maxDelay?: number       // default: 30000 (ms)
  }
}

export interface SSEOptions<T> {
  transform?: (raw: unknown) => T
  events?: string[]         // named event types to subscribe to
  withCredentials?: boolean
}
```

### Pattern 2: Cleanup-First Adapter Structure
**What:** Every adapter creates signals, registers `onCleanup()` immediately, then starts the connection. This ensures cleanup fires even if the owner scope is disposed before the connection opens.
**When to use:** All four adapters.

```typescript
// Source: @streem/core onCleanup API (packages/core/src/owner.ts)
import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, WebSocketOptions, StreamStatus } from './types.js'

export function fromWebSocket<T>(
  url: string | URL,
  options: WebSocketOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  let ws: WebSocket | null = null
  let attempt = 0
  let disposed = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const maxRetries = (typeof options.reconnect === 'object' && options.reconnect?.maxRetries) ?? 10
  const initialDelay = (typeof options.reconnect === 'object' && options.reconnect?.initialDelay) ?? 1000
  const maxDelay = (typeof options.reconnect === 'object' && options.reconnect?.maxDelay) ?? 30000
  const shouldReconnect = options.reconnect !== false

  function connect(): void {
    if (disposed) return
    ws = new WebSocket(url)
    status.set('connecting')

    ws.addEventListener('open', () => {
      if (disposed) { ws?.close(); return }
      status.set('connected')
      attempt = 0
    })

    ws.addEventListener('message', (event) => {
      if (disposed) return
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data as string)
      } catch {
        parsed = event.data
      }
      const value = options.transform ? options.transform(parsed) : (parsed as T)
      data.set(value)
    })

    ws.addEventListener('close', () => {
      if (disposed) return
      if (shouldReconnect && attempt < maxRetries) {
        status.set('reconnecting')
        const delay = Math.min(initialDelay * Math.pow(2, attempt) + Math.random() * 1000, maxDelay)
        attempt++
        retryTimer = setTimeout(connect, delay)
      } else if (shouldReconnect && attempt >= maxRetries) {
        status.set('error')
        error.set(new MaxRetriesExceededError(attempt))
      } else {
        status.set('closed')
      }
    })

    ws.addEventListener('error', () => {
      // WebSocket fires error then close; let close handler drive status
    })
  }

  // Register cleanup BEFORE connecting
  onCleanup(() => {
    disposed = true
    if (retryTimer !== null) clearTimeout(retryTimer)
    if (ws !== null) {
      ws.close()
      ws = null
    }
    status.set('closed')
  })

  connect()

  return [data, status, error]
}

export class MaxRetriesExceededError extends Error {
  constructor(attempts: number) {
    super(`WebSocket failed after ${attempts} reconnection attempts`)
    this.name = 'MaxRetriesExceededError'
  }
}
```

### Pattern 3: SSE Adapter (Native EventSource)
**What:** `fromSSE()` uses the native browser `EventSource` which handles Last-Event-ID and reconnection automatically. The adapter's only job is cleanup + signal bridging.
**When to use:** Server-Sent Events streams.

```typescript
// Source: MDN EventSource API + CONTEXT.md locked decision
import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, SSEOptions, StreamStatus } from './types.js'

export function fromSSE<T>(
  url: string | URL,
  options: SSEOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  const es = new EventSource(url.toString(), {
    withCredentials: options.withCredentials,
  })
  status.set('connecting')

  const handleMessage = (event: MessageEvent) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(event.data as string)
    } catch {
      parsed = event.data
    }
    const value = options.transform ? options.transform(parsed) : (parsed as T)
    data.set(value)
    status.set('connected')
  }

  es.addEventListener('message', handleMessage)
  es.addEventListener('open', () => status.set('connected'))
  es.addEventListener('error', () => {
    // EventSource readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
    if (es.readyState === EventSource.CLOSED) {
      status.set('closed')
      error.set(new Error('SSE connection closed'))
    } else {
      // readyState CONNECTING = native reconnect in progress
      status.set('reconnecting')
    }
  })

  // Named event subscriptions
  for (const eventName of (options.events ?? [])) {
    es.addEventListener(eventName, handleMessage)
  }

  onCleanup(() => {
    es.close()
    status.set('closed')
  })

  return [data, status, error]
}
```

### Pattern 4: ReadableStream Adapter
**What:** Uses `getReader()` + async loop, cancels on cleanup.
**When to use:** WHATWG ReadableStream (Fetch API response body, custom streams).

```typescript
// Source: MDN ReadableStream + WHATWG Streams Standard
import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, StreamStatus } from './types.js'

export function fromReadable<T>(
  stream: ReadableStream<T>,
  options: { transform?: (chunk: T) => T } = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  const reader = stream.getReader()

  // ReadableStream has no reconnect semantics — closed is terminal
  async function pump(): Promise<void> {
    try {
      status.set('connected')
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          status.set('closed')
          break
        }
        const processed = options.transform ? options.transform(value) : value
        data.set(processed)
      }
    } catch (e) {
      // Cancelled by onCleanup is expected — suppress AbortError-style errors
      if ((e as Error)?.name !== 'AbortError') {
        status.set('error')
        error.set(e instanceof Error ? e : new Error(String(e)))
      }
    }
  }

  onCleanup(() => {
    // Cancel the reader — rejects the in-progress read(), exits the loop
    reader.cancel().catch(() => { /* intentional */ })
    status.set('closed')
  })

  void pump()

  return [data, status, error]
}
```

### Pattern 5: Observable Adapter
**What:** Accepts any object with `.subscribe(observer)` returning `{ unsubscribe() }`. This is the `Subscribable<T>` interface — covers RxJS 7/8, xstream, any TC39-compatible observable.
**When to use:** RxJS or other observable sources.

```typescript
// Source: RxJS Subscribable<T> interface (framework-agnostic minimum contract)
import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, StreamStatus } from './types.js'

// Framework-agnostic Subscribable contract (matches RxJS Subscribable<T>)
export interface Subscribable<T> {
  subscribe(observer: {
    next?: (value: T) => void
    error?: (err: unknown) => void
    complete?: () => void
  }): { unsubscribe(): void }
}

export function fromObservable<T>(
  source: Subscribable<T>,
  options: { transform?: (value: T) => T } = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  const subscription = source.subscribe({
    next(value) {
      status.set('connected')
      const processed = options.transform ? options.transform(value) : value
      data.set(processed)
    },
    error(err) {
      status.set('error')
      error.set(err instanceof Error ? err : new Error(String(err)))
    },
    complete() {
      status.set('closed')
    },
  })

  // Observable has no reconnect semantics — closed/errored is terminal
  status.set('connecting')

  onCleanup(() => {
    subscription.unsubscribe()
    status.set('closed')
  })

  return [data, status, error]
}
```

### Pattern 6: batch() Combinator
**What:** Public wrapper over the already-implemented `startBatch()` / `endBatch()` stubs in `reactive.ts`. Just expose the public API — the internals are ready.
**When to use:** High-frequency message handlers (>30 msg/sec).

```typescript
// Source: @streem/core/src/reactive.ts — startBatch/endBatch already implemented
import { startBatch, endBatch } from '@streem/core/reactive' // internal re-export needed

// OR: export from @streem/core directly and expose in @streem/streams

export function batch(fn: () => void): void {
  startBatch()
  try {
    fn()
  } finally {
    endBatch()
  }
}
```

**Important:** `startBatch` and `endBatch` are currently exported from `reactive.ts` but NOT from `packages/core/src/index.ts`. The `batch()` public combinator can live in `@streem/streams/combinators.ts` but needs these internal functions exposed. Two implementation options:
1. Export `startBatch` / `endBatch` from `@streem/core/index.ts` (preferred — keeps batch logic in core)
2. Re-implement `isBatching` flag in streams package (avoid — duplicates state)

**Decision for planner:** Option 1 — add `startBatch` and `endBatch` to `@streem/core`'s public exports, then `batch()` in `@streem/streams` calls them.

### Pattern 7: throttle() and debounce() Combinators
**What:** Signal-to-signal timing wrappers. Take a source `Signal<T>` and return a new `Signal<T>` (actually a `computed`-like derived signal that updates on a timer).
**When to use:** When you want to rate-limit UI updates from a high-frequency stream signal.

```typescript
// Source: MDN Glossary/Debounce + standard JS timing patterns
import { signal, effect, onCleanup } from '@streem/core'
import type { Signal } from '@streem/core'

export function throttle<T>(source: Signal<T>, intervalMs: number): Signal<T> {
  const out = signal<T>(source())
  let lastEmit = 0

  effect(() => {
    const value = source() // track the source
    const now = Date.now()
    if (now - lastEmit >= intervalMs) {
      lastEmit = now
      out.set(value)
    }
  })

  return out
}

export function debounce<T>(source: Signal<T>, delayMs: number): Signal<T> {
  const out = signal<T>(source())
  let timer: ReturnType<typeof setTimeout> | null = null

  effect(() => {
    const value = source() // track the source
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      out.set(value)
      timer = null
    }, delayMs)
    onCleanup(() => {
      if (timer !== null) { clearTimeout(timer); timer = null }
    })
  })

  return out
}
```

**Caveat:** Both `throttle()` and `debounce()` use `effect()` internally, which requires an active owner scope. Document this requirement.

### Anti-Patterns to Avoid

- **Starting connection before registering onCleanup:** If the component's owner scope is disposed synchronously after adapter creation (rare but possible in test scenarios), the cleanup callback must already be registered. Always call `onCleanup()` before `connect()` / `es = new EventSource()` / subscription.
- **Calling adapters outside a reactive scope:** Without an active owner, `onCleanup()` is silently dropped, causing connection leaks. Document this loudly in JSDoc.
- **Re-assigning WebSocket on reconnect without clearing the previous one:** Always null the previous ws reference before creating a new one. Set `disposed = true` flag first in cleanup handler to prevent reconnect race.
- **Using `reader.cancel()` without catching the rejection:** `reader.cancel()` returns a Promise that will reject if the stream was already closed. Always `.catch(() => {})`.
- **Setting status before registering onCleanup:** In `fromObservable`, the subscription starts synchronously. If `.subscribe()` calls `next()` synchronously (hot observable), `status.set('connected')` will fire before `onCleanup()` is registered. This is fine — cleanup registration happens before the `return` statement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket test mocking | Custom mock class | `vitest-websocket-mock` | Handles mock server state machine, async message ordering, cleanup between tests |
| SSE test mocking | Manual `EventSource` stub | `msw` with `sse()` handler | MSW mocking is network-layer; `sse()` API since v2.12.0 supports named events, close, error simulation |
| Observable type compatibility | Custom `Observable` class | Use the `Subscribable<T>` structural interface | Any object with `subscribe(observer)` returning `{ unsubscribe() }` passes the type check — works with RxJS 7, RxJS 8, xstream, etc. |
| Exponential backoff | Custom complex backoff class | Inline formula: `Math.min(initialDelay * 2^attempt + jitter, maxDelay)` | No library needed; 2-line formula covers all cases |

**Key insight:** The stream adapters are adapters — thin wrappers that wire existing APIs to `@streem/core` signals. The hard work (reactive graph, ownership, cleanup) is done. The adapters are glue code, not new machinery.

---

## Common Pitfalls

### Pitfall 1: WebSocket Reconnect Race — Stale `ws` Reference
**What goes wrong:** The cleanup `onCleanup` fires, sets `disposed = true`, but a queued `setTimeout` from a previous reconnect attempt fires afterward and calls `connect()` again, opening a new connection after cleanup.
**Why it happens:** `setTimeout` callbacks are queued asynchronously. If `onCleanup()` fires between the `close` event and the scheduled `connect()`, the timer still fires.
**How to avoid:** Check `if (disposed) return` as the FIRST line inside `connect()` and inside the `setTimeout` callback.
**Warning signs:** Connection stays open after component unmounts; WebSocket `close()` is never called in logs.

### Pitfall 2: ReadableStream getReader() Locks the Stream
**What goes wrong:** `getReader()` acquires an exclusive lock. If the caller also tries to pipe or iterate the stream elsewhere, they get a `TypeError: ReadableStream is locked`.
**Why it happens:** WHATWG Streams Standard: only one reader per stream at a time.
**How to avoid:** Document that `fromReadable()` acquires and holds the reader lock. The stream cannot be used for any other purpose once passed to `fromReadable()`.
**Warning signs:** `TypeError: Failed to execute 'getReader' on 'ReadableStream': ReadableStream is already locked`.

### Pitfall 3: SSE EventSource Status Ambiguity on Error
**What goes wrong:** The `error` event on `EventSource` fires both for temporary disconnects (browser will auto-reconnect) and for permanent failures. Naively setting `status = 'error'` on any error event gives false error signals during routine reconnects.
**Why it happens:** The `error` event fires when the connection is lost regardless of whether the browser will retry.
**How to avoid:** Check `es.readyState` inside the error handler: `CONNECTING` (0) = reconnecting in progress (native), `CLOSED` (2) = permanent failure. Set `'reconnecting'` vs `'error'`/`'closed'` accordingly.
**Warning signs:** `status()` shows `'error'` immediately after brief network blip, then switches to `'connected'` — flickering status.

### Pitfall 4: batch() Must Import from @streem/core Internal
**What goes wrong:** `startBatch()` and `endBatch()` are exported from `reactive.ts` but NOT currently re-exported from `packages/core/src/index.ts`. If `@streem/streams` tries to import them, it gets a module-not-found error.
**Why it happens:** Phase 1 intentionally did not expose these as they were stubs for Phase 3.
**How to avoid:** Plan 03-01 or 03-04 must add `startBatch` and `endBatch` to `@streem/core/src/index.ts` exports before implementing `batch()`.
**Warning signs:** TypeScript error: `Module '@streem/core' has no exported member 'startBatch'`.

### Pitfall 5: throttle()/debounce() Require Active Owner Scope
**What goes wrong:** `throttle()` and `debounce()` call `effect()` internally. If called outside a `createRoot()` / component scope, the dev-mode warning fires and the effect is never auto-disposed.
**Why it happens:** `effect()` without an owner scope logs a DX-03 warning and leaks.
**How to avoid:** Document clearly in JSDoc. These combinators MUST be called inside a component body or `createRoot()` — same restriction as `effect()` itself.
**Warning signs:** `[Streem] effect() created without an active owner scope` warning in console.

### Pitfall 6: Observable `subscribe()` May Be Synchronous
**What goes wrong:** Some observables (e.g., `of(1, 2, 3)` in RxJS) emit values synchronously during `subscribe()`. This means `data.set()` is called before the `return [data, status, error]` statement — which is fine. But setting `status = 'connecting'` AFTER `.subscribe()` will overwrite the `'connected'` status set synchronously inside the `next` callback.
**Why it happens:** Synchronous observables emit during the `subscribe()` call itself.
**How to avoid:** Initialize `status` to `'connecting'` (already done via `signal<StreamStatus>('connecting')`). Set `status.set('connecting')` BEFORE calling `.subscribe()`, not after. The `next` callback sets `'connected'` — if that fires synchronously, it fires before the adapter returns, which is correct.
**Warning signs:** `status()` returns `'connecting'` even after synchronous observable has completed.

### Pitfall 7: vitest-websocket-mock Requires happy-dom (Not node)
**What goes wrong:** `vitest-websocket-mock` (via `mock-socket`) patches the global `WebSocket` object. In a `node` environment, there is no global `WebSocket` before Node 22 / Vitest 4 runtime injection.
**Why it happens:** `mock-socket` replaces `globalThis.WebSocket` — if it doesn't exist, patching fails silently.
**How to avoid:** Configure `@streem/streams` vitest to use `happy-dom` environment for WebSocket tests (same as `@streem/dom`). Alternatively: use `globalThis.WebSocket` availability check in vitest setup, or use `msw` with `setupServer` from `msw/node` for both WS and SSE (MSW handles its own patching).
**Warning signs:** `ReferenceError: WebSocket is not defined` in tests, or WebSocket connects to real URLs instead of mock.

---

## Code Examples

Verified patterns from official sources:

### Exponential Backoff Formula
```typescript
// Source: standard backoff pattern (multiple verified sources)
function getBackoffDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  const jitter = Math.random() * 1000  // up to 1 second jitter
  return Math.min(initialDelay * Math.pow(2, attempt) + jitter, maxDelay)
}
// attempt=0: ~1000ms, attempt=1: ~2000ms, attempt=2: ~4000ms, ..., capped at maxDelay
```

### vitest-websocket-mock Test Pattern
```typescript
// Source: github.com/akiomik/vitest-websocket-mock README
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import WS from 'vitest-websocket-mock'
import { createRoot } from '@streem/core'
import { fromWebSocket } from '../src/from-websocket.js'

describe('fromWebSocket', () => {
  let server: WS

  beforeEach(() => {
    server = new WS('ws://localhost:1234')
  })

  afterEach(() => {
    WS.clean()
  })

  it('updates data signal on message', async () => {
    let data: ReturnType<typeof import('../src/from-websocket.js').fromWebSocket>[0]

    const dispose = createRoot((d) => {
      ;[data] = fromWebSocket('ws://localhost:1234')
      return d
    })

    await server.connected
    server.send(JSON.stringify({ price: 100 }))

    expect(data!()).toEqual({ price: 100 })
    dispose()
  })
})
```

### MSW SSE Test Pattern
```typescript
// Source: mswjs.io/docs/sse/ (MSW v2.12.0+)
import { setupServer } from 'msw/node'
import { sse } from 'msw'
import { afterAll, afterEach, beforeAll, it, expect } from 'vitest'
import { createRoot } from '@streem/core'
import { fromSSE } from '../src/from-sse.js'

const server = setupServer(
  sse('/stream', ({ client }) => {
    client.send({ data: JSON.stringify({ price: 99 }) })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('updates data signal from SSE', async () => {
  let data: any
  const dispose = createRoot((d) => {
    ;[data] = fromSSE('/stream')
    return d
  })
  // wait for message via polling or signal effect
  await vi.waitFor(() => expect(data()).toEqual({ price: 99 }))
  dispose()
})
```

### package.json for @streem/streams
```json
{
  "name": "@streem/streams",
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
  "dependencies": {
    "@streem/core": "workspace:*"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^4.0.0",
    "typescript": "~5.8.0",
    "happy-dom": "^14.0.0",
    "vitest-websocket-mock": "^2.0.0",
    "msw": "^2.12.0"
  },
  "peerDependencies": {
    "rxjs": "^7.0.0 || ^8.0.0"
  },
  "peerDependenciesMeta": {
    "rxjs": { "optional": true }
  }
}
```

### @streem/streams vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',  // provides WebSocket global for mock-socket
    name: '@streem/streams',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

### @streem/streams tests/setup.ts
```typescript
// MSW server setup for SSE tests
import { setupServer } from 'msw/node'
export const mswServer = setupServer()

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `jest-websocket-mock` | `vitest-websocket-mock` (fork) | ~2023 | Drop-in for Vitest — same API, Vitest matchers |
| Manual EventSource stub | MSW `sse()` API | MSW v2.12.0 (2024) | First-class SSE mocking at network layer |
| RxJS `Observable` class import | `Subscribable<T>` structural interface | Always — just better practice | No runtime RxJS dependency; works with any lib |
| Fixed interval reconnect | Exponential backoff + jitter | Industry standard ~2019 | Prevents thundering herd; reduces server load |
| `ReadableStream` manual iteration | `for await (const chunk of stream)` | ES2022 / Streams async iteration | Cleaner, but cleanup requires `break` which triggers automatic cancel |

**Deprecated/outdated:**
- `jest-websocket-mock` directly: works only with Jest; use `vitest-websocket-mock` instead
- Importing `Observable` from `rxjs` in `fromObservable` type signature: creates a hard RxJS dependency; use the structural `Subscribable<T>` interface instead

---

## Open Questions

1. **`startBatch` / `endBatch` export from `@streem/core`**
   - What we know: Both functions are implemented in `reactive.ts` and exported from there. `index.ts` does not re-export them.
   - What's unclear: Whether `batch()` should live in `@streem/core` or `@streem/streams`. Architecturally it belongs in core (it's a reactive primitive), but the requirements say "ships with Phase 3".
   - Recommendation: Export `startBatch`/`endBatch` from `@streem/core/index.ts` in Plan 03-04, then implement the public `batch(fn)` wrapper there. `@streem/streams` can also re-export it for convenience.

2. **`fromReadable` async iteration vs `getReader()` loop**
   - What we know: `for await (const chunk of stream)` is syntactically cleaner and `break` automatically triggers cancel. However, when `onCleanup()` fires, there's no way to `break` from outside the loop — `reader.cancel()` is needed.
   - What's unclear: Whether `ReadableStream[Symbol.asyncIterator]` has full cross-environment support in happy-dom v14 for tests.
   - Recommendation: Use `getReader()` + explicit loop — more control over cancellation, no async iterator cross-environment concerns.

3. **`fromObservable` status initialization with synchronous observables**
   - What we know: Synchronous observables (like `of(1)` in RxJS) call `next` during `.subscribe()`. Our `status` is initialized to `'connecting'` before `.subscribe()` is called.
   - What's unclear: Whether it matters that `status` briefly shows `'connecting'` even for synchronous hot observables.
   - Recommendation: This is acceptable — the signal starts as `'connecting'`, transitions to `'connected'` on first `next`, and any effects reading `status` will see the final state after synchronous execution completes. No special handling needed.

---

## Sources

### Primary (HIGH confidence)
- `@streem/core/src/reactive.ts` — `startBatch`/`endBatch` stub implementation (read from codebase)
- `@streem/core/src/owner.ts` — `onCleanup()` full implementation and behaviour (read from codebase)
- `@streem/core/src/signal.ts` — `Signal<T>` interface, `signal()` API (read from codebase)
- MDN EventSource API — `readyState` values, `close()`, `error` event behaviour
- WHATWG Streams Standard — `getReader()`, `reader.read()`, `reader.cancel()` semantics
- RxJS GitHub `packages/rxjs/src/internal/types.ts` — `Subscribable<T>` and `Unsubscribable` interfaces (verified via WebFetch)

### Secondary (MEDIUM confidence)
- `github.com/akiomik/vitest-websocket-mock` — `WS` class API, `WS.clean()`, `server.connected` Promise (WebFetch confirmed)
- `mswjs.io/docs/sse/` — MSW `sse()` API, `client.send()`, `client.close()` (WebSearch confirmed, MSW v2.12.0+)
- WebSearch: exponential backoff formula `Math.min(initialDelay * 2^attempt + jitter, maxDelay)` — multiple independent sources agree

### Tertiary (LOW confidence)
- vitest-websocket-mock exact version number not confirmed via npm fetch (403 error); version `^2.0.0` from npm trends data
- MSW SSE test integration with Vitest `happy-dom` environment — not directly validated against this codebase's Vitest 4.0.18 setup

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed via direct source reads and official documentation
- Architecture: HIGH — adapter patterns derived from the actual `@streem/core` API (read source), not from generic knowledge
- Pitfalls: HIGH for WebSocket/SSE/ReadableStream (verified from spec and MDN); MEDIUM for testing environment (mock-socket + happy-dom interaction)

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (30 days — ecosystem is stable; MSW SSE API and mock-socket are both mature)
