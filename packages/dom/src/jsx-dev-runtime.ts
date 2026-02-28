/**
 * JSX dev runtime — loaded by esbuild/Vite in development mode.
 *
 * esbuild's dev-mode JSX transform calls:
 *   jsxDEV(type, props, key, isStaticChildren, source, self)
 *
 * The extra args (key, isStaticChildren, source, self) must NOT be forwarded
 * to h() as rest args — h() would treat them as children, overwriting
 * props.children with [key, isStaticChildren, source, self].
 *
 * This wrapper accepts and discards the extra args, passing only type + props
 * to h(). Phase 5 can use the source/self args for dev-mode error enrichment.
 */
import { h, Fragment } from './h.js'

export function jsxDEV(
  type: Parameters<typeof h>[0],
  props: Record<string, unknown> | null,
  _key?: string | number | null,
  _isStaticChildren?: boolean,
  _source?: object,
  _self?: unknown,
): ReturnType<typeof h> {
  return h(type, props)
}

export { Fragment }
export type { JSX } from './types.js'
