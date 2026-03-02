import { DocSection, Code } from './DocSection'

export function PatternsSection(): Node {
  return (
    <DocSection id="patterns" title="Patterns">
      <p class="text-muted mb-3 text-[0.95rem]">Common patterns for building real-world apps with Streem.</p>
      <p class="text-muted mb-3 text-[0.95rem]">For performance considerations when applying these patterns at scale, see the <a href="#performance" class="text-blue-400 no-underline hover:underline">Performance guide</a>.</p>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Form handling</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Bind each field to a signal and derive a computed for the submit payload:</p>
      <Code>{`import { signal, computed } from 'streeem'\n\nfunction LoginForm() {\n  const email = signal('')\n  const password = signal('')\n  const isValid = computed(() => email().includes('@') && password().length >= 8)\n\n  function handleSubmit(e: Event) {\n    e.preventDefault()\n    if (!isValid()) return\n    fetch('/api/login', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ email: email(), password: password() }),\n    })\n  }\n\n  return (\n    <form on:submit={handleSubmit}>\n      <input\n        type="email"\n        on:input={(e) => email.set((e.target as HTMLInputElement).value)}\n        placeholder="Email"\n      />\n      <input\n        type="password"\n        on:input={(e) => password.set((e.target as HTMLInputElement).value)}\n        placeholder="Password"\n      />\n      <button type="submit" disabled={() => !isValid()}>Log in</button>\n    </form>\n  )\n}`}</Code>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Data fetching</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Use a signal for the data and a status signal for loading/error states:</p>
      <Code>{`import { signal, onMount } from 'streeem'\n\ninterface User { id: number; name: string }\n\nfunction UserProfile({ userId }: { userId: number }) {\n  const user = signal<User | null>(null)\n  const status = signal<'loading' | 'done' | 'error'>('loading')\n\n  onMount(async () => {\n    try {\n      const res = await fetch(\`/api/users/\${userId}\`)\n      user.set(await res.json())\n      status.set('done')\n    } catch {\n      status.set('error')\n    }\n  })\n\n  return (\n    <div>\n      <Show when={() => status() === 'loading'}>\n        {() => <p>Loading...</p>}\n      </Show>\n      <Show when={() => status() === 'done' && user() !== null}>\n        {() => <p>Hello, {() => user()!.name}</p>}\n      </Show>\n      <Show when={() => status() === 'error'}>\n        {() => <p>Failed to load user.</p>}\n      </Show>\n    </div>\n  )\n}`}</Code>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Shared state</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Export signals from a module — any component that imports them shares the same reactive state:</p>
      <Code>{`// store/auth.ts\nimport { signal, computed } from 'streeem'\n\nexport const currentUser = signal<{ name: string; role: string } | null>(null)\nexport const isLoggedIn = computed(() => currentUser() !== null)\nexport const isAdmin = computed(() => currentUser()?.role === 'admin')\n\nexport function login(user: { name: string; role: string }) {\n  currentUser.set(user)\n}\n\nexport function logout() {\n  currentUser.set(null)\n}\n\n// components/Header.tsx\nimport { currentUser, isLoggedIn, logout } from '../store/auth'\n\nfunction Header() {\n  return (\n    <header>\n      <Show when={isLoggedIn}>\n        {() => (\n          <div>\n            <span>Hello, {() => currentUser()!.name}</span>\n            <button on:click={logout}>Log out</button>\n          </div>\n        )}\n      </Show>\n    </header>\n  )\n}`}</Code>

      <h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">Real-time updates</h3>
      <p class="text-muted mb-3 text-[0.95rem]">Combine a WebSocket stream with a signal accumulator to maintain a running list of events:</p>
      <Code>{`import { signal, effect, fromWebSocket, throttle } from 'streeem'\n\ninterface TradeEvent { symbol: string; price: number; volume: number }\n\nfunction LiveTradesFeed() {\n  const [rawTrade] = fromWebSocket<TradeEvent>('wss://trades.example.com')\n  const displayTrade = throttle(rawTrade, 100) // max 10 updates/sec\n\n  const trades = signal<TradeEvent[]>([])\n\n  effect(() => {\n    const t = displayTrade()\n    if (t == null) return\n    trades.set([t, ...trades().slice(0, 49)]) // keep last 50\n  })\n\n  return (\n    <ul>\n      <For each={trades} by={(t, i) => i}>\n        {(trade) => (\n          <li>{() => \`\${trade().symbol} @ \${trade().price}\`}</li>\n        )}\n      </For>\n    </ul>\n  )\n}`}</Code>
    </DocSection>
  ) as unknown as Node
}
