---
phase: 06-landing-page-dogfood
plan: "02"
subsystem: ui
tags: [vite, streem, landing-page, tsx, signals, streaming, suspense, for, errorboundary, show]

# Dependency graph
requires:
  - phase: 06-01
    provides: "/landing scaffold with package.json, tsconfig, vite.config, stub App.tsx, stub DocsApp.tsx"
provides:
  - "apps/landing/src/lib/ticker.ts — Subscribable<TickerMessage[]> at 200 msg/sec, no RxJS"
  - "apps/landing/src/lib/sparkline.ts — SVG path math for sparkline rendering"
  - "apps/landing/src/components/Hero.tsx — reactive counter demo with signal + computed"
  - "apps/landing/src/components/TickerDemo.tsx — live streaming ticker with all Streem stream primitives"
  - "apps/landing/src/components/Features.tsx — features grid with Show-toggled code examples"
  - "apps/landing/src/components/CodeSample.tsx — annotated code with copy functionality"
  - "apps/landing/src/App.tsx — root component wiring all 5 sections"
  - "apps/landing/src/DocsApp.tsx — complete docs page with 5 API reference sections (151 lines)"
affects:
  - 06-03-install-cta-and-shoelace

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSX element type bridging: `as unknown as Node` cast required when passing JSX to Streem component props typed as Node"
    - "Streem Suspense uses thrown-Promise protocol (not undefined-signal): TickerTable throws initialPromise before first tick"
    - "Signal.set() takes value only (not updater fn): must read signal then write: `sig.set(sig() + 1)`"
    - "For component uses `by` prop (not `key`) for keying: `<For each={rows} by={r => r.symbol}>`"
    - "fromObservable returns 3-tuple [data, status, error] not 2-tuple"
    - "Per-row signal pattern: stable row objects with price/change/history signals; only text nodes update on tick"
    - "throttle(stream, 33) reduces 200 msg/sec source to ~30fps visual updates"
    - "batch() inside effect() prevents N-effect flushes for N tickers on each tick"

key-files:
  created:
    - apps/landing/src/lib/ticker.ts
    - apps/landing/src/lib/sparkline.ts
    - apps/landing/src/components/Hero.tsx
    - apps/landing/src/components/TickerDemo.tsx
    - apps/landing/src/components/Features.tsx
    - apps/landing/src/components/CodeSample.tsx
  modified:
    - apps/landing/src/App.tsx
    - apps/landing/src/DocsApp.tsx

key-decisions:
  - "Suspense uses thrown-Promise protocol — TickerTable creates initialPromise, throws it on mount when throttledStream() === undefined, resolves it on first tick via effect()"
  - "Signal.set() does not accept updater functions — plan API reference was inaccurate; correct usage: `sig.set(sig() + 1)` (read then write)"
  - "For uses `by` prop not `key` — corrected from plan's API example which used `key`"
  - "JSX component return types require `as unknown as Node` cast — JSX.Element includes undefined but component prop types do not; Streem's typed props use strict Node types"
  - "ErrorBoundary.fallback uses `err: unknown` (not `Error`) — plan's type annotation was incorrect; actual prop type is `(err: unknown, reset: () => void) => Node | Node[] | null`"
  - "Suspense/ErrorBoundary called as functions (not JSX) for type safety inside TickerDemo — avoids JSX child type mismatch without casting"

# Metrics
duration: 458s
completed: 2026-02-28
---

# Phase 06 Plan 02: Landing Page Content and Streaming Demo Summary

**Complete landing page sections and /docs API reference — exercises every v1 Streem primitive meaningfully via a live 200 msg/sec streaming ticker with throttle, batch, per-row signals, For, ErrorBoundary, and Suspense**

## Performance

- **Duration:** 458s (about 8 min)
- **Started:** 2026-02-28T20:15:11Z
- **Completed:** 2026-02-28T20:22:49Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `ticker.ts` + `sparkline.ts`: utility libs with no external dependencies — plain Subscribable<T> at 5ms/200 msg/sec, SVG path math
- `Hero.tsx`: reactive counter using `signal(0)` + `computed(() => count() * 2)`, auto-increments at 800ms via `onMount`
- `TickerDemo.tsx`: complete live streaming demo — `createTickerSource → fromObservable → throttle(stream, 33) → effect with batch()` pipeline; 7 per-row signal objects; `<For by>` keyed list; `<ErrorBoundary>` wrapping `Suspense` via thrown-Promise protocol; `<TickerSkeleton>` shown until first tick
- `Features.tsx`: features grid with `<Show when={() => expandedIdx() === i}>` toggling code examples per card
- `CodeSample.tsx`: annotated code section with `signal`-backed copy button (no Suspense import)
- `App.tsx`: wires Hero → TickerDemo → Features → CodeSample → InstallCtaStub
- `DocsApp.tsx`: 151-line docs page with 5 sections covering complete API surface (signals, components, streams, lit-interop, getting-started)
- Build verified: `pnpm --filter /landing build` exits 0, dist/ contains 3 JS bundles (main, docs, jsx-runtime shared chunk)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ticker data source and sparkline utility** - `bfc9304` (feat)
2. **Task 2: Build all landing page section components and wire App.tsx** - `f57c4ac` (feat)
3. **Task 3: Build the /docs page with getting-started guide and API reference** - `732f1ae` (feat)

## Files Created/Modified

- `apps/landing/src/lib/ticker.ts` — Subscribable<TickerMessage[]> at 5ms interval (200 msg/sec), exports createTickerSource + SYMBOLS
- `apps/landing/src/lib/sparkline.ts` — buildSparklinePath() for SVG polyline rendering
- `apps/landing/src/components/Hero.tsx` — Hero with signal/computed counter demo, onMount auto-increment
- `apps/landing/src/components/TickerDemo.tsx` — Live ticker: fromObservable + throttle + batch + per-row signals + For + ErrorBoundary + Suspense
- `apps/landing/src/components/Features.tsx` — Features grid with Show-toggled code snippets
- `apps/landing/src/components/CodeSample.tsx` — Code section with signal-backed copy button (no Suspense)
- `apps/landing/src/App.tsx` — Root: Hero → TickerDemo → Features → CodeSample → InstallCtaStub
- `apps/landing/src/DocsApp.tsx` — Full docs page: getting-started, signals, components, streams, lit-interop

## Decisions Made

- Suspense uses thrown-Promise protocol: `TickerTable` creates an `initialPromise`, throws it synchronously when `throttledStream() === undefined`, and resolves it from inside an `effect()` on the first tick arrival
- `Signal.set()` does not accept updater functions — plan's API snippet was inaccurate. Correct: `sig.set(sig() + 1)` (read current value, then write new value)
- `For` uses `by` prop (not `key`) — plan's example used `key` which doesn't exist; corrected to `by`
- JSX components returning `JSX.Element` need `as unknown as Node` cast when passed as component prop values — `JSX.Element = Node | Node[] | null | undefined` but prop types use strict `Node | Node[] | null`
- `ErrorBoundary.fallback` typed as `(err: unknown, reset: () => void) => Node | Node[] | null` — plan suggested `err: Error` which is wrong
- `Suspense` called as function rather than JSX inside `ErrorBoundary` children to avoid type mismatch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Signal.set() API — no updater function support**
- **Found during:** Task 2 (TypeScript compilation errors)
- **Issue:** Plan's API reference showed `count.set(prev => prev + 1)` but `Signal<T>.set()` only accepts `value: T`
- **Fix:** Changed all updater patterns to read-then-write: `count.set(count() + 1)`
- **Files modified:** `Hero.tsx`, `Features.tsx`
- **Commit:** f57c4ac

**2. [Rule 1 - Bug] Corrected For component prop name — `by` not `key`**
- **Found during:** Task 2 (TypeScript error: Property 'key' does not exist)
- **Issue:** Plan used `<For each={rows} key={r => r.symbol}>` but actual ForProps uses `by`
- **Fix:** Changed to `<For each={rows} by={(r: TickerRow) => r.symbol}>`
- **Files modified:** `TickerDemo.tsx`
- **Commit:** f57c4ac

**3. [Rule 1 - Bug] Added `as unknown as Node` casts for JSX-to-prop type bridging**
- **Found during:** Task 2 (TypeScript errors: Type 'Element' is not assignable to type 'Node | Node[] | null')
- **Issue:** `JSX.Element = Node | Node[] | null | undefined` but component prop types (ErrorBoundaryProps, SuspenseProps, ShowProps.children) only accept `Node | Node[] | null`. The `undefined` variant in JSX.Element causes TypeScript to reject direct assignment.
- **Fix:** Added explicit `): Node` return types and `as unknown as Node` casts at component return sites; called `Suspense()` as function (not JSX) inside TickerDemo to avoid nested type conflict
- **Files modified:** `TickerDemo.tsx`, `Features.tsx`, `Hero.tsx`, `DocsApp.tsx`
- **Commit:** f57c4ac

**4. [Rule 1 - Bug] Corrected ErrorBoundary.fallback parameter type — `err: unknown` not `err: Error`**
- **Found during:** Task 2 (TypeScript: Type 'unknown' is not assignable to type 'Error')
- **Issue:** Plan typed fallback as `(err: Error)` but actual `ErrorBoundaryProps.fallback` is `(err: unknown, reset: () => void) => Node | Node[] | null`
- **Fix:** Changed to `(err: unknown)` with `err instanceof Error ? err.message : String(err)` guard
- **Files modified:** `TickerDemo.tsx`
- **Commit:** f57c4ac

**5. [Rule 1 - Bug] Implemented correct Suspense protocol — thrown-Promise instead of undefined-signal**
- **Found during:** Pre-coding analysis of Suspense implementation
- **Issue:** Plan described Suspense as triggering when `stream()` returns `undefined`, implying React-style undefined-as-pending. But this codebase's Suspense uses the thrown-Promise protocol (like early React Suspense).
- **Fix:** `TickerTable` creates an `initialPromise`, throws it synchronously when `throttledStream() === undefined`, then resolves it from inside an `effect()` on first tick. Suspense catches the thrown Promise, shows fallback, then retries TickerTable render after resolution.
- **Files modified:** `TickerDemo.tsx`
- **Commit:** f57c4ac

## Issues Encountered

None blocking — all TypeScript errors were auto-fixed within Task 2's single commit.

## User Setup Required

None.

## Next Phase Readiness

- All landing page content complete: Hero, TickerDemo, Features, CodeSample, InstallCtaStub, DocsApp
- Plan 06-03 can now replace `InstallCtaStub` with real Shoelace `<sl-button>` CTA
- Plan 06-03 can replace the `<span class="badge">v0.1.0</span>` placeholder in Hero with `<sl-badge>`
- No blockers.

## Self-Check: PASSED

All 8 created/modified files verified present on disk. All 3 task commits verified in git log.

---
*Phase: 06-landing-page-dogfood*
*Completed: 2026-02-28*
