import { signal, onCleanup } from '@streeem/core'
import type { Signal } from '@streeem/core'

export interface ObserveLitPropOptions {
  /**
   * Override the event name to listen for.
   * Default: camelCase propName converted to kebab-case + '-changed'
   * e.g. 'myValue' → 'my-value-changed'
   *
   * Use this when the component dispatches a non-standard event name
   * (e.g. 'change', 'update', 'myprop-changed').
   *
   * NOTE: Lit does NOT auto-dispatch property-change events. The component
   * must explicitly dispatch the event. This utility subscribes to whatever
   * event the component dispatches.
   */
  event?: string
}

/**
 * observeLitProp — creates a Streem signal that stays in sync with a Lit (or
 * any custom element) property via event-driven pull.
 *
 * Listens for `{propName}-changed` (by default) on the element host and updates
 * the returned signal when the event fires. The event must have:
 *   - bubbles: true, composed: true (to cross Shadow DOM boundary)
 *   - detail: { value: T } (the new property value)
 *
 * Cleanup is automatic: addEventListener is removed when the owning scope disposes.
 * Must be called inside a reactive scope (createRoot / component body).
 *
 * @example
 * const count = observeLitProp(el, 'count', 0)
 * // listens for 'count-changed' events on el
 *
 * @example (explicit event override)
 * const value = observeLitProp(el, 'value', '', { event: 'change' })
 */
export function observeLitProp<T>(
  el: EventTarget,
  propName: string,
  initialValue: T,
  options?: ObserveLitPropOptions,
): Signal<T> {
  const sig = signal<T>(initialValue)

  // Default: camelCase → kebab-case + '-changed'
  // 'myValue' → 'my-value-changed'
  // 'count'   → 'count-changed'
  const defaultEventName = propName
    .replace(/([A-Z])/g, (_, char: string) => `-${char.toLowerCase()}`)
    .replace(/^-/, '') + '-changed'

  const eventName = options?.event ?? defaultEventName

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ value: T }>).detail
    if (detail && 'value' in detail) {
      sig.set(detail.value)
    }
  }

  el.addEventListener(eventName, handler)
  onCleanup(() => el.removeEventListener(eventName, handler))

  return sig
}
