import { signal, onCleanup } from '@streeem/core'
import type { StreamTuple, ObservableOptions, StreamStatus, Subscribable } from './types.js'

export function fromObservable<T>(
  source: Subscribable<T>,
  options: ObservableOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  // status initialized BEFORE .subscribe() — synchronous observables may call
  // next() during subscribe(), which sets status to 'connected' synchronously.
  // This is correct: status starts 'connecting', first value transitions to 'connected'.

  const subscription = source.subscribe({
    next(value: T) {
      status.set('connected')
      const processed = options.transform ? options.transform(value) : value
      data.set(processed)
    },
    error(err: unknown) {
      status.set('error')
      error.set(err instanceof Error ? err : new Error(String(err)))
    },
    complete() {
      status.set('closed')
    },
  })

  onCleanup(() => {
    subscription.unsubscribe()
    status.set('closed')
  })

  return [data, status, error]
}
