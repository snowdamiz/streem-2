---
name: streem/signals
description: Streem signal primitives — signal(), computed(), effect(), createRoot(), onCleanup()
---
# Signals

## Function Signatures

```typescript
signal<T>(initialValue: T): Signal<T>
// Signal<T> is a function: call it to read (), call .set(v) to write

computed<T>(fn: () => T): () => T
// Derives a value from other signals; auto-tracks dependencies

effect(fn: () => void | (() => void)): () => void
// Runs fn immediately and on every signal change; return = cleanup

createRoot<T>(fn: (dispose: () => void) => T): T
// Reactive ownership scope; dispose() stops all nested effects

onCleanup(fn: () => void): void
// Register cleanup to run when the current scope is disposed

getOwner(): Owner | null
runWithOwner(owner: Owner | null, fn: () => void): void
```

## Usage Patterns

### Basic signal read/write
```typescript
const count = signal(0)
count()        // read: returns 0
count.set(1)   // write
count()        // read: returns 1
```

### Computed value
```typescript
const doubled = computed(() => count() * 2)
doubled()  // returns 2 (auto-updates when count changes)
```

### Effect with cleanup
```typescript
const stop = effect(() => {
  console.log('count is', count())
  return () => console.log('cleanup')  // runs before each re-run and on dispose
})
stop()  // stop the effect manually
```

### Scoping with createRoot
```typescript
const dispose = createRoot((d) => {
  effect(() => console.log(count()))
  return d
})
dispose()  // stops the effect above
```

### Component pattern — signals created at module level
```typescript
// CORRECT: signal created outside component, shared across instances
const count = signal(0)

function Counter() {
  return <p>{() => count()}</p>
}
```

## Common Mistakes

### Reading a signal in JSX without wrapping in a function
```tsx
// WRONG — reads once on mount, never updates
<p>{count()}</p>

// CORRECT — wrapped in accessor function, updates reactively
<p>{() => count()}</p>
```

### Creating an effect outside a reactive scope
```typescript
// WRONG — no owner means the effect leaks (never disposed)
effect(() => console.log(count()))  // dev warning: "no active owner"

// CORRECT — inside createRoot or component body
createRoot(() => {
  effect(() => console.log(count()))
})
```

### Using computed result as a signal (wrong type)
```typescript
const doubled = computed(() => count() * 2)
// WRONG: doubled is an accessor function, not a Signal
doubled.set(10)  // TypeError

// CORRECT: read it like a function
doubled()  // 2
```
