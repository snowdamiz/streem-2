import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot } from '@streem/core'
import {
  bindTextNode,
  bindAttr,
  bindClass,
  bindClassList,
  bindStyle,
  bindEvent,
} from '../src/bindings.js'
import { h } from '../src/h.js'

// ---------------------------------------------------------------------------
// bindTextNode
// ---------------------------------------------------------------------------

describe('bindTextNode', () => {
  it('creates a text node with the initial value', () => {
    const count = signal(0)
    const parent = document.createElement('div')
    createRoot((dispose) => {
      bindTextNode(parent, () => String(count()))
      dispose()
    })
    expect(parent.childNodes.length).toBe(1)
    expect(parent.childNodes[0]).toBeInstanceOf(Text)
    expect(parent.childNodes[0].nodeValue).toBe('0')
  })

  it('updates only the nodeValue when the signal changes', () => {
    const msg = signal('hello')
    const parent = document.createElement('div')
    let textNode!: Text
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      textNode = bindTextNode(parent, () => msg())
    })
    expect(textNode.nodeValue).toBe('hello')

    msg.set('world')
    expect(textNode.nodeValue).toBe('world')
    // Only one child — no new nodes were added
    expect(parent.childNodes.length).toBe(1)
    expect(parent.childNodes[0]).toBe(textNode)
    dispose()
  })

  it('does NOT mutate parent innerHTML — only nodeValue changes', () => {
    const label = signal('a')
    const parent = document.createElement('div')
    let dispose!: () => void
    let textNode!: Text
    createRoot((d) => {
      dispose = d
      textNode = bindTextNode(parent, () => label())
    })
    const capturedNode = parent.childNodes[0]
    label.set('b')
    // The same node reference remains in the DOM
    expect(parent.childNodes[0]).toBe(capturedNode)
    expect(parent.childNodes[0].nodeValue).toBe('b')
    dispose()
  })
})

// ---------------------------------------------------------------------------
// bindAttr
// ---------------------------------------------------------------------------

describe('bindAttr', () => {
  it('sets an attribute from the initial accessor value', () => {
    const title = signal('hello')
    const el = document.createElement('div')
    createRoot((dispose) => {
      bindAttr(el, 'title', () => title())
      dispose()
    })
    expect(el.getAttribute('title')).toBe('hello')
  })

  it('updates the attribute when the signal changes', () => {
    const val = signal('foo')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindAttr(el, 'data-x', () => val())
    })
    expect(el.getAttribute('data-x')).toBe('foo')
    val.set('bar')
    expect(el.getAttribute('data-x')).toBe('bar')
    dispose()
  })

  it('removes attribute when accessor returns null', () => {
    const val = signal<string | null>('initial')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindAttr(el, 'data-x', () => val())
    })
    expect(el.hasAttribute('data-x')).toBe(true)
    val.set(null)
    expect(el.hasAttribute('data-x')).toBe(false)
    dispose()
  })

  it('removes attribute when accessor returns false', () => {
    const val = signal<string | boolean>('initial')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindAttr(el, 'disabled', () => val())
    })
    val.set(false)
    expect(el.hasAttribute('disabled')).toBe(false)
    dispose()
  })

  it('sets boolean attribute (attr=attr) when accessor returns true', () => {
    const val = signal<boolean>(false)
    const el = document.createElement('button')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindAttr(el, 'disabled', () => val())
    })
    val.set(true)
    expect(el.getAttribute('disabled')).toBe('disabled')
    dispose()
  })

  it('removes attribute when accessor returns undefined', () => {
    const val = signal<string | undefined>('initial')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindAttr(el, 'aria-label', () => val())
    })
    val.set(undefined)
    expect(el.hasAttribute('aria-label')).toBe(false)
    dispose()
  })
})

// ---------------------------------------------------------------------------
// bindClass
// ---------------------------------------------------------------------------

describe('bindClass', () => {
  it('sets el.className on initial render', () => {
    const cls = signal('active')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClass(el, () => cls())
    })
    expect(el.className).toBe('active')
    dispose()
  })

  it('updates el.className reactively', () => {
    const cls = signal('active')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClass(el, () => cls())
    })
    cls.set('active selected')
    expect(el.className).toBe('active selected')
    dispose()
  })

  it('handles empty string class', () => {
    const cls = signal('visible')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClass(el, () => cls())
    })
    cls.set('')
    expect(el.className).toBe('')
    dispose()
  })
})

// ---------------------------------------------------------------------------
// bindClassList
// ---------------------------------------------------------------------------

describe('bindClassList', () => {
  it('adds classes that are true, skips false ones', () => {
    const map = signal<Record<string, boolean>>({ active: true, hidden: false })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClassList(el, () => map())
    })
    expect(el.classList.contains('active')).toBe(true)
    expect(el.classList.contains('hidden')).toBe(false)
    dispose()
  })

  it('toggles classes when the map updates', () => {
    const map = signal<Record<string, boolean>>({ active: true, hidden: false })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClassList(el, () => map())
    })
    map.set({ active: false, hidden: true })
    expect(el.classList.contains('active')).toBe(false)
    expect(el.classList.contains('hidden')).toBe(true)
    dispose()
  })

  it('applies multiple true classes', () => {
    const map = signal<Record<string, boolean>>({ a: true, b: true, c: false })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindClassList(el, () => map())
    })
    expect(el.classList.contains('a')).toBe(true)
    expect(el.classList.contains('b')).toBe(true)
    expect(el.classList.contains('c')).toBe(false)
    dispose()
  })
})

// ---------------------------------------------------------------------------
// bindStyle
// ---------------------------------------------------------------------------

describe('bindStyle', () => {
  it('sets initial style properties', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ color: 'red' })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindStyle(el, () => style())
    })
    expect(el.style.color).toBe('red')
    dispose()
  })

  it('updates style reactively', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ color: 'red' })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindStyle(el, () => style())
    })
    style.set({ color: 'blue', fontSize: '16px' })
    expect(el.style.color).toBe('blue')
    expect(el.style.fontSize).toBe('16px')
    dispose()
  })

  it('handles multiple style properties at once', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({
      display: 'flex',
      alignItems: 'center',
    })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindStyle(el, () => style())
    })
    expect(el.style.display).toBe('flex')
    expect(el.style.alignItems).toBe('center')
    dispose()
  })
})

// ---------------------------------------------------------------------------
// bindEvent
// ---------------------------------------------------------------------------

describe('bindEvent', () => {
  it('fires the handler when the event occurs', () => {
    const el = document.createElement('button')
    const handler = vi.fn()
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindEvent(el, 'click', handler)
    })
    el.dispatchEvent(new Event('click'))
    expect(handler).toHaveBeenCalledOnce()
    dispose()
  })

  it('removes the listener when the owner disposes', () => {
    const el = document.createElement('button')
    const handler = vi.fn()
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      bindEvent(el, 'click', handler)
    })
    dispose()
    el.dispatchEvent(new Event('click'))
    expect(handler).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// applyProps dispatch — reactive bindings via typeof value === 'function'
// ---------------------------------------------------------------------------

describe('applyProps reactive dispatch (h.ts)', () => {
  it('function child in JSX becomes a reactive text node', () => {
    const text = signal('initial')
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('span', null, () => text()) as HTMLElement
    })
    expect(el.textContent).toBe('initial')
    text.set('updated')
    expect(el.textContent).toBe('updated')
    expect(el.childNodes.length).toBe(1)
    dispose()
  })

  it('function prop routes to bindAttr', () => {
    const title = signal('hello')
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { title: () => title() }) as HTMLElement
    })
    expect(el.getAttribute('title')).toBe('hello')
    title.set('world')
    expect(el.getAttribute('title')).toBe('world')
    dispose()
  })

  it('class with function accessor routes to bindClass', () => {
    const cls = signal('active')
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { class: () => cls() }) as HTMLElement
    })
    expect(el.className).toBe('active')
    cls.set('inactive')
    expect(el.className).toBe('inactive')
    dispose()
  })

  it('class with static string sets className directly', () => {
    const el = h('div', { class: 'static-class' }) as HTMLElement
    expect(el.className).toBe('static-class')
  })

  it('classList accessor routes to bindClassList', () => {
    const map = signal<Record<string, boolean>>({ active: true })
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { classList: () => map() }) as HTMLElement
    })
    expect(el.classList.contains('active')).toBe(true)
    map.set({ active: false, hidden: true })
    expect(el.classList.contains('active')).toBe(false)
    expect(el.classList.contains('hidden')).toBe(true)
    dispose()
  })

  it('style with function accessor routes to bindStyle', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ color: 'red' })
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { style: () => style() }) as HTMLElement
    })
    expect(el.style.color).toBe('red')
    style.set({ color: 'green' })
    expect(el.style.color).toBe('green')
    dispose()
  })

  it('DOM mutation is surgical — only nodeValue changes, no new nodes created', () => {
    // Verify surgical update: signal change modifies nodeValue only,
    // no new nodes are added to the parent (no childList mutations).
    const text = signal('v1')
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('span', null, () => text()) as HTMLElement
    })
    // Capture the initial text node reference
    const initialChildCount = el.childNodes.length
    const initialTextNode = el.childNodes[0]
    expect(initialChildCount).toBe(1)
    expect(initialTextNode.nodeValue).toBe('v1')

    text.set('v2')

    // Same number of children — no new nodes created
    expect(el.childNodes.length).toBe(1)
    // Same node reference — nodeValue was updated in-place
    expect(el.childNodes[0]).toBe(initialTextNode)
    expect(el.childNodes[0].nodeValue).toBe('v2')
    dispose()
  })
})
