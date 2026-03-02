import { DocSection, Code } from './DocSection'

export function PerformanceSection(): Node {
  return (
    <DocSection id="performance" title="Performance">
      <p class="text-muted mb-3 text-[0.95rem]">Streem's reactive system is pull-based and lazily evaluated. These four practices prevent the most costly mistakes in production Streem apps.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">computed() vs effect()</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Use <code>computed()</code> when you need a derived value. Use <code>effect()</code> for side effects only (DOM mutations, fetch calls, timers, logging).</p>
      <p class="text-muted mb-3 text-[0.95rem]"><code>computed()</code> is a lazy pull: it only recalculates when its dependencies change AND the value is read. If nobody reads it, it does no work. <code>effect()</code> always runs eagerly on every dependency change.</p>
      <Code>{`import { signal, computed, effect } from 'streeem'\n\nconst count = signal(0)\n\n// BAD — effect maintaining derived state:\n// Runs as a side effect, creates unnecessary intermediate storage,\n// and triggers extra re-runs in anything reading doubled.\nconst doubled = signal(0)\neffect(() => { doubled.set(count() * 2) })\n\n// GOOD — computed for derived values:\n// Lazy pull — zero overhead when not read. No extra storage.\nconst doubled = computed(() => count() * 2)\nconsole.log(doubled())  // reads and caches the value`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Rule of thumb: if you are writing to a signal inside an effect, consider whether <code>computed()</code> covers the use case instead.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Reactive leak prevention</h3>
      <p class="text-muted mb-3 text-[0.95rem]"><code>computed()</code> and <code>effect()</code> created outside an owner scope are never automatically disposed. In dev mode Streem warns: <code>[Streem] computed() created without an active owner scope. This computation will never be automatically disposed (disposal leak).</code></p>
      <Code>{`import { signal, computed, effect, createRoot } from 'streeem'\n\nconst count = signal(0)\n\n// PROBLEMATIC — created at module level, never disposed:\n// Dev warning fires. The computation lives forever.\nconst doubled = computed(() => count() * 2)\n\n// SAFE PATTERN A — inside a component (render() provides an automatic owner):\nfunction MyComponent() {\n  const doubled = computed(() => count() * 2)\n  return <p>{doubled}</p>\n}\n\n// SAFE PATTERN B — explicit root for module-level reactive work:\nconst root = createRoot(() => {\n  const doubled = computed(() => count() * 2)\n  effect(() => { document.title = String(doubled()) })\n})\n// Later when done:\nroot.dispose()`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Dev-mode warnings are stripped in production builds. Use them to catch leaks during development.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Cleanup patterns</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Three cleanup hooks cover the full lifecycle of reactive resources:</p>
      <p class="text-muted mb-3 text-[0.95rem]"><strong><code>onCleanup()</code> inside effect()</strong> — runs before the next effect re-run AND on dispose. Use for clearing timers or removing event listeners created inside the effect.</p>
      <Code>{`import { effect, onCleanup } from 'streeem'\n\neffect(() => {\n  const handler = (e: KeyboardEvent) => console.log(e.key)\n  window.addEventListener('keydown', handler)\n  onCleanup(() => window.removeEventListener('keydown', handler))\n})`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]"><strong><code>onMount()</code> returning a function</strong> — cleanup runs on component unmount. Use for one-time setup (timers, subscriptions) that should stop when the component leaves the DOM.</p>
      <Code>{`import { signal, onMount } from 'streeem'\n\nfunction LiveClock() {\n  const time = signal(new Date().toLocaleTimeString())\n\n  onMount(() => {\n    const id = setInterval(() => {\n      time.set(new Date().toLocaleTimeString())\n    }, 1000)\n    return () => clearInterval(id)  // fires on unmount\n  })\n\n  return <span>{time}</span>\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]"><strong><code>createRoot().dispose()</code></strong> — explicit teardown for long-lived reactive trees outside components. Call when the reactive tree should be permanently destroyed.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Signal granularity</h3>
      <p class="text-muted mb-3 text-[0.95rem]">How you structure signals determines how many subscribers re-run on each update.</p>
      <p class="text-muted mb-3 text-[0.95rem]"><strong>Fine-grained</strong> (separate signals per field): each subscriber only re-runs when its specific signal changes. Best for independent values that update at different rates.</p>
      <p class="text-muted mb-3 text-[0.95rem]"><strong>Coarse-grained</strong> (one signal holding an object): simpler for values that always update together. Any field change notifies all subscribers of that signal.</p>
      <Code>{`import { signal, computed } from 'streeem'\n\n// Fine-grained — subscribers only re-run when their signal changes:\n// priceLabel recomputes only when price changes, not when volume changes.\nconst price = signal(0)\nconst volume = signal(0)\nconst priceLabel = computed(() => \`$\${price().toFixed(2)}\`)\nconst volumeLabel = computed(() => \`\${volume().toLocaleString()} shares\`)\n\n// Coarse-grained — one update notifies all subscribers:\n// Any field change requires spreading the whole object.\nconst ticker = signal({ price: 0, volume: 0 })\nticker.set({ ...ticker.value, price: 42.5 })`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Rule of thumb: prefer fine-grained for values that update independently; prefer coarse-grained for values that always change together (forms, config objects).</p>
    </DocSection>
  ) as unknown as Node
}
