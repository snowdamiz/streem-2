import { describe, it, expect } from 'vitest'
import { signal, computed, createRoot, effect as coreEffect } from '@streeem/core'
import { bindTextNode, bindAttr } from '../src/bindings.js'

describe('Hero pattern: full reproduction', () => {
  it('two computed bindings from same signal update on every tick', () => {
    const count = signal(0)
    const parent = document.createElement('div')
    let doubledText!: Text
    let isEvenText!: Text

    createRoot(() => {
      const doubled = computed(() => count.value * 2)
      const isEven = computed(() => count.value % 2 === 0)

      doubledText = bindTextNode(parent, doubled as () => unknown)
      isEvenText = bindTextNode(parent, () => String(isEven()))
    })

    expect(doubledText.nodeValue).toBe('0')
    expect(isEvenText.nodeValue).toBe('true')

    count.set(1)
    expect(doubledText.nodeValue).toBe('2')
    expect(isEvenText.nodeValue).toBe('false')

    count.set(2)
    expect(doubledText.nodeValue).toBe('4')
    expect(isEvenText.nodeValue).toBe('true')

    count.set(3)
    expect(doubledText.nodeValue).toBe('6')
    expect(isEvenText.nodeValue).toBe('false')

    count.set(4)
    expect(doubledText.nodeValue).toBe('8')
    expect(isEvenText.nodeValue).toBe('true')
  })

  it('pure reactive: two effects observing computeds from same signal all update every tick', () => {
    const log: string[] = []

    createRoot(() => {
      const count = signal(0)
      const doubled = computed(() => count.value * 2)
      const isEven = computed(() => count.value % 2 === 0)

      coreEffect(() => {
        log.push(`doubled=${doubled()}`)
      })
      coreEffect(() => {
        log.push(`isEven=${isEven()}`)
      })

      count.set(1)
      count.set(2)
      count.set(3)
    })

    expect(log).toContain('doubled=2')
    expect(log).toContain('doubled=4')
    expect(log).toContain('doubled=6')
    expect(log).toContain('isEven=false')
    expect(log).toContain('isEven=true')
  })

  it('full Hero pattern: direct signal + two computeds', () => {
    const count = signal(0)
    const parent = document.createElement('div')
    let countText!: Text
    let doubledText!: Text
    let isEvenText!: Text

    createRoot(() => {
      const doubled = computed(() => count.value * 2)
      const isEven = computed(() => count.value % 2 === 0)

      countText = bindTextNode(parent, () => count.value as unknown as string)
      doubledText = bindTextNode(parent, doubled as () => unknown)
      isEvenText = bindTextNode(parent, () => String(isEven()))
      const span = document.createElement('span')
      parent.appendChild(span)
      bindAttr(span, 'style', () => `color: ${isEven() ? 'green' : 'red'}`)
    })

    expect(countText.nodeValue).toBe('0')
    expect(doubledText.nodeValue).toBe('0')
    expect(isEvenText.nodeValue).toBe('true')

    count.set(1)
    expect(countText.nodeValue).toBe('1')
    expect(doubledText.nodeValue).toBe('2')
    expect(isEvenText.nodeValue).toBe('false')

    count.set(2)
    expect(countText.nodeValue).toBe('2')
    expect(doubledText.nodeValue).toBe('4')
    expect(isEvenText.nodeValue).toBe('true')

    count.set(3)
    expect(countText.nodeValue).toBe('3')
    expect(doubledText.nodeValue).toBe('6')
    expect(isEvenText.nodeValue).toBe('false')

    count.set(99)
    expect(countText.nodeValue).toBe('99')
    expect(doubledText.nodeValue).toBe('198')
    expect(isEvenText.nodeValue).toBe('false')
  })
})
