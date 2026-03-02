import { signal } from 'streeem'

const count = signal(0)

export function App() {
  return (
    <div>
      <h1>Streem Counter</h1>
      <p>Count: {() => count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
      <button onClick={() => count.set(count() - 1)}>-</button>
    </div>
  )
}
