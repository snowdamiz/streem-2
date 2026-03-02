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
