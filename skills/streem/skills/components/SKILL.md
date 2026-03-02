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
