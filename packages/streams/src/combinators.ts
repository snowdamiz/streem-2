import { signal, effect, onCleanup, startBatch, endBatch } from '@streem/core'
import type { Signal } from '@streem/core'

/**
 * Group multiple signal writes into a single batch, flushing all effects once
 * at the end rather than after each individual write.
 *
 * Use this inside high-frequency message handlers (>30 msg/sec) to prevent
 * repeated effect re-runs and browser frame drops.
 *
 * @example
 * ```ts
 * ws.addEventListener('message', () => {
 *   batch(() => {
 *     priceSignal.set(msg.price)
 *     volumeSignal.set(msg.volume)
 *     timestampSignal.set(msg.timestamp)
 *   })
 * })
 * ```
 */
export function batch(fn: () => void): void {
  startBatch()
  try {
    fn()
  } finally {
    endBatch()
  }
}

/**
 * Create a derived signal that updates at most once per `intervalMs`.
 *
 * The first value passes through immediately; subsequent values are dropped
 * until the interval has elapsed. This is a leading-edge throttle.
 *
 * Must be called inside a reactive scope (createRoot, component body).
 * Uses effect() internally — same ownership requirement as effect().
 *
 * @param source - The signal to throttle
 * @param intervalMs - Minimum milliseconds between updates
 */
export function throttle<T>(source: Signal<T>, intervalMs: number): Signal<T> {
  const out = signal<T>(source.value)
  let lastEmit = 0

  effect(() => {
    const value = source.value // reactive tracking
    const now = Date.now()
    if (now - lastEmit >= intervalMs) {
      lastEmit = now
      out.set(value)
    }
  })

  return out
}

/**
 * Create a derived signal that updates only after `delayMs` of silence
 * from the source signal (trailing-edge debounce).
 *
 * Each new source value resets the timer. The output signal updates with
 * the most recent source value after the delay expires.
 *
 * Must be called inside a reactive scope (createRoot, component body).
 * Uses effect() internally — same ownership requirement as effect().
 *
 * @param source - The signal to debounce
 * @param delayMs - Silence period in milliseconds before emitting
 */
export function debounce<T>(source: Signal<T>, delayMs: number): Signal<T> {
  const out = signal<T>(source.value)
  let timer: ReturnType<typeof setTimeout> | null = null

  effect(() => {
    const value = source.value // reactive tracking
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      out.set(value)
      timer = null
    }, delayMs)
    onCleanup(() => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    })
  })

  return out
}
