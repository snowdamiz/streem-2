import { signal } from '@streeem/core'
import { Show, For, onMount, getRestoredValue, saveSignalCount } from '@streeem/dom'

// HMR state preservation: restore signal values from previous module instance
const SIGNAL_KEYS = ['count', 'showExtra']
const _hmrData = import.meta.hot?.data as Record<string, unknown> | undefined

const count = signal(getRestoredValue(_hmrData, 'count', 0))
const showExtra = signal(getRestoredValue(_hmrData, 'showExtra', false))
const items = signal([
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
])

// Save signal state before this module is replaced (HMR).
// main.tsx is the HMR boundary — it disposes the old tree and re-renders.
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.count = count()
    data.showExtra = showExtra()
    saveSignalCount(data, SIGNAL_KEYS.length)
  })
}

export function App() {
  onMount(() => {
    console.log('App mounted. count =', count())
  })

  return (
    <div>
      <h1>Streem Demo</h1>

      <p>Count: {() => count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
      <button onClick={() => count.set(count() - 1)}>Decrement</button>

      <button onClick={() => showExtra.set(!showExtra())}>Toggle extra</button>
      <Show when={() => showExtra()} fallback={<p>Extra hidden</p>}>
        <p>Extra content is visible!</p>
      </Show>

      <h2>Items</h2>
      <ul>
        <For each={() => items()} by={(item) => item.id}>
          {(item) => <li>{item.name}</li>}
        </For>
      </ul>
    </div>
  )
}
