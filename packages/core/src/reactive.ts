/**
 * @streem/core — Internal push-pull reactive graph
 *
 * This module is NOT part of the public API. It contains the internal node
 * types and the push-pull algorithm that signal.ts builds on top of.
 *
 * Algorithm:
 *  - Source signals eagerly push dirty notifications to all subscribers
 *  - Computed values are lazy: marked Pending on dirty notification, re-evaluated only when read
 *  - Effects are eager: re-run synchronously when notified dirty
 *
 * Design note: reactive.ts does NOT import from owner.ts to avoid circular
 * dependencies. The owner association is injected by callers (signal.ts /
 * owner.ts passes the current owner when creating nodes).
 */

import { setCurrentEffectCleanupTarget } from './owner.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A node that can be subscribed to (read from) */
export interface SourceNode {
  subs: Set<SubscriberNode>
  value: unknown
}

/** A node that can subscribe to sources (reads from them) */
export interface SubscriberNode {
  readonly _type: string
  deps: Set<SourceNode>
  /** Clean up stale subscriptions and registered onCleanup callbacks */
  cleanup(): void
  /** Re-run / re-evaluate this subscriber */
  run(): void
}

export interface SignalNode<T> extends SourceNode {
  readonly _type: 'signal'
  value: T
  subs: Set<SubscriberNode>
}

export const enum ComputedState {
  Clean = 0,
  Pending = 1,
}

/** Owner handle — opaque reference; full type lives in owner.ts */
export interface OwnerRef {
  cleanups: (() => void)[] | null
}

export interface ComputedNode<T> extends SourceNode, SubscriberNode {
  readonly _type: 'computed'
  fn: () => T
  value: T
  state: ComputedState
  computing: boolean
  subs: Set<SubscriberNode>
  deps: Set<SourceNode>
  owner: OwnerRef | null
}

export interface EffectNode extends SubscriberNode {
  readonly _type: 'effect'
  fn: () => void
  deps: Set<SourceNode>
  owner: OwnerRef | null
  /** onCleanup callbacks registered during this effect's last run */
  cleanupFns: (() => void)[]
  disposed: boolean
}

// ---------------------------------------------------------------------------
// Global tracking state
// ---------------------------------------------------------------------------

/** The currently active subscriber (effect or computed being evaluated) */
let currentSubscriber: SubscriberNode | null = null

/** Re-entrant notification guard */
let notifying = false

/** Sources queued for notification when a re-entrant write occurs during notification */
let pendingNotifications: SourceNode[] = []

// ---------------------------------------------------------------------------
// Batching stub (Phase 3 batch() extension point)
// ---------------------------------------------------------------------------

/** When true, effect runs are deferred to the end of the batch */
export let isBatching = false

/** Effects queued during batching (Set provides O(1) add and automatic deduplication) */
const batchedEffects: Set<EffectNode> = new Set()

/** Enable batching mode — called by future batch() implementation in Phase 3 */
export function startBatch(): void {
  isBatching = true
}

/** Flush all queued effects and disable batching — called by future batch() */
export function endBatch(): void {
  isBatching = false
  const effects = [...batchedEffects]
  batchedEffects.clear()
  for (const effect of effects) {
    if (!effect.disposed) {
      runEffect(effect)
    }
  }
}

// ---------------------------------------------------------------------------
// Public API (used by owner.ts and signal.ts)
// ---------------------------------------------------------------------------

/**
 * Returns the currently active subscriber (effect or computed being evaluated).
 * Used by the public signal() getter for DX-02 warning check.
 */
export function getCurrentSubscriber(): SubscriberNode | null {
  return currentSubscriber
}

/**
 * Register the current subscriber as a reader of this source.
 * Called during signal/computed reads.
 */
export function trackRead(source: SourceNode): void {
  if (currentSubscriber !== null) {
    source.subs.add(currentSubscriber)
    currentSubscriber.deps.add(source)
  }
}

/**
 * Push dirty notifications to all subscribers of this source.
 * - Computed subscribers: mark Pending (lazy re-evaluation on next read)
 * - Effect subscribers: re-run synchronously (or queue if batching)
 */
export function notifySubscribers(source: SourceNode): void {
  // Re-entrant guard: if already notifying, queue this source
  if (notifying) {
    pendingNotifications.push(source)
    return
  }

  notifying = true

  try {
    propagateDirty(source)
  } finally {
    notifying = false
  }

  // Flush queued notifications from re-entrant writes
  if (pendingNotifications.length > 0) {
    const pending = pendingNotifications.splice(0)
    for (const pendingSource of pending) {
      notifySubscribers(pendingSource)
    }
  }
}

/**
 * Propagate dirty notifications through the subscriber graph.
 * Must be called with notifying=true to prevent re-entrant notification loops.
 */
function propagateDirty(source: SourceNode): void {
  // Snapshot subscribers to avoid mutation during iteration.
  // runEffect() calls source.subs.delete() on stale deps during re-run,
  // which would mutate source.subs mid-iteration and corrupt V8's Set iterator.
  const subs = [...source.subs]

  for (const sub of subs) {
    if (sub._type === 'computed') {
      const computed = sub as ComputedNode<unknown>
      if (computed.state === ComputedState.Clean) {
        // Mark dirty and propagate to computed's own subscribers
        computed.state = ComputedState.Pending
        if (computed.subs.size > 0) {
          propagateDirty(computed)
        }
      }
    } else if (sub._type === 'effect') {
      const effect = sub as EffectNode
      if (!effect.disposed) {
        if (isBatching) {
          batchedEffects.add(effect) // Set.add() is idempotent — no .includes() check needed
        } else {
          runEffect(effect)
        }
      }
    }
  }
}

/**
 * Run an effect: fire cleanup callbacks, clear stale deps, re-track deps.
 */
function runEffect(effect: EffectNode): void {
  if (effect.disposed) return

  // 1. Fire onCleanup callbacks registered in the previous run (Pitfall 5)
  //    These are callbacks registered via onCleanup() inside the effect body.
  for (const fn of effect.cleanupFns) {
    fn()
  }
  effect.cleanupFns = []

  // 2. Clear stale dependency subscriptions (prevent ghost subscriptions, Pitfall 1)
  for (const source of effect.deps) {
    source.subs.delete(effect)
  }
  effect.deps.clear()

  // 3. Run the effect function under this subscriber context.
  //    Set the effect as the current cleanup target so that onCleanup() calls
  //    inside the effect body register on effect.cleanupFns (per-run cleanup)
  //    rather than on the owner's cleanup list (disposal-only cleanup).
  const prevSubscriber = currentSubscriber
  currentSubscriber = effect
  setCurrentEffectCleanupTarget(effect)

  try {
    effect.fn()
  } finally {
    currentSubscriber = prevSubscriber
    setCurrentEffectCleanupTarget(null)
  }
}

// ---------------------------------------------------------------------------
// Node constructors
// ---------------------------------------------------------------------------

/**
 * Create an internal signal node with an initial value.
 */
export function createSignalNode<T>(value: T): SignalNode<T> {
  return {
    _type: 'signal',
    value,
    subs: new Set(),
  }
}

/**
 * Create a lazy computed node.
 *
 * @param fn - The function to evaluate when the computed value is needed.
 * @param owner - The owner scope this computed belongs to (for disposal).
 *
 * The fn is NOT called here — the first call to readComputedNode() triggers it.
 */
export function createComputedNode<T>(fn: () => T, owner: OwnerRef | null = null): ComputedNode<T> {
  const node: ComputedNode<T> = {
    _type: 'computed',
    fn,
    value: undefined as unknown as T, // will be set on first read
    state: ComputedState.Pending,     // needs evaluation
    computing: false,
    subs: new Set(),
    deps: new Set(),
    owner,
    cleanup() {
      // Remove from all source subscriptions (called on computed disposal)
      for (const source of node.deps) {
        source.subs.delete(node)
      }
      node.deps.clear()
    },
    run() {
      // Computed "run" = mark as pending for lazy re-evaluation
      node.state = ComputedState.Pending
    },
  }
  return node
}

/**
 * Read a computed node's current value, re-evaluating if dirty (Pending).
 * Called by the public computed() getter.
 */
export function readComputedNode<T>(node: ComputedNode<T>): T {
  if (node.state === ComputedState.Clean) {
    // Still up to date — track read and return cached value
    trackRead(node)
    return node.value
  }

  // Circular dependency detection (Pitfall 4)
  if (node.computing) {
    if (import.meta.env.DEV) {
      throw new Error(
        '[Streem] Circular dependency detected: a computed value depends on itself.',
      )
    }
    // In prod: return last cached value to break the cycle
    return node.value
  }

  // 1. Clear stale subscriptions before re-evaluating
  for (const source of node.deps) {
    source.subs.delete(node)
  }
  node.deps.clear()

  // 2. Evaluate under this computed as the active subscriber
  const prevSubscriber = currentSubscriber
  currentSubscriber = node
  node.computing = true

  try {
    node.value = node.fn()
    node.state = ComputedState.Clean
  } finally {
    node.computing = false
    currentSubscriber = prevSubscriber
  }

  // 3. Register this computed as a dependency of the outer subscriber (if any)
  trackRead(node)

  return node.value
}

/**
 * Create an eager effect node and run it immediately.
 *
 * @param fn - The effect function to run.
 * @param owner - The owner scope this effect belongs to (for disposal and cleanup registration).
 *
 * The effect re-runs synchronously whenever any tracked dependency changes.
 * The owner is responsible for calling disposeEffect(effect) on scope disposal.
 *
 * Note: The effect does NOT register itself with owner.cleanups here.
 * The public effect() wrapper in signal.ts (Plan 01-02) handles that by calling
 * onCleanup(() => disposeEffect(effect)) after creation.
 */
export function createEffectNode(fn: () => void, owner: OwnerRef | null = null): EffectNode {
  const effect: EffectNode = {
    _type: 'effect',
    fn,
    deps: new Set(),
    owner,
    cleanupFns: [],
    disposed: false,
    cleanup() {
      // Full cleanup: remove subscriptions and fire registered cleanups
      for (const source of effect.deps) {
        source.subs.delete(effect)
      }
      effect.deps.clear()
      for (const cleanupFn of effect.cleanupFns) {
        cleanupFn()
      }
      effect.cleanupFns = []
    },
    run() {
      runEffect(effect)
    },
  }

  // Run immediately on creation
  runEffect(effect)

  return effect
}

/**
 * Dispose an effect: fire cleanups, remove subscriptions, mark disposed.
 * Safe to call multiple times (idempotent).
 */
export function disposeEffect(effect: EffectNode): void {
  if (effect.disposed) return
  effect.disposed = true

  // Fire registered cleanup callbacks one final time
  for (const fn of effect.cleanupFns) {
    fn()
  }
  effect.cleanupFns = []

  // Remove from all source subscriptions
  for (const source of effect.deps) {
    source.subs.delete(effect)
  }
  effect.deps.clear()
}
