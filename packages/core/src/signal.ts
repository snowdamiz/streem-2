/**
 * @streem/core — Public reactive API
 *
 * This module exposes the public signal(), computed(), and effect() APIs that
 * users interact with directly. It wraps the internal push-pull reactive graph
 * (reactive.ts) and owner tree (owner.ts) and adds dev-mode warnings.
 *
 * Dev warnings implemented:
 *  - DX-02: signal read outside any reactive context (no subscriber, no owner)
 *  - DX-03: computed() or effect() created without an active owner scope
 */

import {
  createSignalNode,
  createComputedNode,
  createEffectNode,
  readComputedNode,
  disposeEffect,
  trackRead,
  getCurrentSubscriber,
  notifySubscribers,
} from './reactive.js'

import {
  getOwner,
  getCurrentOwner,
  onCleanup,
} from './owner.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A signal is a callable getter function with a `.set()` method.
 * Reading the signal (calling it as a function) tracks it as a dependency
 * in the current reactive context.
 *
 * @example
 * ```ts
 * const count = signal(0)
 * count()        // read — returns 0
 * count.set(1)   // write — notifies subscribers
 * ```
 */
export interface Signal<T> {
  (): T
  set(value: T): void
}

// ---------------------------------------------------------------------------
// signal()
// ---------------------------------------------------------------------------

/**
 * Create a reactive signal with an initial value.
 *
 * The returned getter is tracked when called inside a reactive context
 * (effect, computed, or any function running under an owner).
 *
 * @param initialValue - The initial value of the signal.
 * @param options.name - Optional name for dev-mode warnings.
 *
 * @example
 * ```ts
 * const count = signal(0)
 * const doubled = computed(() => count() * 2)
 * effect(() => console.log(doubled())) // logs 0, then 2 on count.set(1)
 * count.set(1)
 * ```
 */
export function signal<T>(initialValue: T, options?: { name?: string }): Signal<T> {
  const node = createSignalNode(initialValue)

  const getter = function (): T {
    if (import.meta.env.DEV) {
      if (getCurrentSubscriber() === null && getOwner() === null) {
        const label = options?.name ? ` "${options.name}"` : ''
        console.warn(
          `[Streem] Signal${label} read outside reactive context. This is likely a snapshot.`,
        )
      }
    }
    trackRead(node)
    return node.value
  } as Signal<T>

  getter.set = function (value: T): void {
    if (!Object.is(node.value, value)) {
      node.value = value
      notifySubscribers(node)
    }
  }

  return getter
}

// ---------------------------------------------------------------------------
// computed()
// ---------------------------------------------------------------------------

/**
 * Create a lazy computed value derived from reactive dependencies.
 *
 * The computation is re-evaluated only when read after a dependency changes
 * (lazy pull-based evaluation). The returned getter is itself trackable —
 * reading it inside an effect or another computed registers a dependency.
 *
 * Dev warning (DX-03): warns if created outside any owner scope — the
 * computed will never be automatically disposed, causing a memory leak.
 *
 * @param fn - Pure function that reads signals and returns a derived value.
 *
 * @example
 * ```ts
 * createRoot((dispose) => {
 *   const count = signal(0)
 *   const doubled = computed(() => count() * 2)
 *   console.log(doubled()) // 0
 *   count.set(3)
 *   console.log(doubled()) // 6
 * })
 * ```
 */
export function computed<T>(fn: () => T): () => T {
  if (import.meta.env.DEV) {
    if (getOwner() === null) {
      console.warn(
        '[Streem] computed() created without an active owner scope. ' +
        'This computation will never be automatically disposed (disposal leak).',
      )
    }
  }

  const owner = getCurrentOwner()
  const node = createComputedNode(fn, owner)

  // Register disposal with current owner so the computed is cleaned up
  // when the owner scope is disposed
  if (owner !== null) {
    onCleanup(() => {
      node.cleanup()
    })
  }

  const getter = function (): T {
    return readComputedNode(node)
  }

  return getter
}

// ---------------------------------------------------------------------------
// effect()
// ---------------------------------------------------------------------------

/**
 * Create a reactive side effect that re-runs when its dependencies change.
 *
 * The function is called immediately on creation, tracking all signal reads
 * as dependencies. It re-runs synchronously whenever any dependency changes.
 *
 * Returns a manual dispose function that stops the effect immediately
 * (independent of owner-scope disposal — both paths work).
 *
 * Dev warning (DX-03): warns if created outside any owner scope — the
 * effect will never be automatically disposed, causing a memory leak.
 *
 * Note: `onCleanup()` called inside the effect `fn` registers a callback
 * that fires BOTH before each re-run AND when the effect is disposed.
 *
 * @param fn - The effect function. May call `onCleanup()` for teardown.
 *
 * @example
 * ```ts
 * createRoot((dispose) => {
 *   const count = signal(0)
 *   const stop = effect(() => {
 *     console.log('count:', count())
 *     onCleanup(() => console.log('cleanup'))
 *   })
 *   count.set(1) // logs: cleanup, count: 1
 *   stop()       // logs: cleanup
 * })
 * ```
 */
export function effect(fn: () => void): () => void {
  if (import.meta.env.DEV) {
    if (getOwner() === null) {
      console.warn(
        '[Streem] effect() created without an active owner scope. ' +
        'This effect will never be automatically disposed (disposal leak).',
      )
    }
  }

  const owner = getCurrentOwner()
  const node = createEffectNode(fn, owner)

  // Register disposal with current owner so the effect is cleaned up
  // when the owner scope is disposed
  if (owner !== null) {
    onCleanup(() => {
      disposeEffect(node)
    })
  }

  // Return manual dispose function (independent of owner-scope disposal)
  return function dispose(): void {
    disposeEffect(node)
  }
}
