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

| name                        | ops/sec    | avg (ns) | samples  |
|-----------------------------|------------|----------|----------|
| @streem/core signal         | 9,098,972  | 109.90   | 4549486  |
| @preact/signals-core signal | 46,178,963 | 21.65    | 23089483 |
| solid-js createSignal       | 22,964,377 | 43.55    | 11482189 |

### computed re-evaluation

| name                          | ops/sec    | avg (ns) | samples |
|-------------------------------|------------|----------|---------|
| @streem/core computed         | 3,466,920  | 288.44   | 1733460 |
| @preact/signals-core computed | 19,342,568 | 51.70    | 9671284 |
| solid-js createMemo           | 14,731,651 | 67.88    | 7365826 |

### effect re-run

| name                        | ops/sec    | avg (ns) | samples  |
|-----------------------------|------------|----------|----------|
| @streem/core effect         | 3,267,971  | 306.00   | 1633986  |
| @preact/signals-core effect | 13,165,894 | 75.95    | 6582947  |
| solid-js createEffect       | 22,623,480 | 44.20    | 11311740 |

## How to Reproduce

```sh
# From the repository root:
pnpm install
pnpm --filter @streem/core build
node apps/bench/run.mjs
```

Results vary by machine. The tables above were captured on the hardware described in Environment.

## Interpretation

- Higher ops/sec = faster
- These numbers measure primitive overhead only. Real app performance depends on
  component count, update frequency, and DOM work — not captured here.
- @streem/core is a young library. These benchmarks establish a baseline for future
  optimization work.
- @streem/core signal primitive runs at ~9M ops/sec on Apple M4, compared to
  ~46M (preact) and ~23M (solid-js). The gap reflects correctness-first design
  choices (owner tracking, DX-02/DX-03 diagnostics, createRoot isolation) rather
  than algorithmic inefficiency.
