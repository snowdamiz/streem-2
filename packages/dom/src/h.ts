import { createRoot, effect, onCleanup, isSignal } from '@streem/core'
import type { Signal } from '@streem/core'
import {
  bindTextNode,
  bindAttr,
  bindClass,
  resolveClassValue,
  bindStyle,
  bindEvent,
} from './bindings.js'
import type { ClassValue } from './types.js'

/** Sentinel symbol for JSX Fragment (<> </>) */
export const Fragment = Symbol('Fragment')

const SVG_NS = 'http://www.w3.org/2000/svg'

// SVG element tag names that must be created with createElementNS.
// Excludes ambiguous tags that exist in both HTML and SVG (a, script, style, title).
const SVG_TAGS = new Set([
  'animate', 'animateMotion', 'animateTransform', 'circle', 'clipPath',
  'defs', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge',
  'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence',
  'filter', 'foreignObject', 'g', 'image', 'line', 'linearGradient',
  'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern', 'polygon',
  'polyline', 'radialGradient', 'rect', 'set', 'stop', 'svg', 'switch',
  'symbol', 'text', 'textPath', 'tspan', 'use', 'view',
])

type Children = unknown[]

function normalizeChildren(children: Children): unknown {
  if (children.length === 0) return undefined
  if (children.length === 1) return children[0]
  return children
}

function flattenChildren(children: Children): Node[] {
  const nodes: Node[] = []
  for (const child of children) {
    if (child == null || child === false || child === true) continue
    if (child instanceof Node) {
      nodes.push(child)
    } else if (Array.isArray(child)) {
      nodes.push(...flattenChildren(child as Children))
    } else {
      nodes.push(document.createTextNode(String(child)))
    }
  }
  return nodes
}

function appendChildren(parent: Element, children: Children): void {
  for (const child of children) {
    if (child == null || child === false || child === true) continue
    if (child instanceof Node) {
      parent.appendChild(child)
    } else if (Array.isArray(child)) {
      appendChildren(parent, child as Children)
    } else if (typeof child === 'function') {
      // Accessor function — create a reactive text node via bindTextNode.
      // The text node is appended and kept in sync with the signal.
      bindTextNode(parent, child as () => unknown)
    } else if (isSignal(child)) {
      // Signal instance — wrap in accessor so bindTextNode can track it.
      bindTextNode(parent, () => (child as Signal<unknown>).value)
    } else {
      parent.appendChild(document.createTextNode(String(child)))
    }
  }
}

/**
 * applyProps — inspects each prop and routes to the appropriate DOM setter
 * or reactive binding function.
 *
 * Dispatch rules (in priority order):
 *   key === 'children'                            → skip (handled by h())
 *   key === 'ref' + typeof value === 'function'   → call ref(el)
 *   key starts with 'prop:' + typeof value === 'function' → effect() → el[propName] = accessor()
 *   key starts with 'prop:' + static value               → el[propName] = value (direct JS prop)
 *   key starts with 'attr:' + typeof value === 'function' → bindAttr
 *   key starts with 'attr:' + static value               → setAttribute
 *   key starts with 'on:'                                 → bindEvent with name preserved exactly
 *   key starts with 'on' + typeof value === 'function' → bindEvent (lowercased, JSX convention)
 *   key === 'class' | 'className' + typeof value === 'function' → bindClass
 *   key === 'class' | 'className' + isSignal     → bindClass (wrapped accessor)
 *   key === 'class' | 'className' + static       → setAttribute (resolveClassValue)
 *   key === 'style' + typeof value === 'function' → bindStyle
 *   key === 'style' + static object              → bindStyle (wrapped in accessor)
 *   typeof value === 'function'                  → bindAttr (reactive attribute)
 *   static non-null value                        → setAttribute (existing behavior)
 *
 * CRITICAL: typeof value === 'function' MUST be checked before any invocation
 * of value. Calling value() here would consume a snapshot, breaking reactivity.
 */
export function applyProps(el: Element, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue

    if (key === 'ref' && typeof value === 'function') {
      ;(value as (el: Element) => void)(el)
      continue
    }

    // prop: — JS property assignment (bypasses setAttribute entirely)
    if (key.startsWith('prop:')) {
      const propName = key.slice(5)  // 'prop:value' → 'value'
      if (typeof value === 'function') {
        // Reactive: create effect() that keeps el[propName] in sync with signal accessor.
        effect(() => {
          ;(el as unknown as Record<string, unknown>)[propName] = (value as () => unknown)()
        })
      } else if (isSignal(value)) {
        effect(() => {
          ;(el as unknown as Record<string, unknown>)[propName] = (value as Signal<unknown>).value
        })
      } else if (value !== undefined) {
        ;(el as unknown as Record<string, unknown>)[propName] = value
      }
      continue
    }

    // attr: — explicit attribute assignment (force setAttribute path)
    if (key.startsWith('attr:')) {
      const attrName = key.slice(5)  // 'attr:disabled' → 'disabled'
      if (typeof value === 'function') {
        bindAttr(el, attrName, value as () => unknown)
      } else if (isSignal(value)) {
        bindAttr(el, attrName, () => (value as Signal<unknown>).value)
      } else if (value != null && value !== false) {
        el.setAttribute(attrName, value === true ? attrName : String(value))
      }
      continue
    }

    // on: — direct addEventListener with event name preserved exactly (no lowercasing)
    // MUST appear before the existing on* handler which lowercases the event name.
    if (key.startsWith('on:')) {
      const eventName = key.slice(3)  // 'on:my-event' → 'my-event' (NO lowercasing)
      if (typeof value === 'function') {
        bindEvent(el, eventName, value as EventListener)
      }
      continue
    }

    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      bindEvent(el, eventName, value as EventListener)
      continue
    }

    if (key === 'class' || key === 'className') {
      if (typeof value === 'function') {
        bindClass(el, value as () => ClassValue)
      } else if (isSignal(value)) {
        bindClass(el, () => (value as Signal<ClassValue>).value)
      } else if (value != null && value !== false) {
        // Static ClassValue — resolve immediately and set as attribute
        el.setAttribute('class', resolveClassValue(value as ClassValue))
      }
      continue
    }
    // Note: 'classList' is intentionally NOT handled — removed per phase 11 decision

    if (key === 'style') {
      const styledEl = el as HTMLElement | SVGElement
      if (typeof value === 'function') {
        bindStyle(styledEl, value as () => Partial<CSSStyleDeclaration> | string)
      } else if (isSignal(value)) {
        bindStyle(styledEl, () => (value as Signal<Partial<CSSStyleDeclaration> | string>).value)
      } else if (typeof value === 'string') {
        bindStyle(styledEl, () => value)
      } else if (value != null && typeof value === 'object') {
        // Static style object: wrap in accessor
        bindStyle(styledEl, () => value as Partial<CSSStyleDeclaration>)
      }
      continue
    }

    // Generic reactive attribute: accessor function → bindAttr
    if (typeof value === 'function') {
      bindAttr(el, key, value as () => unknown)
      continue
    }

    // Generic reactive attribute: signal → bindAttr
    if (isSignal(value)) {
      bindAttr(el, key, () => (value as Signal<unknown>).value)
      continue
    }

    // Static value: set as attribute
    if (value != null && value !== false) {
      if (value === true) {
        el.setAttribute(key, key)
      } else {
        el.setAttribute(key, String(value))
      }
    }
  }
}

/**
 * h() — the core JSX factory. Called by jsx()/jsxs() for every JSX element.
 *
 * For function components: runs once inside createRoot scope.
 * For HTML elements: creates DOM node immediately, applies props, appends children.
 * For Fragment: returns children array as flat Node[].
 *
 * CRITICAL: Component functions run exactly once. Reactivity lives in JSX
 * expressions (accessor functions) and explicit effect() calls inside the component.
 * This implements COMP-02.
 */
export function h(
  type: string | ((props: Record<string, unknown>) => Node | Node[] | null | undefined) | symbol,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): Node | Node[] | null {
  // Fragment: flatten and return children as Node[]
  if (type === Fragment) {
    const allChildren = props?.children != null
      ? (Array.isArray(props.children) ? props.children : [props.children])
      : children
    return flattenChildren(allChildren as Children)
  }

  // Function component: run exactly once inside createRoot scope
  if (typeof type === 'function') {
    // The automatic JSX runtime (react-jsx transform) puts children inside
    // props.children — rest args are always empty in that mode. Only overwrite
    // props.children if rest args were actually provided (classic h() call).
    const allProps: Record<string, unknown> = { ...(props ?? {}) }
    if (children.length > 0) {
      allProps.children = normalizeChildren(children)
    }
    let result: Node | Node[] | null | undefined = null
    createRoot((dispose) => {
      // Register dispose on parent owner via onCleanup so component
      // is torn down when its parent scope is disposed
      onCleanup(dispose)
      result = type(allProps)
    })
    return result ?? null
  }

  // Intrinsic element: use SVG namespace for known SVG tags, HTML otherwise
  const tag = type as string
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag)
  if (props) {
    applyProps(el as HTMLElement, props)
  }
  // With the automatic JSX runtime children arrive via props.children (rest args = []).
  // With the classic runtime they arrive as rest args. Support both.
  if (children.length > 0) {
    appendChildren(el, children)
  } else if (props?.children != null) {
    const pc = props.children
    appendChildren(el, Array.isArray(pc) ? (pc as Children) : [pc])
  }
  return el
}
