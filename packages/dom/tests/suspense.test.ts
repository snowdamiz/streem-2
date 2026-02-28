import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from '@streem/core'
import { Suspense, ErrorBoundary } from '../src/components.js'

// ---------------------------------------------------------------------------
// Suspense — async pending state with thrown-Promise protocol
//
// Suspense catches thrown Promises from children. While the Promise is pending,
// it shows the fallback. When the Promise resolves, it retries rendering the
// children. When the Promise rejects, it logs via console.error (Phase 2 scope;
// full async ErrorBoundary propagation is Phase 3).
//
// Non-Promise errors inside Suspense children propagate up (re-thrown) so that
// parent ErrorBoundary components can catch them.
//
// NOTE: Suspense uses queueMicrotask for initial render (after anchor is in DOM).
// Tests that check DOM state after initial render must flush microtasks first:
//   await new Promise(resolve => queueMicrotask(resolve))
// ---------------------------------------------------------------------------

/** Flush all queued microtasks */
const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve))

describe('Suspense — happy path (no thrown Promise)', () => {
  it('returns an anchor node immediately (Suspense always returns anchor)', () => {
    let node: unknown
    createRoot((dispose) => {
      node = Suspense({
        fallback: document.createTextNode('loading...'),
        children: document.createTextNode('content'),
      })
      dispose()
    })
    // Suspense returns a Comment anchor
    expect(node).toBeInstanceOf(Comment)
  })

  it('renders children into DOM when no Promise is thrown (after microtask flush)', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('loading...'),
        children: document.createTextNode('rendered content'),
      })
      container.appendChild(anchor)
    })

    // Suspense uses queueMicrotask for initial render
    await flushMicrotasks()

    expect(container.textContent).toContain('rendered content')
    expect(container.textContent).not.toContain('loading...')
    dispose()
  })

  it('renders children from a function when no Promise is thrown', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('loading...'),
        children: () => document.createTextNode('function children'),
      })
      container.appendChild(anchor)
    })

    await flushMicrotasks()

    expect(container.textContent).toContain('function children')
    expect(container.textContent).not.toContain('loading...')
    dispose()
  })

  it('does NOT show fallback when no Promise is thrown', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('SHOULD NOT APPEAR'),
        children: document.createTextNode('ok'),
      })
      container.appendChild(anchor)
    })

    await flushMicrotasks()

    expect(container.textContent).not.toContain('SHOULD NOT APPEAR')
    dispose()
  })
})

describe('Suspense — pending state (child throws Promise)', () => {
  it('shows fallback immediately while Promise is pending', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let resolveIt!: () => void
    const pendingPromise = new Promise<void>((resolve) => {
      resolveIt = resolve
    })

    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('loading...'),
        children: () => {
          throw pendingPromise
        },
      })
      container.appendChild(anchor)
    })

    await flushMicrotasks()

    expect(container.textContent).toContain('loading...')
    expect(container.textContent).not.toContain('ready')
    dispose()
  })

  it('shows fallback from a function while Promise is pending', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    const pendingPromise = new Promise<void>(() => {})

    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: () => document.createTextNode('function fallback'),
        children: () => {
          throw pendingPromise
        },
      })
      container.appendChild(anchor)
    })

    await flushMicrotasks()

    expect(container.textContent).toContain('function fallback')
    dispose()
  })

  it('replaces fallback with children when Promise resolves', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    let resolveIt!: () => void
    let shouldThrow = true
    const pendingPromise = new Promise<void>((resolve) => {
      resolveIt = resolve
    })

    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('loading...'),
        children: () => {
          if (shouldThrow) {
            throw pendingPromise
          }
          return document.createTextNode('resolved content')
        },
      })
      container.appendChild(anchor)
    })

    // Initial state: pending
    await flushMicrotasks()
    expect(container.textContent).toContain('loading...')

    // Resolve the promise — children will stop throwing on retry
    shouldThrow = false
    resolveIt()

    // Wait for Promise microtasks + Suspense retry microtask
    await pendingPromise
    await flushMicrotasks()

    expect(container.textContent).toContain('resolved content')
    expect(container.textContent).not.toContain('loading...')
    dispose()
  })
})

describe('Suspense — rejected Promise (Phase 2: console.error)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('calls console.error when child Promise rejects (Phase 2 behavior)', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    let rejectIt!: (err: Error) => void
    const rejectingPromise = new Promise<void>((_resolve, reject) => {
      rejectIt = reject
    })

    createRoot((d) => {
      dispose = d
      const anchor = Suspense({
        fallback: document.createTextNode('loading...'),
        children: () => {
          throw rejectingPromise
        },
      })
      container.appendChild(anchor)
    })

    await flushMicrotasks()

    const rejectionError = new Error('resource failed')
    rejectIt(rejectionError)

    // Wait for rejection to process
    await rejectingPromise.catch(() => {})
    await flushMicrotasks()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Suspense'),
      rejectionError,
    )
    dispose()
  })

  it('does NOT call ErrorBoundary fallback for rejected Promises (Phase 2 scope)', async () => {
    // Full async propagation from Suspense rejection to ErrorBoundary is Phase 3.
    // In Phase 2, rejected Promises only trigger console.error.
    const container = document.createElement('div')
    let dispose!: () => void
    const fallbackCalled = vi.fn()
    let rejectIt!: (err: Error) => void
    const rejectingPromise = new Promise<void>((_resolve, reject) => {
      rejectIt = reject
    })

    createRoot((d) => {
      dispose = d
      const anchor = ErrorBoundary({
        fallback: (_err, _reset) => {
          fallbackCalled()
          return document.createTextNode('error fallback')
        },
        children: () =>
          Suspense({
            fallback: document.createTextNode('loading...'),
            children: () => {
              throw rejectingPromise
            },
          }) as unknown as Node,
      })
      container.appendChild(anchor as Node)
    })

    await flushMicrotasks()
    rejectIt(new Error('async failure'))
    await rejectingPromise.catch(() => {})
    await flushMicrotasks()

    // Phase 2: ErrorBoundary fallback should NOT be shown for async rejection
    expect(fallbackCalled).not.toHaveBeenCalled()
    dispose()
  })
})

describe('Suspense — non-Promise error propagation', () => {
  it('re-throws non-Promise errors (so ErrorBoundary above can catch them)', () => {
    // Suspense only catches Promises. Regular Errors propagate up.
    expect(() => {
      createRoot((dispose) => {
        try {
          const anchor = Suspense({
            fallback: document.createTextNode('loading...'),
            children: () => {
              throw new Error('synchronous render error')
            },
          })
          // Append so microtask runs (but error should propagate before that)
          const container = document.createElement('div')
          container.appendChild(anchor)
        } finally {
          dispose()
        }
      })
    }).toThrow('synchronous render error')
  })

  it('ErrorBoundary catches synchronous errors re-thrown by Suspense', async () => {
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const node = ErrorBoundary({
        fallback: (err, _reset) => {
          const msg = err instanceof Error ? err.message : String(err)
          return document.createTextNode(`Caught: ${msg}`)
        },
        children: () =>
          Suspense({
            fallback: document.createTextNode('loading...'),
            children: () => {
              throw new Error('sync error in child')
            },
          }) as unknown as Node,
      })
      container.appendChild(node as Node)
    })

    // Non-Promise error goes through synchronously before microtask
    expect(container.textContent).toContain('Caught: sync error in child')
    expect(container.textContent).not.toContain('loading...')
    dispose()
  })
})

describe('ErrorBoundary + Suspense integration', () => {
  it('Promise thrown inside Suspense is handled by Suspense, not ErrorBoundary', async () => {
    const container = document.createElement('div')
    let dispose!: () => void
    const errorFallbackCalled = vi.fn()
    let resolveIt!: () => void
    let shouldThrow = true
    const pendingPromise = new Promise<void>((resolve) => {
      resolveIt = resolve
    })

    createRoot((d) => {
      dispose = d
      const node = ErrorBoundary({
        fallback: (_err, _reset) => {
          errorFallbackCalled()
          return document.createTextNode('error boundary fallback')
        },
        children: () =>
          Suspense({
            fallback: document.createTextNode('suspense loading...'),
            children: () => {
              if (shouldThrow) throw pendingPromise
              return document.createTextNode('done')
            },
          }) as unknown as Node,
      })
      container.appendChild(node as Node)
    })

    await flushMicrotasks()

    // Suspense handles the Promise — ErrorBoundary should NOT be triggered
    expect(errorFallbackCalled).not.toHaveBeenCalled()
    expect(container.textContent).toContain('suspense loading...')

    // Resolve
    shouldThrow = false
    resolveIt()
    await pendingPromise
    await flushMicrotasks()

    expect(container.textContent).toContain('done')
    expect(errorFallbackCalled).not.toHaveBeenCalled()
    dispose()
  })

  it('Error thrown in Suspense child propagates to ErrorBoundary (not caught by Suspense)', () => {
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const node = ErrorBoundary({
        fallback: (err, _reset) => {
          const msg = err instanceof Error ? err.message : String(err)
          return document.createTextNode(`EB: ${msg}`)
        },
        children: () =>
          Suspense({
            fallback: document.createTextNode('loading...'),
            children: () => {
              throw new Error('hard error')
            },
          }) as unknown as Node,
      })
      container.appendChild(node as Node)
      dispose()
    })

    expect(container.textContent).toContain('EB: hard error')
    expect(container.textContent).not.toContain('loading...')
  })
})
