import { DocSection, Code } from './DocSection'

export function StreamsSection(): Node {
  return (
    <DocSection id="streams" title="Streams">
      <p class="text-muted mb-3 text-[0.95rem]">Stream adapters return a <code>[dataSignal, statusSignal]</code> tuple. All connections close automatically via <code>onCleanup()</code> when the component unmounts.</p>
      <Code>{`import { fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce } from 'streeem'\nimport type { Subscribable } from 'streeem'\n\n// WebSocket — auto-reconnects with exponential backoff\nconst [data, status] = fromWebSocket('wss://example.com')\n// status() → 'connected' | 'reconnecting' | 'error' | 'closed'\n\n// SSE\nconst [feed] = fromSSE('/api/events')\n\n// Fetch ReadableStream\nconst [chunk] = fromReadable(response.body!)\n\n// Any Observable / RxJS subject\nconst myObs: Subscribable<number> = {\n  subscribe(obs) {\n    // ...\n    return { unsubscribe() {} }\n  }\n}\nconst [value] = fromObservable(myObs)\n\n// Backpressure — batch N signal writes as one effect run\nbatch(() => {\n  price.set(newPrice)\n  volume.set(newVolume)\n})\n\n// Throttle / debounce signal updates\nconst visual = throttle(stream, 33)   // max 30fps\nconst search = debounce(query, 300)   // debounce 300ms`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Always check the status signal before rendering data — connections may be reconnecting or in error:</p>
      <Code>{`import { fromWebSocket, Show } from 'streeem'\n\nfunction PriceDisplay() {\n  const [price, status] = fromWebSocket<number>('wss://prices.example.com')\n\n  return (\n    <div>\n      <Show when={() => status() === 'connected'}>\n        {() => <span>Price: {price}</span>}\n      </Show>\n      <Show when={() => status() === 'reconnecting'}>\n        {() => <span>Reconnecting...</span>}\n      </Show>\n      <Show when={() => status() === 'error'}>\n        {() => <span>Connection error</span>}\n      </Show>\n    </div>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Use throttle to limit UI updates from fast streams (e.g. 30fps cap):</p>
      <Code>{`import { fromWebSocket, throttle } from 'streeem'\n\nconst [rawTick] = fromWebSocket('wss://ticks.example.com')\nconst displayTick = throttle(rawTick, 33) // max ~30fps\n\nfunction Ticker() {\n  return <span>{displayTick}</span>\n}`}</Code>
    </DocSection>
  ) as unknown as Node
}
