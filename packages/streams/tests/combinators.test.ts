import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, signal, effect } from '@streem/core'
import { batch, throttle, debounce } from '../src/combinators.js'

describe('batch()', () => {
  it('flushes all queued effects exactly once after the batch (STREAM-05)', () => {
    const s = signal(0)
    let runCount = 0

    const dispose = createRoot((d) => {
      effect(() => {
        s() // track
        runCount++
      })
      return d
    })

    // Initial effect run counts as 1
    expect(runCount).toBe(1)

    // 200 writes in a batch → effects flush only once after endBatch()
    batch(() => {
      for (let i = 0; i < 200; i++) {
        s.set(i)
      }
    })

    // Only 1 additional run (the flush), not 200
    expect(runCount).toBe(2)
    dispose()
  })

  it('propagates the final value after 200 batched writes (STREAM-05)', () => {
    const s = signal(0)
    batch(() => {
      for (let i = 0; i < 200; i++) {
        s.set(i + 1)
      }
    })
    // createRoot just to read safely
    let val: number | undefined
    const dispose = createRoot((d) => {
      effect(() => { val = s() })
      return d
    })
    expect(val).toBe(200)
    dispose()
  })

  it('batches multiple different signals in one flush (STREAM-05)', () => {
    const a = signal(0)
    const b = signal(0)
    let runCount = 0

    const dispose = createRoot((d) => {
      effect(() => {
        a(); b()
        runCount++
      })
      return d
    })

    expect(runCount).toBe(1)

    batch(() => {
      a.set(1)
      b.set(2)
    })

    // Only 1 additional run despite 2 signal writes
    expect(runCount).toBe(2)
    dispose()
  })

  it('re-throws errors thrown inside the batch fn (STREAM-05)', () => {
    const s = signal(0)
    expect(() =>
      batch(() => {
        s.set(1)
        throw new Error('batch error')
      })
    ).toThrow('batch error')
  })
})

describe('throttle()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('emits the first value immediately (STREAM-06)', () => {
    const s = signal(0)
    let out: any

    const dispose = createRoot((d) => {
      const throttled = throttle(s, 100)
      effect(() => { out = throttled() })
      return d
    })

    expect(out).toBe(0)
    dispose()
  })

  it('suppresses intermediate values within the interval (STREAM-06)', () => {
    const s = signal(0)
    const emitted: number[] = []

    const dispose = createRoot((d) => {
      const throttled = throttle(s, 100)
      effect(() => { emitted.push(throttled()) })
      return d
    })

    emitted.length = 0 // reset after initial

    s.set(1) // within interval — leading edge already emitted
    s.set(2) // within interval — suppressed
    s.set(3) // within interval — suppressed

    expect(emitted.length).toBe(0) // none passed through yet
    dispose()
  })

  it('passes a value after interval elapses (STREAM-06)', () => {
    const s = signal(0)
    let out: number | undefined

    const dispose = createRoot((d) => {
      const throttled = throttle(s, 100)
      effect(() => { out = throttled() })
      return d
    })

    // Advance past interval
    vi.advanceTimersByTime(200)
    s.set(99)

    expect(out).toBe(99)
    dispose()
  })
})

describe('debounce()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not update output until delay expires (STREAM-06)', () => {
    const s = signal(0)
    let out: number | undefined

    const dispose = createRoot((d) => {
      const debounced = debounce(s, 100)
      effect(() => { out = debounced() })
      return d
    })

    expect(out).toBe(0) // initial value

    s.set(1)
    expect(out).toBe(0) // not yet — timer not expired

    vi.advanceTimersByTime(50)
    s.set(2) // reset timer

    vi.advanceTimersByTime(50)
    expect(out).toBe(0) // still not — reset extended the wait

    vi.advanceTimersByTime(60) // now 110ms since last set
    expect(out).toBe(2) // debounced value finally emits

    dispose()
  })

  it('emits the most recent value after silence (STREAM-06)', () => {
    const s = signal('a')
    let out: string | undefined

    const dispose = createRoot((d) => {
      const debounced = debounce(s, 100)
      effect(() => { out = debounced() })
      return d
    })

    s.set('b')
    s.set('c')
    s.set('d')
    vi.advanceTimersByTime(200)

    expect(out).toBe('d')
    dispose()
  })

  it('clears pending timer on scope disposal (STREAM-06)', () => {
    const s = signal(0)
    const dispose = createRoot((d) => {
      const _debounced = debounce(s, 100)
      return d
    })
    s.set(1)
    // Dispose before timer fires — should not throw
    expect(() => dispose()).not.toThrow()
  })
})
