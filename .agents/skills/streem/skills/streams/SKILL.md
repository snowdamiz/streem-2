---
name: streem/streams
description: fromWebSocket(), fromSSE(), fromReadable(), fromObservable() — StreamTuple pattern
---

# Stream Adapters

Import from `@streem/streams` or `streem`.

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
import { fromWebSocket } from '@streem/streams'

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
import { fromSSE } from '@streem/streams'

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
import { fromReadable } from '@streem/streams'

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
import { fromObservable } from '@streem/streams'
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
