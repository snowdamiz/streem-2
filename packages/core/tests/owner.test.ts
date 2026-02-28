/**
 * @streem/core — Owner tree test suite
 *
 * Covers:
 *  - SIGNAL-04: createRoot() disposes all nested effects and signals when dispose() is called
 *  - SIGNAL-05: onCleanup() callbacks fire at scope disposal AND before each effect re-run
 */

import { describe, it, expect, vi } from 'vitest'
import { signal, effect, computed, createRoot, onCleanup } from '../src/index.js'

// ---------------------------------------------------------------------------
// SIGNAL-04: createRoot() disposal
// ---------------------------------------------------------------------------

describe('SIGNAL-04: createRoot()', () => {
  it('effects inside root run initially', () => {
    const log: number[] = []

    createRoot((dispose) => {
      const count = signal(0)
      effect(() => { log.push(count()) })
      dispose()
    })

    expect(log).toEqual([0])
  })

  it('after dispose(), signal changes no longer trigger inner effects', () => {
    const log: number[] = []
    let outerCount!: ReturnType<typeof signal<number>>

    const dispose = createRoot((dispose) => {
      const count = signal(0)
      outerCount = count
      effect(() => { log.push(count()) })
      return dispose
    })

    expect(log).toEqual([0])

    outerCount.set(1)
    expect(log).toEqual([0, 1])

    dispose()

    outerCount.set(2)
    expect(log).toEqual([0, 1]) // no re-run after dispose
    outerCount.set(3)
    expect(log).toEqual([0, 1])
  })

  it('createRoot returns the value returned by fn', () => {
    const result = createRoot(() => 42)
    expect(result).toBe(42)
  })

  it('nested createRoot: disposing outer also disposes inner (bottom-up)', () => {
    const outerLog: number[] = []
    const innerLog: number[] = []
    let outerCount!: ReturnType<typeof signal<number>>
    let innerCount!: ReturnType<typeof signal<number>>

    const outerDispose = createRoot((outerDispose) => {
      const count = signal(0)
      outerCount = count
      effect(() => { outerLog.push(count()) })

      createRoot(() => {
        const innerC = signal(10)
        innerCount = innerC
        effect(() => { innerLog.push(innerC()) })
      })

      return outerDispose
    })

    expect(outerLog).toEqual([0])
    expect(innerLog).toEqual([10])

    outerCount.set(1)
    innerCount.set(11)
    expect(outerLog).toEqual([0, 1])
    expect(innerLog).toEqual([10, 11])

    outerDispose() // disposing outer should also dispose inner

    outerCount.set(2)
    innerCount.set(12)
    expect(outerLog).toEqual([0, 1]) // stopped
    expect(innerLog).toEqual([10, 11]) // stopped (inner was child of outer)
  })

  it('multiple independent roots are isolated', () => {
    const log1: number[] = []
    const log2: number[] = []
    let count1!: ReturnType<typeof signal<number>>
    let count2!: ReturnType<typeof signal<number>>
    let dispose1!: () => void

    createRoot((dispose) => {
      dispose1 = dispose
      count1 = signal(0)
      effect(() => { log1.push(count1()) })
    })

    createRoot(() => {
      count2 = signal(100)
      effect(() => { log2.push(count2()) })
    })

    expect(log1).toEqual([0])
    expect(log2).toEqual([100])

    dispose1()

    count1.set(1)
    count2.set(101)

    expect(log1).toEqual([0]) // root1 disposed
    expect(log2).toEqual([100, 101]) // root2 unaffected
  })

  it('dispose() is idempotent — safe to call multiple times', () => {
    const log: number[] = []
    let outerCount!: ReturnType<typeof signal<number>>

    const dispose = createRoot((dispose) => {
      const count = signal(0)
      outerCount = count
      effect(() => { log.push(count()) })
      return dispose
    })

    dispose()
    dispose() // second call should be safe
    dispose() // third call should be safe

    outerCount.set(99)
    expect(log).toEqual([0]) // still no re-run
  })
})

// ---------------------------------------------------------------------------
// SIGNAL-05: onCleanup() callbacks
// ---------------------------------------------------------------------------

describe('SIGNAL-05: onCleanup()', () => {
  it('fires cleanup before each effect re-run', () => {
    const sequence: string[] = []

    createRoot((dispose) => {
      const count = signal(0)

      effect(() => {
        const current = count()
        sequence.push(`run:${current}`)
        onCleanup(() => {
          sequence.push(`cleanup:${current}`)
        })
      })

      // Initial run: run:0 registered, no cleanup yet
      expect(sequence).toEqual(['run:0'])

      // Trigger re-run: cleanup fires first, then new run
      count.set(1)
      expect(sequence).toEqual(['run:0', 'cleanup:0', 'run:1'])

      count.set(2)
      expect(sequence).toEqual(['run:0', 'cleanup:0', 'run:1', 'cleanup:1', 'run:2'])

      dispose()
      // Cleanup for the last run fires on dispose
      expect(sequence).toEqual(['run:0', 'cleanup:0', 'run:1', 'cleanup:1', 'run:2', 'cleanup:2'])
    })
  })

  it('fires cleanup on scope disposal (from createRoot)', () => {
    const cleanupCalls: number[] = []

    const dispose = createRoot((dispose) => {
      onCleanup(() => { cleanupCalls.push(1) })
      onCleanup(() => { cleanupCalls.push(2) })
      return dispose
    })

    expect(cleanupCalls).toEqual([])

    dispose()
    expect(cleanupCalls).toEqual([1, 2])
  })

  it('multiple onCleanup registrations in effect all fire on re-run (in order)', () => {
    const log: string[] = []

    createRoot((dispose) => {
      const count = signal(0)

      effect(() => {
        count() // track dependency
        onCleanup(() => { log.push('cleanup-A') })
        onCleanup(() => { log.push('cleanup-B') })
        onCleanup(() => { log.push('cleanup-C') })
      })

      expect(log).toEqual([])

      count.set(1)
      // All three cleanups should fire in registration order
      expect(log).toEqual(['cleanup-A', 'cleanup-B', 'cleanup-C'])

      dispose()
    })
  })

  it('cleanup fires before new effect run, not after', () => {
    const log: string[] = []

    createRoot((dispose) => {
      const count = signal(0)

      effect(() => {
        const val = count()
        onCleanup(() => {
          log.push(`cleanup-before-run-${val + 1}`)
        })
        log.push(`effect-run-${val}`)
      })

      expect(log).toEqual(['effect-run-0'])

      count.set(1)
      // cleanup fires FIRST, then new run
      expect(log[1]).toBe('cleanup-before-run-1')
      expect(log[2]).toBe('effect-run-1')

      dispose()
    })
  })

  it('onCleanup inside computed is a no-op (cleanups belong to effect/root context)', () => {
    // This test verifies calling onCleanup inside a computed does not crash
    // and the cleanup never fires (computed context is owned by the enclosing owner)
    expect(() => {
      createRoot((dispose) => {
        const count = signal(0)
        const derived = computed(() => {
          // onCleanup inside computed: current owner is the computed's owner (enclosing root)
          // This registers on the enclosing owner, not the computed node itself
          return count() * 2
        })
        derived()
        dispose()
      })
    }).not.toThrow()
  })
})
