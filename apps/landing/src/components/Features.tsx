import { signal, Show } from 'streem'

interface Feature {
  icon: string
  title: string
  description: string
  code: string
}

const FEATURES: Feature[] = [
  {
    icon: '⚡',
    title: 'Fine-grained reactivity',
    description: 'Signals update only the exact DOM nodes they affect. No virtual DOM, no reconciliation, no wasted renders.',
    code: 'const count = signal(0)\n// Only this text node updates:\n<span>{count}</span>',
  },
  {
    icon: '🌊',
    title: 'First-class streams',
    description: 'WebSocket, SSE, ReadableStream, Observable — one API. Automatic cleanup when components unmount.',
    code: 'const [data] = fromWebSocket(url)\n// Auto-closes on unmount\n<div>{data}</div>',
  },
  {
    icon: '🏗️',
    title: 'Web component interop',
    description: 'Use any Lit component in TSX with typed props. Works with any Web Component-based design system.',
    code: '<sl-button\n  prop:variant="primary"\n  on:click={handler}\n/>',
  },
  {
    icon: '🛡️',
    title: 'Error + async boundaries',
    description: 'ErrorBoundary catches thrown errors. Suspense handles Promises. Both work with stream-backed signals.',
    code: '<ErrorBoundary fallback={err => <p>{err.message}</p>}>\n  <Suspense fallback={<Spinner />}>\n    <LiveWidget />\n  </Suspense>\n</ErrorBoundary>',
  },
]

export function Features(): Node {
  const expandedIdx = signal<number | null>(null)

  return (
    <section class="features-section">
      <div class="container">
        <div class="section-label">Why Streem</div>
        <h2 class="section-title">Everything you need, nothing you don't</h2>
        <div class="features-grid">
          {FEATURES.map((f, i) => (
            <div
              class="feature-card"
              onclick={() => {
                const current = expandedIdx()
                expandedIdx.set(current === i ? null : i)
              }}
            >
              <div class="feature-icon">{f.icon}</div>
              <h3 class="feature-title">{f.title}</h3>
              <p class="feature-desc">{f.description}</p>
              <Show when={() => expandedIdx() === i}>
                {() => (<pre class="feature-code"><code>{f.code}</code></pre>) as unknown as Node}
              </Show>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .features-section {}
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-top: 40px;
        }
        .feature-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 28px 24px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .feature-card:hover { border-color: var(--color-accent); }
        .feature-icon { font-size: 2rem; margin-bottom: 12px; }
        .feature-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .feature-desc { color: var(--color-muted); font-size: 0.95rem; }
        .feature-code {
          margin-top: 16px;
          font-size: 12px;
          background: var(--color-code-bg);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 12px;
          white-space: pre;
          overflow-x: auto;
        }
      `}</style>
    </section>
  ) as unknown as Node
}
