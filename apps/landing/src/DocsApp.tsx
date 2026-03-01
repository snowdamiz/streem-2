import './styles/global.css'
import { signal, effect, onCleanup, Show } from 'streem'
import { highlight } from './lib/highlight'

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'signals', label: 'Signals' },
  { id: 'components', label: 'Components' },
  { id: 'streams', label: 'Streams' },
  { id: 'lit-interop', label: 'Lit interop' },
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
      `}</style>
    </div>
  ) as unknown as Node
}
