import { effect, onCleanup } from '@streem/core'

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
 * bindClass — sets `el.className` to the string returned by the accessor.
 * Use this for reactive `class=` props that produce a whole class string.
 */
export function bindClass(el: Element, accessor: () => string): void {
  effect(() => {
    el.className = accessor()
  })
}

/**
 * bindClassList — toggles individual CSS classes via an accessor that returns
 * a `Record<string, boolean>` class map. Each key is a class name; truthy
 * value means add, falsy means remove.
 *
 * On each run the full map is applied, so removed classes are properly cleaned
 * up even if they disappear from the map object entirely.
 */
export function bindClassList(
  el: Element,
  accessor: () => Record<string, boolean>,
): void {
  effect(() => {
    const map = accessor()
    for (const [cls, active] of Object.entries(map)) {
      el.classList.toggle(cls, Boolean(active))
    }
  })
}

/**
 * bindStyle — merges the style object returned by the accessor into
 * `el.style` using Object.assign. Runs inside an effect so it re-runs
 * whenever any signal read inside the accessor changes.
 */
export function bindStyle(
  el: HTMLElement,
  accessor: () => Partial<CSSStyleDeclaration>,
): void {
  effect(() => {
    Object.assign(el.style, accessor())
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
