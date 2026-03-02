import { signal, onCleanup } from '@streeem/core'
import type { StreamTuple, SSEOptions, StreamStatus } from './types.js'

export function fromSSE<T>(
  url: string | URL,
  options: SSEOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  const es = new EventSource(url.toString(), {
    withCredentials: options.withCredentials ?? false,
  })

  function parseAndSet(raw: string): void {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
    const value = options.transform ? options.transform(parsed) : (parsed as T)
    data.set(value)
  }

  const handleMessage = (event: MessageEvent<string>) => {
    parseAndSet(event.data)
    status.set('connected')
  }

  es.addEventListener('message', handleMessage)

  es.addEventListener('open', () => {
    status.set('connected')
  })

  es.addEventListener('error', () => {
    // EventSource.CLOSED = 2 → permanent failure
    // EventSource.CONNECTING = 0 → browser is auto-reconnecting (temporary)
    if (es.readyState === EventSource.CLOSED) {
      status.set('closed')
      error.set(new Error('SSE connection closed permanently'))
    } else {
      // readyState === EventSource.CONNECTING: native reconnect in progress
      status.set('reconnecting')
    }
  })

  // Named event subscriptions — all route to the same data signal
  for (const eventName of (options.events ?? [])) {
    es.addEventListener(eventName, handleMessage as EventListener)
  }

  // Register cleanup — close() stops native reconnection as well
  onCleanup(() => {
    es.close()
    status.set('closed')
  })

  return [data, status, error]
}
