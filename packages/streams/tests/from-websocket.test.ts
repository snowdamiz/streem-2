import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WS from 'vitest-websocket-mock'
import { createRoot } from '@streem/core'
import { fromWebSocket, MaxRetriesExceededError } from '../src/from-websocket.js'

const WS_URL = 'ws://localhost:1234'

describe('fromWebSocket', () => {
  let server: WS

  beforeEach(() => {
    server = new WS(WS_URL)
  })

  afterEach(() => {
    WS.clean()
  })

  it('starts with status=connecting, data=undefined, error=undefined (STREAM-07)', async () => {
    let data: any, status: any, error: any
    const dispose = createRoot((d) => {
      ;[data, status, error] = fromWebSocket(WS_URL)
      return d
    })
    // Before connection opens
    expect(data()).toBeUndefined()
    expect(status()).toBe('connecting')
    expect(error()).toBeUndefined()
    dispose()
  })

  it('sets status=connected when WebSocket opens (STREAM-07)', async () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromWebSocket(WS_URL)
      return d
    })
    await server.connected
    expect(status()).toBe('connected')
    dispose()
  })

  it('parses JSON and updates data signal on message (STREAM-01)', async () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromWebSocket(WS_URL)
      return d
    })
    await server.connected
    server.send(JSON.stringify({ price: 100 }))
    expect(data()).toEqual({ price: 100 })
    dispose()
  })

  it('passes raw string through on JSON parse failure (STREAM-01)', async () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromWebSocket(WS_URL)
      return d
    })
    await server.connected
    server.send('not valid json{')
    expect(data()).toBe('not valid json{')
    dispose()
  })

  it('applies transform function to parsed message (STREAM-01)', async () => {
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromWebSocket<number>(WS_URL, {
        transform: (raw: any) => raw.price as number,
      })
      return d
    })
    await server.connected
    server.send(JSON.stringify({ price: 42 }))
    expect(data()).toBe(42)
    dispose()
  })

  it('closes WebSocket and sets status=closed on owner disposal (STREAM-01)', async () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromWebSocket(WS_URL)
      return d
    })
    await server.connected
    dispose()
    expect(status()).toBe('closed')
  })

  it('sets reconnect: false => status=closed on disconnect (STREAM-01)', async () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromWebSocket(WS_URL, { reconnect: false })
      return d
    })
    await server.connected
    server.close()
    // Give event loop a tick
    await new Promise(r => setTimeout(r, 10))
    expect(status()).toBe('closed')
    dispose()
  })

  it('sets status=reconnecting and retries after disconnect (STREAM-08)', async () => {
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromWebSocket(WS_URL, {
        reconnect: { maxRetries: 2, initialDelay: 10, maxDelay: 50 },
      })
      return d
    })
    await server.connected
    server.close()
    await new Promise(r => setTimeout(r, 5))
    expect(status()).toBe('reconnecting')
    dispose()
  })

  it('sets status=error with MaxRetriesExceededError after maxRetries exhausted (STREAM-08)', async () => {
    // Use maxRetries: 0 so the very first close triggers the error path immediately
    // (no retry scheduled — attempt(0) >= maxRetries(0))
    let status: any, error: any
    const dispose = createRoot((d) => {
      ;[, status, error] = fromWebSocket(WS_URL, {
        reconnect: { maxRetries: 0, initialDelay: 10, maxDelay: 50 },
      })
      return d
    })
    await server.connected
    server.close()
    // Give event loop a tick for the close event to fire
    await new Promise(r => setTimeout(r, 10))
    // attempt(0) >= maxRetries(0) → sets status=error and error=MaxRetriesExceededError
    expect(status()).toBe('error')
    expect(error()).toBeInstanceOf(MaxRetriesExceededError)
    dispose()
  })
})
