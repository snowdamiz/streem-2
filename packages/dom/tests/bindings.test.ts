import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot } from '@streem/core'
import {
  bindTextNode,
  bindAttr,
  bindClass,
  bindStyle,
  bindEvent,
} from '../src/bindings.js'
import { h } from '../src/h.js'
import type { ClassValue } from '../src/types.js'

// ---------------------------------------------------------------------------
// bindTextNode
// ---------------------------------------------------------------------------

describe('bindTextNode', () => {
  it('creates a text node with the initial value', () => {
    const count = signal(0)
    const parent = document.createElement('div')
    createRoot((dispose) => {
      bindTextNode(parent, () => String(count.value))
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
      textNode = bindTextNode(parent, () => msg.value)
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
      textNode = bindTextNode(parent, () => label.value)
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
      bindAttr(el, 'title', () => title.value)
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
      bindAttr(el, 'data-x', () => val.value)
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
      bindAttr(el, 'data-x', () => val.value)
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
      bindAttr(el, 'disabled', () => val.value)
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
      bindAttr(el, 'disabled', () => val.value)
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
      bindAttr(el, 'aria-label', () => val.value)
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
  it('sets class from a plain string', () => {
    const cls = signal<ClassValue>('active')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    expect(el.className).toBe('active')
    dispose()
  })

  it('updates class reactively', () => {
    const cls = signal<ClassValue>('active')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    cls.set('active selected')
    expect(el.className).toBe('active selected')
    dispose()
  })

  it('resolves array of strings, skipping falsy values', () => {
    const cls = signal<ClassValue>(['btn', false, null, undefined, '', 'primary'])
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    expect(el.className).toBe('btn primary')
    dispose()
  })

  it('resolves Record<string, boolean> — truthy keys only', () => {
    const cls = signal<ClassValue>({ active: true, disabled: false, selected: true })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    expect(el.classList.contains('active')).toBe(true)
    expect(el.classList.contains('disabled')).toBe(false)
    expect(el.classList.contains('selected')).toBe(true)
    dispose()
  })

  it('resolves mixed array (strings + objects + falsy)', () => {
    const isPrimary = signal(true)
    const cls = () => ['btn', { 'btn-primary': isPrimary.value, 'btn-disabled': false }, false] as ClassValue
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, cls) })
    expect(el.classList.contains('btn')).toBe(true)
    expect(el.classList.contains('btn-primary')).toBe(true)
    expect(el.classList.contains('btn-disabled')).toBe(false)
    isPrimary.set(false)
    expect(el.classList.contains('btn-primary')).toBe(false)
    dispose()
  })

  it('handles empty string class', () => {
    const cls = signal<ClassValue>('visible')
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    cls.set('')
    expect(el.className).toBe('')
    dispose()
  })

  it('handles null/undefined/false ClassValue', () => {
    const cls = signal<ClassValue>(null)
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindClass(el, () => cls.value) })
    expect(el.className).toBe('')
    dispose()
  })
})

// bindClassList removed — classList prop removed in Phase 11 (use class with object syntax)

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
      bindStyle(el, () => style.value)
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
      bindStyle(el, () => style.value)
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
      bindStyle(el, () => style.value)
    })
    expect(el.style.display).toBe('flex')
    expect(el.style.alignItems).toBe('center')
    dispose()
  })

  it('clears properties removed in a reactive update', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ color: 'red', fontSize: '16px' })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindStyle(el, () => style.value) })
    expect(el.style.color).toBe('red')
    expect(el.style.fontSize).toBe('16px')
    // Remove fontSize from the style object
    style.set({ color: 'blue' })
    expect(el.style.color).toBe('blue')
    expect(el.style.fontSize).toBe('')  // cleared by removeProperty
    dispose()
  })

  it('handles full style object replacement without stale properties', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ display: 'flex', gap: '8px', alignItems: 'center' })
    const el = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => { dispose = d; bindStyle(el, () => style.value) })
    style.set({ display: 'block' })
    expect(el.style.display).toBe('block')
    expect(el.style.gap).toBe('')
    expect(el.style.alignItems).toBe('')
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
      el = h('span', null, () => text.value) as HTMLElement
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
      el = h('div', { title: () => title.value }) as HTMLElement
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
      el = h('div', { class: () => cls.value }) as HTMLElement
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

  it('className prop works identically to class prop', () => {
    const el = h('div', { className: 'foo bar' }) as HTMLElement
    expect(el.className).toBe('foo bar')
  })

  it('class with object value resolves truthy keys', () => {
    const el = h('div', { class: { active: true, disabled: false } }) as HTMLElement
    expect(el.classList.contains('active')).toBe(true)
    expect(el.classList.contains('disabled')).toBe(false)
  })

  it('class with array resolves to joined string, skipping falsy', () => {
    const el = h('div', { class: ['btn', false, 'primary'] }) as HTMLElement
    expect(el.className).toBe('btn primary')
  })

  it('reactive className with accessor resolves ClassValue', () => {
    const active = signal(true)
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { className: () => ({ active: active.value, disabled: false }) as ClassValue }) as HTMLElement
    })
    expect(el.classList.contains('active')).toBe(true)
    active.set(false)
    expect(el.classList.contains('active')).toBe(false)
    dispose()
  })

  it('style with function accessor routes to bindStyle', () => {
    const style = signal<Partial<CSSStyleDeclaration>>({ color: 'red' })
    let dispose!: () => void
    let el!: HTMLElement
    createRoot((d) => {
      dispose = d
      el = h('div', { style: () => style.value }) as HTMLElement
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
      el = h('span', null, () => text.value) as HTMLElement
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
