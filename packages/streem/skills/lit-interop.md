---
name: streem/lit-interop
description: Streem + Lit web component interop — prop: prefix, on: prefix, bindLitProp, observeLitProp, CEM type generation
---
# Lit Web Component Interop

Streem can use Lit web components in TSX with full TypeScript typed props. No runtime wrapper — components are used as plain custom elements.

## JSX Namespace Prefixes

```
prop:name={value}  — JavaScript property assignment (el[name] = value)
                     Use for: array/object/boolean values, reactive signals
on:event={handler} — addEventListener directly on the element
                     Use for: Shadow DOM events that don't bubble through retargeting
attr:name={value}  — explicit setAttribute (rarely needed — default is setAttribute)
```

## @streem/lit Utilities

```typescript
import { bindLitProp, observeLitProp } from '@streem/lit'

bindLitProp<T>(el: Element, propName: string, accessor: () => T): void
// Reactively binds accessor() result to el[propName] via effect()
// Use when programmatically binding outside JSX

observeLitProp<T>(
  el: Element,
  propName: string,
  callback: (value: T) => void,
  eventName?: string  // defaults to `${propName}-changed`
): void
// Listens for Lit property-changed events and calls callback
```

## Usage Patterns

### Typed Lit component in TSX
```tsx
// After CEM type generation, my-counter has TypeScript types:
<my-counter
  prop:value={() => count()}
  on:increment={(e) => count.set(e.detail)}
/>
```

### Direct property binding with reactive signal
```tsx
const items = signal(['a', 'b', 'c'])

<my-list prop:items={() => items()} />
// Routes to el.items = ['a', 'b', 'c'] — not setAttribute (which would stringify the array)
```

### Shadow DOM event handling
```tsx
// Event originates inside Shadow DOM — use on: to attach directly, bypassing retargeting
<my-button on:click={(e) => console.log('clicked', e)} />
```

### CEM type generation workflow
```bash
# 1. Install CEM analyzer
npm install -D @custom-elements-manifest/analyzer @wc-toolkit/jsx-types

# 2. Analyze Lit component source
npx cem analyze --globs "src/components/**/*.ts"

# 3. Generate JSX IntrinsicElements declarations
node gen-lit-types.ts   # creates lit-elements.d.ts
```

### Observing Lit property changes (two-way sync)
```typescript
const litValue = signal<number>(0)

onMount(() => {
  const el = document.querySelector('my-counter')!
  observeLitProp<number>(el, 'value', (v) => litValue.set(v))
})
```

## Common Mistakes

### Using default attribute binding for JavaScript objects
```tsx
// WRONG — stringifies the array, Lit receives "[object Object]"
<my-list items={items()} />

// CORRECT — prop: routes to JavaScript property assignment
<my-list prop:items={items()} />
```

### Using JSX onClick for Shadow DOM events
```tsx
// WRONG — event retargeting inside Shadow DOM can cause event.target to be wrong
<my-button onClick={handler} />

// CORRECT — on: attaches directly to the element, bypassing retargeting
<my-button on:click={handler} />
```

### Forgetting to run CEM before type generation
```bash
# WRONG — gen-lit-types reads custom-elements.json which must be generated first
node gen-lit-types.ts   # error: custom-elements.json not found

# CORRECT — analyze first, then generate types
npx cem analyze --globs "src/**/*.ts"
node gen-lit-types.ts
```
