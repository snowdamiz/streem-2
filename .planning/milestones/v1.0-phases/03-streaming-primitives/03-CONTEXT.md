# Phase 3: Streaming Primitives - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose four DOM-agnostic stream adapters (`fromWebSocket`, `fromSSE`, `fromReadable`, `fromObservable`) that return reactive signals with automatic cleanup on owner disposal, typed connection status, and built-in backpressure combinators (`batch`, `throttle`, `debounce`). Creating posts, UI rendering, and Lit interop are separate phases.

</domain>

<decisions>
## Implementation Decisions

### API return shape
- All four adapters return an identical three-element destructured tuple: `const [data, status, error] = fromWebSocket(url)`
- `status` signal values: string union `'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'`
- `error` signal is the third element — readable when `status() === 'error'`, otherwise `undefined`
- Consistent tuple shape across all adapters — no adapter-specific extras beyond the base three

### Initial / default value
- `data()` is `undefined` before the first message arrives
- TypeScript type is automatically widened: `Signal<T | undefined>` (type reflects reality, not a lie)
- On WebSocket reconnection: `data()` retains the last known value (stale data visible, not a blank)
- After permanent close (`status === 'closed'`): `data()` continues to return the last received value

### Message parsing
- Adapters auto-parse JSON by default; if `JSON.parse` fails, the raw string is passed through silently — no error thrown
- Optional `transform` function: `fromWebSocket<Price>(url, { transform: (raw) => raw.data.price })` — preprocesses each message before setting the signal, keeping the signal type clean without a separate `computed()`
- JSON parse failure is silent — `data()` gets the unparsed string, stream continues
- `fromSSE` supports named SSE events via an `events` array option: `fromSSE(url, { events: ['price', 'trade'] })` — named events route to the same `data` signal

### Reconnection control
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

</decisions>

<specifics>
## Specific Ideas

- No specific references mentioned — open to standard approaches for adapter implementation patterns

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-streaming-primitives*
*Context gathered: 2026-02-28*
