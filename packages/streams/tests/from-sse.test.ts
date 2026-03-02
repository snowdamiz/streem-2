import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from '@streem/core'
import { fromSSE } from '../src/from-sse.js'

// ---------------------------------------------------------------------------
// Mock EventSource — intercepts construction and exposes controls per instance
// ---------------------------------------------------------------------------

class MockEventSource extends EventTarget {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  CONNECTING = 0
  OPEN = 1
  CLOSED = 2

  readyState: number = MockEventSource.CONNECTING
  url: string
  withCredentials: boolean

  // Test hook: last constructed instance is accessible for dispatching events
  static _last: MockEventSource | null = null

  // Registered listeners (using EventTarget, so addEventListener works natively)

  constructor(url: string, init?: EventSourceInit) {
    super()
    this.url = url
    this.withCredentials = init?.withCredentials ?? false
    MockEventSource._last = this
  }

  // Simulate an 'open' event
  _open(): void {
    this.readyState = MockEventSource.OPEN
    this.dispatchEvent(new Event('open'))
  }

  // Simulate a 'message' event
  _message(data: string): void {
    const e = new MessageEvent<string>('message', { data })
    this.dispatchEvent(e)
  }

  // Simulate a named custom event
  _event(type: string, data: string): void {
    const e = new MessageEvent<string>(type, { data })
    this.dispatchEvent(e)
  }

  // Simulate a temporary error (native reconnect — readyState stays CONNECTING)
  _errorReconnecting(): void {
    this.readyState = MockEventSource.CONNECTING
    this.dispatchEvent(new Event('error'))
  }

  // Simulate a permanent failure (readyState becomes CLOSED)
  _errorClosed(): void {
    this.readyState = MockEventSource.CLOSED
    this.dispatchEvent(new Event('error'))
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('fromSSE', () => {
  const originalEventSource = globalThis.EventSource

  beforeEach(() => {
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource
    MockEventSource._last = null
  })

  afterEach(() => {
    globalThis.EventSource = originalEventSource
    MockEventSource._last = null
  })

  it('starts with status=connecting, data=undefined, error=undefined (STREAM-07)', () => {
    let data: any, status: any, error: any
    const dispose = createRoot((d) => {
      ;[data, status, error] = fromSSE('/stream')
      return d
    })
    expect(data.value).toBeUndefined()
    expect(status.value).toBe('connecting')
    expect(error.value).toBeUndefined()
    dispose()
  })

  it('parses JSON message and updates data signal (STREAM-02)', () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    es._message(JSON.stringify({ price: 99 }))
    expect(data.value).toEqual({ price: 99 })
    dispose()
  })

  it('passes raw string through on JSON parse failure (STREAM-02)', () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    es._message('plain text message')
    expect(data.value).toBe('plain text message')
    dispose()
  })

  it('applies transform function to parsed message (STREAM-02)', () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromSSE<number>('/stream', {
        transform: (raw: any) => raw.price as number,
      })
      return d
    })
    const es = MockEventSource._last!
    es._message(JSON.stringify({ price: 55 }))
    expect(data.value).toBe(55)
    dispose()
  })

  it('sets status=connected after receiving a message (STREAM-07)', () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    es._message(JSON.stringify({ ok: true }))
    expect(status.value).toBe('connected')
    dispose()
  })

  it('sets status=connected on open event (STREAM-07)', () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    es._open()
    expect(status.value).toBe('connected')
    dispose()
  })

  it('closes EventSource and sets status=closed on owner disposal (STREAM-02)', () => {
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    es._message('hello')
    expect(data.value).toBeDefined()
    dispose()
    expect(status.value).toBe('closed')
    // Verify es.close() was called (readyState should be CLOSED from our mock's close())
    expect(es.readyState).toBe(MockEventSource.CLOSED)
  })

  it('sets status=reconnecting on error when native reconnect in progress (STREAM-07)', () => {
    let status: any, error: any
    const dispose = createRoot((d) => {
      ;[, status, error] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    // Simulate temporary disconnect — browser will reconnect (readyState=CONNECTING)
    es._errorReconnecting()
    expect(status.value).toBe('reconnecting')
    expect(error.value).toBeUndefined()
    dispose()
  })

  it('sets status=closed and error on permanent failure (STREAM-07)', () => {
    let status: any, error: any
    const dispose = createRoot((d) => {
      ;[, status, error] = fromSSE('/stream')
      return d
    })
    const es = MockEventSource._last!
    // Simulate permanent failure — readyState=CLOSED
    es._errorClosed()
    expect(status.value).toBe('closed')
    expect(error.value).toBeInstanceOf(Error)
    dispose()
  })

  it('subscribes to named events via options.events (STREAM-02)', () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromSSE('/stream', { events: ['price'] })
      return d
    })
    const es = MockEventSource._last!
    es._event('price', JSON.stringify({ price: 77 }))
    expect(data.value).toEqual({ price: 77 })
    dispose()
  })

  it('passes withCredentials to EventSource constructor (STREAM-02)', () => {
    const dispose = createRoot((d) => {
      fromSSE('/stream', { withCredentials: true })
      return d
    })
    const es = MockEventSource._last!
    expect(es.withCredentials).toBe(true)
    dispose()
  })
})
