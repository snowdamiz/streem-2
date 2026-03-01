# @streem/core Signal Benchmarks

Benchmark results for `@streem/core` signals compared against `solid-js` and
`@preact/signals-core` under identical conditions using
[tinybench](https://github.com/tinylibs/tinybench).

## Methodology

**What was measured:**
- `signal()` / `createSignal` — single read+write cycle throughput (ops/second)
- `computed()` / `createMemo()` — derived value re-evaluation on signal change
- `effect()` / `createEffect()` — reactive side-effect re-run on signal change

Each benchmark runs 1000 warmup iterations followed by 5000 measured iterations.
All libraries run in the same process under the same Node.js version.
No DOM, no framework overhead — pure reactive primitive cost.

**`@streem/core` is measured twice per suite:**
- **(with createRoot)** — includes owner-scope allocation; matches real-world usage and SolidJS pattern
- **(primitive only)** — calls `signal()`/`computed()`/`effect()` directly without a createRoot wrapper; directly comparable to `@preact/signals-core` which has no owner concept

**Libraries compared:**

| Library | Version | Import |
|---------|---------|--------|
| @streem/core | 0.1.0 | `signal, computed, effect, createRoot` |
| @preact/signals-core | 1.13.0 | `signal, computed, effect` |
| solid-js | 1.9.11 | `createSignal, createMemo, createEffect, createRoot` |

**Environment:**
- Node.js: v25.3.0
- Hardware: Apple M4
- Date: 2026-03-01
- OS: macOS
- Benchmark tool: tinybench ^2.9.0

## Results

### signal read+write

| name                                  | ops/sec    | avg (ns) | samples  |
|---------------------------------------|------------|----------|----------|
| @streem/core signal (with createRoot) | 23,036,155 | 43.41    | 11,518,078 |
| @streem/core signal (primitive only)  | 26,574,594 | 37.63    | 13,287,298 |
| @preact/signals-core signal           | 46,421,161 | 21.54    | 23,210,582 |
| solid-js createSignal                 | 21,947,613 | 45.56    | 10,973,807 |

### computed re-evaluation

| name                                    | ops/sec    | avg (ns) | samples  |
|-----------------------------------------|------------|----------|----------|
| @streem/core computed (with createRoot) | 11,925,326 | 83.86    | 5,962,663 |
| @streem/core computed (primitive only)  | 5,326,796  | 187.73   | 2,663,398 |
| @preact/signals-core computed           | 18,896,253 | 52.92    | 9,453,221 |
| solid-js createMemo                     | 14,523,704 | 68.85    | 7,261,852 |

### effect re-run

| name                                  | ops/sec    | avg (ns) | samples  |
|---------------------------------------|------------|----------|----------|
| @streem/core effect (with createRoot) | 8,911,157  | 112.22   | 4,455,579 |
| @streem/core effect (primitive only)  | 10,597,901 | 94.36    | 5,298,951 |
| @preact/signals-core effect           | 13,154,002 | 76.02    | 6,577,002 |
| solid-js createEffect                 | 22,629,833 | 44.19    | 11,314,917 |

## How to Reproduce

```sh
# From the repository root:
pnpm install
pnpm --filter @streem/core build
node apps/bench/run.mjs
```

Results vary by machine. The tables above were captured on the hardware described in Environment.

## Phase 9.1 Optimizations

These results supersede the Phase 9 baseline. The following changes were made to
`@streem/core` between Phase 9 and Phase 9.1 (minor) and the subsequent linked-list
rewrite (major).

### Reactive graph rewrite — linked list subscriber tracking (`reactive.ts`)

The subscriber tracking model was changed from `Set<SubscriberNode>` on each source
node to a **doubly-linked list** of `Link` objects. This is the same approach used
by Preact signals internally.

Each `Link` represents a single dependency edge (one subscriber reading one source).
Links are doubly-linked in two dimensions:
- `prevSub / nextSub` — the source's subscriber list (who reads this signal)
- `prevDep / nextDep` — the subscriber's dependency list (what this effect/computed reads)

This eliminates:
- **`new Set()` per node**: previously 2 Sets per computed node, 1 per signal. Now zero.
- **`[...source.subs]` spread**: previously allocated a new array on every signal write
  to snapshot subscribers before iteration. The linked list is safe to walk without
  a snapshot — we capture `link.nextSub` before running each effect.
- **`Set.add / Set.delete` hash overhead**: replaced by pointer assignments.
- **`notifySubscribers` overhead on writes with no subscribers**: early-exit when
  `source.subHead === null`.

A `notifyVersion` counter prevents double-execution: when an effect re-subscribes to a
source during its own run, its new link appears at the tail of the list. Without the
version guard the propagation walk would encounter it and run the effect a second time.

### Integer type discriminants

`_type: 'signal' | 'computed' | 'effect'` (string) replaced with
`nodeType: NodeType` (TypeScript `const enum`, compiled to integers 0/1/2).
Integer comparisons in `propagateDirty`'s hot loop are faster than string comparisons.

### Lazy `cleanupFns` allocation

`EffectNode.cleanupFns` is now `null` until the first `onCleanup()` call inside the
effect, instead of eagerly allocating `[]` on every effect creation. Effects that never
call `onCleanup` (the common case) avoid this allocation entirely.

### Baseline comparison

| Suite | Phase 9 | Phase 9.1 (set-based) | Phase 9.1+ (linked list) | Preact |
|-------|---------|-----------------------|--------------------------|--------|
| signal (with root) | 9,098,972 | 10,191,710 | **23,036,155** (+126%) | 46,421,161 |
| signal (primitive) | — | 14,574,182 | **26,574,594** (+82%) | 46,421,161 |
| computed (with root) | 3,466,920 | 3,694,567 | **11,925,326** (+223%) | 18,896,253 |
| computed (primitive) | — | 2,436,068 | **5,326,796** (+119%) | 18,896,253 |
| effect (with root) | 3,267,971 | 2,840,716 | **8,911,157** (+214%) | 13,154,002 |
| effect (primitive) | — | 3,527,707 | **10,597,901** (+200%) | 13,154,002 |

## Interpretation

- Higher ops/sec = faster
- These numbers measure primitive overhead only. Real app performance depends on
  component count, update frequency, and DOM work — not captured here.
- **Signal with-root (23M) now exceeds Solid (21.9M)** — the owner-scope overhead
  is no longer a meaningful drag on throughput.
- **Effect (with root) reaches 68% of Preact** (8.9M vs 13.2M). Computed (with root)
  reaches 63% of Preact (11.9M vs 18.9M).
- **Remaining signal gap vs Preact (~1.75x)**: `s()` is a function call; Preact's
  `s.value` is a property getter. Function call dispatch has inherent overhead in V8.
  Closing this gap requires changing the public API to a `.value` accessor — a
  breaking API change and a separate design decision.
- **Primitive-only column** shows raw reactive primitive cost without owner overhead.
  This is the apples-to-apples comparison with `@preact/signals-core`.
- **With-createRoot column** shows real-world framework usage cost — this is what
  application code experiences when signals are used inside component trees.
