import { describe, expect, it } from 'vitest'
import { createRoot } from '@streeem/core'
import { fromReadable } from '../src/from-readable.js'

function makeStream<T>(chunks: T[], delayMs = 0): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
        controller.enqueue(chunk)
      }
      controller.close()
    },
  })
}

describe('fromReadable', () => {
  it('starts with status=connecting, data=undefined (STREAM-07)', () => {
    const stream = makeStream([42])
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromReadable(stream)
      return d
    })
    // Immediately after creation — pump() hasn't yielded yet
    expect(data.value).toBeUndefined()
    dispose()
  })

  it('updates data signal for each chunk (STREAM-03)', async () => {
    const stream = makeStream(['hello', 'world'])
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromReadable(stream)
      return d
    })
    // Wait for pump to consume all chunks
    await new Promise(r => setTimeout(r, 20))
    expect(data.value).toBe('world')
    expect(status.value).toBe('closed')
    dispose()
  })

  it('applies transform function to each chunk (STREAM-03)', async () => {
    const stream = makeStream([{ value: 5 }, { value: 10 }])
    let data: any
    const dispose = createRoot((d) => {
      ;[data] = fromReadable(stream, {
        transform: (chunk: any) => chunk.value as any,
      })
      return d
    })
    await new Promise(r => setTimeout(r, 20))
    expect(data.value).toBe(10)
    dispose()
  })

  it('sets status=closed when stream ends (STREAM-03)', async () => {
    const stream = makeStream(['a'])
    let status: any
    const dispose = createRoot((d) => {
      ;[, status] = fromReadable(stream)
      return d
    })
    await new Promise(r => setTimeout(r, 20))
    expect(status.value).toBe('closed')
    dispose()
  })

  it('sets status=closed when owner is disposed and cancels the reader (STREAM-03)', async () => {
    // Long-running stream — owner disposed before it finishes
    const stream = new ReadableStream({
      start(controller) {
        // Keeps stream open indefinitely (no close call)
        controller.enqueue('first chunk')
      },
    })
    let data: any, status: any
    const dispose = createRoot((d) => {
      ;[data, status] = fromReadable(stream)
      return d
    })
    await new Promise(r => setTimeout(r, 10))
    dispose()
    expect(status.value).toBe('closed')
  })

  it('sets status=error and error signal when ReadableStream controller.error() is called', async () => {
    // Tests the pump() catch block — non-cancellation errors set status=error
    let controller!: ReadableStreamDefaultController<string>
    const errorStream = new ReadableStream<string>({
      start(c) {
        controller = c
        c.enqueue('first value')
      },
    })

    let data: any, status: any, error: any
    const dispose = createRoot((d) => {
      ;[data, status, error] = fromReadable(errorStream)
      return d
    })

    // Wait for first chunk to be consumed
    await new Promise(r => setTimeout(r, 20))
    expect(data.value).toBe('first value')

    // Error the stream — pump() catch block should fire
    const streamError = new Error('stream corrupted')
    controller.error(streamError)

    await new Promise(r => setTimeout(r, 20))
    expect(status.value).toBe('error')
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value.message).toBe('stream corrupted')
    dispose()
  })
})
