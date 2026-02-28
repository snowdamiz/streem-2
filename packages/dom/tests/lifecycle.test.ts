import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot } from '@streem/core'
import { onMount } from '../src/components.js'

// ---------------------------------------------------------------------------
// onMount() — lifecycle callback that runs once after component mounts
// ---------------------------------------------------------------------------

describe('onMount', () => {
  it('calls the callback exactly once on mount', () => {
    const fn = vi.fn()
    createRoot((dispose) => {
      onMount(fn)
      dispose()
    })
    expect(fn).toHaveBeenCalledOnce()
  })

  it('callback fires synchronously during the createRoot scope', () => {
    let called = false
    createRoot((dispose) => {
      onMount(() => {
        called = true
      })
      expect(called).toBe(true)
      dispose()
    })
  })

  it('cleanup return value fires when owner disposes', () => {
    const cleanup = vi.fn()
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      onMount(() => cleanup)
    })
    expect(cleanup).not.toHaveBeenCalled()
    dispose()
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('two onMount calls in same component both fire once each', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    createRoot((dispose) => {
      onMount(fn1)
      onMount(fn2)
      dispose()
    })
    expect(fn1).toHaveBeenCalledOnce()
    expect(fn2).toHaveBeenCalledOnce()
  })

  it('signal read inside onMount is a snapshot (no reactive update)', () => {
    const count = signal(0)
    let capturedValue = -1
    createRoot((dispose) => {
      onMount(() => {
        capturedValue = count()
      })
      count.set(99)
      // onMount runs once — capturedValue should not update to 99
      dispose()
    })
    expect(capturedValue).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// COMP-02 — Component function body runs exactly once
// ---------------------------------------------------------------------------

describe('COMP-02: component runs once', () => {
  it('component function is called exactly once regardless of signal changes', () => {
    const count = signal(0)
    let callCount = 0

    function TestComponent(_props: Record<string, unknown>) {
      callCount++
      // Direct signal read in body = snapshot, does not subscribe
      const _snapshot = count()
      return document.createTextNode('')
    }

    createRoot((dispose) => {
      TestComponent({})
      count.set(1)
      count.set(2)
      count.set(3)
      dispose()
    })

    expect(callCount).toBe(1)
  })

  it('signal read directly in component body captures a snapshot', () => {
    const name = signal('Alice')
    let capturedName = ''

    function NameComponent(_props: Record<string, unknown>) {
      capturedName = name() // snapshot — not reactive
      return document.createTextNode(capturedName)
    }

    createRoot((dispose) => {
      NameComponent({})
      // After component ran, name is still 'Alice'
      expect(capturedName).toBe('Alice')
      // Changing signal does NOT re-run component
      name.set('Bob')
      expect(capturedName).toBe('Alice') // still the snapshot
      dispose()
    })
  })
})
