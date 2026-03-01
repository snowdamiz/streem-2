import { signal, effect, Suspense, For, ErrorBoundary } from 'streem'
import { fromObservable, batch, throttle } from 'streem'
import { createTickerSource, SYMBOLS } from '../lib/ticker'
import { buildSparklinePath } from '../lib/sparkline'
import styles from './TickerDemo.module.css'

interface TickerRow {
  symbol: string
  price: ReturnType<typeof signal<number>>
  change: ReturnType<typeof signal<number>>
  history: ReturnType<typeof signal<number[]>>
  // Plain mutable buffer — read inside the main effect without reactive tracking.
  // Reading row.history() inside an effect that also calls row.history.set()
  // would create a cycle (re-triggers the effect). Buffer breaks that cycle.
  historyBuf: number[]
}

// Skeleton shown by <Suspense> until the first stream tick arrives.
function TickerSkeleton(): Node {
  return (
    <table class={styles.tickerTable + ' ' + styles.tickerSkeleton}>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Price</th>
          <th>Change</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        {SYMBOLS.map(symbol => (
          <tr class={styles.tickerRow}>
            <td class={styles.tickerSymbol}>{symbol}</td>
            <td><span class={styles.skeletonCell} /></td>
            <td><span class={styles.skeletonCell} /></td>
            <td><span class={[styles.skeletonCell, styles.skeletonWide]} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ) as unknown as Node
}

function Sparkline({ history }: { history: () => number[] }): Node {
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" style="overflow:visible">
      <path
        stroke="var(--color-accent)"
        fill="none"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        d={() => buildSparklinePath(history())}
      />
    </svg>
  ) as unknown as Node
}

function TickerRowComponent({ row }: { row: TickerRow }): Node {
  return (
    <tr class={styles.tickerRow}>
      <td class={styles.tickerSymbol}>{row.symbol}</td>
      <td class={styles.tickerPrice}>${() => row.price.value.toFixed(2)}</td>
      <td
        class={styles.tickerChange}
        style={() => `color: ${row.change.value >= 0 ? 'var(--color-green)' : 'var(--color-red)'}`}
      >
        {() => (row.change.value >= 0 ? '+' : '') + row.change.value.toFixed(3) + '%'}
      </td>
      <td class={styles.tickerSparkline}>
        <Sparkline history={() => row.history.value} />
      </td>
    </tr>
  ) as unknown as Node
}

export function TickerDemo(): Node {
  // Stream and rows are created ONCE here — stable across any re-renders.
  // (Suspense retries by re-calling its children function, which would create a
  // new stream each time. By lifting state here we avoid that infinite-skeleton bug.)
  const rows: TickerRow[] = SYMBOLS.map(symbol => ({
    symbol,
    price: signal(100 + Math.random() * 400),
    change: signal(0),
    history: signal<number[]>([]),
    historyBuf: [] as number[],
  }))

  const source = createTickerSource(SYMBOLS)
  const [stream] = fromObservable(source)

  // Throttle visual updates to ~30fps (33ms) — source runs at 200 msg/sec
  const throttledStream = throttle(stream, 33)

  // Promise that resolves on the first tick — Suspense waits on this.
  // Using a plain promise+flag (not a signal) so TickerTable can throw it
  // synchronously during Suspense's tryRenderChildren().
  let resolveInitial!: () => void
  const initialPromise = new Promise<void>(res => { resolveInitial = res })
  let initialResolved = false

  effect(() => {
    const ticks = throttledStream.value
    if (!ticks) return
    if (!initialResolved) {
      initialResolved = true
      resolveInitial()
    }
    // batch() ensures all N signal writes flush as one effect run, not N runs
    batch(() => {
      for (const tick of ticks) {
        const row = rows.find(r => r.symbol === tick.symbol)
        if (row) {
          row.price.set(tick.price)
          row.change.set(tick.change)
          // historyBuf is a plain array — reading it here does not subscribe
          // this effect to row.history, which would cause an infinite loop.
          row.historyBuf = [...row.historyBuf.slice(-19), tick.price]
          row.history.set(row.historyBuf)
        }
      }
    })
  })

  // Rendered by Suspense once initialPromise resolves.
  // rows + stream are in TickerDemo scope — retrying children() does NOT
  // re-create them, which was the original retry-loop bug.
  function TickerTable(): Node {
    if (!initialResolved) throw initialPromise
    return (
      <table class={styles.tickerTable}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          <For each={rows} by={(r: TickerRow) => r.symbol}>
            {(row: TickerRow) => <TickerRowComponent row={row} />}
          </For>
        </tbody>
      </table>
    ) as unknown as Node
  }

  return (
    <section class={styles.tickerSection}>
      <div class="container">
        <div class="section-label">Live streaming demo</div>
        <h2 class="section-title">Real-time data, zero overhead</h2>
        <p class="section-sub">
          7 tickers. 200 updates/second. <code>batch()</code> + <code>throttle()</code> keep it smooth.
          Each row updates independently — no full-table re-render.
        </p>
        {/*
          ErrorBoundary catches stream errors.
          Show swaps skeleton → table once the first tick arrives via hasData signal.
        */}
        <ErrorBoundary fallback={(err: unknown) => (
          document.createTextNode(
            'Stream error: ' + (err instanceof Error ? err.message : String(err))
          )
        )}>
          {Suspense({
            fallback: TickerSkeleton(),
            children: TickerTable,
          }) as Node}
        </ErrorBoundary>
      </div>
    </section>
  ) as unknown as Node
}
