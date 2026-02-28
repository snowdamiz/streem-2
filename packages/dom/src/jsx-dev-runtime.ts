/**
 * JSX dev runtime — loaded in development mode.
 * TypeScript passes additional source location info (file, line, column).
 * For Phase 2, dev runtime re-exports the production runtime.
 * Phase 5 can add source-location-based error messages here.
 */
export { h as jsxDEV, Fragment } from './h.js'
export type { JSX } from './types.js'
