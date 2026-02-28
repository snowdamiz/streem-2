import { signal, onCleanup } from '@streem/core'
import type { StreamTuple, WebSocketOptions, StreamStatus } from './types.js'

export class MaxRetriesExceededError extends Error {
  constructor(attempts: number) {
    super(`WebSocket failed after ${attempts} reconnection attempts`)
    this.name = 'MaxRetriesExceededError'
  }
}

export function fromWebSocket<T>(
  url: string | URL,
  options: WebSocketOptions<T> = {},
): StreamTuple<T> {
  const data = signal<T | undefined>(undefined)
  const status = signal<StreamStatus>('connecting')
  const error = signal<Error | undefined>(undefined)

  let ws: WebSocket | null = null
  let attempt = 0
  let disposed = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const reconnectOpt = options.reconnect
  const shouldReconnect = reconnectOpt !== false
  const reconnectConfig = typeof reconnectOpt === 'object' && reconnectOpt !== null ? reconnectOpt : {}
  const maxRetries = reconnectConfig.maxRetries ?? 10
  const initialDelay = reconnectConfig.initialDelay ?? 1000
  const maxDelay = reconnectConfig.maxDelay ?? 30000

  function getBackoffDelay(att: number): number {
    const jitter = Math.random() * 1000
    return Math.min(initialDelay * Math.pow(2, att) + jitter, maxDelay)
  }

  function connect(): void {
    if (disposed) return  // guard: cleanup may have fired before setTimeout callback
    ws = new WebSocket(url)
    status.set('connecting')

    ws.addEventListener('open', () => {
      if (disposed) { ws?.close(); return }
      status.set('connected')
      attempt = 0
    })

    ws.addEventListener('message', (event: MessageEvent) => {
      if (disposed) return
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data as string)
      } catch {
        parsed = event.data
      }
      const value = options.transform ? options.transform(parsed) : (parsed as T)
      data.set(value)
    })

    ws.addEventListener('close', () => {
      if (disposed) return
      if (shouldReconnect && attempt < maxRetries) {
        status.set('reconnecting')
        const delay = getBackoffDelay(attempt)
        attempt++
        retryTimer = setTimeout(connect, delay)
      } else if (shouldReconnect && attempt >= maxRetries) {
        status.set('error')
        error.set(new MaxRetriesExceededError(attempt))
      } else {
        // reconnect: false — clean close
        status.set('closed')
      }
    })

    ws.addEventListener('error', () => {
      // WebSocket fires 'error' then 'close' — let close handler drive status.
      // No action here; prevents double status transitions.
    })
  }

  // Register cleanup BEFORE connecting — critical invariant
  onCleanup(() => {
    disposed = true  // FIRST: stop all async callbacks
    if (retryTimer !== null) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (ws !== null) {
      ws.close()
      ws = null
    }
    status.set('closed')
  })

  connect()

  return [data, status, error]
}
