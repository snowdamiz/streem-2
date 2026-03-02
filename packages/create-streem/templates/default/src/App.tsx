import { signal } from 'streeem'

const count = signal(0)

export function App() {
  return (
    <div class="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div class="bg-gray-900 rounded-2xl p-10 shadow-xl text-center w-80">
        <h1 class="text-2xl font-bold mb-2 tracking-tight">Streem Counter</h1>
        <p class="text-gray-400 text-sm mb-8">Fine-grained reactive signal</p>
        <div class="text-6xl font-mono font-bold mb-8 text-violet-400">
          {() => count()}
        </div>
        <div class="flex gap-3 justify-center">
          <button
            class="flex-1 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-lg font-bold transition-colors"
            onClick={() => count.set(count() - 1)}
          >
            −
          </button>
          <button
            class="flex-1 py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-lg font-bold transition-colors"
            onClick={() => count.set(count() + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
