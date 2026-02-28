/**
 * @streem/lit — Lit web component interop utilities
 *
 * Runtime:
 *   bindLitProp()    — reactive effect() binding for prop: JSX prefix (used internally by applyProps)
 *   observeLitProp() — event-driven pull: creates a Signal that tracks element property changes
 *
 * Types (automatically included via package exports):
 *   base-custom-element-types.d.ts — JSX.IntrinsicElements augmentation for custom elements
 *   src/lit-types/lit-elements.d.ts — CEM-generated element-specific types (run gen:lit-types)
 */
export { bindLitProp } from './bind-lit-prop.js'
export { observeLitProp } from './observe-lit-prop.js'
export type { ObserveLitPropOptions } from './observe-lit-prop.js'
