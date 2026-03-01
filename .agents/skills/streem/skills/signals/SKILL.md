---
name: streem/signals
description: signal(), computed(), effect(), isSignal()
---

# Signals

Import from `@streem/core` or `streem`.

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
import { signal } from '@streem/core'

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
import { signal, computed } from '@streem/core'

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
import { signal, effect, onCleanup } from '@streem/core'

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
import { isSignal } from '@streem/core'

isSignal(count)    // true
isSignal(42)       // false
isSignal(doubled)  // false — computed returns a function, not a Signal
```

## Rules

- Always create signals inside a reactive scope or at module level (module-level is fine — no owner needed for signals themselves, only for effects/computeds)
- `computed()` and `effect()` MUST be inside a scope — they warn in dev if not
- `computed()` is lazy (pull-based) — not pushed on every change
- `effect()` is eager — runs immediately on creation
