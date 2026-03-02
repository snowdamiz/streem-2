---
name: streem/lit
description: bindLitProp(), observeLitProp() — Lit web component interop
---

# Lit / Custom Element Interop

Import from `/lit`.

## Why this package exists

Lit elements use JS properties (not HTML attributes) for complex data. Using `setAttribute`
destroys type information. `bindLitProp` uses `el[propName] = value` (property assignment)
to preserve arrays, objects, numbers, and booleans.

In JSX, use the `prop:` prefix instead of calling `bindLitProp` directly:

```typescript
// Preferred — use prop: prefix in JSX (same effect)
<my-chart prop:data={() => chartData.value} prop:config={staticConfig} />

// Manual usage (outside JSX)
import { bindLitProp } from '/lit'
bindLitProp(el, 'data', () => chartData.value)
```

## bindLitProp(el, propName, accessor)

Creates a reactive `effect()` that keeps `el[propName]` in sync with `accessor()`.
Must be called inside a reactive scope.

```typescript
import { bindLitProp } from '/lit'

createRoot(() => {
  const el = document.querySelector('my-element') as Record<string, unknown>
  const items = signal([1, 2, 3])

  bindLitProp(el, 'items', () => items.value)
  // Equivalent to: effect(() => { el.items = items.value })
})
```

## observeLitProp(el, propName, initialValue, options?)

Creates a `Signal<T>` that updates when the element dispatches property-change events.

**Default event name:** camelCase → kebab-case + `-changed`
- `'myValue'` → `'my-value-changed'`
- `'count'` → `'count-changed'`

The event must have `bubbles: true, composed: true` (to cross Shadow DOM) and
`detail: { value: T }`.

```typescript
import { observeLitProp } from '/lit'

createRoot(() => {
  const el = document.querySelector('my-counter')!
  const count = observeLitProp(el, 'count', 0)
  // Listens for 'count-changed' events on el

  const value = observeLitProp(el, 'selectedItem', null, { event: 'selection-changed' })
  // Override event name

  effect(() => console.log(count.value))
})
```

Cleanup is automatic — the event listener is removed when the owning scope disposes.

## Interface

```typescript
interface ObserveLitPropOptions {
  event?: string  // Override the listened event name
}

function bindLitProp(
  el: Record<string, unknown>,
  propName: string,
  accessor: () => unknown,
): void

function observeLitProp<T>(
  el: EventTarget,
  propName: string,
  initialValue: T,
  options?: ObserveLitPropOptions,
): Signal<T>
```
