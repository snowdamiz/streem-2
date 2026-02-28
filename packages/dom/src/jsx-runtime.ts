/**
 * JSX runtime entry point — imported automatically by TypeScript when
 * jsxImportSource: "@streem/dom" (or "streem" for the meta-package).
 *
 * TypeScript's react-jsx transform calls:
 *   jsx(type, props, key)   — for single-child elements
 *   jsxs(type, props, key)  — for multi-child elements (static array optimization)
 *
 * Both map to h() since Streem doesn't need the jsx/jsxs distinction at runtime.
 */
/**
 * jsx/jsxs wrappers that accept the optional key argument but discard it.
 * Forwarding key to h()'s ...children rest args would overwrite props.children.
 */
import { h, Fragment } from './h.js'

export function jsx(
  type: Parameters<typeof h>[0],
  props: Record<string, unknown> | null,
  _key?: string | number | null,
): ReturnType<typeof h> {
  return h(type, props)
}

export { jsx as jsxs, Fragment }

/**
 * JSX type declarations for @streem/dom.
 * TypeScript reads these when jsxImportSource resolves to this package.
 * Declared inline here (rather than re-exported from types.ts) so that
 * vite-plugin-dts rollupTypes preserves the full namespace members.
 */
export namespace JSX {
  /**
   * What a JSX expression evaluates to. Streem creates real DOM nodes —
   * no virtual DOM. Arrays are returned for Fragments.
   */
  export type Element = Node | Node[] | null | undefined

  /**
   * Props for HTML intrinsic elements (div, span, input, etc.)
   * Event handlers use onXxx naming convention (onClick, onInput, etc.)
   */
  export interface IntrinsicElements {
    // Catch-all for all HTML tags
    [tag: string]: {
      [prop: string]: unknown
      // Children accept static values, reactive accessor functions, and mixed arrays.
      // Using `unknown` for the array case allows Streem's reactive child pattern:
      // e.g. <p>Count: {() => count()}</p> — mixed string + accessor array.
      children?: unknown
      ref?: (el: HTMLElement) => void
      class?: string | (() => string)
      classList?: Record<string, boolean> | (() => Record<string, boolean>)
      style?: Partial<CSSStyleDeclaration> | (() => Partial<CSSStyleDeclaration>)
    }
  }

  /** Tells TypeScript which prop is used for children */
  export interface ElementChildrenAttribute {
    children: {}
  }

  /** Props that all components can receive */
  export interface IntrinsicAttributes {}
}
