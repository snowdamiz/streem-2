import { describe, it, expect, vi } from 'vitest'
import { signal, createRoot, effect } from '@streem/core'
import { For } from '../src/components.js'

type Item = { id: number; name: string }

// ---------------------------------------------------------------------------
// For component — keyed list rendering with reconciliation
//
// For returns a DocumentFragment. When appended to a DOM parent, all nodes
// (initial items + anchor comment) move into the parent. After that,
// anchor.parentNode === parent for reactive updates (insertBefore anchor).
// ---------------------------------------------------------------------------

describe('For — initial render', () => {
  it('renders all items in order', () => {
    const items = signal<Item[]>([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Carol' },
    ])
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
    })
    expect(container.textContent).toBe('AliceBobCarol')
    dispose()
  })

  it('renders empty list (no items)', () => {
    const items = signal<Item[]>([])
    const container = document.createElement('div')
    let dispose!: () => void
    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
    })
    expect(container.textContent).toBe('')
    dispose()
  })

  it('renders with static array (non-function each)', () => {
    const container = document.createElement('div')
    createRoot((dispose) => {
      const frag = For({
        each: [{ id: 1, name: 'X' }, { id: 2, name: 'Y' }],
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
      dispose()
    })
    expect(container.textContent).toBe('XY')
  })
})

describe('For — adding items', () => {
  it('adding a new item creates only that item DOM', () => {
    const items = signal<Item[]>([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    const renderCounts = new Map<number, number>()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => {
          renderCounts.set(item.id, (renderCounts.get(item.id) ?? 0) + 1)
          return document.createTextNode(item.name)
        },
      })
      container.appendChild(frag)
    })

    // Initially rendered items 1 and 2 once each
    expect(renderCounts.get(1)).toBe(1)
    expect(renderCounts.get(2)).toBe(1)

    // Add item 3
    items.set([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }])

    // Item 3 rendered once; items 1 and 2 NOT re-rendered
    expect(renderCounts.get(1)).toBe(1)
    expect(renderCounts.get(2)).toBe(1)
    expect(renderCounts.get(3)).toBe(1)
    expect(container.textContent).toBe('ABC')
    dispose()
  })
})

describe('For — removing items', () => {
  it('removing an item removes its DOM and disposes its scope', () => {
    const items = signal<Item[]>([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ])
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
    })

    expect(container.textContent).toBe('ABC')

    // Remove B
    items.set([{ id: 1, name: 'A' }, { id: 3, name: 'C' }])
    expect(container.textContent).toBe('AC')
    dispose()
  })

  it("removed item's effects stop firing after removal", () => {
    const items = signal<Item[]>([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    const counter = signal(0)
    const effectCallsForItem2 = vi.fn()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => {
          if (item.id === 2) {
            effect(() => {
              counter()
              effectCallsForItem2()
            })
          }
          return document.createTextNode(item.name)
        },
      })
      container.appendChild(frag)
    })

    // Effect ran once (initial)
    expect(effectCallsForItem2).toHaveBeenCalledTimes(1)

    // Update counter while item 2 still exists
    counter.set(1)
    expect(effectCallsForItem2).toHaveBeenCalledTimes(2)

    // Remove item 2
    items.set([{ id: 1, name: 'A' }])

    // Counter change should NOT trigger effect for removed item
    const countAtRemoval = effectCallsForItem2.mock.calls.length
    counter.set(2)
    expect(effectCallsForItem2.mock.calls.length).toBe(countAtRemoval)
    dispose()
  })
})

describe('For — reordering items', () => {
  it('reorders DOM nodes to match new array order without recreating them', () => {
    const items = signal<Item[]>([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ])
    const renderCounts = new Map<number, number>()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => {
          renderCounts.set(item.id, (renderCounts.get(item.id) ?? 0) + 1)
          return document.createTextNode(item.name)
        },
      })
      container.appendChild(frag)
    })

    expect(container.textContent).toBe('ABC')

    // Reorder: C, A, B
    items.set([
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])

    // DOM should match new order
    expect(container.textContent).toBe('CAB')

    // No item was recreated — all render counts still at 1
    expect(renderCounts.get(1)).toBe(1)
    expect(renderCounts.get(2)).toBe(1)
    expect(renderCounts.get(3)).toBe(1)
    dispose()
  })

  it('index getter returns updated index after reorder', () => {
    const items = signal<Item[]>([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ])
    const indexGetters = new Map<number, () => number>()
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, index) => {
          indexGetters.set(item.id, index)
          return document.createTextNode(item.name)
        },
      })
      container.appendChild(frag)
    })

    // Initial indices
    expect(indexGetters.get(1)!()).toBe(0)
    expect(indexGetters.get(2)!()).toBe(1)
    expect(indexGetters.get(3)!()).toBe(2)

    // Reorder: [B, C, A] → ids [2, 3, 1]
    items.set([
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
    ])

    // Index getters should reflect new positions
    expect(indexGetters.get(2)!()).toBe(0) // B is now index 0
    expect(indexGetters.get(3)!()).toBe(1) // C is now index 1
    expect(indexGetters.get(1)!()).toBe(2) // A is now index 2
    dispose()
  })
})

describe('For — edge cases', () => {
  it('clears all items when list becomes empty', () => {
    const items = signal<Item[]>([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
    })

    expect(container.textContent).toBe('AB')
    items.set([])
    expect(container.textContent).toBe('')
    dispose()
  })

  it('handles mixed add + remove + reorder in one update', () => {
    const items = signal<Item[]>([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ])
    const container = document.createElement('div')
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      const frag = For({
        each: () => items(),
        key: (item) => item.id,
        children: (item, _index) => document.createTextNode(item.name),
      })
      container.appendChild(frag)
    })

    expect(container.textContent).toBe('ABC')

    // Remove B (id=2), add D (id=4), reorder remaining: [C, A, D]
    items.set([
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
      { id: 4, name: 'D' },
    ])

    expect(container.textContent).toBe('CAD')
    dispose()
  })
})
