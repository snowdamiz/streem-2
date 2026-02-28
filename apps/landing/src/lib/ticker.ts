import type { Subscribable } from 'streem'

export interface TickerMessage {
  symbol: string
  price: number
  change: number   // percentage change from last tick
}

const SYMBOLS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META'] as const
export type TickerSymbol = typeof SYMBOLS[number]

// Creates a Subscribable<TickerMessage[]> that emits at 5ms intervals (200 msg/sec).
// Passed to fromObservable() so the full Streem stream pipeline is exercised.
// Satisfies the structural Subscribable<T> interface — no RxJS required.
export function createTickerSource(symbols: readonly string[] = SYMBOLS): Subscribable<TickerMessage[]> {
  return {
    subscribe(observer: { next: (v: TickerMessage[]) => void }) {
      // Initialize prices in $50–$500 range
      const prices: Record<string, number> = Object.fromEntries(
        symbols.map(s => [s, 50 + Math.random() * 450])
      )
      const id = setInterval(() => {
        const ticks: TickerMessage[] = symbols.map(s => {
          // Random walk: ±$0.5 per tick
          const delta = (Math.random() - 0.5) * 1.0
          prices[s] = Math.max(0.01, prices[s] + delta)
          const changePct = (delta / prices[s]) * 100
          return { symbol: s, price: prices[s], change: changePct }
        })
        observer.next(ticks)
      }, 5)  // 200 ticks/sec — throttled to 30fps in TickerDemo.tsx
      return { unsubscribe: () => clearInterval(id) }
    }
  }
}

export { SYMBOLS }
