import { signal, Show } from 'streem'
import styles from './Features.module.css'

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
    <section class={[styles.featuresSection, "py-20"]}>
      <div class="container">
        <div class="section-label">Why Streem</div>
        <h2 class="section-title">Everything you need, nothing you don't</h2>
        <div class={[styles.featuresGrid, "grid gap-6 sm:grid-cols-2"]}>
          {FEATURES.map((f, i) => (
            <div
              class={styles.featureCard}
              onclick={() => {
                const current = expandedIdx.value
                expandedIdx.set(current === i ? null : i)
              }}
            >
              <div class={styles.featureIcon}>{f.icon}</div>
              <h3 class={styles.featureTitle}>{f.title}</h3>
              <p class={styles.featureDesc}>{f.description}</p>
              <Show when={() => expandedIdx.value === i}>
                {() => (<pre class={styles.featureCode}><code>{f.code}</code></pre>) as unknown as Node}
              </Show>
            </div>
          ))}
        </div>
      </div>
    </section>
  ) as unknown as Node
}
