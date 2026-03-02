import { DocSection, Code } from './DocSection'

export function SignalsSection(): Node {
  return (
    <DocSection id="signals" title="Signals">
      <p class="text-muted mb-3 text-[0.95rem]"><code>signal()</code> creates a reactive value. Read it by calling it as a function; write with <code>.set()</code>.</p>
      <Code>{`import { signal, computed, effect, createRoot, onCleanup } from 'streeem'\n\n// Create a signal\nconst count = signal(0)\n\n// Read\nconsole.log(count())  // 0\n\n// Write\ncount.set(1)\ncount.set(count() + 1)  // read then write\n\n// Computed — auto-tracks dependencies\nconst doubled = computed(() => count() * 2)\n\n// Effect — re-runs when dependencies change\nconst dispose = effect(() => {\n  console.log('count changed:', count())\n})\n\n// Cleanup\ndispose()\n\n// Scoped reactive root\nconst root = createRoot(() => {\n  effect(() => { /* ... */ })\n  onCleanup(() => console.log('cleaning up'))\n})\nroot.dispose()  // fires onCleanup callbacks`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Batch multiple signal writes so downstream effects run only once:</p>
      <Code>{`import { signal, effect, batch } from 'streeem'\n\nconst x = signal(0)\nconst y = signal(0)\n\neffect(() => console.log(x(), y()))\n\n// Without batch: effect fires twice\nx.set(1)\ny.set(1)\n\n// With batch: effect fires once\nbatch(() => {\n  x.set(2)\n  y.set(2)\n})`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">TypeScript tip: use <code>signal&lt;string | null&gt;(null)</code> for optional values. The computed type is inferred automatically.</p>
      <p class="text-muted mb-3 text-[0.95rem]">For a full TypeScript reference covering signal types, computed types, and JSX config, see the <a href="#typescript" class="text-blue-400 no-underline hover:underline">TypeScript guide</a>.</p>
      <p class="text-muted mb-3 text-[0.95rem]">For performance best practices — when to use computed vs effect, how to prevent leaks, and signal granularity — see the <a href="#performance" class="text-blue-400 no-underline hover:underline">Performance guide</a>.</p>
    </DocSection>
  ) as unknown as Node
}
