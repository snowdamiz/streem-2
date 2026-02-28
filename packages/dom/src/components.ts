import { createRoot, effect, onCleanup } from '@streem/core'

// ---------------------------------------------------------------------------
// ErrorBoundary component
// ---------------------------------------------------------------------------

export interface ErrorBoundaryProps {
  fallback: (err: unknown, reset: () => void) => Node | Node[] | null
  children: Node | Node[] | (() => Node | Node[] | null)
}

/**
 * ErrorBoundary(props) — wraps children in try/catch to isolate synchronous
 * render errors. When an error is caught, renders fallback(err, reset) instead.
 *
 * CRITICAL invariant: ErrorBoundary MUST re-throw thrown Promises so that
 * parent Suspense components can catch them. Only non-Promise errors are caught
 * and turned into fallback UI.
 *
 * Phase 2 design (simple, correct):
 *   - ErrorBoundary renders children synchronously in try/catch
 *   - Returns the child Node directly (or fallback Node on error)
 *   - reset() is provided to the fallback function — in Phase 2 it triggers a
 *     re-render attempt; in-place DOM swap infrastructure is Phase 3+ scope
 *
 * Key link: if (err instanceof Promise) throw err  — this re-throw is critical.
 * Without it, thrown Promises would be caught here and show error fallback UI
 * instead of Suspense's loading fallback.
 */
export function ErrorBoundary(props: ErrorBoundaryProps): Node | Node[] {
  let childResult: Node | Node[] | null = null
  let childDispose: (() => void) | null = null

  const attemptRender = (): Node | Node[] | null => {
    let result: Node | Node[] | null = null
    try {
      createRoot((d) => {
        childDispose = d
        const child = typeof props.children === 'function' ? props.children() : props.children
        result = child ?? null
      })
    } catch (err) {
      // CRITICAL: re-throw Promises so Suspense above can catch them
      if (err instanceof Promise) throw err

      // Synchronous error — dispose failed child scope and render fallback
      childDispose?.()
      childDispose = null

      const reset = () => {
        // Phase 2: reset triggers a new render attempt. The returned node is
        // not swapped in-place (that requires anchor infrastructure, Phase 3+).
        // reset() is callable without throwing — the caller owns the DOM swap.
        attemptRender()
      }

      result = props.fallback(err, reset) ?? null
    }
    return result
  }

  childResult = attemptRender()

  onCleanup(() => {
    childDispose?.()
    childDispose = null
  })

  // Return children node(s) or fallback node(s) — caller appends to DOM
  if (childResult === null) {
    return document.createComment('ErrorBoundary:empty')
  }
  return childResult
}

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
  by: (item: T) => string | number
  fallback?: Node
  children: (item: T, index: () => number) => Node | Node[] | null | undefined
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
  const renderItem = props.children
  const anchor = document.createComment('For')
  const frag = document.createDocumentFragment()

  // Anchor in frag first so insertBefore(node, anchor) works during initial render
  frag.appendChild(anchor)

  const rows = new Map<string | number, RowEntry>()

  const getEach = typeof props.each === 'function' ? props.each : () => props.each as T[]

  effect(() => {
    const items = getEach()
    const newKeys = new Set(items.map(props.by))

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
      const k = props.by(item)

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
          const result = renderItem(item, getIndex)
          nodes = Array.isArray(result)
            ? result.filter((n): n is Node => n != null)
            : result != null ? [result] : []
        })

        rows.set(k, { dispose, nodes, setIndex, getIndex })
      }
    }

    // Re-order DOM: insert each item's nodes before anchor (in array order)
    // insertBefore moves existing nodes, so this handles reorder without recreation
    const parent = anchor.parentNode!
    for (let i = 0; i < items.length; i++) {
      const k = props.by(items[i])
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

// ---------------------------------------------------------------------------
// Suspense component
// ---------------------------------------------------------------------------

export interface SuspenseProps {
  fallback: Node | Node[] | (() => Node | Node[] | null)
  children: Node | Node[] | (() => Node | Node[] | null)
  /**
   * Called when a thrown Promise inside this Suspense boundary rejects.
   * Use this to propagate async errors to an outer ErrorBoundary scope.
   * If omitted, rejection errors are logged to console.error.
   *
   * @example
   * let outerError: unknown = undefined
   * const node = ErrorBoundary({
   *   fallback: (err) => ...,
   *   children: () => Suspense({
   *     fallback: ...,
   *     onError: (err) => { outerError = err }, // capture for outer scope
   *     children: ...,
   *   }) as unknown as Node
   * })
   */
  onError?: (err: unknown) => void
}

/**
 * Suspense(props) — catches thrown Promises from children (thrown-Promise
 * protocol, like React Suspense). Shows fallback while pending; swaps to
 * children when the Promise resolves.
 *
 * Returns a Comment anchor. Children are inserted before the anchor using
 * queueMicrotask (so the anchor must be in the DOM before children insert).
 * Caller must append the anchor node to a DOM parent.
 *
 * Phase 3 behavior:
 *   - Child throws Promise → show fallback; attach .then() to retry on resolve
 *   - Promise resolves → retry tryRenderChildren(); replace fallback with children
 *   - Promise rejects → call props.onError(err) if provided; else console.error
 *   - Child throws non-Promise Error → re-throw (propagates to ErrorBoundary above)
 *   - Multiple Promises thrown → pendingCount tracks; retry after all resolve
 *     (simple counter approach — progressive resolution is Phase 3 + createResource)
 *
 * Key link: err instanceof Promise check (MUST happen in Suspense before re-throw)
 * ensures non-Promise errors propagate to ErrorBoundary while Promises are handled
 * by Suspense's loading state mechanism.
 */
export function Suspense(props: SuspenseProps): Comment {
  const anchor = document.createComment('Suspense')
  let pendingCount = 0
  let currentNodes: Node[] = []

  const removeCurrentNodes = () => {
    for (const n of currentNodes) {
      n.parentNode?.removeChild(n)
    }
    currentNodes = []
  }

  const insertBefore = (nodes: Node | Node[] | null | undefined) => {
    if (!nodes) return
    const arr = Array.isArray(nodes) ? nodes : [nodes]
    removeCurrentNodes()
    currentNodes = arr
    for (const n of arr) {
      anchor.parentNode?.insertBefore(n, anchor)
    }
  }

  const getFallback = (): Node | Node[] | null => {
    const fb = typeof props.fallback === 'function' ? props.fallback() : props.fallback
    return fb ?? null
  }

  const tryRenderChildren = (): void => {
    try {
      const child = typeof props.children === 'function' ? props.children() : props.children
      insertBefore(child ?? null)
    } catch (err) {
      if (!(err instanceof Promise)) {
        // Non-Promise errors propagate up to ErrorBoundary above
        throw err
      }

      // Pending Promise: show fallback, attach resolve/reject handlers
      pendingCount++
      insertBefore(getFallback())

      err.then(
        () => {
          pendingCount--
          if (pendingCount === 0) {
            // All Promises resolved — retry rendering children
            queueMicrotask(() => tryRenderChildren())
          }
        },
        (rejectionError: unknown) => {
          if (props.onError) {
            props.onError(rejectionError)
          } else {
            console.error('Streem <Suspense>: resource rejected:', rejectionError)
          }
        },
      )
    }
  }

  // Initial render deferred via queueMicrotask so the anchor is in the DOM
  // by the time insertBefore() runs (anchor.parentNode !== null after caller
  // appends the anchor to the DOM).
  queueMicrotask(() => {
    tryRenderChildren()
  })

  onCleanup(() => {
    removeCurrentNodes()
  })

  return anchor
}
