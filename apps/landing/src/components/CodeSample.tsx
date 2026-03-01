import { signal } from 'streem'
import styles from './CodeSample.module.css'

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
    <section class={[styles.codeSection, "py-20"]}>
      <div class="container">
        <div class={["section-label", "mb-3"]}>Zero config</div>
        <h2 class="section-title">Write signals like variables, not reducers</h2>
        <p class="section-sub">
          One import. No context providers. No dependency arrays. TypeScript out of the box.
        </p>
        <div class={styles.codeWrapper}>
          <div class={styles.codeHeader}>
            <span class={styles.codeFilename}>ticker.tsx</span>
            <button class={styles.copyBtn} onclick={copyCode}>
              {() => copied.value ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre class={styles.codeBlock}><code>{SAMPLE_CODE}</code></pre>
        </div>
      </div>
    </section>
  )
}
