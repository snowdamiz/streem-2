import { DocSection, Code } from './DocSection'

export function StylingSection(): Node {
  return (
    <DocSection id="styling" title="Styling">
      <p class="text-muted mb-3 text-[0.95rem]">Streem does not include a CSS-in-JS runtime. The recommended patterns are CSS Modules for component styles, Tailwind v4 for utility-first workflows, and style objects for dynamic inline styles.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">CSS Modules</h3>
      <p class="text-muted mb-3 text-[0.95rem]">CSS Modules are Vite-native and require zero configuration. They provide local scoping by default, TypeScript autocompletion for class names, and tree-shakeable output.</p>
      <p class="text-muted mb-3 text-[0.95rem]">No configuration needed — Vite handles <code>.module.css</code> files automatically.</p>
      <Code>{`/* Button.module.css */\n.root {\n  display: inline-flex;\n  align-items: center;\n  padding: 8px 16px;\n  border-radius: 4px;\n}\n\n.primary {\n  background: var(--color-primary, #3b82f6);\n  color: white;\n}`}</Code>
      <Code>{`// Button.tsx\nimport styles from './Button.module.css'\n\ninterface ButtonProps {\n  variant?: 'primary' | 'secondary'\n  children?: unknown\n}\n\nexport function Button(props: ButtonProps) {\n  return (\n    <button\n      class={\`\${styles.root} \${props.variant === 'primary' ? styles.primary : ''}\`}\n    >\n      {props.children}\n    </button>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">TypeScript tip: add a global declaration to get full type support for CSS Module imports. Create <code>src/vite-env.d.ts</code> with:</p>
      <Code>{`/// <reference types="vite/client" />`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">This enables <code>import styles from './Button.module.css'</code> to return <code>Record&lt;string, string&gt;</code>.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Tailwind v4</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Tailwind v4 uses a Vite plugin for zero-config integration — no <code>tailwind.config.js</code> required.</p>
      <Code>{`npm install -D tailwindcss @tailwindcss/vite`}</Code>
      <Code>{`// vite.config.ts\nimport { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'\nimport { streemHMR } from 'streem'\n\nexport default defineConfig({\n  plugins: [\n    tailwindcss(),\n    streemHMR(),\n  ]\n})`}</Code>
      <Code>{`/* src/styles/global.css — CSS entry file */\n@import "tailwindcss";`}</Code>
      <Code>{`// Example component using Tailwind utility classes\nimport { signal } from 'streem'\n\nexport function AlertBanner() {\n  const visible = signal(true)\n\n  return (\n    <div class="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-900">\n      <span class="text-sm font-medium">Update available</span>\n      <button\n        class="ml-auto rounded px-2 py-1 text-xs hover:bg-blue-100"\n        on:click={() => visible.set(false)}\n      >\n        Dismiss\n      </button>\n    </div>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">TypeScript tip: Tailwind classes are plain strings — no special types needed. All utilities are available immediately after adding the <code>@import</code>.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Reactive style objects</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Use the <code>CSSProperties</code> type from <code>streem</code> to type extracted style variables. The <code>style</code> prop accepts both static objects and reactive accessors.</p>
      <Code>{`import type { CSSProperties } from 'streem'\n\n// Static style object\nconst containerStyle: CSSProperties = {\n  display: 'grid',\n  gridTemplateColumns: 'repeat(3, 1fr)',\n  gap: '20px',\n}\n\n// Use static objects and inline objects interchangeably\n<div style={containerStyle} />\n<div style={{ display: 'flex', alignItems: 'center' }} />`}</Code>
      <Code>{`import { signal } from 'streem'\nimport type { CSSProperties } from 'streem'\n\n// Reactive style — re-runs when signal changes\nconst isDark = signal(false)\n\nfunction ThemedPanel() {\n  return (\n    <div style={() => ({ background: isDark() ? '#1a1a1a' : 'white' })}>\n      <button on:click={() => isDark.set(!isDark())}>Toggle theme</button>\n    </div>\n  )\n}`}</Code>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">What NOT to use</h3>
      <p class="text-muted mb-3 text-[0.95rem]"><strong>CSS-in-JS runtimes</strong> (styled-components, emotion) — runtime overhead; CSS Modules + style objects are sufficient for all use cases.</p>
      <p class="text-muted mb-3 text-[0.95rem]"><strong>Scoped style transforms</strong> (Vue-style scoped blocks) — require a compiler step not included in the standard Vite + Streem setup.</p>
    </DocSection>
  ) as unknown as Node
}
