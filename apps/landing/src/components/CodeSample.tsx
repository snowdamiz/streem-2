import { signal } from 'streem'

const SAMPLE_CODE = `import { signal, computed, effect } from 'streem'
import { fromWebSocket, batch } from 'streem'

// Signals — fine-grained reactive state
const price = signal(0)
const trend = computed(() => price() > 100 ? '📈' : '📉')

// Stream — auto-closes when component unmounts
const [feed] = fromWebSocket('wss://prices.example.com')

effect(() => {
  batch(() => {
    price.set(feed()?.price ?? 0)
  })
})

// In TSX — only the text nodes update, not the component
export function PriceTicker() {
  return (
    <div>
      <span>{trend}</span>
      <span>$\{() => price().toFixed(2)}</span>
    </div>
  )
}`

export function CodeSample() {
  const copied = signal(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(SAMPLE_CODE)
    copied.set(true)
    setTimeout(() => copied.set(false), 2000)
  }

  return (
    <section class="code-section">
      <div class="container">
        <div class="section-label">Zero config</div>
        <h2 class="section-title">Write signals like variables, not reducers</h2>
        <p class="section-sub">
          One import. No context providers. No dependency arrays. TypeScript out of the box.
        </p>
        <div class="code-wrapper">
          <div class="code-header">
            <span class="code-filename">ticker.tsx</span>
            <button class="copy-btn" onclick={copyCode}>
              {() => copied() ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre class="code-block"><code>{SAMPLE_CODE}</code></pre>
        </div>
      </div>

      <style>{`
        .code-section { background: var(--color-surface); }
        .section-sub {
          color: var(--color-muted);
          margin-bottom: 32px;
          max-width: 560px;
        }
        .code-wrapper {
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
        }
        .code-filename {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-muted);
        }
        .copy-btn {
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          color: var(--color-text);
          font-size: 12px;
          padding: 3px 10px;
          cursor: pointer;
          font-family: var(--font-mono);
        }
        .copy-btn:hover { border-color: var(--color-accent); }
        .code-block {
          border: none;
          border-radius: 0;
          padding: 24px;
          font-size: 13px;
          max-height: 400px;
          overflow-y: auto;
        }
      `}</style>
    </section>
  )
}
