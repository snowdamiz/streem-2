import { describe, it, expect } from 'vitest'
import { h, Fragment, render } from '../src/index.js'

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
})
