---
name: streem/streaming
description: Streem streaming primitives — fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce
---
# Streaming Primitives

All adapters return a `StreamTuple<T>`: `[data: Signal<T | undefined>, status: Signal<StreamStatus>]`.
Call them inside a component or `createRoot` — `onCleanup()` is registered automatically.

## Function Signatures

```typescript
fromWebSocket<T>(url: string, options?: WebSocketOptions): StreamTuple<T>
fromSSE<T>(url: string, options?: SSEOptions): StreamTuple<T>
fromReadable<T>(stream: ReadableStream<T>, options?: ReadableOptions): StreamTuple<T>
fromObservable<T>(source: Subscribable<T>, options?: ObservableOptions): StreamTuple<T>

// StreamStatus: 'connected' | 'reconnecting' | 'error' | 'closed'

batch(fn: () => void): void           // Batch multiple signal writes into one DOM update
throttle<T>(signal: Signal<T>, ms: number): () => T  // Must be inside reactive scope
debounce<T>(signal: Signal<T>, ms: number): () => T  // Must be inside reactive scope
```

## Usage Patterns

### WebSocket with status display
```tsx
import { fromWebSocket } from 'streem'

function LiveFeed() {
  const [data, status] = fromWebSocket<string>('wss://api.example.com/feed')

  return (
    <div>
      <p>Status: {() => status()}</p>
      <p>Latest: {() => data() ?? 'waiting...'}</p>
    </div>
  )
}
```

### SSE stream
```tsx
const [price, status] = fromSSE<number>('/api/prices/stream')
```

### ReadableStream (Fetch API)
```tsx
const response = await fetch('/api/stream')
const [chunk, status] = fromReadable<Uint8Array>(response.body!)
```

### High-frequency stream with batch backpressure
```tsx
const [tick, status] = fromWebSocket<number>('wss://ticks.example.com')
// Wrap writes in batch() to coalesce DOM updates at 200 msg/sec
// batch() is called automatically by the adapter — use throttle/debounce for additional control
const throttled = throttle(tick, 100)  // max one DOM update per 100ms
```

### Observable / RxJS
```typescript
import { fromObservable } from 'streem'
import { interval } from 'rxjs'

const [value, status] = fromObservable(interval(1000))
```

## Common Mistakes

### Calling adapter outside a reactive scope
```typescript
// WRONG — no cleanup owner; connection leaks
const [data] = fromWebSocket('wss://example.com')

// CORRECT — inside component function or createRoot
function MyComponent() {
  const [data] = fromWebSocket('wss://example.com')
  // ...
}
```

### Reading StreamTuple incorrectly
```typescript
const result = fromWebSocket('wss://example.com')
// WRONG: result is [data, status] — must destructure
result()  // TypeError

// CORRECT
const [data, status] = fromWebSocket('wss://example.com')
data()    // T | undefined
status()  // StreamStatus
```

### Calling throttle/debounce outside a reactive scope
```typescript
// WRONG — creates an effect with no owner
const throttled = throttle(mySignal, 100)

// CORRECT — inside component or createRoot
function Component() {
  const throttled = throttle(mySignal, 100)
  return <p>{() => throttled()}</p>
}
```
