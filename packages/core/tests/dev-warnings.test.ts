/**
 * @streeem/core — Dev-mode warning test suite
 *
 * Covers:
 *  - DX-02: console.warn fires when signal read outside reactive tracking context
 *  - DX-03: console.warn fires when effect() or computed() created without active owner scope
 *
 * Note: Vitest sets import.meta.env.DEV = true automatically when NODE_ENV !== 'production'.
 * Dev warnings use `if (import.meta.env.DEV)` guards inline in signal.ts.
 *
 * Warning messages (from signal.ts):
 *  - DX-02 named:   '[Streem] Signal "name" read outside reactive context. This is likely a snapshot.'
 *  - DX-02 anon:    '[Streem] Signal read outside reactive context. This is likely a snapshot.'
 *  - DX-03 effect:  '[Streem] effect() created without an active owner scope. This effect will never be automatically disposed (disposal leak).'
 *  - DX-03 computed:'[Streem] computed() created without an active owner scope. This computation will never be automatically disposed (disposal leak).'
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signal, computed, effect, createRoot } from '../src/index.js'

// ---------------------------------------------------------------------------
// Shared spy setup
// ---------------------------------------------------------------------------

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
})

// ---------------------------------------------------------------------------
// DX-02: signal read outside reactive context
// ---------------------------------------------------------------------------

describe('DX-02: signal read outside reactive context', () => {
  it('warns when named signal is read at module top-level (no owner, no subscriber)', () => {
    const count = signal(0, { name: 'count' })

    // Read outside any reactive context
    count.value

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(
      '[Streem] Signal "count" read outside reactive context. This is likely a snapshot.',
    )
  })

  it('warns when anonymous signal is read outside reactive context', () => {
    const count = signal(0)

    count.value

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(
      '[Streem] Signal read outside reactive context. This is likely a snapshot.',
    )
  })

  it('does NOT warn when signal is read inside effect (active subscriber)', () => {
    createRoot(() => {
      const count = signal(0)

      effect(() => {
        count.value // inside effect — tracked subscriber, no warning
      })

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  it('does NOT warn when signal is read inside computed', () => {
    createRoot(() => {
      const count = signal(0)
      const doubled = computed(() => count.value * 2) // inside computed — no warning

      doubled() // trigger evaluation

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  it('does NOT warn when signal is read inside createRoot (active owner)', () => {
    createRoot(() => {
      const count = signal(0)
      count.value // reading inside createRoot — owner is active, no warning
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns once per read call (not once per signal)', () => {
    const a = signal(0, { name: 'a' })
    const b = signal(0, { name: 'b' })

    a.value
    b.value

    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('does not emit DX-02 warning when setting (not reading) outside context', () => {
    const count = signal(0)

    // set() never warns — only reading triggers DX-02
    count.set(5)

    expect(warnSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// DX-03: effect() / computed() created without active owner scope
// ---------------------------------------------------------------------------

describe('DX-03: computed() or effect() without owner scope', () => {
  it('warns when effect() is called at module top-level (no owner)', () => {
    const dispose = effect(() => {})
    dispose() // clean up

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(
      '[Streem] effect() created without an active owner scope. ' +
      'This effect will never be automatically disposed (disposal leak).',
    )
  })

  it('warns when computed() is called at module top-level (no owner)', () => {
    const c = computed(() => 1)
    c() // trigger evaluation

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(
      '[Streem] computed() created without an active owner scope. ' +
      'This computation will never be automatically disposed (disposal leak).',
    )
  })

  it('does NOT warn when effect() is created inside createRoot', () => {
    createRoot(() => {
      effect(() => {})
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('does NOT warn when computed() is created inside createRoot', () => {
    createRoot(() => {
      computed(() => 1)()
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns once per out-of-scope effect() call', () => {
    const d1 = effect(() => {})
    const d2 = effect(() => {})
    d1()
    d2()

    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('DX-03 warning is separate from DX-02: effect warning does not trigger signal warning', () => {
    // effect with no signals — only DX-03, not DX-02
    const dispose = effect(() => {
      // reads nothing — no DX-02
    })
    dispose()

    expect(warnSpy).toHaveBeenCalledOnce()
    const call = warnSpy.mock.calls[0][0] as string
    expect(call).toContain('effect() created without an active owner scope')
    expect(call).not.toContain('Signal')
  })
})
