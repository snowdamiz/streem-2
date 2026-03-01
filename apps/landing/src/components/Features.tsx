import { highlight } from '../lib/highlight'

interface Feature {
  num: string
  title: string
  description: string
  code: string
  accent: string
}

const FEATURES: Feature[] = [
  {
    num: '01',
    title: 'Fine-grained reactivity',
    description: 'Signals update only the exact DOM nodes they depend on. No virtual DOM, no reconciliation pass, no wasted work. Write less, render less.',
    code: `const count = signal(0)
const doubled = computed(() => count.value * 2)

// Only <span> updates — not the parent, not siblings
export function Counter() {
  return <span>{count}</span>
}`,
    accent: 'var(--color-accent)',
  },
  {
    num: '02',
    title: 'First-class streaming',
    description: 'WebSocket, SSE, ReadableStream, and any Observable-compatible source through a single API. Streams close automatically when the component unmounts.',
    code: `// Auto-closes on unmount — no cleanup needed
const [feed] = fromWebSocket('wss://prices.example.com')
const [events] = fromSSE('/api/stream')

// Throttle a 200/sec stream to ~30fps
const smooth = throttle(feed, 33)`,
    accent: 'var(--color-accent)',
  },
  {
    num: '03',
    title: 'Web component interop',
    description: 'Use Shoelace, Lit, or any Web Component-based design system in TSX with fully-typed props. No wrappers. No adapters.',
    code: `// TypeScript knows sl-button's props
<sl-button
  prop:variant="primary"
  prop:size="large"
  on:click={handleClick}
>
  Launch
</sl-button>`,
    accent: 'var(--color-accent-2)',
  },
  {
    num: '04',
    title: 'Async + error boundaries',
    description: 'ErrorBoundary catches thrown errors. Suspense handles Promises. Both compose cleanly with stream-backed signals — no special cases.',
    code: `<ErrorBoundary
  fallback={(err) => <p>{err.message}</p>}
>
  <Suspense fallback={<Spinner />}>
    <LiveWidget />
  </Suspense>
</ErrorBoundary>`,
    accent: 'var(--color-accent-2)',
  },
]

export function Features(): Node {
  return (
    <section class="py-[100px] bg-surface border-t border-border border-b">
      <div class="container">
        <div class="mb-[72px]">
          <div class="text-[11px] uppercase tracking-[0.12em] text-accent font-mono mb-4">Why Streem</div>
          <h2 class="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-tight">
            Everything you need.{' '}
            <span class="text-muted">Nothing you don't.</span>
          </h2>
        </div>

        <div class="flex flex-col">
          {FEATURES.map(f => (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-[60px] items-center py-14 border-t border-border last:border-b last:border-border">
              <div class="md:pr-5">
                <div class="text-[3rem] font-black font-mono tracking-[-0.05em] leading-none mb-4 opacity-90" style={`color: ${f.accent}`}>{f.num}</div>
                <h3 class="text-[1.35rem] font-bold tracking-[-0.02em] mb-3 text-text">{f.title}</h3>
                <p class="text-muted text-[0.95rem] leading-[1.75]">{f.description}</p>
              </div>
              <div>
                <div class="border border-border-2 rounded-xl overflow-hidden shadow-[0_0_0_1px_var(--color-border),_0_12px_40px_rgba(0,0,0,0.35)]">
                  <div class="flex items-center px-3.5 py-2.5 bg-surface-3 border-b border-border">
                    <div class="flex gap-1.5">
                      <span class="block w-[9px] h-[9px] rounded-full bg-border-2" />
                      <span class="block w-[9px] h-[9px] rounded-full bg-border-2" />
                      <span class="block w-[9px] h-[9px] rounded-full bg-border-2" />
                    </div>
                  </div>
                  <pre class="m-0 border-0 rounded-none p-[22px] text-[13px] leading-[1.7] bg-[var(--color-code-bg)]"><code prop:innerHTML={highlight(f.code)} /></pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ) as unknown as Node
}
