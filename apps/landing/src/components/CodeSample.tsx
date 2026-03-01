import { signal, Show } from 'streem'
import { highlight } from '../lib/highlight'

type Tab = 'signals' | 'streams' | 'jsx'

const TABS: { id: Tab; label: string; file: string }[] = [
  { id: 'signals', label: 'Signals', file: 'reactive.ts' },
  { id: 'streams', label: 'Streams', file: 'live-feed.ts' },
  { id: 'jsx', label: 'JSX', file: 'app.tsx' },
]

const CODE: Record<Tab, string> = {
  signals: `import { signal, computed, effect } from 'streem'

// Signals — plain reactive values
const count = signal(0)
const doubled = computed(() => count.value * 2)
const label = computed(() =>
  count.value % 2 === 0 ? 'even' : 'odd'
)

// Automatically re-runs when dependencies change
effect(() => {
  console.log(\`\${count.value} is \${label.value}\`)
})

// Trigger updates — effects flush synchronously
count.set(count.value + 1)
// logs: "1 is odd"`,

  streams: `import { fromWebSocket, fromSSE, batch, throttle } from 'streem'

// WebSocket — closes automatically when component unmounts
const [feed, status] = fromWebSocket('wss://prices.example.com')

// Server-sent events — same API
const [events] = fromSSE('/api/stream')

// Throttle a 200 msg/sec observable to ~30fps
const smooth = throttle(feed, 33)

// Batch writes — all signals flush as a single DOM update
effect(() => {
  batch(() => {
    price.set(smooth.value?.price ?? 0)
    volume.set(smooth.value?.volume ?? 0)
  })
})`,

  jsx: `import { signal, Show, For } from 'streem'

const items = signal(['Alice', 'Bob', 'Carol'])
const selected = signal<string | null>(null)

// Reactive JSX — signals bind directly to DOM text nodes
export function List() {
  return (
    <div>
      {/* For re-renders only changed items */}
      <For each={items} by={(x) => x}>
        {(name) => (
          <button onclick={() => selected.set(name)}>
            {name}
          </button>
        )}
      </For>

      {/* Show mounts/unmounts based on a signal */}
      <Show when={() => selected.value !== null}>
        {() => <p>Selected: {selected}</p>}
      </Show>
    </div>
  )
}`,
}

export function CodeSample(): Node {
  const activeTab = signal<Tab>('signals')
  const copied = signal(false)

  const copy = async () => {
    await navigator.clipboard.writeText(CODE[activeTab.value]).catch(() => {})
    copied.set(true)
    setTimeout(() => copied.set(false), 2000)
  }

  return (
    <section class="py-[100px] bg-bg border-b border-border">
      <div class="container">
        <div class="max-w-[640px] mb-12">
          <div class="text-[11px] uppercase tracking-[0.12em] text-accent font-mono mb-4">API</div>
          <h2 class="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-tight mb-4">
            Write signals like variables,
            <br />
            <span class="text-muted">not reducers.</span>
          </h2>
          <p class="text-muted text-base leading-[1.7]">
            One import. No context providers. No dependency arrays. Full TypeScript inference out of the box.
          </p>
        </div>

        <div class="border border-border-2 rounded-2xl overflow-hidden shadow-[0_0_0_1px_var(--color-border),_0_20px_60px_rgba(0,0,0,0.4)]">
          {/* Tab bar */}
          <div class="flex items-center justify-between px-4 bg-surface-2 border-b border-border min-h-[46px]">
            <div class="flex gap-0.5">
              {TABS.map(t => (
                <button
                  class={() => `py-3 px-4 bg-transparent border-b-2 text-[13px] font-mono font-medium cursor-pointer transition-colors -mb-px ${activeTab.value === t.id ? 'text-accent border-accent' : 'text-muted border-transparent hover:text-text'}`}
                  onclick={() => activeTab.set(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-[12px] text-muted-2">
                {() => TABS.find(t => t.id === activeTab.value)?.file ?? ''}
              </span>
              <button class="bg-transparent border border-border-2 rounded-[5px] text-muted text-[12px] font-mono px-2.5 py-1 cursor-pointer transition-colors hover:text-text hover:border-accent" onclick={copy}>
                {() => copied.value ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Code panels */}
          <div class="bg-[var(--color-code-bg)]">
            <Show when={() => activeTab.value === 'signals'}>
              {() => <pre class="m-0 border-0 rounded-none px-8 py-7 text-[13.5px] leading-[1.75]"><code prop:innerHTML={highlight(CODE.signals)} /></pre> as unknown as Node}
            </Show>
            <Show when={() => activeTab.value === 'streams'}>
              {() => <pre class="m-0 border-0 rounded-none px-8 py-7 text-[13.5px] leading-[1.75]"><code prop:innerHTML={highlight(CODE.streams)} /></pre> as unknown as Node}
            </Show>
            <Show when={() => activeTab.value === 'jsx'}>
              {() => <pre class="m-0 border-0 rounded-none px-8 py-7 text-[13.5px] leading-[1.75]"><code prop:innerHTML={highlight(CODE.jsx)} /></pre> as unknown as Node}
            </Show>
          </div>
        </div>
      </div>
    </section>
  ) as unknown as Node
}
