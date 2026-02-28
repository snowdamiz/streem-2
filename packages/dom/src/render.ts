import { createRoot } from '@streem/core'

/**
 * render() — Mount a component into a DOM container.
 *
 * The component function is called inside a createRoot scope so all reactive
 * effects and cleanups it creates are scoped to this render tree.
 * Returns a dispose function that tears down the entire render tree.
 *
 * @param component - A function that returns the component's DOM node(s)
 * @param container - DOM element to mount into
 * @returns dispose - Call to unmount and clean up all effects
 */
export function render(
  component: () => Node | Node[] | null | undefined,
  container: Element
): () => void {
  return createRoot((dispose) => {
    const nodes = component()
    if (nodes != null) {
      if (Array.isArray(nodes)) {
        nodes.forEach((n) => container.appendChild(n))
      } else {
        container.appendChild(nodes as Node)
      }
    }
    return dispose
  })
}
