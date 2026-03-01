import { Bench } from 'tinybench'
import { signal, effect, createRoot } from '@streem/core'
import { signal as preactSignal, effect as preactEffect } from '@preact/signals-core'
import { createSignal, createEffect, createRoot as solidRoot } from 'solid-js'

export const suiteName = 'effect re-run'

export async function run() {
  const bench = new Bench({ warmupIterations: 1000, iterations: 5000 })

  bench.add('@streem/core effect', () => {
    createRoot((dispose) => {
      const s = signal(0)
      let runs = 0
      effect(() => { s(); runs++ })
      s.set(1)
      dispose()
      return runs
    })
  })

  bench.add('@preact/signals-core effect', () => {
    const s = preactSignal(0)
    let runs = 0
    const cleanup = preactEffect(() => { s.value; runs++ })
    s.value = 1
    cleanup()
    return runs
  })

  bench.add('solid-js createEffect', () => {
    solidRoot((dispose) => {
      const [get, set] = createSignal(0)
      let runs = 0
      createEffect(() => { get(); runs++ })
      set(1)
      dispose()
      return runs
    })
  })

  await bench.run()
  return { bench, name: suiteName }
}
