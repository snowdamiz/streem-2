import type { Signal } from '@streeem/core'

/**
 * Connection state for all stream adapters.
 * All adapters share this identical status union — no adapter-specific extensions.
 */
export type StreamStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'

/**
 * The return type of all four stream adapters.
 * Destructured as: const [data, status, error] = fromWebSocket(url)
 */
export type StreamTuple<T> = [
  data: Signal<T | undefined>,
  status: Signal<StreamStatus>,
  error: Signal<Error | undefined>,
]

/**
 * Options for fromWebSocket().
 */
export interface WebSocketOptions<T> {
  /**
   * Transform raw parsed message before setting the data signal.
   * Runs after JSON.parse (or on raw string if parse fails).
   */
  transform?: (raw: unknown) => T
  /**
   * Auto-reconnect on close. Default: true (enabled).
   * Pass false to disable. Pass an object to configure backoff.
   */
  reconnect?: boolean | {
    maxRetries?: number    // default: 10
    initialDelay?: number  // default: 1000 (ms)
    maxDelay?: number      // default: 30000 (ms)
  }
}

/**
 * Options for fromSSE().
 */
export interface SSEOptions<T> {
  transform?: (raw: unknown) => T
  /** Named SSE event types to subscribe to (in addition to the default 'message' event). */
  events?: string[]
  withCredentials?: boolean
}

/**
 * Options for fromReadable().
 */
export interface ReadableOptions<T> {
  transform?: (chunk: T) => T
}

/**
 * Options for fromObservable().
 */
export interface ObservableOptions<T> {
  transform?: (value: T) => T
}

/**
 * Framework-agnostic Subscribable interface.
 * Structurally compatible with RxJS 7/8 Observable, xstream, and TC39 Observable.
 * No runtime RxJS dependency — uses structural typing only.
 */
export interface Subscribable<T> {
  subscribe(observer: {
    next?: (value: T) => void
    error?: (err: unknown) => void
    complete?: () => void
  }): { unsubscribe(): void }
}
