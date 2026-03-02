---
phase: 02-jsx-runtime-and-component-model
plan: "03"
subsystem: ui
tags: [jsx, tsx, dom, reactive, signals, effect, createRoot, onMount, Show, For, happy-dom, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-reactive-core
    provides: effect(), onCleanup(), createRoot() — used by Show/For for scope isolation
  - plan: 02-01
    provides: h() factory, Fragment, render() — component model runs via these primitives
  - plan: 02-02
    provides: bindings.ts bind* functions — Show/For children can use reactive bindings

provides:
  - "components.ts: onMount(), Show(), For() — lifecycle and conditional/list rendering primitives"
  - "onMount(): fn() called once synchronously; cleanup return value registered via onCleanup() on owner"
  - "Show(): DocumentFragment-first DOM insertion; anchor comment for stable reactivity; createRoot per shown state"
  - "For(): keyed Map<key, RowEntry> reconciliation; createRoot per item; insertBefore reorder without DOM teardown"
  - "index.ts updated: exports Show, For, onMount alongside h, Fragment, render"
  - "TDD test suites: 26 tests covering lifecycle, Show condition toggling/scope, For add/remove/reorder/index"

affects:
  - 02-04-error-boundary
  - 02-05-vite-hmr

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fragment-first DOM insertion: append anchor to fragment before effect runs — anchor.parentNode is fragment during initial render, real DOM after appendChild(fragment)"
    - "onMount = direct fn() call (not inside effect()) — avoids signal tracking; snapshot semantics enforced by absence of currentSubscriber"
    - "Show children as render function: () => Node enables createRoot scope per shown state; scope disposal stops all child effects"
    - "For reconciler: Map<key, {dispose, nodes, setIndex, getIndex}> — stale keys disposed, new keys createRooted, all keys insertBefore anchor for O(n) reorder"
    - "Index as mutable ref: let indexRef = i; setIndex updates ref, getIndex closure reads it — no signal needed, no DOM teardown on reorder"

key-files:
  created:
    - packages/dom/src/components.ts
    - packages/dom/tests/lifecycle.test.ts
    - packages/dom/tests/show.test.ts
    - packages/dom/tests/for.test.ts
  modified:
    - packages/dom/src/index.ts

key-decisions:
  - "onMount implemented without effect() wrapper — direct fn() call avoids establishing reactive subscriptions; onCleanup() registers cleanup on owner for disposal-time teardown"
  - "Show/For return DocumentFragment instead of Comment anchor — fragment must be pre-populated with anchor before effect runs so anchor.parentNode is non-null during initial insertion"
  - "Show children accepts function type (() => Node) — render function required for Show to create children inside its own createRoot scope; scope disposal on hide stops child effects"

patterns-established:
  - "Pattern: DocumentFragment-first insertion — create anchor, append to fragment, run effect (initial nodes go into fragment before anchor), return fragment"
  - "Pattern: createRoot per conditional branch in Show — each shown state gets its own owner; hiding disposes the scope"
  - "Pattern: createRoot per list item in For — item removal disposes its scope, stopping all effects in that item's subtree"
  - "Pattern: insertBefore anchor for ordered DOM — all items reordered by calling insertBefore(node, anchor) in array order; existing nodes are moved, not recreated"

requirements-completed: [COMP-02, COMP-03, COMP-04, COMP-05]

# Metrics
duration: 7min
completed: 2026-02-28
---

# Phase 2 Plan 03: onMount, Show, For Components Summary

**onMount() calls fn once synchronously without reactive tracking (snapshot semantics), Show() swaps DOM subtrees with per-state createRoot scopes, For() reconciles keyed lists with surgical add/remove/reorder via a Map — all using DocumentFragment-first DOM insertion so anchor comments are attached before effects need parentNode**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-28T05:33:02Z
- **Completed:** 2026-02-28T05:40:00Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 5

## Accomplishments

- Implemented `packages/dom/src/components.ts` with `onMount()`, `Show()`, and `For()` — the three component lifecycle/rendering primitives
- `onMount()` calls `fn()` directly (not inside `effect()`) so signal reads are untracked snapshots; cleanup return value is registered via `onCleanup()` on the current owner scope — fires on component disposal
- `Show()` uses a DocumentFragment with the anchor pre-appended so the initial render can insert children before the anchor (inside the fragment); returning the fragment lets callers do `container.appendChild(frag)` to atomically move all nodes
- `Show()` accepts `children` as a render function `() => Node` — calling it inside a fresh `createRoot` on each show gives each shown state its own scope; hiding disposes that scope, stopping all effects created during that render
- `For()` uses a `Map<key, RowEntry>` reconciler — on each list update: stale entries are disposed and removed, new entries get their own `createRoot` scope, and all entries are re-ordered via `insertBefore(node, anchor)` without recreating DOM nodes
- Index getter implemented as a mutable ref closure (`let indexRef = i; () => indexRef`) — `setIndex(newIndex)` updates the ref on reorder; no signal needed, no DOM teardown for index changes
- Updated `packages/dom/src/index.ts` to export `Show`, `For`, `onMount` alongside existing exports
- All 58 `/dom` tests pass (32 existing + 26 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD RED — failing tests for lifecycle, show, for** - `239de6c` (test)
2. **Task 2: TDD GREEN — implementation + test corrections** - `39b0d23` (feat)

## Files Created/Modified

- `packages/dom/src/components.ts` - onMount, Show, For implementation
- `packages/dom/src/index.ts` - Updated exports to include Show, For, onMount
- `packages/dom/tests/lifecycle.test.ts` - 7 tests: onMount fires once, cleanup, COMP-02 proof
- `packages/dom/tests/show.test.ts` - 9 tests: static conditions, reactive toggling, scope disposal
- `packages/dom/tests/for.test.ts` - 10 tests: add, remove, reorder, index getter, edge cases

## Decisions Made

- **onMount without effect()**: The plan suggested `effect(() => fn())` but this causes signal reads inside `fn()` to become reactive dependencies (effect re-runs on signal change). The correct implementation calls `fn()` directly — outside any effect subscriber context, signal reads are snapshots. Cleanup registered via `onCleanup()` on the owner.
- **DocumentFragment-first DOM insertion**: The plan suggested returning a Comment anchor from Show/For, but the initial `effect()` run happens before the caller can append the anchor to the DOM (`anchor.parentNode` would be null). Fix: pre-append anchor to a DocumentFragment, run the effect (initial nodes go into the fragment before anchor), return the fragment. The caller appends the fragment atomically.
- **Show children as render function**: The plan's behavior spec says "child scope disposed when switching to fallback — no effect leaks." This requires Show to create children inside its own `createRoot` scope. Passing a pre-created Node doesn't give Show scope ownership. Fix: children accepts `() => Node` render function, called inside `createRoot` on each show.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] onMount() used effect() causing signal reads to be reactive**
- **Found during:** Task 2 (GREEN — lifecycle "signal read inside onMount is a snapshot" test failed)
- **Issue:** Plan's suggested implementation `effect(() => fn())` establishes reactive tracking. When `fn()` reads a signal, that signal becomes a dependency of the effect — causing re-runs when the signal changes. This violates the COMP-02 "runs once" guarantee.
- **Fix:** Replaced `effect(() => fn())` with direct `fn()` call followed by `onCleanup()` registration. Outside an effect body, signal reads do not track (no `currentSubscriber`). This is the correct snapshot semantics.
- **Files modified:** packages/dom/src/components.ts
- **Verification:** lifecycle.test.ts "signal read inside onMount is a snapshot" passes

**2. [Rule 1 - Bug] Show/For returned Comment anchor — parentNode null during initial effect run**
- **Found during:** Task 2 (GREEN — Show static render tests returned empty container)
- **Issue:** The plan specified returning a Comment anchor from Show/For. The `effect()` runs immediately during construction before the caller appends the anchor to any parent — `anchor.parentNode` is null. No nodes are inserted on first render.
- **Fix:** Return a DocumentFragment instead. Pre-append the anchor to the fragment before running the effect so `anchor.parentNode === frag` during initial render. Nodes are inserted into the fragment before the anchor. The caller's `container.appendChild(frag)` atomically moves all nodes into the real DOM parent. Subsequent effect runs find `anchor.parentNode === container`.
- **Files modified:** packages/dom/src/components.ts, tests updated to use `frag = Show(...); container.appendChild(frag)`
- **Verification:** All Show/For tests pass

**3. [Rule 1 - Bug] Show test passed pre-created child node instead of render function**
- **Found during:** Task 2 (GREEN — "effects inside children stop firing after Show switches to fallback" test failed)
- **Issue:** Original test created child node with external `createRoot`, then passed the node to Show. Show cannot dispose an externally-owned scope — only the external root's owner disposes it. Show's `createRoot` around children doesn't wrap pre-created nodes.
- **Fix:** Updated test to pass a render function `children: () => { effect(...); return node }` so Show creates children inside its own `createRoot`. When Show hides, it calls `currentDispose()` which disposes the createRoot scope, stopping all effects created in the render function.
- **Files modified:** packages/dom/tests/show.test.ts
- **Verification:** show.test.ts "effects inside children stop firing" passes

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs — incorrect implementation approach, DOM lifecycle timing issue, incorrect test pattern)
**Impact on plan:** Core architecture is correct; fixes align with the plan's stated behaviors and must-haves. No scope creep.

## Issues Encountered

None beyond the three bugs documented above. All were caught and fixed during the GREEN phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Component lifecycle layer complete: `onMount()`, `Show()`, `For()` are ready for use
- Plan 02-04 can build `ErrorBoundary` and `Suspense` on the same DocumentFragment + anchor pattern established here
- Plan 02-05 (Vite HMR) can proceed independently — no dependency on component primitives
- `Show` and `For` are the primary dynamic rendering primitives for all future application code

## Self-Check: PASSED

All files found:
- packages/dom/src/components.ts: FOUND
- packages/dom/src/index.ts: FOUND (modified)
- packages/dom/tests/lifecycle.test.ts: FOUND
- packages/dom/tests/show.test.ts: FOUND
- packages/dom/tests/for.test.ts: FOUND

All commits found:
- 239de6c: FOUND (test RED)
- 39b0d23: FOUND (feat GREEN)

---
*Phase: 02-jsx-runtime-and-component-model*
*Completed: 2026-02-28*
