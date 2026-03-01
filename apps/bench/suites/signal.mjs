import { Bench } from 'tinybench'
import { signal, createRoot } from '@streem/core'
import { signal as preactSignal } from '@preact/signals-core'
import { createSignal, createRoot as solidRoot } from 'solid-js'

export const suiteName = 'signal read+write'

export async function run() {
  const bench = new Bench({ warmupIterations: 1000, iterations: 5000 })

  // @streem/core — with owner scope (matches real-world usage)
  bench.add('@streem/core signal (with createRoot)', () => {
    createRoot((dispose) => {
      const s = signal(0)
      s.set(1)
      const v = s()
      dispose()
      return v
    })
  })

  // @streem/core — primitive only, no owner scope (apples-to-apples with Preact)
  // Valid: signals work without createRoot in production builds (no owner warnings in prod)
  bench.add('@streem/core signal (primitive only)', () => {
    const s = signal(0)
    s.set(1)
    const v = s()
    return v
  })

  // Preact signals — no owner concept
  bench.add('@preact/signals-core signal', () => {
    const s = preactSignal(0)
    s.value = 1
    const v = s.value
    return v
  })

  // SolidJS — uses createRoot (same scope as @streem/core with-root variant)
  bench.add('solid-js createSignal', () => {
    solidRoot((dispose) => {
      const [get, set] = createSignal(0)
      set(1)
      const v = get()
      dispose()
      return v
    })
  })

  await bench.run()
  return { bench, name: suiteName }
}
