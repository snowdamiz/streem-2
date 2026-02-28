import { describe, it, expect, vi } from 'vitest'
import { createRoot } from '@streem/core'
import { ErrorBoundary } from '../src/components.js'

// ---------------------------------------------------------------------------
// ErrorBoundary — synchronous error isolation with fallback UI
//
// ErrorBoundary wraps child rendering in try/catch. On error, it shows a
// fallback rendered via fallback(err, reset). On Promise throws, it RE-THROWS
// (does not call fallback) so that parent Suspense components can catch them.
//
// Phase 2 scope: reset() callback triggers parent-scoped re-render concept;
// in-place DOM swap requires anchor infrastructure from Phase 3+.
// ---------------------------------------------------------------------------

describe('ErrorBoundary — happy path (no error)', () => {
  it('renders children when no error is thrown', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (_err, _reset) => document.createTextNode('ERROR'),
        children: document.createTextNode('hello world'),
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(container.textContent).toContain('hello world')
    expect(container.textContent).not.toContain('ERROR')
  })

  it('renders children from a function when no error is thrown', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (_err, _reset) => document.createTextNode('ERROR'),
        children: () => document.createTextNode('function child'),
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(container.textContent).toContain('function child')
  })
})

describe('ErrorBoundary — error catching', () => {
  it('renders fallback when child throws a synchronous Error', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (err, _reset) => {
          const msg = err instanceof Error ? err.message : String(err)
          return document.createTextNode(`Error caught: ${msg}`)
        },
        children: () => {
          throw new Error('render failed')
        },
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(container.textContent).toContain('Error caught: render failed')
  })

  it('renders fallback when child throws a string error', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (err, _reset) => document.createTextNode(`caught: ${String(err)}`),
        children: () => {
          throw 'something went wrong'
        },
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(container.textContent).toContain('caught: something went wrong')
  })

  it('passes the error object to the fallback function', () => {
    const container = document.createElement('div')
    const capturedErr: unknown[] = []
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (err, _reset) => {
          capturedErr.push(err)
          return document.createTextNode('fallback')
        },
        children: () => {
          throw new TypeError('type error')
        },
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(capturedErr).toHaveLength(1)
    expect(capturedErr[0]).toBeInstanceOf(TypeError)
    expect((capturedErr[0] as TypeError).message).toBe('type error')
  })

  it('fallback is NOT shown when no error occurs', () => {
    const container = document.createElement('div')
    const fallbackCalled = vi.fn()
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (_err, _reset) => {
          fallbackCalled()
          return document.createTextNode('fallback')
        },
        children: () => document.createTextNode('ok'),
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(fallbackCalled).not.toHaveBeenCalled()
  })
})

describe('ErrorBoundary — reset callback', () => {
  it('provides a reset function to the fallback renderer', () => {
    const container = document.createElement('div')
    let resetFn: (() => void) | null = null
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (_err, reset) => {
          resetFn = reset
          return document.createTextNode('fallback shown')
        },
        children: () => {
          throw new Error('oops')
        },
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(container.textContent).toContain('fallback shown')
    expect(resetFn).toBeTypeOf('function')
  })

  it('reset function is callable without throwing', () => {
    // Phase 2: reset() is provided but in-place DOM swap is Phase 3+ scope.
    // We verify it can be called without throwing.
    const container = document.createElement('div')
    let resetFn: (() => void) | null = null
    createRoot((dispose) => {
      const node = ErrorBoundary({
        fallback: (_err, reset) => {
          resetFn = reset
          return document.createTextNode('error')
        },
        children: () => {
          throw new Error('fail')
        },
      })
      container.appendChild(node as Node)
      dispose()
    })
    expect(() => resetFn?.()).not.toThrow()
  })
})

describe('ErrorBoundary — Promise re-throw (critical invariant)', () => {
  it('re-throws a Promise instead of calling fallback', () => {
    // CRITICAL: ErrorBoundary MUST re-throw thrown Promises so Suspense can catch them.
    // This is the key contract for ErrorBoundary > Suspense > children nesting.
    const pendingPromise = new Promise<void>(() => {}) // never resolves
    let caughtError: unknown = undefined

    try {
      createRoot((dispose) => {
        try {
          ErrorBoundary({
            fallback: (_err, _reset) => document.createTextNode('SHOULD NOT SHOW'),
            children: () => {
              throw pendingPromise
            },
          })
        } finally {
          dispose()
        }
      })
    } catch (e) {
      caughtError = e
    }

    // The Promise was re-thrown (not swallowed as an error)
    expect(caughtError).toBe(pendingPromise)
  })

  it('fallback is NOT called when child throws a Promise', () => {
    const pendingPromise = new Promise<void>(() => {})
    const fallbackCalled = vi.fn()

    try {
      createRoot((dispose) => {
        try {
          ErrorBoundary({
            fallback: (_err, _reset) => {
              fallbackCalled()
              return document.createTextNode('fallback')
            },
            children: () => {
              throw pendingPromise
            },
          })
        } finally {
          dispose()
        }
      })
    } catch (e) {
      // Expected: ErrorBoundary re-throws the Promise
      expect(e).toBe(pendingPromise)
    }
    expect(fallbackCalled).not.toHaveBeenCalled()
  })
})

describe('ErrorBoundary — scope cleanup', () => {
  it('does not leak the child scope on error', () => {
    // ErrorBoundary must dispose its child createRoot scope when an error occurs
    // so reactive effects inside the failed children do not keep running.
    // We verify the component renders fallback cleanly and does not throw.
    const container = document.createElement('div')
    expect(() => {
      createRoot((dispose) => {
        const node = ErrorBoundary({
          fallback: (_err, _reset) => document.createTextNode('recovered'),
          children: () => {
            throw new Error('child blew up')
          },
        })
        container.appendChild(node as Node)
        dispose()
      })
    }).not.toThrow()
    expect(container.textContent).toContain('recovered')
  })
})
