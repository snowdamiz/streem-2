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
 * ClassValue — accepted by the `class` and `className` JSX props.
 *
 * Supports all clsx-compatible value shapes:
 *   - string: used as-is
 *   - false | null | undefined: silently skipped
 *   - Record<string, boolean>: keys with truthy values become class names
 *   - ClassValue[]: mixed arrays, recursively resolved
 *
 * @example
 * <div class="btn" />
 * <div class={['btn', isPrimary && 'btn-primary']} />
 * <div class={{ active: isActive, disabled: isDisabled }} />
 * <div class={['btn', { 'btn-primary': isPrimary }]} />
 */
export type ClassValue =
  | string
  | false
  | null
  | undefined
  | Record<string, boolean>
  | ClassValue[]

/**
 * JSX type declarations for @streeem/dom.
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
      class?: ClassValue | (() => ClassValue)
      className?: ClassValue | (() => ClassValue)
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
