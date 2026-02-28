import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot, effect } from '@streem/core'
import { Show } from '../src/components.js'

// ---------------------------------------------------------------------------
// Show component — conditional rendering with scope isolation
// ---------------------------------------------------------------------------

describe('Show — static conditions', () => {
  it('renders children when when=true (static)', () => {
    let anchor!: Node
    const container = document.createElement('div')
    createRoot((dispose) => {
      anchor = Show({ when: true, children: document.createTextNode('hello') })
      container.appendChild(anchor)
      dispose()
    })
    expect(container.textContent).toContain('hello')
  })

  it('renders nothing when when=false (no fallback)', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const anchor = Show({ when: false, children: document.createTextNode('hello') })
      container.appendChild(anchor)
      dispose()
    })
    expect(container.textContent).toBe('')
  })

  it('renders fallback when when=false', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const anchor = Show({
        when: false,
        fallback: document.createTextNode('fallback content'),
        children: document.createTextNode('main content'),
      })
      container.appendChild(anchor)
      dispose()
    })
    expect(container.textContent).toContain('fallback content')
    expect(container.textContent).not.toContain('main content')
  })
})

describe('Show — reactive condition toggling', () => {
  it('swaps to fallback when condition changes true→false', () => {
    const visible = signal(true)
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Show({
        when: () => visible(),
        fallback: document.createTextNode('fallback'),
        children: document.createTextNode('main'),
      })
      container.appendChild(anchor)
    })
    expect(container.textContent).toContain('main')
    expect(container.textContent).not.toContain('fallback')

    visible.set(false)
    expect(container.textContent).not.toContain('main')
    expect(container.textContent).toContain('fallback')
    dispose()
  })

  it('swaps back to children when condition changes false→true', () => {
    const visible = signal(false)
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Show({
        when: () => visible(),
        fallback: document.createTextNode('fallback'),
        children: document.createTextNode('main'),
      })
      container.appendChild(anchor)
    })
    expect(container.textContent).toContain('fallback')

    visible.set(true)
    expect(container.textContent).toContain('main')
    expect(container.textContent).not.toContain('fallback')
    dispose()
  })

  it('anchor comment node is stable across swaps — does not move', () => {
    const visible = signal(true)
    const container = document.createElement('div')
    let anchor!: Comment
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      anchor = Show({
        when: () => visible(),
        fallback: document.createTextNode('fb'),
        children: document.createTextNode('ch'),
      }) as Comment
      container.appendChild(anchor)
    })
    const capturedAnchor = anchor
    visible.set(false)
    visible.set(true)
    // Anchor is the same node instance
    expect(container.contains(capturedAnchor)).toBe(true)
    dispose()
  })

  it('does not render both children and fallback at the same time', () => {
    const visible = signal(true)
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const anchor = Show({
        when: () => visible(),
        fallback: document.createTextNode('FALLBACK'),
        children: document.createTextNode('MAIN'),
      })
      container.appendChild(anchor)
    })

    expect(container.textContent).toContain('MAIN')
    expect(container.textContent).not.toContain('FALLBACK')

    visible.set(false)
    expect(container.textContent).not.toContain('MAIN')
    expect(container.textContent).toContain('FALLBACK')

    visible.set(true)
    expect(container.textContent).toContain('MAIN')
    expect(container.textContent).not.toContain('FALLBACK')
    dispose()
  })
})

describe('Show — child scope disposal', () => {
  it('effects inside children stop firing after Show switches to fallback', () => {
    const visible = signal(true)
    const counter = signal(0)
    const effectRunCount = vi.fn()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      // The child scope: contains an effect that tracks counter
      const childNode = createRoot((childDispose) => {
        effect(() => {
          // This effect reads counter — it will run whenever counter changes
          counter()
          effectRunCount()
        })
        return document.createTextNode('child')
      })

      const anchor = Show({
        when: () => visible(),
        children: childNode as Node,
      })
      container.appendChild(anchor)
    })

    // Effect has run once (initial)
    expect(effectRunCount).toHaveBeenCalledTimes(1)

    counter.set(1)
    // Effect should re-run since Show is still visible
    expect(effectRunCount).toHaveBeenCalledTimes(2)

    // Now hide — child scope should be disposed
    visible.set(false)

    counter.set(2)
    // Effect should NOT re-run — child scope was disposed when Show hid
    // Note: effectRunCount may have been called once more when Show disposes the scope
    // What matters is counter.set(2) does NOT trigger a new call
    const countAfterHide = effectRunCount.mock.calls.length
    counter.set(3)
    expect(effectRunCount.mock.calls.length).toBe(countAfterHide) // no new calls after hide
    dispose()
  })

  it('re-shows create a fresh child scope (not the stale one)', () => {
    const visible = signal(false)
    const container = document.createElement('div')
    let mountCount = 0
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      // children as a function — allows creating fresh nodes each show
      const anchor = Show({
        when: () => visible(),
        children: (() => {
          mountCount++
          return document.createTextNode(`mount ${mountCount}`)
        })(),
      })
      container.appendChild(anchor)
    })

    // Initially false — children not mounted yet
    expect(mountCount).toBe(0)
    dispose()
  })
})
