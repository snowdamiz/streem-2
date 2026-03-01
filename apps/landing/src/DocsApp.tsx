import './styles/global.css'
import { signal, effect, onCleanup, Show } from 'streem'
import { highlight } from './lib/highlight'

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'signals', label: 'Signals' },
  { id: 'components', label: 'Components' },
  { id: 'streams', label: 'Streams' },
  { id: 'lit-interop', label: 'Lit interop' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'styling', label: 'Styling' },
  { id: 'typescript', label: 'TypeScript' },
]

function getPage(): string {
  const hash = location.hash.slice(1)
  return NAV_ITEMS.some(i => i.id === hash) ? hash : NAV_ITEMS[0].id
}

const currentPage = signal(getPage())

function DocSection({ id, title, children }: { id: string; title: string; children: unknown }) {
  return (
    <section id={id} class="doc-section">
      <h2 class="doc-section-title">{title}</h2>
      {children}
    </section>
  ) as unknown as Node
}

function Code({ children }: { children: string }) {
  const pre = document.createElement('pre')
  pre.className = 'doc-pre'
  const code = document.createElement('code')
  code.innerHTML = highlight(children)
  pre.appendChild(code)
  return pre
}

function GettingStartedSection(): Node {
  return (
    <DocSection id="getting-started" title="Getting started">
      <p>Bootstrap a new project in one command:</p>
      <Code>{`npm create streem@latest`}</Code>
      <p>Or install manually in an existing Vite project:</p>
      <Code>{`npm install streem\n\n# tsconfig.json\n{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "streem"\n  }\n}\n\n# vite.config.ts\nimport { defineConfig } from 'vite'\nimport { streemHMR } from 'streem'\n\nexport default defineConfig({\n  plugins: [streemHMR()]\n})`}</Code>
      <p>For styling setup (CSS Modules or Tailwind v4), see the <a href="#styling" class="docs-link">Styling guide</a>.</p>
      <p>Here is a minimal counter app to verify everything works:</p>
      <Code>{`import { signal } from 'streem'\n\nexport function Counter() {\n  const count = signal(0)\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button on:click={() => count.set(count() + 1)}>+1</button>\n    </div>\n  )\n}`}</Code>
      <p>TypeScript tip: streem infers the type from the initial value. For explicit typing use <code>signal&lt;number&gt;(0)</code>.</p>
    </DocSection>
  ) as unknown as Node
}

function SignalsSection(): Node {
  return (
    <DocSection id="signals" title="Signals">
      <p><code>signal()</code> creates a reactive value. Read it by calling it as a function; write with <code>.set()</code>.</p>
      <Code>{`import { signal, computed, effect, createRoot, onCleanup } from 'streem'\n\n// Create a signal\nconst count = signal(0)\n\n// Read\nconsole.log(count())  // 0\n\n// Write\ncount.set(1)\ncount.set(count() + 1)  // read then write\n\n// Computed — auto-tracks dependencies\nconst doubled = computed(() => count() * 2)\n\n// Effect — re-runs when dependencies change\nconst dispose = effect(() => {\n  console.log('count changed:', count())\n})\n\n// Cleanup\ndispose()\n\n// Scoped reactive root\nconst root = createRoot(() => {\n  effect(() => { /* ... */ })\n  onCleanup(() => console.log('cleaning up'))\n})\nroot.dispose()  // fires onCleanup callbacks`}</Code>
      <p>Batch multiple signal writes so downstream effects run only once:</p>
      <Code>{`import { signal, effect, batch } from 'streem'\n\nconst x = signal(0)\nconst y = signal(0)\n\neffect(() => console.log(x(), y()))\n\n// Without batch: effect fires twice\nx.set(1)\ny.set(1)\n\n// With batch: effect fires once\nbatch(() => {\n  x.set(2)\n  y.set(2)\n})`}</Code>
      <p>TypeScript tip: use <code>signal&lt;string | null&gt;(null)</code> for optional values. The computed type is inferred automatically.</p>
      <p>For a full TypeScript reference covering signal types, computed types, and JSX config, see the <a href="#typescript" class="docs-link">TypeScript guide</a>.</p>
    </DocSection>
  ) as unknown as Node
}

function ComponentsSection(): Node {
  return (
    <DocSection id="components" title="Components">
      <p>Components are functions that run once on mount. Reactivity lives in JSX expressions, not in re-renders.</p>
      <Code>{`import { render, onMount, Show, For, ErrorBoundary, Suspense } from 'streem'\n\n// Mount to DOM\nrender(App, document.getElementById('app')!)\n\n// onMount — runs after first render\nfunction MyComponent() {\n  onMount(() => {\n    // Do work after mount\n    return () => { /* cleanup */ }\n  })\n  return <div>Hello</div>\n}\n\n// Show — conditional rendering\n<Show when={() => isVisible()} fallback={<p>Hidden</p>}>\n  {() => <p>Visible</p>}\n</Show>\n\n// For — keyed list rendering\n<For each={items} by={item => item.id}>\n  {(item) => <li>{item.name}</li>}\n</For>\n\n// ErrorBoundary — catch thrown errors\n<ErrorBoundary fallback={(err, reset) => (\n  document.createTextNode('Error: ' + String(err))\n)}>\n  {() => <RiskyComponent />}\n</ErrorBoundary>\n\n// Suspense — show loading while async resolves\n// Children should throw a Promise to trigger fallback;\n// Suspense retries render when the Promise resolves.\n<Suspense fallback={<p>Loading...</p>}>\n  {() => <AsyncComponent />}\n</Suspense>`}</Code>
      <p>onMount returns a cleanup function — use it to remove event listeners or cancel timers:</p>
      <Code>{`import { onMount } from 'streem'\n\nfunction ResizeWatcher() {\n  onMount(() => {\n    const handler = () => console.log(window.innerWidth)\n    window.addEventListener('resize', handler)\n    return () => window.removeEventListener('resize', handler)\n  })\n  return <div>Watching...</div>\n}`}</Code>
      <p>Combine Show and For for conditional lists:</p>
      <Code>{`import { signal, Show, For } from 'streem'\n\nconst items = signal([{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }])\nconst loading = signal(false)\n\nfunction ItemList() {\n  return (\n    <div>\n      <Show when={() => loading()} fallback={<span />}>\n        {() => <p>Loading...</p>}\n      </Show>\n      <Show when={() => !loading()}>\n        {() => (\n          <For each={items} by={item => item.id}>\n            {(item) => <li>{() => item().name}</li>}\n          </For>\n        )}\n      </Show>\n    </div>\n  )\n}`}</Code>
      <p>For component prop typing patterns and how to type children correctly, see the <a href="#typescript" class="docs-link">TypeScript guide</a>.</p>
    </DocSection>
  ) as unknown as Node
}

function StreamsSection(): Node {
  return (
    <DocSection id="streams" title="Streams">
      <p>Stream adapters return a <code>[dataSignal, statusSignal]</code> tuple. All connections close automatically via <code>onCleanup()</code> when the component unmounts.</p>
      <Code>{`import { fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce } from 'streem'\nimport type { Subscribable } from 'streem'\n\n// WebSocket — auto-reconnects with exponential backoff\nconst [data, status] = fromWebSocket('wss://example.com')\n// status() → 'connected' | 'reconnecting' | 'error' | 'closed'\n\n// SSE\nconst [feed] = fromSSE('/api/events')\n\n// Fetch ReadableStream\nconst [chunk] = fromReadable(response.body!)\n\n// Any Observable / RxJS subject\nconst myObs: Subscribable<number> = {\n  subscribe(obs) {\n    // ...\n    return { unsubscribe() {} }\n  }\n}\nconst [value] = fromObservable(myObs)\n\n// Backpressure — batch N signal writes as one effect run\nbatch(() => {\n  price.set(newPrice)\n  volume.set(newVolume)\n})\n\n// Throttle / debounce signal updates\nconst visual = throttle(stream, 33)   // max 30fps\nconst search = debounce(query, 300)   // debounce 300ms`}</Code>
      <p>Always check the status signal before rendering data — connections may be reconnecting or in error:</p>
      <Code>{`import { fromWebSocket, Show } from 'streem'\n\nfunction PriceDisplay() {\n  const [price, status] = fromWebSocket<number>('wss://prices.example.com')\n\n  return (\n    <div>\n      <Show when={() => status() === 'connected'}>\n        {() => <span>Price: {price}</span>}\n      </Show>\n      <Show when={() => status() === 'reconnecting'}>\n        {() => <span>Reconnecting...</span>}\n      </Show>\n      <Show when={() => status() === 'error'}>\n        {() => <span>Connection error</span>}\n      </Show>\n    </div>\n  )\n}`}</Code>
      <p>Use throttle to limit UI updates from fast streams (e.g. 30fps cap):</p>
      <Code>{`import { fromWebSocket, throttle } from 'streem'\n\nconst [rawTick] = fromWebSocket('wss://ticks.example.com')\nconst displayTick = throttle(rawTick, 33) // max ~30fps\n\nfunction Ticker() {\n  return <span>{displayTick}</span>\n}`}</Code>
    </DocSection>
  ) as unknown as Node
}

function LitInteropSection(): Node {
  return (
    <DocSection id="lit-interop" title="Lit interop">
      <p>Use any Lit or Web Component in TSX with typed props. Install <code>@streem/lit</code> separately (it is not included in the main <code>streem</code> package).</p>
      <Code>{`npm install @streem/lit\n\n# Generate JSX types from a component library's Custom Elements Manifest\npnpm --filter @streem/lit tsx scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace\n\n# In your TSX\nimport { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'\nsetBasePath('./shoelace_assets')  // must be first — before any component import\n\nimport '@shoelace-style/shoelace/dist/components/button/button.js'\nimport '@shoelace-style/shoelace/dist/components/badge/badge.js'\n\n// prop: routes to JS property (not HTML attribute) — typed by generated IntrinsicElements\n// on: uses direct addEventListener — bypasses Shadow DOM event retargeting\nexport function InstallButton() {\n  return (\n    <sl-button\n      prop:variant="primary"\n      prop:size="large"\n      on:click={() => navigator.clipboard.writeText('npm create streem@latest')}\n    >\n      Copy install command\n    </sl-button>\n  )\n}`}</Code>
      <p>A complete styled button using prop: and on: together:</p>
      <Code>{`import { signal } from 'streem'\nimport '@shoelace-style/shoelace/dist/components/button/button.js'\nimport '@shoelace-style/shoelace/dist/components/badge/badge.js'\n\nfunction NotifyButton() {\n  const count = signal(0)\n\n  return (\n    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>\n      <sl-button\n        prop:variant="primary"\n        on:click={() => count.set(count() + 1)}\n      >\n        Notify\n      </sl-button>\n      <sl-badge prop:variant="danger" prop:pill={true}>\n        {count}\n      </sl-badge>\n    </div>\n  )\n}`}</Code>
      <p>TypeScript tip: <code>prop:</code> routes to a JS property; <code>on:</code> attaches an event listener. Both are typed by the generated IntrinsicElements from the Custom Elements Manifest.</p>
    </DocSection>
  ) as unknown as Node
}

function PatternsSection(): Node {
  return (
    <DocSection id="patterns" title="Patterns">
      <p>Common patterns for building real-world apps with Streem.</p>

      <h3 class="doc-section-subtitle">Form handling</h3>
      <p>Bind each field to a signal and derive a computed for the submit payload:</p>
      <Code>{`import { signal, computed } from 'streem'\n\nfunction LoginForm() {\n  const email = signal('')\n  const password = signal('')\n  const isValid = computed(() => email().includes('@') && password().length >= 8)\n\n  function handleSubmit(e: Event) {\n    e.preventDefault()\n    if (!isValid()) return\n    fetch('/api/login', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ email: email(), password: password() }),\n    })\n  }\n\n  return (\n    <form on:submit={handleSubmit}>\n      <input\n        type="email"\n        on:input={(e) => email.set((e.target as HTMLInputElement).value)}\n        placeholder="Email"\n      />\n      <input\n        type="password"\n        on:input={(e) => password.set((e.target as HTMLInputElement).value)}\n        placeholder="Password"\n      />\n      <button type="submit" disabled={() => !isValid()}>Log in</button>\n    </form>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">Data fetching</h3>
      <p>Use a signal for the data and a status signal for loading/error states:</p>
      <Code>{`import { signal, onMount } from 'streem'\n\ninterface User { id: number; name: string }\n\nfunction UserProfile({ userId }: { userId: number }) {\n  const user = signal<User | null>(null)\n  const status = signal<'loading' | 'done' | 'error'>('loading')\n\n  onMount(async () => {\n    try {\n      const res = await fetch(\`/api/users/\${userId}\`)\n      user.set(await res.json())\n      status.set('done')\n    } catch {\n      status.set('error')\n    }\n  })\n\n  return (\n    <div>\n      <Show when={() => status() === 'loading'}>\n        {() => <p>Loading...</p>}\n      </Show>\n      <Show when={() => status() === 'done' && user() !== null}>\n        {() => <p>Hello, {() => user()!.name}</p>}\n      </Show>\n      <Show when={() => status() === 'error'}>\n        {() => <p>Failed to load user.</p>}\n      </Show>\n    </div>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">Shared state</h3>
      <p>Export signals from a module — any component that imports them shares the same reactive state:</p>
      <Code>{`// store/auth.ts\nimport { signal, computed } from 'streem'\n\nexport const currentUser = signal<{ name: string; role: string } | null>(null)\nexport const isLoggedIn = computed(() => currentUser() !== null)\nexport const isAdmin = computed(() => currentUser()?.role === 'admin')\n\nexport function login(user: { name: string; role: string }) {\n  currentUser.set(user)\n}\n\nexport function logout() {\n  currentUser.set(null)\n}\n\n// components/Header.tsx\nimport { currentUser, isLoggedIn, logout } from '../store/auth'\n\nfunction Header() {\n  return (\n    <header>\n      <Show when={isLoggedIn}>\n        {() => (\n          <div>\n            <span>Hello, {() => currentUser()!.name}</span>\n            <button on:click={logout}>Log out</button>\n          </div>\n        )}\n      </Show>\n    </header>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">Real-time updates</h3>
      <p>Combine a WebSocket stream with a signal accumulator to maintain a running list of events:</p>
      <Code>{`import { signal, effect, fromWebSocket, throttle } from 'streem'\n\ninterface TradeEvent { symbol: string; price: number; volume: number }\n\nfunction LiveTradesFeed() {\n  const [rawTrade] = fromWebSocket<TradeEvent>('wss://trades.example.com')\n  const displayTrade = throttle(rawTrade, 100) // max 10 updates/sec\n\n  const trades = signal<TradeEvent[]>([])\n\n  effect(() => {\n    const t = displayTrade()\n    if (t == null) return\n    trades.set([t, ...trades().slice(0, 49)]) // keep last 50\n  })\n\n  return (\n    <ul>\n      <For each={trades} by={(t, i) => i}>\n        {(trade) => (\n          <li>{() => \`\${trade().symbol} @ \${trade().price}\`}</li>\n        )}\n      </For>\n    </ul>\n  )\n}`}</Code>
    </DocSection>
  ) as unknown as Node
}

function StylingSection(): Node {
  return (
    <DocSection id="styling" title="Styling">
      <p>Streem does not include a CSS-in-JS runtime. The recommended patterns are CSS Modules for component styles, Tailwind v4 for utility-first workflows, and style objects for dynamic inline styles.</p>

      <h3 class="doc-section-subtitle">CSS Modules</h3>
      <p>CSS Modules are Vite-native and require zero configuration. They provide local scoping by default, TypeScript autocompletion for class names, and tree-shakeable output.</p>
      <p>No configuration needed — Vite handles <code>.module.css</code> files automatically.</p>
      <Code>{`/* Button.module.css */\n.root {\n  display: inline-flex;\n  align-items: center;\n  padding: 8px 16px;\n  border-radius: 4px;\n}\n\n.primary {\n  background: var(--color-primary, #3b82f6);\n  color: white;\n}`}</Code>
      <Code>{`// Button.tsx\nimport styles from './Button.module.css'\n\ninterface ButtonProps {\n  variant?: 'primary' | 'secondary'\n  children?: unknown\n}\n\nexport function Button(props: ButtonProps) {\n  return (\n    <button\n      class={\`\${styles.root} \${props.variant === 'primary' ? styles.primary : ''}\`}\n    >\n      {props.children}\n    </button>\n  )\n}`}</Code>
      <p>TypeScript tip: add a global declaration to get full type support for CSS Module imports. Create <code>src/vite-env.d.ts</code> with:</p>
      <Code>{`/// <reference types="vite/client" />`}</Code>
      <p>This enables <code>import styles from './Button.module.css'</code> to return <code>Record&lt;string, string&gt;</code>.</p>

      <h3 class="doc-section-subtitle">Tailwind v4</h3>
      <p>Tailwind v4 uses a Vite plugin for zero-config integration — no <code>tailwind.config.js</code> required.</p>
      <Code>{`npm install -D tailwindcss @tailwindcss/vite`}</Code>
      <Code>{`// vite.config.ts\nimport { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'\nimport { streemHMR } from 'streem'\n\nexport default defineConfig({\n  plugins: [\n    tailwindcss(),\n    streemHMR(),\n  ]\n})`}</Code>
      <Code>{`/* src/styles/global.css — CSS entry file */\n@import "tailwindcss";`}</Code>
      <Code>{`// Example component using Tailwind utility classes\nimport { signal } from 'streem'\n\nexport function AlertBanner() {\n  const visible = signal(true)\n\n  return (\n    <div class="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-900">\n      <span class="text-sm font-medium">Update available</span>\n      <button\n        class="ml-auto rounded px-2 py-1 text-xs hover:bg-blue-100"\n        on:click={() => visible.set(false)}\n      >\n        Dismiss\n      </button>\n    </div>\n  )\n}`}</Code>
      <p>TypeScript tip: Tailwind classes are plain strings — no special types needed. All utilities are available immediately after adding the <code>@import</code>.</p>

      <h3 class="doc-section-subtitle">Reactive style objects</h3>
      <p>Use the <code>CSSProperties</code> type from <code>streem</code> to type extracted style variables. The <code>style</code> prop accepts both static objects and reactive accessors.</p>
      <Code>{`import type { CSSProperties } from 'streem'\n\n// Static style object\nconst containerStyle: CSSProperties = {\n  display: 'grid',\n  gridTemplateColumns: 'repeat(3, 1fr)',\n  gap: '20px',\n}\n\n// Use static objects and inline objects interchangeably\n<div style={containerStyle} />\n<div style={{ display: 'flex', alignItems: 'center' }} />`}</Code>
      <Code>{`import { signal } from 'streem'\nimport type { CSSProperties } from 'streem'\n\n// Reactive style — re-runs when signal changes\nconst isDark = signal(false)\n\nfunction ThemedPanel() {\n  return (\n    <div style={() => ({ background: isDark() ? '#1a1a1a' : 'white' })}>\n      <button on:click={() => isDark.set(!isDark())}>Toggle theme</button>\n    </div>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">What NOT to use</h3>
      <p><strong>CSS-in-JS runtimes</strong> (styled-components, emotion) — runtime overhead; CSS Modules + style objects are sufficient for all use cases.</p>
      <p><strong>Scoped style transforms</strong> (Vue-style scoped blocks) — require a compiler step not included in the standard Vite + Streem setup.</p>
    </DocSection>
  ) as unknown as Node
}

function TypeScriptSection(): Node {
  return (
    <DocSection id="typescript" title="TypeScript">
      <p>Streem is built TypeScript-first. This guide covers the type patterns that matter most when building with Streem: signal generics, JSX configuration, CSSProperties, conditional classes, and component prop types.</p>

      <h3 class="doc-section-subtitle">Signal typing</h3>
      <p>TypeScript infers the signal type from the initial value. Use explicit generics when the type cannot be inferred, such as union types or interfaces.</p>
      <Code>{`import { signal, computed, effect } from 'streem'\nimport type { Signal } from 'streem'\n\n// Type inferred from initial value\nconst count = signal(0)           // Signal<number>\nconst name = signal('')           // Signal<string>\nconst active = signal(false)      // Signal<boolean>\n\n// Explicit generic — required for union types and interfaces\ninterface User { id: number; name: string }\nconst user = signal<User | null>(null)   // Signal<User | null>\nconst status = signal<'idle' | 'loading' | 'done'>('idle')\n\n// computed() returns () => T (a getter function, NOT a Signal)\nconst doubled = computed(() => count() * 2)  // () => number\nconst label = computed(() => \`Count: \${count()}\`)  // () => string\n\n// Read computed in JSX as a function — called reactively by the renderer\nfunction Counter() {\n  const count = signal<number>(0)\n  const doubled = computed(() => count() * 2)\n\n  effect(() => {\n    // In effects and event handlers, call as a function\n    console.log('doubled:', doubled())\n  })\n\n  return (\n    <div>\n      {/* In JSX, pass the signal directly — renderer calls .value */}\n      <p>Count: {count}</p>\n      {/* Pass computed directly — renderer calls it as () => T */}\n      <p>Doubled: {doubled}</p>\n      <button on:click={() => count.set(count() + 1)}>+1</button>\n    </div>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">JSX configuration</h3>
      <p>Add these two fields to <code>compilerOptions</code> in your <code>tsconfig.json</code> to enable Streem's JSX factory and full type checking for intrinsic elements:</p>
      <Code>{`{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "streem"\n  }\n}`}</Code>
      <p><code>jsxImportSource: "streem"</code> tells TypeScript to resolve JSX types from <code>streem/jsx-runtime</code>. This enables:</p>
      <Code>{`// Type-checked intrinsic elements (div, button, input, etc.)\n<div class="container" />         // 'class', not 'className'\n<button on:click={handler} />     // on:click is typed correctly\n<input type="text" value={val} />\n\n// Component functions return Node, not JSX.Element\nfunction MyComponent(): Node {\n  return <div>Hello</div>\n}\n\n// Render to DOM\nimport { render } from 'streem'\nrender(MyComponent, document.getElementById('app')!)`}</Code>
      <p>Note: Streem uses <code>class</code> (not <code>className</code>) and event handlers are prefixed with <code>on:</code>. Both are enforced at the type level.</p>

      <h3 class="doc-section-subtitle">CSSProperties</h3>
      <p>Import <code>CSSProperties</code> from <code>streem</code> to type extracted style objects. The <code>style</code> prop accepts either a static <code>CSSProperties</code> object or a reactive accessor <code>() =&gt; CSSProperties</code>.</p>
      <Code>{`import type { CSSProperties } from 'streem'\n\n// Static style object — evaluated once\nconst gridStyle: CSSProperties = {\n  display: 'grid',\n  gridTemplateColumns: 'repeat(3, 1fr)',\n  gap: '16px',\n}\n\n// Use static object or inline object interchangeably\n<div style={gridStyle} />\n<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} />`}</Code>
      <Code>{`import { signal } from 'streem'\nimport type { CSSProperties } from 'streem'\n\nconst isDark = signal(false)\n\n// Reactive style — accessor re-runs when signal changes\nfunction ThemedCard() {\n  return (\n    <div style={() => ({\n      background: isDark() ? '#1a1a1a' : 'white',\n      color: isDark() ? '#f5f5f5' : '#111',\n      padding: '20px',\n      borderRadius: '8px',\n    } satisfies CSSProperties)}>\n      <button on:click={() => isDark.set(!isDark())}>Toggle theme</button>\n    </div>\n  )\n}`}</Code>

      <h3 class="doc-section-subtitle">Conditional classes</h3>
      <p>Streem has no built-in <code>clsx</code> or <code>classnames</code>. Use template literals for simple cases and array filter for multiple conditions. Wrap in an accessor for reactive class switching.</p>
      <Code>{`import styles from './Button.module.css'\nimport { signal } from 'streem'\n\nconst isActive = signal(false)\nconst isDisabled = signal(false)\n\n// Template literal — simple single condition\n<div class={\`\${styles.root} \${isActive() ? styles.active : ''}\`} />\n\n// Array filter — multiple conditions\nconst cls = [styles.root, isActive() && styles.active, isDisabled() && styles.disabled]\n  .filter(Boolean)\n  .join(' ')\n<div class={cls} />\n\n// Reactive — re-evaluates when signals change\n<div class={() => [\n  styles.root,\n  isActive() && styles.active,\n  isDisabled() && styles.disabled,\n].filter(Boolean).join(' ')} />`}</Code>
      <p>The reactive accessor form (<code>{'class={() => ...}'}</code>) is important when the class depends on signals — the renderer re-evaluates the accessor on signal change and patches the DOM attribute.</p>

      <h3 class="doc-section-subtitle">Component prop types</h3>
      <p>Define a <code>Props</code> interface for each component. Use <code>unknown</code> for <code>children</code> — Streem children can be <code>Node</code>, <code>Node[]</code>, <code>string</code>, <code>Signal&lt;T&gt;</code>, or <code>() =&gt; T</code>. Cast to <code>Node</code> at the call site.</p>
      <Code>{`import type { Signal } from 'streem'\n\ninterface CardProps {\n  title: string\n  subtitle?: string\n  variant?: 'default' | 'featured'\n  onClick?: () => void\n  children?: unknown   // unknown, not ReactNode\n}\n\nfunction Card(props: CardProps): Node {\n  return (\n    <div\n      class={\`card \${props.variant === 'featured' ? 'card--featured' : ''}\`}\n      on:click={props.onClick}\n    >\n      <h2>{props.title}</h2>\n      {props.subtitle && <p>{props.subtitle}</p>}\n      {props.children as Node}\n    </div>\n  ) as unknown as Node\n}\n\n// Reactive props — wrap in a signal when the value changes over time\ninterface StatusBadgeProps {\n  status: Signal<'idle' | 'loading' | 'done' | 'error'>\n}\n\nfunction StatusBadge(props: StatusBadgeProps): Node {\n  return (\n    <span class={() => \`badge badge--\${props.status()}\`}>\n      {props.status}\n    </span>\n  ) as unknown as Node\n}`}</Code>
      <p>Note: <code>children</code> is typed as <code>unknown</code> because Streem's JSX children are structurally flexible. Casting to <code>Node</code> when rendering is intentional and safe — the renderer handles all child types at runtime.</p>
    </DocSection>
  ) as unknown as Node
}

function PerformanceSection(): Node {
  return (
    <DocSection id="performance" title="Performance">
      <p>Streem's reactive system is pull-based and lazily evaluated. These four practices prevent the most costly mistakes in production Streem apps.</p>

      <h3 class="doc-section-subtitle">computed() vs effect()</h3>
      <p>Use <code>computed()</code> when you need a derived value. Use <code>effect()</code> for side effects only (DOM mutations, fetch calls, timers, logging).</p>
      <p><code>computed()</code> is a lazy pull: it only recalculates when its dependencies change AND the value is read. If nobody reads it, it does no work. <code>effect()</code> always runs eagerly on every dependency change.</p>
      <Code>{`import { signal, computed, effect } from 'streem'\n\nconst count = signal(0)\n\n// BAD — effect maintaining derived state:\n// Runs as a side effect, creates unnecessary intermediate storage,\n// and triggers extra re-runs in anything reading doubled.\nconst doubled = signal(0)\neffect(() => { doubled.set(count() * 2) })\n\n// GOOD — computed for derived values:\n// Lazy pull — zero overhead when not read. No extra storage.\nconst doubled = computed(() => count() * 2)\nconsole.log(doubled())  // reads and caches the value`}</Code>
      <p>Rule of thumb: if you are writing to a signal inside an effect, consider whether <code>computed()</code> covers the use case instead.</p>

      <h3 class="doc-section-subtitle">Reactive leak prevention</h3>
      <p><code>computed()</code> and <code>effect()</code> created outside an owner scope are never automatically disposed. In dev mode Streem warns: <code>[Streem] computed() created without an active owner scope. This computation will never be automatically disposed (disposal leak).</code></p>
      <Code>{`import { signal, computed, effect, createRoot } from 'streem'\n\nconst count = signal(0)\n\n// PROBLEMATIC — created at module level, never disposed:\n// Dev warning fires. The computation lives forever.\nconst doubled = computed(() => count() * 2)\n\n// SAFE PATTERN A — inside a component (render() provides an automatic owner):\nfunction MyComponent() {\n  const doubled = computed(() => count() * 2)\n  return <p>{doubled}</p>\n}\n\n// SAFE PATTERN B — explicit root for module-level reactive work:\nconst root = createRoot(() => {\n  const doubled = computed(() => count() * 2)\n  effect(() => { document.title = String(doubled()) })\n})\n// Later when done:\nroot.dispose()`}</Code>
      <p>Dev-mode warnings are stripped in production builds. Use them to catch leaks during development.</p>

      <h3 class="doc-section-subtitle">Cleanup patterns</h3>
      <p>Three cleanup hooks cover the full lifecycle of reactive resources:</p>
      <p><strong><code>onCleanup()</code> inside effect()</strong> — runs before the next effect re-run AND on dispose. Use for clearing timers or removing event listeners created inside the effect.</p>
      <Code>{`import { effect, onCleanup } from 'streem'\n\neffect(() => {\n  const handler = (e: KeyboardEvent) => console.log(e.key)\n  window.addEventListener('keydown', handler)\n  onCleanup(() => window.removeEventListener('keydown', handler))\n})`}</Code>
      <p><strong><code>onMount()</code> returning a function</strong> — cleanup runs on component unmount. Use for one-time setup (timers, subscriptions) that should stop when the component leaves the DOM.</p>
      <Code>{`import { signal, onMount } from 'streem'\n\nfunction LiveClock() {\n  const time = signal(new Date().toLocaleTimeString())\n\n  onMount(() => {\n    const id = setInterval(() => {\n      time.set(new Date().toLocaleTimeString())\n    }, 1000)\n    return () => clearInterval(id)  // fires on unmount\n  })\n\n  return <span>{time}</span>\n}`}</Code>
      <p><strong><code>createRoot().dispose()</code></strong> — explicit teardown for long-lived reactive trees outside components. Call when the reactive tree should be permanently destroyed.</p>

      <h3 class="doc-section-subtitle">Signal granularity</h3>
      <p>How you structure signals determines how many subscribers re-run on each update.</p>
      <p><strong>Fine-grained</strong> (separate signals per field): each subscriber only re-runs when its specific signal changes. Best for independent values that update at different rates.</p>
      <p><strong>Coarse-grained</strong> (one signal holding an object): simpler for values that always update together. Any field change notifies all subscribers of that signal.</p>
      <Code>{`import { signal, computed } from 'streem'\n\n// Fine-grained — subscribers only re-run when their signal changes:\n// priceLabel recomputes only when price changes, not when volume changes.\nconst price = signal(0)\nconst volume = signal(0)\nconst priceLabel = computed(() => \`$\${price().toFixed(2)}\`)\nconst volumeLabel = computed(() => \`\${volume().toLocaleString()} shares\`)\n\n// Coarse-grained — one update notifies all subscribers:\n// Any field change requires spreading the whole object.\nconst ticker = signal({ price: 0, volume: 0 })\nticker.set({ ...ticker.value, price: 42.5 })`}</Code>
      <p>Rule of thumb: prefer fine-grained for values that update independently; prefer coarse-grained for values that always change together (forms, config objects).</p>
    </DocSection>
  ) as unknown as Node
}

export function DocsApp(): Node {
  const handleHashChange = () => {
    currentPage.set(getPage())
    window.scrollTo(0, 0)
  }
  window.addEventListener('hashchange', handleHashChange)
  onCleanup(() => window.removeEventListener('hashchange', handleHashChange))

  effect(() => {
    const item = NAV_ITEMS.find(i => i.id === currentPage.value)
    document.title = item ? `${item.label} — Streem Docs` : 'Streem Docs'
  })

  return (
    <div class="docs-layout">
      <nav class="docs-nav">
        <div class="docs-nav-logo">
          <a href="../" class="docs-nav-brand">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Streem" style={{ height: '24px', width: 'auto', display: 'block' }} />
          </a>
        </div>
        <ul class="docs-nav-list">
          {NAV_ITEMS.map(item => (
            <li><a href={`#${item.id}`} class={() => `docs-nav-link${currentPage.value === item.id ? ' active' : ''}`}>{item.label}</a></li>
          ))}
        </ul>
      </nav>

      <main class="docs-main">
        <div class="docs-content">
          <Show when={() => currentPage.value === 'getting-started'}>
            {() => GettingStartedSection()}
          </Show>
          <Show when={() => currentPage.value === 'signals'}>
            {() => SignalsSection()}
          </Show>
          <Show when={() => currentPage.value === 'components'}>
            {() => ComponentsSection()}
          </Show>
          <Show when={() => currentPage.value === 'streams'}>
            {() => StreamsSection()}
          </Show>
          <Show when={() => currentPage.value === 'lit-interop'}>
            {() => LitInteropSection()}
          </Show>
          <Show when={() => currentPage.value === 'patterns'}>
            {() => PatternsSection()}
          </Show>
          <Show when={() => currentPage.value === 'styling'}>
            {() => StylingSection()}
          </Show>
          <Show when={() => currentPage.value === 'typescript'}>
            {() => TypeScriptSection()}
          </Show>
        </div>
      </main>

      <style>{`
        .docs-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
        }
        .docs-nav {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          padding: 24px 20px;
        }
        .docs-nav-logo { margin-bottom: 8px; }
        .docs-nav-brand { display: block; margin-bottom: 28px; }
        .docs-nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .docs-nav-link {
          display: block;
          padding: 6px 10px;
          color: var(--color-muted);
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          transition: all 0.1s;
        }
        .docs-nav-link:hover {
          color: var(--color-text);
          background: rgba(255,255,255,0.05);
        }
        .docs-nav-link.active {
          color: var(--color-text);
          background: rgba(255,255,255,0.08);
        }
        .docs-main {
          overflow-y: auto;
          padding: 48px 60px;
        }
        .docs-content {
          max-width: 760px;
          margin: 0 auto;
        }
        .doc-section {
          margin-bottom: 60px;
          padding-top: 16px;
        }
        .doc-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--color-text);
        }
        .doc-section-subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text);
          margin-top: 32px;
          margin-bottom: 8px;
        }
        .doc-section p {
          color: var(--color-muted);
          margin-bottom: 12px;
          font-size: 0.95rem;
        }
        .doc-pre {
          margin: 16px 0 24px;
          font-size: 13px;
          max-width: 100%;
        }
        @media (max-width: 700px) {
          .docs-layout { grid-template-columns: 1fr; }
          .docs-nav {
            position: static;
            height: auto;
            display: flex;
            flex-direction: row;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            overflow-x: auto;
            padding: 12px 16px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
          .docs-nav-brand { flex-shrink: 0; margin-bottom: 0; }
          .docs-nav-logo { margin-bottom: 0; }
          .docs-nav-list {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 4px 8px;
          }
          .docs-main {
            padding: 24px 16px;
            min-width: 0;
          }
        }
        @media (max-width: 500px) {
          .doc-section-title { font-size: 1.8rem; }
        }
        .docs-link { color: var(--color-primary, #3b82f6); text-decoration: none; }
        .docs-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  ) as unknown as Node
}
