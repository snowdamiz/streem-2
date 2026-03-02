/**
 * @streeem/core — Signal primitives test suite
 *
 * Covers:
 *  - SIGNAL-01: signal() creates a typed reactive signal readable/writable from plain TypeScript
 *  - SIGNAL-02: computed() auto-updates without manual dependency arrays
 *  - SIGNAL-03: effect() auto-tracks dependencies without dependency arrays
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signal, computed, effect, createRoot, onCleanup } from '../src/index.js'

// ---------------------------------------------------------------------------
// SIGNAL-01: signal() basic read/write
// ---------------------------------------------------------------------------

describe('SIGNAL-01: signal()', () => {
  it('returns the initial value when called', () => {
    const count = createRoot(() => signal(0))
    expect(count.value).toBe(0)
  })

  it('returns updated value after set()', () => {
    const count = createRoot(() => signal(0))
    count.set(5)
    expect(count.value).toBe(5)
  })

  it('holds any initial value type', () => {
    const name = createRoot(() => signal('hello'))
    expect(name.value).toBe('hello')

    const flag = createRoot(() => signal(true))
    expect(flag.value).toBe(true)

    const obj = createRoot(() => signal({ x: 1 }))
    expect(obj.value).toEqual({ x: 1 })
  })

  it('successive set() calls update the value', () => {
    const count = createRoot(() => signal(0))
    count.set(1)
    count.set(2)
    count.set(3)
    expect(count.value).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// SIGNAL-02: computed() auto-updates
// ---------------------------------------------------------------------------

describe('SIGNAL-02: computed()', () => {
  it('returns derived value based on signal', () => {
    createRoot(() => {
      const count = signal(0)
      const doubled = computed(() => count.value * 2)
      expect(doubled()).toBe(0)
    })
  })

  it('returns updated value after dependency changes', () => {
    createRoot(() => {
      const count = signal(0)
      const doubled = computed(() => count.value * 2)
      count.set(5)
      expect(doubled()).toBe(10)
    })
  })

  it('is lazy: does not recompute until read', () => {
    createRoot(() => {
      let callCount = 0
      const count = signal(0)
      const derived = computed(() => {
        callCount++
        return count.value * 2
      })

      // Not called until first read
      expect(callCount).toBe(0)
      derived() // first read triggers evaluation
      expect(callCount).toBe(1)

      // After dependency change, does not recompute until next read
      count.set(3)
      expect(callCount).toBe(1) // still not recomputed
      derived() // read triggers re-evaluation
      expect(callCount).toBe(2)
    })
  })

  it('returns cached value when dependency has not changed', () => {
    createRoot(() => {
      let callCount = 0
      const count = signal(0)
      const derived = computed(() => {
        callCount++
        return count.value * 2
      })

      derived() // first read
      expect(callCount).toBe(1)

      derived() // second read — same value, no recompute
      expect(callCount).toBe(1)
    })
  })

  it('handles diamond dependency: A -> B, A -> C, B+C -> D evaluates D once per A change', () => {
    createRoot(() => {
      const a = signal(1)
      const b = computed(() => a.value * 2)
      const c = computed(() => a.value * 3)

      let evalCount = 0
      const d = computed(() => {
        evalCount++
        return b() + c()
      })

      // First read evaluates all
      expect(d()).toBe(1 * 2 + 1 * 3) // 5
      const firstEvalCount = evalCount

      // Change a, then read d once — d should not evaluate more than once
      a.set(2)
      expect(d()).toBe(2 * 2 + 2 * 3) // 10
      // d evaluated at most once per a change (pull-based avoids double-eval)
      expect(evalCount - firstEvalCount).toBe(1)
    })
  })

  it('composes multiple computed values', () => {
    createRoot(() => {
      const x = signal(2)
      const doubled = computed(() => x.value * 2)
      const quadrupled = computed(() => doubled() * 2)

      expect(quadrupled()).toBe(8)
      x.set(3)
      expect(quadrupled()).toBe(12)
    })
  })
})

// ---------------------------------------------------------------------------
// SIGNAL-03: effect() auto-tracks dependencies
// ---------------------------------------------------------------------------

describe('SIGNAL-03: effect()', () => {
  it('runs immediately on creation', () => {
    createRoot(() => {
      const count = signal(0)
      const log: number[] = []

      effect(() => {
        log.push(count.value)
      })

      expect(log).toEqual([0])
    })
  })

  it('re-runs when dependency changes', () => {
    createRoot(() => {
      const count = signal(0)
      const log: number[] = []

      effect(() => {
        log.push(count.value)
      })

      count.set(1)
      expect(log).toEqual([0, 1])
    })
  })

  it('does NOT re-run when set to same value (Object.is equality)', () => {
    createRoot(() => {
      const count = signal(0)
      const log: number[] = []

      effect(() => {
        log.push(count.value)
      })

      expect(log).toEqual([0])
      count.set(0) // same value — should not re-run
      expect(log).toEqual([0])

      count.set(1) // different value — should re-run
      expect(log).toEqual([0, 1])
      count.set(1) // same value again — should not re-run
      expect(log).toEqual([0, 1])
    })
  })

  it('handles conditional reads — subscribes/unsubscribes dynamically', () => {
    createRoot(() => {
      const count = signal(0)
      const name = signal('alice')
      const log: string[] = []

      effect(() => {
        if (count.value > 0) {
          log.push(`count:${count.value} name:${name.value}`)
        } else {
          log.push(`count:0`)
        }
      })

      // Initial run: count is 0, reads count but not name
      expect(log).toEqual(['count:0'])

      // Changing name when count=0 should NOT trigger effect
      name.set('bob')
      expect(log).toEqual(['count:0'])

      // count goes 0 -> 1: effect now reads name too
      count.set(1)
      expect(log).toEqual(['count:0', 'count:1 name:bob'])

      // name change now DOES trigger effect (count > 0)
      name.set('carol')
      expect(log).toEqual(['count:0', 'count:1 name:bob', 'count:1 name:carol'])

      // count goes 1 -> 0: effect should unsubscribe from name
      count.set(0)
      expect(log).toEqual(['count:0', 'count:1 name:bob', 'count:1 name:carol', 'count:0'])

      // name change when count=0 should NOT trigger effect (stale dep cleanup)
      name.set('dave')
      expect(log).toEqual(['count:0', 'count:1 name:bob', 'count:1 name:carol', 'count:0'])
    })
  })

  it('dispose() stops the effect from re-running', () => {
    createRoot(() => {
      const count = signal(0)
      const log: number[] = []

      const dispose = effect(() => {
        log.push(count.value)
      })

      expect(log).toEqual([0])

      count.set(1)
      expect(log).toEqual([0, 1])

      dispose()

      count.set(2)
      expect(log).toEqual([0, 1]) // no more re-runs after dispose
      count.set(3)
      expect(log).toEqual([0, 1])
    })
  })

  it('multiple independent effects all track their own dependencies', () => {
    createRoot(() => {
      const a = signal(1)
      const b = signal(10)
      const logA: number[] = []
      const logB: number[] = []

      effect(() => { logA.push(a.value) })
      effect(() => { logB.push(b.value) })

      expect(logA).toEqual([1])
      expect(logB).toEqual([10])

      a.set(2)
      expect(logA).toEqual([1, 2])
      expect(logB).toEqual([10]) // b effect not triggered

      b.set(20)
      expect(logA).toEqual([1, 2]) // a effect not triggered
      expect(logB).toEqual([10, 20])
    })
  })
})
