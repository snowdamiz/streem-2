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
