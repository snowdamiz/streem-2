/**
 * CSSProperties — typed style object for use as the `style` JSX prop
 * or as an extracted variable.
 *
 * @example
 * const containerStyle: CSSProperties = { display: 'grid', gap: '20px' }
 * // In JSX:
 * <div style={containerStyle} />
 * <div style={{ display: 'flex', alignItems: 'center' }} />
 */
export type CSSProperties = Partial<CSSStyleDeclaration>

/**
 * JSX type declarations for @streem/dom.
 * TypeScript reads these when jsxImportSource resolves to this package.
 */
export namespace JSX {
  /**
   * What a JSX expression evaluates to. Streem creates real DOM nodes —
   * no virtual DOM. Arrays are returned for Fragments.
   */
  type Element = Node | Node[] | null | undefined

  /**
   * Props for HTML intrinsic elements (div, span, input, etc.)
   * Event handlers use onXxx naming convention (onClick, onInput, etc.)
   */
  interface IntrinsicElements {
    // Catch-all for all HTML tags
    [tag: string]: {
      [prop: string]: unknown
      children?: Element | Element[] | string | number | boolean | null
      ref?: (el: HTMLElement) => void
      class?: string | (() => string)
      classList?: Record<string, boolean> | (() => Record<string, boolean>)
      style?: CSSProperties | (() => CSSProperties)
    }
  }

  /** Tells TypeScript which prop is used for children */
  interface ElementChildrenAttribute {
    children: {}
  }

  /** Props that all components can receive */
  interface IntrinsicAttributes {}
}
