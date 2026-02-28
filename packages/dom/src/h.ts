import { createRoot, onCleanup } from '@streem/core'

/** Sentinel symbol for JSX Fragment (<> </>) */
export const Fragment = Symbol('Fragment')

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
    } else {
      parent.appendChild(document.createTextNode(String(child)))
    }
  }
}

/**
 * applyProps — inspects each prop and routes to appropriate DOM setter or binding.
 * Bindings are imported lazily in bindings.ts (Plan 02-02). For Plan 02-01,
 * implement static prop application only; reactive binding dispatch is added in Plan 02-02.
 */
export function applyProps(el: HTMLElement, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    if (key === 'ref' && typeof value === 'function') {
      ;(value as (el: HTMLElement) => void)(el)
      continue
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value as EventListener)
      onCleanup(() => el.removeEventListener(eventName, value as EventListener))
      continue
    }
    // Static value: set as attribute
    // Plan 02-02 will extend this with reactive binding dispatch
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
    const allProps: Record<string, unknown> = {
      ...(props ?? {}),
      children: normalizeChildren(children),
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

  // HTML intrinsic element: create DOM node
  const el = document.createElement(type as string)
  if (props) {
    applyProps(el as HTMLElement, props)
  }
  appendChildren(el, children)
  return el
}
