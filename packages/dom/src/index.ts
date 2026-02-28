/**
 * @streem/dom — JSX runtime and reactive DOM renderer
 *
 * Public API:
 *   h()        — JSX factory (used directly or via jsxImportSource)
 *   Fragment   — JSX Fragment symbol
 *   render()   — Mount a component into a DOM container
 *   onMount()  — Run code after component is mounted
 *   Show       — Conditional rendering component
 *   For        — Keyed list rendering component
 */
export { h, Fragment } from './h.js'
export { render } from './render.js'
export { onMount, Show, For } from './components.js'
