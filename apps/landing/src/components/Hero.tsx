import { signal, computed, onMount } from 'streeem'
import '@shoelace-style/shoelace/dist/components/badge/badge.js'
import '@streeem/lit'
import styles from './Hero.module.css'

export function Hero(): Node {
  // Live reactive counter demo — shows signals updating DOM in real time
  const count = signal(0)
  const doubled = computed(() => count.value * 2)

  // Auto-increment to demonstrate reactivity to visitors
  onMount(() => {
    const id = setInterval(() => count.set(count.value + 1), 800)
    return () => clearInterval(id)
  })

  return (
    <header class={[styles.hero, "py-24 text-center"]}>
      <div class="container">
        <div class={[styles.heroBadge, "mb-4"]}>
          <sl-badge prop:variant="neutral" prop:pill={true}>v0.1.0</sl-badge>
        </div>
        <h1 class={[styles.heroHeadline, "mb-5"]}>
          Build reactive UIs that update in microseconds
        </h1>
        <p class={[styles.heroSub, "mb-12"]}>
          Streem brings fine-grained signals and real-time streams to the browser —
          no virtual DOM, no dependency arrays, no magic. Just TypeScript.
        </p>
        {/* Live demo: reactive counter showing signal + computed */}
        <div class={styles.heroDemo}>
          <div class={styles.demoLabel}>Live signal demo</div>
          <div class={styles.demoValues}>
            <div class={styles.demoCell}>
              <div class={styles.demoValue}>{count}</div>
              <div class={styles.demoCaption}>count()</div>
            </div>
            <div class={styles.demoCell}>
              <div class={[styles.demoValue, styles.accent]}>{doubled}</div>
              <div class={styles.demoCaption}>computed(() =&gt; count() * 2)</div>
            </div>
          </div>
        </div>
        <div class={styles.heroInstall}>
          <code class={styles.installCmd}>npm create @streeem@latest</code>
        </div>
      </div>
    </header>
  ) as unknown as Node
}
