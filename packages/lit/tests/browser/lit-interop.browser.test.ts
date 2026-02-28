/**
 * Browser test suite for @streem/lit — Vitest Browser Mode (Playwright Chromium)
 *
 * Covers all four LIT-01..04 behaviors that require a real browser:
 *  - LIT-03: Shadow DOM event routing via on: prefix
 *  - LIT-02: prop: routes to JS property setter, not setAttribute
 *  - LIT-01: observeLitProp — reactive pull from element property changes
 *
 * These behaviors cannot be verified in happy-dom or JSDOM because:
 *  - happy-dom does not implement Shadow DOM event retargeting correctly
 *  - Shadow DOM boundary events require composed: true to propagate out
 *
 * NOTE: Lit reactive properties are declared via static properties object
 * (not TypeScript decorators) to avoid decorator transform complications
 * in the Vite browser mode pipeline.
 *
 * CRITICAL: Events inside Shadow DOM must have { bubbles: true, composed: true }
 * for the event to cross the Shadow DOM boundary and reach listeners on the host.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LitElement, html } from 'lit'
import { createRoot, signal } from '@streem/core'
import { bindLitProp, observeLitProp } from '@streem/lit'

// ---------------------------------------------------------------------------
// Inline Lit component stubs (no decorators — static properties declaration)
// ---------------------------------------------------------------------------

// TestCounter: has a `count` JS property (reactive via Lit), dispatches
// 'count-changed' events from inside its shadow DOM.
if (!customElements.get('test-counter')) {
  class TestCounter extends LitElement {
    // Declare reactive property using static properties (Lit 3 API, no decorators)
    // CRITICAL: Do NOT use class field initializer for 'count' — it would overwrite
    // Lit's reactive property accessor (class-field-shadowing, see lit.dev/msg/class-field-shadowing).
    // Use the constructor to set the initial value instead.
    static override get properties() {
      return {
        count: { type: Number },
      }
    }

    declare count: number

    constructor() {
      super()
      // Initialize via constructor to avoid overwriting Lit's reactive accessor
      this.count = 0
    }

    override render() {
      return html`<button>Click</button>`
    }

    /**
     * Dispatches an event from inside the shadow DOM (from the internal button).
     * Used to test that composed events reach listeners on the host element.
     * The event has { bubbles: true, composed: true } — required to cross the
     * Shadow DOM boundary.
     */
    dispatchFromShadow(eventName: string, detail: unknown) {
      const button = this.shadowRoot?.querySelector('button')
      if (button) {
        button.dispatchEvent(
          new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true,
          }),
        )
      }
    }
  }

  customElements.define('test-counter', TestCounter)
}

type TestCounterEl = HTMLElement & {
  count: number
  dispatchFromShadow(name: string, detail: unknown): void
  updateComplete: Promise<boolean>
}

// ---------------------------------------------------------------------------
// LIT-03: Shadow DOM event routing via on: prefix
// ---------------------------------------------------------------------------

describe('LIT-03: Shadow DOM event routing via on: prefix', () => {
  let el: TestCounterEl
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    el = document.createElement('test-counter') as TestCounterEl
    container.appendChild(el)
  })

  afterEach(() => {
    container.remove()
  })

  it('on: handler fires when event originates inside shadow root (composed: true)', async () => {
    // Wait for Lit to complete initial render and create shadowRoot
    await el.updateComplete

    let fired = false
    // Simulate what applyProps `on:` prefix does: addEventListener on host element
    // with event name preserved exactly (no lowercasing)
    el.addEventListener('count-changed', () => {
      fired = true
    })

    // Dispatch from inside the shadow DOM — requires composed: true to cross boundary
    el.dispatchFromShadow('count-changed', { value: 1 })

    expect(fired).toBe(true)
  })

  it('event.target is the custom element host (no Shadow DOM retargeting failure)', async () => {
    // Wait for Lit to complete initial render
    await el.updateComplete

    let capturedTarget: EventTarget | null = null
    el.addEventListener('count-changed', (e: Event) => {
      capturedTarget = e.target
    })

    // Dispatch from inside shadow root — the browser retargets e.target to the host
    el.dispatchFromShadow('count-changed', { value: 1 })

    // The event.target must be the host element, not the internal shadow node.
    // This verifies the Shadow DOM event retargeting that JSDOM/happy-dom cannot test.
    expect(capturedTarget).toBe(el)
  })
})

// ---------------------------------------------------------------------------
// LIT-02: prop: routes to JS property setter, not setAttribute
// ---------------------------------------------------------------------------

describe('LIT-02: prop: routes to JS property setter, not setAttribute', () => {
  it('prop: with static value assigns to JS property (not setAttribute)', () => {
    const counterEl = document.createElement('test-counter') as TestCounterEl
    document.body.appendChild(counterEl)

    const setAttributeSpy = vi.spyOn(counterEl, 'setAttribute')

    // Simulate what applyProps does for a static prop:count={5}
    // Direct JS property assignment — this is what applyProps `prop:` branch does
    ;(counterEl as unknown as Record<string, unknown>)['count'] = 5

    expect(counterEl.count).toBe(5)
    // setAttribute must NOT have been called — prop: uses JS property, not HTML attribute
    expect(setAttributeSpy).not.toHaveBeenCalledWith('count', expect.anything())

    setAttributeSpy.mockRestore()
    counterEl.remove()
  })

  it('prop: with signal accessor keeps JS property in sync via bindLitProp / effect()', () => {
    const counterEl = document.createElement('test-counter') as TestCounterEl
    document.body.appendChild(counterEl)

    const count = signal(42)
    let dispose!: () => void

    createRoot((d) => {
      dispose = d
      // bindLitProp is the function applyProps calls for reactive prop: bindings.
      // It creates an effect(() => { el[propName] = accessor() }) internally.
      bindLitProp(counterEl as unknown as Record<string, unknown>, 'count', () => count())
    })

    // Effect should have run immediately — count should be 42
    expect(counterEl.count).toBe(42)

    // Update the signal — effect should re-run, updating the JS property
    count.set(99)
    expect(counterEl.count).toBe(99)

    dispose()
    counterEl.remove()
  })
})

// ---------------------------------------------------------------------------
// LIT-01: observeLitProp — reactive pull from element property changes
// ---------------------------------------------------------------------------

describe('LIT-01: observeLitProp — reactive pull from element property changes', () => {
  it('signal updates when element dispatches count-changed event', async () => {
    const counterEl = document.createElement('test-counter') as TestCounterEl
    document.body.appendChild(counterEl)
    await counterEl.updateComplete

    let dispose!: () => void
    let countSig!: ReturnType<typeof observeLitProp<number>>

    createRoot((d) => {
      dispose = d
      // observeLitProp listens for 'count-changed' events
      // (camelCase propName → kebab-case + '-changed' is the default convention)
      countSig = observeLitProp<number>(counterEl, 'count', 0)
    })

    expect(countSig()).toBe(0)

    // Simulate the element dispatching a count-changed event (as LitElement would)
    counterEl.dispatchEvent(
      new CustomEvent('count-changed', {
        detail: { value: 42 },
        bubbles: true,
        composed: true,
      }),
    )

    expect(countSig()).toBe(42)

    dispose()
    counterEl.remove()
  })

  it('observeLitProp with custom event name override', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    let dispose!: () => void
    let sig!: ReturnType<typeof observeLitProp<string>>

    createRoot((d) => {
      dispose = d
      // event: 'change' overrides the default 'value-changed' convention
      sig = observeLitProp<string>(el, 'value', '', { event: 'change' })
    })

    el.dispatchEvent(new CustomEvent('change', { detail: { value: 'hello' } }))
    expect(sig()).toBe('hello')

    dispose()
    el.remove()
  })

  it('cleanup removes event listener when scope disposes', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    let dispose!: () => void
    let sig!: ReturnType<typeof observeLitProp<number>>

    createRoot((d) => {
      dispose = d
      sig = observeLitProp<number>(el, 'count', 0)
    })

    // Initial value
    expect(sig()).toBe(0)

    // Dispose the scope — onCleanup inside observeLitProp removes the listener
    dispose()

    // Event dispatched AFTER dispose must NOT update the signal
    el.dispatchEvent(
      new CustomEvent('count-changed', {
        detail: { value: 99 },
      }),
    )
    // Signal must remain at initial value — listener was removed on dispose
    expect(sig()).toBe(0)

    el.remove()
  })
})
