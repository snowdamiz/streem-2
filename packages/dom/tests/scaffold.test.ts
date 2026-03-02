import { describe, it, expect } from 'vitest'
import { h, Fragment, render, For } from '../src/index.js'
import { signal } from '@streem/core'

describe('@streem/dom scaffold', () => {
  it('h() creates a DOM element', () => {
    const el = h('div', { id: 'test' }) as HTMLElement
    expect(el).toBeInstanceOf(HTMLElement)
    expect(el.tagName).toBe('DIV')
    expect(el.id).toBe('test')
  })

  it('h() with string children creates text nodes', () => {
    const el = h('p', null, 'Hello world') as HTMLElement
    expect(el.textContent).toBe('Hello world')
  })

  it('h() with function component calls it once and returns DOM', () => {
    let callCount = 0
    const MyComp = (props: { name: string }) => {
      callCount++
      return h('span', null, props.name)
    }
    const node = h(MyComp as unknown as (props: Record<string, unknown>) => Node, { name: 'Alice' })
    expect(callCount).toBe(1)
    expect((node as HTMLElement).textContent).toBe('Alice')
  })

  it('Fragment returns array of nodes', () => {
    const nodes = h(Fragment, null, h('span', null, 'a'), h('span', null, 'b')) as Node[]
    expect(Array.isArray(nodes)).toBe(true)
    expect(nodes).toHaveLength(2)
  })

  it('render() mounts component into container and returns dispose', () => {
    const container = document.createElement('div')
    const dispose = render(() => h('p', null, 'mounted') as Node, container)
    expect(container.querySelector('p')?.textContent).toBe('mounted')
    dispose()
  })

  // Automatic JSX runtime puts children in props, not rest args.
  // Verify h() preserves props.children for function components (e.g. For).
  it('h() with automatic-runtime style: props.children preserved for function components', () => {
    const items = signal([{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }])
    const container = document.createElement('ul')
    // Simulate: jsx(For, { each: () => items.value, by: item => item.id, children: item => jsx('li', { children: item.name }) })
    const frag = h(For as unknown as (props: Record<string, unknown>) => Node, {
      each: () => items.value,
      by: (item: { id: number; name: string }) => item.id,
      children: (item: { id: number; name: string }) =>
        h('li', { children: item.name }),
    }) as DocumentFragment
    container.appendChild(frag)
    const lis = container.querySelectorAll('li')
    expect(lis).toHaveLength(2)
    expect(lis[0].textContent).toBe('Alpha')
    expect(lis[1].textContent).toBe('Beta')
  })

  // Automatic JSX runtime: HTML element children arrive via props.children (rest args = []).
  it('h() with automatic-runtime style: props.children appended for HTML elements', () => {
    const el = h('p', { children: 'Hello via props' }) as HTMLElement
    expect(el.textContent).toBe('Hello via props')
  })
})
