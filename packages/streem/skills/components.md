---
name: streem/components
description: Streem component model — render(), onMount(), Show, For, ErrorBoundary, Suspense, JSX setup
---
# Component Model

Components are plain TypeScript functions that return `Node`. They run **exactly once** on mount — no re-execution. Reactivity lives in JSX accessor functions.

## Function Signatures

```typescript
render(component: () => Node, container: Element): () => void
// Mounts component into container; returns dispose function

onMount(fn: () => void | (() => void)): void
// Runs fn once after mount; return value is cleanup

Show(props: {
  when: () => boolean
  fallback?: Node
  children: Node
}): Node

For<T>(props: {
  each: () => T[]
  by: (item: T) => unknown  // key function — used for identity, not index
  children: (item: T, index: () => number) => Node
}): Node

ErrorBoundary(props: {
  fallback: (err: unknown, reset: () => void) => Node
  children: Node
}): Node

Suspense(props: {
  fallback: Node
  children: Node
}): Node
```

## Usage Patterns

### Basic component with reactive signal
```tsx
import { signal, render } from 'streem'

const count = signal(0)

function Counter() {
  return (
    <div>
      <p>{() => count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
    </div>
  )
}

render(Counter, document.getElementById('app')!)
```

### Conditional rendering with Show
```tsx
const visible = signal(false)

<Show when={() => visible()} fallback={<p>Hidden</p>}>
  <p>Visible!</p>
</Show>
```

### List rendering with For
```tsx
const items = signal([{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }])

<ul>
  <For each={() => items()} by={(item) => item.id}>
    {(item) => <li>{item.name}</li>}
  </For>
</ul>
```

### Error boundary
```tsx
<ErrorBoundary fallback={(err, reset) => (
  <div>
    <p>Error: {String(err)}</p>
    <button onClick={reset}>Retry</button>
  </div>
)}>
  <MyComponent />
</ErrorBoundary>
```

### Suspense for async state
```tsx
<Suspense fallback={<p>Loading...</p>}>
  <AsyncComponent />
</Suspense>
```

### onMount lifecycle
```tsx
function Logger() {
  onMount(() => {
    console.log('mounted')
    return () => console.log('unmounted')  // cleanup
  })
  return <p>Logged</p>
}
```

## Common Mistakes

### Putting reactive logic in component body (not in JSX accessor)
```tsx
// WRONG — reads signal once on mount, value never updates in DOM
function Counter() {
  const value = count()  // snapshot — not reactive!
  return <p>{value}</p>
}

// CORRECT — accessor function re-reads on every signal change
function Counter() {
  return <p>{() => count()}</p>
}
```

### Using index as For key
```tsx
// WRONG — index-based keying causes unnecessary DOM teardown on reorder
<For each={() => items()} by={(_, i) => i}>

// CORRECT — stable identity key
<For each={() => items()} by={(item) => item.id}>
```

### Nesting ErrorBoundary inside Suspense incorrectly
```tsx
// WRONG — ErrorBoundary must be OUTSIDE Suspense to catch async errors
<Suspense fallback={<Spinner />}>
  <ErrorBoundary fallback={<Error />}>  {/* catches sync errors inside Suspense only */}
    <Child />
  </ErrorBoundary>
</Suspense>

// CORRECT — ErrorBoundary wraps Suspense to catch both sync and async errors
<ErrorBoundary fallback={(err, reset) => <Error err={err} reset={reset} />}>
  <Suspense fallback={<Spinner />}>
    <Child />
  </Suspense>
</ErrorBoundary>
```
