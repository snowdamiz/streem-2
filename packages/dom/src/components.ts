import { createRoot, effect, onCleanup } from '@streem/core'

// ---------------------------------------------------------------------------
// onMount()
// ---------------------------------------------------------------------------

/**
 * onMount(fn) — runs fn exactly once after the component's createRoot scope
 * is active. The component's DOM exists synchronously by this point (h() is
 * synchronous, so all child nodes have been created before the component fn
 * returns).
 *
 * If fn returns a cleanup function, that cleanup fires when the owner scope
 * disposes (component unmount). This is the standard pattern for registering
 * component-level teardown.
 *
 * Implementation: calls fn() directly in the current owner scope (not inside
 * an effect). Signal reads inside fn() are snapshots — no reactive dependency
 * is established since we are not inside an effect subscriber context. The
 * cleanup return value is registered via onCleanup() on the current owner,
 * which fires on owner disposal (component unmount).
 *
 * This correctly implements COMP-02: the component function runs once and
 * onMount's callback runs once with no reactive re-runs.
 */
export function onMount(fn: () => void | (() => void)): void {
  const cleanup = fn()
  if (typeof cleanup === 'function') {
    onCleanup(cleanup)
  }
}

// ---------------------------------------------------------------------------
// Show component
// ---------------------------------------------------------------------------

export interface ShowProps {
  when: boolean | (() => boolean)
  fallback?: Node | Node[] | null
  children: Node | Node[] | (() => Node | Node[]) | null | undefined
}

/**
 * Show(props) — renders children when `when` is truthy, fallback otherwise.
 *
 * Returns a DocumentFragment containing the anchor comment (and initial
 * children if `when` is truthy on mount). When the caller appends this
 * fragment to a container, all nodes move into the container at once, and
 * `anchor.parentNode` becomes the real DOM parent for future reactive swaps.
 *
 * Implementation:
 *   1. Create anchor comment + fragment; append anchor to fragment first
 *   2. Run effect() immediately — anchor.parentNode is the fragment, so
 *      initial children are inserted before anchor in the fragment
 *   3. Return the fragment — appending it consumes the fragment and moves
 *      all nodes (children + anchor) into the real DOM parent
 *   4. Subsequent effect runs find anchor.parentNode = the real DOM parent
 *
 * On each `when` change:
 *   - Dispose current child scope (stops effects inside children render fn)
 *   - Remove nodes inserted before anchor
 *   - Create new createRoot scope for the newly shown branch
 *   - Call children (if function) or use static nodes
 *   - Insert new nodes before anchor
 *
 * Key links:
 *   effect() → watches `when` accessor
 *   createRoot() → isolated scope per Show state (children fn re-called on show)
 *   onCleanup() → disposes current child scope when Show itself is disposed
 */
export function Show(props: ShowProps): DocumentFragment {
  const anchor = document.createComment('Show')
  const frag = document.createDocumentFragment()

  // Anchor must be in frag BEFORE effect runs so that insertBefore(node, anchor)
  // works during the initial render (anchor.parentNode === frag at that point)
  frag.appendChild(anchor)

  let currentDispose: (() => void) | null = null
  let currentNodes: Node[] = []

  const getWhen = typeof props.when === 'function' ? props.when : () => props.when

  effect(() => {
    const show = getWhen()

    // Dispose previous child scope (stops all effects inside children)
    currentDispose?.()
    currentDispose = null

    // Remove previous DOM nodes (works whether parent is frag or real DOM)
    for (const node of currentNodes) {
      node.parentNode?.removeChild(node)
    }
    currentNodes = []

    // After the first render, anchor.parentNode is the real DOM container.
    // On the first render, it's frag (set up above).
    const parent = anchor.parentNode!

    if (show) {
      createRoot((dispose) => {
        currentDispose = dispose
        const child = typeof props.children === 'function'
          ? props.children()
          : props.children
        if (child != null) {
          const nodes = Array.isArray(child) ? child : [child]
          currentNodes = nodes
          for (const node of nodes) {
            parent.insertBefore(node, anchor)
          }
        }
      })
    } else if (props.fallback != null) {
      // Fallback rendered without a reactive scope (static pre-rendered node)
      const fb = props.fallback
      const nodes = Array.isArray(fb) ? fb : [fb]
      currentNodes = nodes
      for (const node of nodes) {
        parent.insertBefore(node, anchor)
      }
    }
  })

  // Dispose current child scope when the Show component itself is disposed
  onCleanup(() => {
    currentDispose?.()
    currentDispose = null
  })

  return frag
}

// ---------------------------------------------------------------------------
// For component
// ---------------------------------------------------------------------------

export interface ForProps<T> {
  each: T[] | (() => T[])
  key: (item: T) => string | number
  fallback?: Node
  children: (item: T, index: () => number) => Node | Node[]
}

type RowEntry = {
  dispose: () => void
  nodes: Node[]
  setIndex: (i: number) => void
  getIndex: () => number
}

/**
 * For(props) — renders a keyed list with fine-grained reconciliation.
 *
 * Returns a DocumentFragment containing initial item nodes + anchor comment.
 * Appending the fragment to a DOM parent consumes it, making anchor.parentNode
 * the real DOM parent for future reactive updates.
 *
 * Reconciliation on each `each` change:
 *   - Stale keys: dispose scope, remove DOM nodes, delete from map
 *   - New keys: createRoot scope, call children(item, indexGetter), store nodes
 *   - Existing keys: call setIndex(newIndex) to update the index ref
 *   - All keys: insertBefore each item's nodes before anchor (re-orders DOM)
 *
 * The index getter `() => indexRef` is a plain closure over a mutable number.
 * setIndex() updates the ref on reorder — no signal needed, no DOM teardown.
 *
 * Key links:
 *   Map<key, RowEntry> → reconciliation map per item
 *   createRoot() → isolated scope per item (dispose stops item's effects)
 *   effect() → watches `each` accessor, runs full reconciliation pass
 */
export function For<T>(props: ForProps<T>): DocumentFragment {
  const anchor = document.createComment('For')
  const frag = document.createDocumentFragment()

  // Anchor in frag first so insertBefore(node, anchor) works during initial render
  frag.appendChild(anchor)

  const rows = new Map<string | number, RowEntry>()

  const getEach = typeof props.each === 'function' ? props.each : () => props.each as T[]

  effect(() => {
    const items = getEach()
    const newKeys = new Set(items.map(props.key))

    // Remove stale rows (keys no longer in new list)
    for (const [k, row] of rows) {
      if (!newKeys.has(k)) {
        row.dispose()
        for (const node of row.nodes) {
          node.parentNode?.removeChild(node)
        }
        rows.delete(k)
      }
    }

    // Add new rows / update index for existing rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const k = props.key(item)

      if (rows.has(k)) {
        // Existing row — update index ref only, no DOM recreation
        rows.get(k)!.setIndex(i)
      } else {
        if (import.meta.env.DEV) {
          // Dev-mode: after stale removal, if key already in rows it's a dup
          if (rows.has(k)) {
            console.warn('[Streem] <For>: duplicate key detected:', k)
          }
        }

        let indexRef = i
        const setIndex = (newI: number) => {
          indexRef = newI
        }
        const getIndex = () => indexRef

        let dispose!: () => void
        let nodes: Node[] = []

        createRoot((d) => {
          dispose = d
          const result = props.children(item, getIndex)
          nodes = Array.isArray(result) ? result : [result]
        })

        rows.set(k, { dispose, nodes, setIndex, getIndex })
      }
    }

    // Re-order DOM: insert each item's nodes before anchor (in array order)
    // insertBefore moves existing nodes, so this handles reorder without recreation
    const parent = anchor.parentNode!
    for (let i = 0; i < items.length; i++) {
      const k = props.key(items[i])
      const row = rows.get(k)!
      for (const node of row.nodes) {
        parent.insertBefore(node, anchor)
      }
    }
  })

  // Dispose all row scopes when For component itself is disposed
  onCleanup(() => {
    for (const row of rows.values()) {
      row.dispose()
    }
    rows.clear()
  })

  return frag
}
