import { effect } from '@streeem/core'

/**
 * bindLitProp — creates a reactive effect() that keeps an element's JS property
 * in sync with a signal accessor. Called by applyProps() for `prop:` prefix bindings.
 *
 * IMPORTANT: Use el[propName] = value, NOT setAttribute. Property assignment
 * preserves type information (arrays, objects, numbers, booleans) that
 * setAttribute destroys via String() coercion.
 *
 * Must be called inside a reactive scope (createRoot / component body).
 */
export function bindLitProp(
  el: Record<string, unknown>,
  propName: string,
  accessor: () => unknown,
): void {
  effect(() => {
    el[propName] = accessor()
  })
}
