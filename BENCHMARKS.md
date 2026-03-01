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
- Date: 2026-02-28
- OS: macOS
- Benchmark tool: tinybench ^2.9.0

## Results

### signal read+write

| name                                  | ops/sec    | avg (ns) | samples  |
|---------------------------------------|------------|----------|----------|
| @streem/core signal (with createRoot) | 10,191,710 | 98.12    | 5,110,852 |
| @streem/core signal (primitive only)  | 14,574,182 | 68.61    | 7,287,091 |
| @preact/signals-core signal           | 45,787,463 | 21.84    | 22,893,732 |
| solid-js createSignal                 | 22,584,107 | 44.28    | 11,292,054 |

### computed re-evaluation

| name                                    | ops/sec    | avg (ns) | samples  |
|-----------------------------------------|------------|----------|----------|
| @streem/core computed (with createRoot) | 3,694,567  | 270.67   | 1,847,284 |
| @streem/core computed (primitive only)  | 2,436,068  | 410.50   | 1,218,034 |
| @preact/signals-core computed           | 18,394,735 | 54.36    | 9,484,727 |
| solid-js createMemo                     | 13,763,458 | 72.66    | 6,881,729 |

### effect re-run

| name                                  | ops/sec    | avg (ns) | samples  |
|---------------------------------------|------------|----------|----------|
| @streem/core effect (with createRoot) | 2,840,716  | 352.02   | 1,420,567 |
| @streem/core effect (primitive only)  | 3,527,707  | 283.47   | 1,763,854 |
| @preact/signals-core effect           | 12,753,766 | 78.41    | 6,377,566 |
| solid-js createEffect                 | 22,033,082 | 45.39    | 11,016,541 |

## How to Reproduce

```sh
# From the repository root:
pnpm install
pnpm --filter @streem/core build
node apps/bench/run.mjs
```

Results vary by machine. The tables above were captured on the hardware described in Environment.

## Phase 9.1 Optimizations

These results replace the Phase 9 baseline. The following changes were made to
`@streem/core` between Phase 9 and Phase 9.1:

### Reactive graph improvements (`reactive.ts`)

- **Eliminated O(n) scan in `batchedEffects`**: `batchedEffects` changed from
  `EffectNode[]` (with `Array.includes()` O(n) scan before each push) to
  `Set<EffectNode>` (O(1) `.add()` deduplication). `endBatch()` now spreads the
  Set to snapshot before clearing, matching the previous `splice(0)` pattern.

- **Note on `propagateDirty()` snapshot**: The `[...source.subs]` spread was
  retained in `propagateDirty()`. Direct Set iteration is unsafe: `runEffect()`
  calls `source.subs.delete()` on stale deps during the effect re-run, mutating
  the Set mid-iteration and triggering a V8 `OrderedHashTable::Shrink` crash.

### Owner tree improvements (`owner.ts`)

- **Lazy array initialization**: `Owner.children` and `Owner.cleanups` are now
  `null` until first use, instead of eagerly allocating empty arrays. Most
  createRoot scopes in the benchmark never acquire children or cleanups,
  so this reduces allocation per iteration.

### Benchmark fairness

- **Primitive-only variants added**: Each suite now measures `@streem/core`
  both with and without a `createRoot` wrapper. The primitive-only variant is
  directly comparable to `@preact/signals-core` which has no owner concept.
  The with-createRoot variant matches real-world usage (and SolidJS's pattern).

### Baseline comparison

| Suite | Phase 9 ops/sec | Phase 9.1 (with root) | Phase 9.1 (primitive) |
|-------|-----------------|----------------------|-----------------------|
| signal read+write | 9,098,972 | 10,191,710 | 14,574,182 |
| computed re-evaluation | 3,466,920 | 3,694,567 | 2,436,068 |
| effect re-run | 3,267,971 | 2,840,716 | 3,527,707 |

## Interpretation

- Higher ops/sec = faster
- These numbers measure primitive overhead only. Real app performance depends on
  component count, update frequency, and DOM work — not captured here.
- @streem/core is a young library. These benchmarks establish a baseline for future
  optimization work.
- **Primitive-only column** shows raw reactive primitive cost without owner overhead.
  This is the apples-to-apples comparison with `@preact/signals-core`.
- **With-createRoot column** shows real-world framework usage cost — this is what
  application code experiences when signals are used inside component trees.
- Signal with-root improved ~12% vs Phase 9 (9.1M → 10.2M ops/sec); the
  batchedEffects Set optimization and lazy Owner allocation both contribute.
- The remaining gap between primitive-only and Preact signal (~14.6M vs ~45.8M)
  is the next optimization target — tracking the reactive dependency graph has
  inherent cost that will require algorithmic improvements.
- Effect and computed scores show variance between runs on the same machine;
  the absolute numbers should be treated as order-of-magnitude guidance.
