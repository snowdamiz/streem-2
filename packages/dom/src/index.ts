/**
 * @streeem/dom — JSX runtime and reactive DOM renderer
 *
 * Public API:
 *   h()             — JSX factory (used directly or via jsxImportSource)
 *   Fragment        — JSX Fragment symbol
 *   render()        — Mount a component into a DOM container
 *   onMount()       — Run code after component is mounted
 *   Show            — Conditional rendering component
 *   For             — Keyed list rendering component
 *   ErrorBoundary   — Synchronous error isolation with fallback UI
 *   Suspense        — Async pending state via thrown-Promise protocol
 *   HMR utilities   — registerForHMR, getRestoredValue, saveToHotData, etc.
 *   streemHMR()     — Vite plugin for HMR integration
 */
export { h, Fragment } from './h.js'
export { render } from './render.js'
export { onMount, Show, For, ErrorBoundary, Suspense } from './components.js'
// HMR utilities (tree-shaken in production builds)
export { registerForHMR, getRestoredValue, saveToHotData, canRestoreState, saveSignalCount, clearHMRRegistry } from './hmr.js'
// Vite plugin
export { streemHMR } from './hmr-plugin.js'
// Types
export type { CSSProperties, ClassValue } from './types.js'
