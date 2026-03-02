---
name: streem
description: Streem reactive framework — signals, streaming, and JSX-based DOM rendering. Use when working with signal(), effect(), fromWebSocket(), fromSSE(), render(), Show, For, or Lit web component interop.
---
# Streem Framework

Streem is a fine-grained reactive framework for TypeScript/TSX. Components run once on mount; reactivity lives in signal expressions inside JSX, not in component re-runs.

## Topic Routing

| If you are working with...                            | Read this file     |
|-------------------------------------------------------|--------------------|
| `signal()`, `computed()`, `effect()`, `createRoot()`  | `signals.md`       |
| `fromWebSocket()`, `fromSSE()`, `fromReadable()`, SSE | `streaming.md`     |
| Components, JSX, `render()`, `Show`, `For`, `onMount` | `components.md`    |
| Lit web components, `prop:`, `on:`, `@streeem/lit`     | `lit-interop.md`   |

## Quick Start

```tsx
import { signal, render, Show } from 'streem'

const count = signal(0)

function App() {
  return (
    <div>
      <p>Count: {() => count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
    </div>
  )
}

render(App, document.getElementById('app')!)
```

## Setup

```json
// tsconfig.json
{ "compilerOptions": { "jsxImportSource": "streem" } }
```

```typescript
// vite.config.ts
import { streemHMR } from 'streem'
export default defineConfig({ plugins: [streemHMR()] })
```
