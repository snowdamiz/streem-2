import { describe, expect, it } from 'vitest'
import { createRoot } from '@streem/core'
import { fromObservable } from '../src/from-observable.js'
import type { Subscribable } from '../src/types.js'

// Synchronous observable: emits all values during .subscribe()
function syncObservable<T>(values: T[]): Subscribable<T> {
  return {
    subscribe(observer) {
      for (const value of values) {
        observer.next?.(value)
      }
      observer.complete?.()
      return { unsubscribe() {} }
    },
  }
}

// Async observable: emits values with setTimeout
function asyncObservable<T>(values: T[], delayMs = 10): Subscribable<T> {
  let cancelled = false
  return {
    subscribe(observer) {
      let i = 0
      const step = () => {
        if (cancelled || i >= values.length) {
          if (!cancelled) observer.complete?.()
          return
        }
        observer.next?.(values[i++])
        setTimeout(step, delayMs)
      }
      setTimeout(step, delayMs)
      return { unsubscribe() { cancelled = true } }
    },
  }
}

// Error-emitting observable
function errorObservable<T>(err: Error): Subscribable<T> {
  return {
    subscribe(observer) {
      observer.error?.(err)
      return { unsubscribe() {} }
    },
  }
}

describe('fromObservable', () => {
  it('starts with status=connecting, data=undefined (STREAM-07)', () => {
    // Async observable — nothing emits synchronously
    const obs = asyncObservable([1, 2, 3])
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromObservable(obs)
      return d
    })
    expect(data()).toBeUndefined()
    expect(status()).toBe('connecting')
    dispose()
  })

  it('updates data signal from synchronous observable (STREAM-04)', () => {
    const obs = syncObservable([10, 20, 30])
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromObservable(obs)
      return d
    })
    // Synchronous observable: all values emitted during .subscribe()
    expect(data()).toBe(30)
    expect(status()).toBe('closed')
    dispose()
  })

  it('updates data signal from async observable (STREAM-04)', async () => {
    const obs = asyncObservable(['a', 'b'], 10)
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromObservable(obs)
      return d
    })
    await new Promise(r => setTimeout(r, 50))
    expect(data()).toBe('b')
    dispose()
  })

  it('applies transform function (STREAM-04)', () => {
    const obs = syncObservable([{ n: 7 }])
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromObservable<number>(obs as any, {
        transform: (v: any) => v.n as number,
      })
      return d
    })
    expect(data()).toBe(7)
    dispose()
  })

  it('sets status=error on observable error (STREAM-04)', () => {
    const obs = errorObservable<number>(new Error('stream failed'))
    let status: any, error: any
    const dispose = createRoot((d) => {
      ;[, status, error] = fromObservable(obs)
      return d
    })
    expect(status()).toBe('error')
    expect(error()).toBeInstanceOf(Error)
    expect(error().message).toBe('stream failed')
    dispose()
  })

  it('calls unsubscribe() when owner disposed (STREAM-04)', () => {
    let unsubscribeCalled = false
    const obs: Subscribable<number> = {
      subscribe(observer) {
        observer.next?.(1)
        return { unsubscribe() { unsubscribeCalled = true } }
      },
    }
    const dispose = createRoot((d) => {
      fromObservable(obs)
      return d
    })
    dispose()
    expect(unsubscribeCalled).toBe(true)
  })

  it('sets status=closed when owner disposed (STREAM-04)', () => {
    const obs = asyncObservable([1], 1000) // long delay — never emits before dispose
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromObservable(obs)
      return d
    })
    dispose()
    expect(status()).toBe('closed')
  })

  it('sets status=error after emitting values — error() fires after next() calls (STREAM-04)', () => {
    // Tests that error() after values correctly sets error signal
    // and that previous data is preserved (last emitted value stays in data signal)
    const testError = new Error('late stream failure')
    const obs: Subscribable<number> = {
      subscribe(observer) {
        observer.next?.(1)
        observer.next?.(2)
        observer.next?.(3)
        observer.error?.(testError) // error after emitting values
        return { unsubscribe() {} }
      },
    }

    let data: any, status: any, error: any
    const dispose = createRoot((d) => {
      ;[data, status, error] = fromObservable(obs)
      return d
    })

    // Synchronous observable: all calls happen during .subscribe()
    expect(data()).toBe(3) // last emitted value preserved
    expect(status()).toBe('error')
    expect(error()).toBe(testError)
    dispose()
  })
})
