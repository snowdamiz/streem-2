import { DocSection, Code } from './DocSection'

export function ComponentsSection(): Node {
  return (
    <DocSection id="components" title="Components">
      <p class="text-muted mb-3 text-[0.95rem]">Components are functions that run once on mount. Reactivity lives in JSX expressions, not in re-renders.</p>
      <Code>{`import { render, onMount, Show, For, ErrorBoundary, Suspense } from 'streeem'\n\n// Mount to DOM\nrender(App, document.getElementById('app')!)\n\n// onMount — runs after first render\nfunction MyComponent() {\n  onMount(() => {\n    // Do work after mount\n    return () => { /* cleanup */ }\n  })\n  return <div>Hello</div>\n}\n\n// Show — conditional rendering\n<Show when={() => isVisible()} fallback={<p>Hidden</p>}>\n  {() => <p>Visible</p>}\n</Show>\n\n// For — keyed list rendering\n<For each={items} by={item => item.id}>\n  {(item) => <li>{item.name}</li>}\n</For>\n\n// ErrorBoundary — catch thrown errors\n<ErrorBoundary fallback={(err, reset) => (\n  document.createTextNode('Error: ' + String(err))\n)}>\n  {() => <RiskyComponent />}\n</ErrorBoundary>\n\n// Suspense — show loading while async resolves\n// Children should throw a Promise to trigger fallback;\n// Suspense retries render when the Promise resolves.\n<Suspense fallback={<p>Loading...</p>}>\n  {() => <AsyncComponent />}\n</Suspense>`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">onMount returns a cleanup function — use it to remove event listeners or cancel timers:</p>
      <Code>{`import { onMount } from 'streeem'\n\nfunction ResizeWatcher() {\n  onMount(() => {\n    const handler = () => console.log(window.innerWidth)\n    window.addEventListener('resize', handler)\n    return () => window.removeEventListener('resize', handler)\n  })\n  return <div>Watching...</div>\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Combine Show and For for conditional lists:</p>
      <Code>{`import { signal, Show, For } from 'streeem'\n\nconst items = signal([{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }])\nconst loading = signal(false)\n\nfunction ItemList() {\n  return (\n    <div>\n      <Show when={() => loading()} fallback={<span />}>\n        {() => <p>Loading...</p>}\n      </Show>\n      <Show when={() => !loading()}>\n        {() => (\n          <For each={items} by={item => item.id}>\n            {(item) => <li>{() => item().name}</li>}\n          </For>\n        )}\n      </Show>\n    </div>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">For component prop typing patterns and how to type children correctly, see the <a href="#typescript" class="text-blue-400 no-underline hover:underline">TypeScript guide</a>.</p>
    </DocSection>
  ) as unknown as Node
}
