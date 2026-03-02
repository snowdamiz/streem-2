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
 *  - currentSubscriber is exported as a live ES module binding so signal
 *    getters can read it without a function call.
 *  - Link objects are pooled and reused across clearDeps calls to reduce GC
 *    pressure in effect-heavy loops.
 *  - Dep reuse: runEffect sets depScan = depHead before calling fn(). addLink
 *    checks depScan first and reuses the existing Link object when the source
 *    matches. For effects with stable deps this eliminates all link
 *    allocation / deallocation on re-runs.
 *  - currentEffectCleanupTarget lives in this module (not owner.ts) so that
 *    runEffect can assign it directly instead of making a cross-module call.
 */

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
  /**
   * Dep-reuse cursor. Set to depHead before each effect run. addLink advances
   * it when the next expected dep matches, enabling O(1) reuse for stable deps.
   * null means "no reuse in progress" (computed nodes always leave this null).
   */
  depScan: Link | null
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
  depScan: Link | null
  owner: OwnerRef | null
  /**
   * Snapshot of notifyVersion when this computed was last marked Pending.
   * Prevents re-marking a computed Pending during a single propagation wave
   * when it was already dirtied and re-evaluated (and re-subscribed to its
   * source). Without this guard, the newly-created subscriber link would be
   * re-processed by the outer propagateDirty walk, marking the computed
   * Pending a second time but without running the subscriber effect (blocked
   * by the effect's own notifyVersion guard). This leaves the computed
   * permanently Pending, freezing all future updates.
   */
  notifyVersion: number
}

export interface EffectNode extends SubscriberNode {
  readonly nodeType: NodeType.Effect
  fn: () => void
  depHead: Link | null
  depTail: Link | null
  depScan: Link | null
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

/**
 * The currently active subscriber (effect or computed being evaluated).
 * Exported as a live ES module binding — signal getters read it directly
 * without a function call for maximum V8 optimization.
 */
export let currentSubscriber: SubscriberNode | null = null

/** Internal setter — ES module exported `let` is read-only externally */
function setCurrentSubscriber(sub: SubscriberNode | null): void {
  currentSubscriber = sub
}

/**
 * The currently executing effect, used by onCleanup() in owner.ts to register
 * per-run cleanup callbacks. Exported as a live binding so owner.ts can read
 * it directly without a function call (owner.ts imports reactive.ts; not vice
 * versa — no circular dependency).
 */
export let currentEffectCleanupTarget: EffectNode | null = null

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
// Link pool — reuse Link objects across clearDeps calls to reduce GC pressure
// ---------------------------------------------------------------------------

const linkPool: Link[] = []

function acquireLink(): Link {
  return linkPool.pop() ?? {
    source: null!,
    sub: null!,
    prevSub: null,
    nextSub: null,
    prevDep: null,
    nextDep: null,
  }
}

function releaseLink(link: Link): void {
  link.source = null!
  link.sub = null!
  link.prevSub = null
  link.nextSub = null
  link.prevDep = null
  link.nextDep = null
  linkPool.push(link)
}

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
// Linked list operations
// ---------------------------------------------------------------------------

/**
 * Remove all of sub's tracked dependencies from their source subscriber lists,
 * then clear sub's dep list. Called before re-running a computed (which always
 * re-tracks) and on disposal paths.
 *
 * Effects use dep reuse (see runEffect / addLink) instead of clearDeps for
 * re-runs, so clearDeps is only called during disposal for effects.
 *
 * Link objects are returned to the pool for reuse.
 */
function clearDeps(sub: SubscriberNode): void {
  let link = sub.depHead
  while (link !== null) {
    const nextDep = link.nextDep  // capture before releaseLink zeros it
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
    releaseLink(link)
    link = nextDep
  }
  sub.depHead = null
  sub.depTail = null
}

/**
 * Remove links from `from` to the end of sub's dep list.
 * Unlinks each from its source's subscriber list and releases to the pool.
 * Updates sub.depHead if `from` is the head; does NOT update sub.depTail
 * (callers maintain depTail themselves via the depScan match loop).
 *
 * Used by addLink (dep order changed mid-run) and runEffect's finally block
 * (stale deps not re-read this run).
 */
function removeDepTail(sub: SubscriberNode, from: Link): void {
  const prev = from.prevDep
  if (prev !== null) {
    prev.nextDep = null
  } else {
    sub.depHead = null
  }

  let link: Link | null = from
  while (link !== null) {
    const nextDep: Link | null = link.nextDep
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
    releaseLink(link)
    link = nextDep
  }
}

/**
 * Register `source` as a dependency of `currentSubscriber`.
 * Called from the signal `.value` getter after confirming currentSubscriber !== null.
 * Skips the null check — caller is responsible for the guard.
 *
 * Dep reuse: if sub.depScan is non-null and points to a link for this source,
 * the existing link is kept in place (O(1), no allocation). Only when the
 * source doesn't match do we fall through to acquire a fresh link.
 */
export function addLink(source: SourceNode): void {
  const sub = currentSubscriber!
  const scan = sub.depScan

  if (scan !== null) {
    if (scan.source === source) {
      // Stable dep — existing link is already correct, just advance the cursor
      sub.depScan = scan.nextDep
      sub.depTail = scan
      return
    }
    // Dep order changed at this position — remove the stale tail and fall through
    sub.depScan = null
    removeDepTail(sub, scan)
  }

  const link = acquireLink()
  link.source = source
  link.sub = sub
  link.prevSub = source.subTail
  link.nextSub = null
  link.prevDep = sub.depTail
  link.nextDep = null

  // Append to source's subscriber list
  if (source.subTail !== null) {
    source.subTail.nextSub = link
  } else {
    source.subHead = link
  }
  source.subTail = link

  // Append to subscriber's dep list
  if (sub.depTail !== null) {
    sub.depTail.nextDep = link
  } else {
    sub.depHead = link
  }
  sub.depTail = link
}

/**
 * Register the current subscriber as a reader of this source.
 * Creates a Link and appends it to both lists in O(1).
 * Thin wrapper around addLink — preserves the null check for callers
 * that may not know whether tracking is active.
 */
export function trackRead(source: SourceNode): void {
  if (currentSubscriber === null) return
  addLink(source)
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
 * may mutate the subscriber list (dep reuse keeps the link in place; dep
 * changes may remove it). The captured next pointer remains valid in both
 * cases.
 *
 * The notifyVersion guard prevents double-execution and stale-Pending state:
 *
 * Effects: if an effect re-subscribes to this source during its own run,
 * its link is already in the list. effect.notifyVersion === notifyVersion
 * causes us to skip it.
 *
 * Computeds: an effect running mid-propagation calls clearDeps(computed)
 * then re-evaluates, re-appending the computed's link to its source's tail.
 * The outer propagateDirty walk then encounters this new link. Without the
 * guard it would mark the computed Pending again (even though it was just
 * re-evaluated) and recurse — but the subscriber effect's notifyVersion guard
 * would prevent it from running. The computed would be left permanently Pending,
 * freezing all future updates. computed.notifyVersion === notifyVersion skips
 * the already-processed computed.
 */
function propagateDirty(source: SourceNode): void {
  let link = source.subHead
  while (link !== null) {
    const next = link.nextSub   // capture before any mutation
    const sub = link.sub

    // A released link has sub=null (zeroed by releaseLink). This can happen
    // when removeDepTail releases a link whose nextSub was already captured
    // as `next` in a previous iteration. Skip it.
    if (sub === null) {
      link = next
      continue
    }

    if (sub.nodeType === NodeType.Computed) {
      const computed = sub as ComputedNode<unknown>
      if (computed.notifyVersion !== notifyVersion) {
        computed.notifyVersion = notifyVersion
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
 * Run an effect: fire cleanup callbacks, set up dep reuse scan, re-run.
 *
 * Instead of calling clearDeps before running (which removes all links and
 * forces addLink to re-allocate them), we set depScan = depHead and depTail =
 * null. addLink then reuses existing links for sources that match in order.
 * Any stale links (sources not re-read) are removed in the finally block.
 *
 * For effects with stable dependencies this eliminates all link churn:
 * no releaseLink, no acquireLink, no pointer writes to the source's sub list.
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

  // Dep reuse: start scanning from the head of the existing dep list.
  // addLink will advance depScan and reuse matching links in O(1).
  effect.depScan = effect.depHead
  effect.depTail = null

  const prevSubscriber = currentSubscriber
  setCurrentSubscriber(effect)
  currentEffectCleanupTarget = effect   // direct assignment — no cross-module call

  try {
    effect.fn()
  } finally {
    // Remove any deps from the previous run that weren't re-read this time
    if (effect.depScan !== null) {
      removeDepTail(effect, effect.depScan)
      effect.depScan = null
    }
    setCurrentSubscriber(prevSubscriber)
    currentEffectCleanupTarget = null   // direct assignment — no cross-module call
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
    depScan: null,
    owner,
    notifyVersion: 0,
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
  setCurrentSubscriber(node)
  node.computing = true

  try {
    node.value = node.fn()
    node.state = ComputedState.Clean
  } finally {
    node.computing = false
    setCurrentSubscriber(prevSubscriber)
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
    depScan: null,
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
