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
 *
 * Performance model:
 *  - Subscriber tracking uses doubly-linked lists instead of Sets.
 *    This eliminates new Set() per node, Set.add/delete hash overhead,
 *    and the [...source.subs] spread snapshot on every notify.
 *  - NodeType uses a const enum (integer) instead of string literals.
 *    Integer comparisons are faster than string comparisons.
 *  - notifySubscribers returns immediately when there are no subscribers.
 *  - cleanupFns on EffectNode is null until first onCleanup() call.
 *  - notifyVersion prevents double-execution when an effect re-subscribes
 *    during its own run (a subtlety of linked-list traversal vs Set snapshot).
 */

import { setCurrentEffectCleanupTarget } from './owner.js'

// ---------------------------------------------------------------------------
// Node type discriminants (integer const enum — inlined to 0/1/2 by tsc)
// ---------------------------------------------------------------------------

export const enum NodeType {
  Signal   = 0,
  Computed = 1,
  Effect   = 2,
}

// ---------------------------------------------------------------------------
// Link: one object per dependency edge (sub reads from source)
//
// Doubly-linked in two dimensions:
//   prevSub / nextSub  — this source's subscriber list (all nodes that read source)
//   prevDep / nextDep  — this subscriber's dependency list (all sources sub reads)
//
// Replaces Set<SubscriberNode> on sources and Set<SourceNode> on subscribers.
// Eliminates: new Set() per node, hash operations, [...spread] snapshots.
// ---------------------------------------------------------------------------

export interface Link {
  source: SourceNode
  sub: SubscriberNode
  // In source's subscriber list
  prevSub: Link | null
  nextSub: Link | null
  // In subscriber's dependency list
  prevDep: Link | null
  nextDep: Link | null
}

// ---------------------------------------------------------------------------
// Node interfaces
// ---------------------------------------------------------------------------

/** A node that can be subscribed to (read from) */
export interface SourceNode {
  subHead: Link | null   // head of subscriber linked list
  subTail: Link | null   // tail for O(1) append
  value: unknown
}

/** A node that can subscribe to sources (reads from them) */
export interface SubscriberNode {
  readonly nodeType: NodeType
  depHead: Link | null   // head of dependency linked list
  depTail: Link | null   // tail for O(1) append
  cleanup(): void
  run(): void
}

export interface SignalNode<T> extends SourceNode {
  readonly nodeType: NodeType.Signal
  value: T
}

export const enum ComputedState {
  Clean   = 0,
  Pending = 1,
}

/** Owner handle — opaque reference; full type lives in owner.ts */
export interface OwnerRef {
  cleanups: (() => void)[] | null
}

export interface ComputedNode<T> extends SourceNode, SubscriberNode {
  readonly nodeType: NodeType.Computed
  fn: () => T
  value: T
  state: ComputedState
  computing: boolean
  subHead: Link | null
  subTail: Link | null
  depHead: Link | null
  depTail: Link | null
  owner: OwnerRef | null
}

export interface EffectNode extends SubscriberNode {
  readonly nodeType: NodeType.Effect
  fn: () => void
  depHead: Link | null
  depTail: Link | null
  owner: OwnerRef | null
  /** onCleanup callbacks — null until first onCleanup() call (lazy allocation) */
  cleanupFns: (() => void)[] | null
  disposed: boolean
  /**
   * Snapshot of notifyVersion when this effect was last scheduled.
   * Prevents double-execution when an effect re-subscribes during its own
   * run and its new link is encountered later in the same propagation walk.
   */
  notifyVersion: number
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
// Notification version counter
//
// Incremented on each top-level notifySubscribers call.
// When propagateDirty schedules an effect, it records the current notifyVersion
// on the effect. If the effect re-subscribes to the same source during its run,
// its new Link will appear at the tail of the source's subscriber list. Without
// this guard, the propagation walk would encounter the new link and run the effect
// a second time. The version check prevents that.
// ---------------------------------------------------------------------------

let notifyVersion = 0

// ---------------------------------------------------------------------------
// Batching
// ---------------------------------------------------------------------------

/** When true, effect runs are deferred to the end of the batch */
export let isBatching = false

/** Effects queued during batching — Set gives O(1) add and automatic deduplication */
const batchedEffects: Set<EffectNode> = new Set()

/** Enable batching mode */
export function startBatch(): void {
  isBatching = true
}

/** Flush all queued effects and disable batching */
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
// Public API (used by signal.ts)
// ---------------------------------------------------------------------------

export function getCurrentSubscriber(): SubscriberNode | null {
  return currentSubscriber
}

// ---------------------------------------------------------------------------
// Linked list operations
// ---------------------------------------------------------------------------

/**
 * Remove all of sub's tracked dependencies from their source subscriber lists,
 * then clear sub's dep list. Called before re-running an effect or computed
 * to discard stale subscriptions.
 *
 * Only touches the source's subscriber list (prevSub/nextSub pointers).
 * The dep list is cleared by nulling depHead/depTail at the end.
 */
function clearDeps(sub: SubscriberNode): void {
  let link = sub.depHead
  while (link !== null) {
    const prevSub = link.prevSub
    const nextSub = link.nextSub
    if (prevSub !== null) {
      prevSub.nextSub = nextSub
    } else {
      link.source.subHead = nextSub
    }
    if (nextSub !== null) {
      nextSub.prevSub = prevSub
    } else {
      link.source.subTail = prevSub
    }
    link = link.nextDep
  }
  sub.depHead = null
  sub.depTail = null
}

/**
 * Register the current subscriber as a reader of this source.
 * Creates a Link and appends it to both lists in O(1).
 */
export function trackRead(source: SourceNode): void {
  if (currentSubscriber === null) return

  const link: Link = {
    source,
    sub: currentSubscriber,
    prevSub: source.subTail,
    nextSub: null,
    prevDep: currentSubscriber.depTail,
    nextDep: null,
  }

  // Append to source's subscriber list
  if (source.subTail !== null) {
    source.subTail.nextSub = link
  } else {
    source.subHead = link
  }
  source.subTail = link

  // Append to subscriber's dep list
  if (currentSubscriber.depTail !== null) {
    currentSubscriber.depTail.nextDep = link
  } else {
    currentSubscriber.depHead = link
  }
  currentSubscriber.depTail = link
}

/**
 * Push dirty notifications to all subscribers of this source.
 * Returns immediately if there are no subscribers (common case for fresh signals).
 */
export function notifySubscribers(source: SourceNode): void {
  if (source.subHead === null) return  // fast path: no subscribers — zero overhead

  if (notifying) {
    pendingNotifications.push(source)
    return
  }

  notifying = true
  notifyVersion++

  try {
    propagateDirty(source)
  } finally {
    notifying = false
  }

  // Flush any sources that were written to re-entrantly during notification
  if (pendingNotifications.length > 0) {
    const pending = pendingNotifications.splice(0)
    for (const pendingSource of pending) {
      notifySubscribers(pendingSource)
    }
  }
}

/**
 * Walk the subscriber linked list and propagate dirty state.
 *
 * Computed nodes: mark Pending (lazy re-evaluation on next read).
 * Effect nodes: run immediately (or enqueue if batching).
 *
 * We capture link.nextSub before running each effect. Running the effect
 * calls clearDeps() which removes the effect's current links, then the
 * effect re-reads its sources adding new links at the tail. The captured
 * next pointer remains valid because we only removed the current link.
 *
 * The notifyVersion guard prevents double-execution: if an effect re-subscribes
 * to this source during its own run, its new link appears at the tail.
 * effect.notifyVersion === notifyVersion causes us to skip it.
 */
function propagateDirty(source: SourceNode): void {
  let link = source.subHead
  while (link !== null) {
    const next = link.nextSub   // capture before any mutation
    const sub = link.sub

    if (sub.nodeType === NodeType.Computed) {
      const computed = sub as ComputedNode<unknown>
      if (computed.state === ComputedState.Clean) {
        computed.state = ComputedState.Pending
        if (computed.subHead !== null) {
          propagateDirty(computed)
        }
      }
    } else {
      const effect = sub as EffectNode
      if (!effect.disposed && effect.notifyVersion !== notifyVersion) {
        effect.notifyVersion = notifyVersion
        if (isBatching) {
          batchedEffects.add(effect)
        } else {
          runEffect(effect)
        }
      }
    }

    link = next
  }
}

/**
 * Run an effect: fire cleanup callbacks, clear stale deps, re-run.
 */
function runEffect(effect: EffectNode): void {
  if (effect.disposed) return

  // Fire onCleanup callbacks from the previous run
  if (effect.cleanupFns !== null) {
    for (const fn of effect.cleanupFns) {
      fn()
    }
    effect.cleanupFns = null
  }

  // Clear stale subscriptions before re-tracking
  clearDeps(effect)

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

export function createSignalNode<T>(value: T): SignalNode<T> {
  return {
    nodeType: NodeType.Signal,
    value,
    subHead: null,
    subTail: null,
  }
}

export function createComputedNode<T>(fn: () => T, owner: OwnerRef | null = null): ComputedNode<T> {
  const node: ComputedNode<T> = {
    nodeType: NodeType.Computed,
    fn,
    value: undefined as unknown as T,
    state: ComputedState.Pending,
    computing: false,
    subHead: null,
    subTail: null,
    depHead: null,
    depTail: null,
    owner,
    cleanup() {
      clearDeps(node)
    },
    run() {
      node.state = ComputedState.Pending
    },
  }
  return node
}

/**
 * Read a computed node's current value, re-evaluating if dirty.
 */
export function readComputedNode<T>(node: ComputedNode<T>): T {
  if (node.state === ComputedState.Clean) {
    trackRead(node)
    return node.value
  }

  if (node.computing) {
    if (import.meta.env.DEV) {
      throw new Error(
        '[Streem] Circular dependency detected: a computed value depends on itself.',
      )
    }
    return node.value
  }

  // Clear stale subscriptions before re-evaluating
  clearDeps(node)

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

  // Register this computed as a dependency of the outer subscriber (if any)
  trackRead(node)

  return node.value
}

export function createEffectNode(fn: () => void, owner: OwnerRef | null = null): EffectNode {
  const effect: EffectNode = {
    nodeType: NodeType.Effect,
    fn,
    depHead: null,
    depTail: null,
    owner,
    cleanupFns: null,   // lazy — only allocated when onCleanup() is called
    disposed: false,
    notifyVersion: 0,
    cleanup() {
      clearDeps(effect)
      if (effect.cleanupFns !== null) {
        for (const fn of effect.cleanupFns) {
          fn()
        }
        effect.cleanupFns = null
      }
    },
    run() {
      runEffect(effect)
    },
  }

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

  if (effect.cleanupFns !== null) {
    for (const fn of effect.cleanupFns) {
      fn()
    }
    effect.cleanupFns = null
  }

  clearDeps(effect)
}
