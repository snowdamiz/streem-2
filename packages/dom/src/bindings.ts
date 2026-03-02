import { effect, onCleanup } from '@streeem/core'
import type { ClassValue } from './types.js'

/**
 * bindTextNode — creates a text node appended to `parent` whose nodeValue
 * is kept in sync with the accessor function via a reactive effect.
 *
 * The text node is returned so callers can keep a reference (useful for
 * anchor-based insertion). Only `nodeValue` is mutated on updates — no
 * new nodes are created and `parent.innerHTML` is never touched.
 */
export function bindTextNode(
  parent: Node,
  accessor: () => unknown,
  anchor?: Node | null,
): Text {
  const node = document.createTextNode('')
  if (anchor) {
    parent.insertBefore(node, anchor)
  } else {
    parent.appendChild(node)
  }
  effect(() => {
    node.nodeValue = String(accessor())
  })
  return node
}

/**
 * bindAttr — keeps a single DOM attribute in sync with an accessor.
 *
 * Attribute removal rules (matches HTML spec conventions):
 *   null | undefined | false → removeAttribute
 *   true                     → setAttribute(name, name)  (boolean attribute)
 *   any other value          → setAttribute(name, String(value))
 */
export function bindAttr(
  el: Element,
  name: string,
  accessor: () => unknown,
): void {
  effect(() => {
    const value = accessor()
    if (value == null || value === false) {
      el.removeAttribute(name)
    } else if (value === true) {
      el.setAttribute(name, name)
    } else {
      el.setAttribute(name, String(value))
    }
  })
}

/**
 * resolveClassValue — converts a ClassValue into a space-separated class string.
 * Package-internal helper used by bindClass and applyProps.
 *
 * - string: returned as-is
 * - false | null | undefined: returns ''
 * - Record<string, boolean>: keys with truthy values joined by ' '
 * - ClassValue[]: each item resolved recursively, falsy results filtered out
 */
export function resolveClassValue(value: ClassValue): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map(resolveClassValue).filter(Boolean).join(' ')
  }
  // Record<string, boolean>
  return Object.entries(value)
    .filter(([, active]) => active)
    .map(([cls]) => cls)
    .join(' ')
}

/**
 * bindClass — sets `el.className` to the string resolved from the ClassValue
 * returned by the accessor. Accepts any ClassValue shape: strings, arrays,
 * objects, and mixed arrays (clsx-compatible).
 *
 * Use this for reactive `class=` and `className=` props.
 */
export function bindClass(el: Element, accessor: () => ClassValue): void {
  effect(() => {
    el.setAttribute('class', resolveClassValue(accessor()))
  })
}

/**
 * bindStyle — keeps el.style in sync with the object (or string) returned by
 * the accessor. Diffs previous and next style keys so removed properties are
 * explicitly cleared via el.style.removeProperty().
 *
 * This prevents stale inline styles when a reactive style object drops keys
 * on update — a bug with the previous Object.assign approach.
 */
export function bindStyle(
  el: HTMLElement | SVGElement,
  accessor: () => Partial<CSSStyleDeclaration> | string,
): void {
  let prevKeys: string[] = []
  effect(() => {
    const value = accessor()
    if (typeof value === 'string') {
      el.style.cssText = value
      prevKeys = []
    } else {
      // Clear properties that were in the previous object but absent now
      const nextKeys = Object.keys(value)
      for (const key of prevKeys) {
        if (!(key in value)) {
          el.style.removeProperty(
            // Convert camelCase to kebab-case for removeProperty
            key.replace(/([A-Z])/g, '-$1').toLowerCase()
          )
        }
      }
      // Apply all properties from the new value
      for (const [k, v] of Object.entries(value)) {
        ;(el.style as unknown as Record<string, string>)[k] = v as string
      }
      prevKeys = nextKeys
    }
  })
}

/**
 * bindEvent — registers an event listener once (not reactive) and registers
 * an onCleanup handler to remove it when the current owner scope disposes.
 *
 * Event handlers are intentionally NOT reactive — they read the latest value
 * via closure at the time the event fires, which is the expected pattern.
 */
export function bindEvent(
  el: EventTarget,
  eventName: string,
  handler: EventListener,
): void {
  el.addEventListener(eventName, handler)
  onCleanup(() => el.removeEventListener(eventName, handler))
}
