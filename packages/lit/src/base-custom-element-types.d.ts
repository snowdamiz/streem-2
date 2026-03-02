/**
 * Base JSX type declarations for custom elements (hyphenated tags).
 * Augments @streeem/dom/jsx-runtime with:
 *   - Standard Shadow DOM attributes (part, slot, exportparts)
 *   - prop: namespace prefix index signature (JS property routing)
 *   - attr: namespace prefix index signature (explicit attribute routing)
 *   - on: namespace prefix index signature (direct addEventListener routing)
 *
 * This declaration is included automatically when @streeem/lit is used.
 * The declare module path MUST be '@streeem/dom/jsx-runtime' — this is what
 * TypeScript resolves from jsxImportSource: "@streeem/dom".
 */
declare module '@streeem/dom/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * All custom elements (hyphenated tag names) receive:
       * - Standard Shadow DOM attributes: part, slot, exportparts
       * - prop: prefix: routes to JS property (el[name] = value)
       * - attr: prefix: routes to setAttribute explicitly
       * - on: prefix: routes to direct addEventListener (Shadow DOM safe)
       */
      [tag: `${string}-${string}`]: {
        [key: string]: unknown
        // Shadow DOM composition attributes
        part?: string
        slot?: string
        exportparts?: string
        // children support
        children?: unknown
        // ref callback
        ref?: (el: HTMLElement) => void
        // Namespace prefix index signatures (TypeScript 5.1+ template literal)
        [key: `prop:${string}`]: unknown
        [key: `attr:${string}`]: string | boolean | undefined
        [key: `on:${string}`]: EventListener
      }
    }
  }
}
