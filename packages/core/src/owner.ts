/**
 * @streem/core — Owner tree implementation
 *
 * The owner tree is the fundamental scope/disposal mechanism. Every reactive
 * computation (effect, computed) must be created inside an owner scope so it
 * can be automatically disposed when the scope is disposed.
 *
 * Relationship to reactive.ts:
 *  - owner.ts does NOT import from reactive.ts to avoid circular dependencies
 *  - The OwnerRef interface in reactive.ts is a structural subtype of Owner
 *  - signal.ts (Plan 01-02) imports from both and wires them together
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Owner {
  parent: Owner | null
  children: Owner[]
  cleanups: (() => void)[]
  disposed: boolean
}

// ---------------------------------------------------------------------------
// Global owner state
// ---------------------------------------------------------------------------

/** The currently active owner scope */
let currentOwner: Owner | null = null

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Dispose an owner node: bottom-up traversal (children first, then own cleanups).
 * Idempotent — returns early if already disposed.
 */
function disposeOwner(owner: Owner): void {
  if (owner.disposed) return
  owner.disposed = true

  // Bottom-up: dispose children first so nested scopes clean up before parents
  for (const child of owner.children) {
    disposeOwner(child)
  }

  // Fire own cleanup callbacks synchronously
  for (const cleanup of owner.cleanups) {
    cleanup()
  }

  // Release references
  owner.children = []
  owner.cleanups = []
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new reactive owner scope.
 *
 * The `fn` callback is invoked synchronously with a `dispose` function.
 * All reactive computations (effects, computeds) created during `fn` are
 * registered as children of this owner. When `dispose()` is called, the
 * entire subtree is torn down bottom-up.
 *
 * @example
 * ```ts
 * const dispose = createRoot((dispose) => {
 *   const count = signal(0)
 *   effect(() => console.log(count()))
 *   return dispose
 * })
 * dispose() // stops the effect and fires all onCleanup callbacks
 * ```
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner: Owner = {
    parent: currentOwner,
    children: [],
    cleanups: [],
    disposed: false,
  }

  // Register as child of the current owner (if any)
  if (currentOwner !== null) {
    currentOwner.children.push(owner)
  }

  const prevOwner = currentOwner
  currentOwner = owner

  let result: T
  try {
    result = fn(() => disposeOwner(owner))
  } finally {
    currentOwner = prevOwner
  }

  return result!
}

/**
 * Register a cleanup callback on the current owner scope.
 *
 * The callback fires:
 *  1. When the containing scope is disposed (`createRoot` dispose called)
 *  2. Before each re-execution of the containing effect (if inside an effect)
 *
 * If called outside any owner scope, the callback is silently dropped
 * (it will never be called). This is acceptable per design — owners are
 * opt-in, not required for basic signal reads.
 *
 * @example
 * ```ts
 * createRoot((dispose) => {
 *   effect(() => {
 *     const controller = new AbortController()
 *     fetch(url()).then(...)
 *     onCleanup(() => controller.abort())
 *   })
 * })
 * ```
 */
export function onCleanup(fn: () => void): void {
  if (currentOwner !== null) {
    currentOwner.cleanups.push(fn)
  }
  // Note: if called outside any owner, fn is never registered and never called.
  // This is intentional — not a bug. See CONTEXT.md.
}

/**
 * Returns the currently active owner scope, or null if there is none.
 *
 * Use `runWithOwner` to re-attach to a captured owner across async boundaries.
 *
 * @example
 * ```ts
 * createRoot((dispose) => {
 *   const owner = getOwner()
 *   setTimeout(() => {
 *     runWithOwner(owner!, () => {
 *       effect(() => { ... }) // properly owned
 *     })
 *   }, 1000)
 * })
 * ```
 */
export function getOwner(): Owner | null {
  return currentOwner
}

/**
 * Run a function inside a specific owner scope.
 *
 * Useful for re-attaching to an owner across async boundaries (timers,
 * promises, event handlers) so that reactive computations created in the
 * callback are properly owned and disposed.
 *
 * In dev mode, throws if the owner has already been disposed — this catches
 * the "async callback fires after component unmount" bug early.
 *
 * In prod, silently does nothing if owner is disposed (no-op).
 *
 * @example
 * ```ts
 * const owner = getOwner()
 * fetch('/api').then(() => {
 *   runWithOwner(owner!, () => {
 *     effect(() => { ... })
 *   })
 * })
 * ```
 */
export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  if (import.meta.env.DEV && owner?.disposed) {
    throw new Error(
      '[Streem] runWithOwner called with a disposed owner. ' +
      'The owner has already been disposed and can no longer accept new reactive computations.',
    )
  }

  // In prod, if owner is disposed, do not run fn — return undefined cast to T
  // (no-op behavior for disposed owners matches circular dep pattern)
  if (owner?.disposed) {
    return undefined as unknown as T
  }

  const prevOwner = currentOwner
  currentOwner = owner
  try {
    return fn()
  } finally {
    currentOwner = prevOwner
  }
}

/**
 * Returns the currently active owner (same as getOwner).
 * Named getCurrentOwner for consistency with getCurrentSubscriber in reactive.ts.
 * Used internally by createEffectNode and createComputedNode in signal.ts.
 */
export function getCurrentOwner(): Owner | null {
  return currentOwner
}
