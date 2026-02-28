import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, ReadableOptions, StreamStatus } from './types.js'

export function fromReadable<T>(
  stream: ReadableStream<T>,
  options: ReadableOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  const reader = stream.getReader()

  async function pump(): Promise<void> {
    try {
      status.set('connected')
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          status.set('closed')
          break
        }
        const processed = options.transform ? options.transform(value) : value
        data.set(processed)
      }
    } catch (e) {
      const err = e as Error
      // Suppress cancellation errors from onCleanup() calling reader.cancel()
      // Different environments use different error names/messages for cancellation
      const isCancellation =
        err?.name === 'AbortError' ||
        err?.message?.includes('cancel') ||
        err?.message?.includes('cancelled') ||
        err?.message?.includes('canceled')
      if (!isCancellation) {
        status.set('error')
        error.set(err instanceof Error ? err : new Error(String(err)))
      } else {
        // Cancellation errors — set status=closed if not already closed by onCleanup
        if (status() !== 'closed') {
          status.set('closed')
        }
      }
    }
  }

  onCleanup(() => {
    // reader.cancel() rejects the in-progress reader.read() Promise,
    // causing pump() to catch and exit. .catch(() => {}) is critical:
    // reader.cancel() may itself reject if the stream is already closed.
    reader.cancel().catch(() => { /* intentional */ })
    status.set('closed')
  })

  void pump()

  return [data, status, error]
}
