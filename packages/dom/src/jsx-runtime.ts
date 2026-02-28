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
export { h as jsx, h as jsxs, Fragment } from './h.js'
export type { JSX } from './types.js'
