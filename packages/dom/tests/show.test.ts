import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot, effect } from '@streem/core'
import { Show } from '../src/components.js'

// ---------------------------------------------------------------------------
// Show component — conditional rendering with scope isolation
//
// Show returns a DocumentFragment. When the fragment is appended to a DOM
// parent, all nodes (initial children + anchor comment) move into the parent.
// After that, anchor.parentNode === parent for all future reactive updates.
// ---------------------------------------------------------------------------

describe('Show — static conditions', () => {
  it('renders children when when=true (static)', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const frag = Show({ when: true, children: document.createTextNode('hello') })
      container.appendChild(frag)
      dispose()
    })
    expect(container.textContent).toContain('hello')
  })

  it('renders nothing when when=false (no fallback)', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const frag = Show({ when: false, children: document.createTextNode('hello') })
      container.appendChild(frag)
      dispose()
    })
    expect(container.textContent).toBe('')
  })

  it('renders fallback when when=false', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const frag = Show({
        when: false,
        fallback: document.createTextNode('fallback content'),
        children: document.createTextNode('main content'),
      })
      container.appendChild(frag)
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
      const frag = Show({
        when: () => visible.value,
        fallback: document.createTextNode('fallback'),
        children: document.createTextNode('main'),
      })
      container.appendChild(frag)
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
      const frag = Show({
        when: () => visible.value,
        fallback: document.createTextNode('fallback'),
        children: document.createTextNode('main'),
      })
      container.appendChild(frag)
    })
    expect(container.textContent).toContain('fallback')

    visible.set(true)
    expect(container.textContent).toContain('main')
    expect(container.textContent).not.toContain('fallback')
    dispose()
  })

  it('anchor comment node is stable across swaps — container is not disrupted', () => {
    const visible = signal(true)
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const frag = Show({
        when: () => visible.value,
        fallback: document.createTextNode('fb'),
        children: document.createTextNode('ch'),
      })
      container.appendChild(frag)
    })
    // After multiple swaps, container remains intact
    visible.set(false)
    visible.set(true)
    // Container still has content correctly
    expect(container.textContent).toContain('ch')
    dispose()
  })

  it('does not render both children and fallback at the same time', () => {
    const visible = signal(true)
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const frag = Show({
        when: () => visible.value,
        fallback: document.createTextNode('FALLBACK'),
        children: document.createTextNode('MAIN'),
      })
      container.appendChild(frag)
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
  it('effects inside a children render function stop firing after Show hides', () => {
    const visible = signal(true)
    const counter = signal(0)
    const effectRunCount = vi.fn()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      // Pass children as a FUNCTION — Show creates it inside its own createRoot scope
      const frag = Show({
        when: () => visible.value,
        children: () => {
          // effect() created inside children render function — lives in Show's scope
          effect(() => {
            counter.value
            effectRunCount()
          })
          return document.createTextNode('child')
        },
      })
      container.appendChild(frag)
    })

    // Effect has run once (initial)
    expect(effectRunCount).toHaveBeenCalledTimes(1)

    counter.set(1)
    // Effect should re-run since Show is still visible
    expect(effectRunCount).toHaveBeenCalledTimes(2)

    // Now hide — Show disposes its child createRoot scope, stopping the effect
    visible.set(false)

    // Counter change should NOT trigger effect — child scope was disposed
    const countAfterHide = effectRunCount.mock.calls.length
    counter.set(2)
    expect(effectRunCount.mock.calls.length).toBe(countAfterHide)
    dispose()
  })

  it('re-shows create a fresh child scope — render function re-invoked', () => {
    const visible = signal(false)
    const container = document.createElement('div')
    let mountCount = 0
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = Show({
        when: () => visible.value,
        children: () => {
          mountCount++
          return document.createTextNode(`mount ${mountCount}`)
        },
      })
      container.appendChild(frag)
    })

    // Initially false — children render function not called
    expect(mountCount).toBe(0)
    expect(container.textContent).toBe('')

    // Show once
    visible.set(true)
    expect(mountCount).toBe(1)
    expect(container.textContent).toBe('mount 1')

    // Hide and re-show — fresh scope, render function called again
    visible.set(false)
    visible.set(true)
    expect(mountCount).toBe(2)
    expect(container.textContent).toBe('mount 2')
    dispose()
  })
})
