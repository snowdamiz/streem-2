import { Bench } from 'tinybench'
import { signal, computed, createRoot } from '@streem/core'
import { signal as preactSignal, computed as preactComputed } from '@preact/signals-core'
import { createSignal, createMemo, createRoot as solidRoot } from 'solid-js'

export const suiteName = 'computed re-evaluation'

export async function run() {
  const bench = new Bench({ warmupIterations: 1000, iterations: 5000 })

  bench.add('@streem/core computed', () => {
    createRoot((dispose) => {
      const s = signal(0)
      const c = computed(() => s() * 2)
      s.set(1)
      const v = c()
      dispose()
      return v
    })
  })

  bench.add('@preact/signals-core computed', () => {
    const s = preactSignal(0)
    const c = preactComputed(() => s.value * 2)
    s.value = 1
    return c.value
  })

  bench.add('solid-js createMemo', () => {
    solidRoot((dispose) => {
      const [get, set] = createSignal(0)
      const c = createMemo(() => get() * 2)
      set(1)
      const v = c()
      dispose()
      return v
    })
  })

  await bench.run()
  return { bench, name: suiteName }
}
