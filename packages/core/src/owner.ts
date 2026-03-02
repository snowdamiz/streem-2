/**
 * @streeem/core — Owner tree implementation
 *
 * The owner tree is the fundamental scope/disposal mechanism. Every reactive
 * computation (effect, computed) must be created inside an owner scope so it
 * can be automatically disposed when the scope is disposed.
 *
 * Relationship to reactive.ts:
 *  - owner.ts imports currentEffectCleanupTarget from reactive.ts (one-way)
 *  - reactive.ts does NOT import from owner.ts (no circular dependency)
 *  - signal.ts imports from both and wires them together
 */

import { currentEffectCleanupTarget } from './reactive.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Owner {
  parent: Owner | null
  children: Owner[] | null    // null until first child is added
  cleanups: (() => void)[] | null  // null until first cleanup is registered
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
  if (owner.children !== null) {
    for (const child of owner.children) {
      disposeOwner(child)
    }
  }

  // Fire own cleanup callbacks synchronously
  if (owner.cleanups !== null) {
    for (const cleanup of owner.cleanups) {
      cleanup()
    }
  }

  // Release references
  owner.children = null
  owner.cleanups = null
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
    children: null,   // lazy — allocated on first child registration
    cleanups: null,   // lazy — allocated on first cleanup registration
    disposed: false,
  }

  // Register as child of the current owner (if any)
  if (currentOwner !== null) {
    if (currentOwner.children === null) {
      currentOwner.children = []
    }
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
 *  1. Before each re-execution of the containing effect (if called inside an
 *     effect body — registered on the effect's per-run cleanupFns store)
 *  2. When the containing scope is disposed (`createRoot` dispose called or
 *     effect manually disposed)
 *
 * Priority: if called during an effect's execution (currentEffectCleanupTarget
 * is set by runEffect in reactive.ts), the callback registers on the effect's
 * cleanupFns so it fires before each re-run. Otherwise falls back to the
 * owner's cleanups.
 *
 * If called outside any owner scope and outside an effect, the callback is
 * silently dropped (it will never be called). This is intentional per design.
 *
 * @example
 * ```ts
 * createRoot((dispose) => {
 *   effect(() => {
 *     const controller = new AbortController()
 *     fetch(url()).then(...)
 *     onCleanup(() => controller.abort()) // fires before re-run and on dispose
 *   })
 * })
 * ```
 */
export function onCleanup(fn: () => void): void {
  if (currentEffectCleanupTarget !== null) {
    // Inside an effect body — register on effect's per-run cleanup store.
    // This fires before each re-run AND is cleared on disposeEffect.
    if (currentEffectCleanupTarget.cleanupFns === null) {
      currentEffectCleanupTarget.cleanupFns = []
    }
    currentEffectCleanupTarget.cleanupFns.push(fn)
  } else if (currentOwner !== null) {
    // Inside a createRoot (but not an effect body) — register on owner.
    if (currentOwner.cleanups === null) {
      currentOwner.cleanups = []
    }
    currentOwner.cleanups.push(fn)
  }
  // Note: if called outside any owner or effect, fn is silently dropped.
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
