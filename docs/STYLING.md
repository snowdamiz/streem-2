# Styling in Streem

Streem does not include a CSS-in-JS runtime. The recommended patterns are:

## CSS Modules (recommended for component styles)

CSS Modules are Vite-native and require zero configuration. They provide local scoping by default, TypeScript autocompletion for class names, and tree-shakeable output.

### Setup

No configuration needed — Vite handles `.module.css` files automatically.

### Usage

**Button.module.css:**
```css
.root {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}
```

**Button.tsx:**
```typescript
import styles from './Button.module.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children?: unknown
}

export function Button(props: ButtonProps) {
  return (
    <button
      class={`${styles.root} ${props.variant === 'primary' ? styles.primary : ''}`}
    >
      {props.children}
    </button>
  )
}
```

### TypeScript autocomplete

Add a global declaration to get full type support for CSS Module imports:

**src/vite-env.d.ts:**
```typescript
/// <reference types="vite/client" />
```

This enables `import styles from './Button.module.css'` to return `Record<string, string>`.

## Style objects (for dynamic inline styles)

Use the `CSSProperties` type from `@streem/dom` or `streem` to type extracted style variables:

```typescript
import type { CSSProperties } from 'streem'

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
}

// In JSX — accepts both static objects and reactive accessors:
<div style={containerStyle} />
<div style={{ display: 'flex', alignItems: 'center' }} />

// Reactive style (re-runs when signal changes):
const isDark = signal(false)
<div style={() => ({ background: isDark() ? '#1a1a1a' : 'white' })} />
```

## What NOT to use

- **CSS-in-JS runtimes** (styled-components, emotion) — runtime overhead; CSS Modules + style objects are sufficient
- **Scoped style transforms** — require a compiler step not included in the standard Vite + Streem setup
