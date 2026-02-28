/**
 * @streem/dom — JSX runtime and reactive DOM renderer
 *
 * Public API:
 *   h()        — JSX factory (used directly or via jsxImportSource)
 *   Fragment   — JSX Fragment symbol
 *   render()   — Mount a component into a DOM container
 *   onMount()  — Run code after component is mounted (stub — implemented in Plan 02-03)
 */
export { h, Fragment } from './h.js'
export { render } from './render.js'
