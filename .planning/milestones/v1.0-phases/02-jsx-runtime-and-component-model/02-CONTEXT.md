# Phase 2: JSX Runtime and Component Model - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the DOM rendering layer: JSX factory (`h()`, `Fragment`, `render()`), reactive DOM bindings, component primitives (`onMount()`, function-runs-once model), built-in components (`<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`), and Vite HMR with signal/stream state preservation. Creating posts, interactions, and stream adapters are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Reactive binding syntax
- Developers write `{signal()}` — calling the signal is the reactive read. No auto-unwrapping.
- Any function wrapping a signal read is reactive: `{() => signal() + ' suffix'}` tracks correctly.
- Reactive bindings target individual DOM nodes/attributes — surgical updates only, no subtree re-render.
- Both `class=` (reactive string expression) and `classList=` (object map of class → boolean) are supported.

### Built-in component APIs
- `<Show when={isVisible()} fallback={<Loading />}>children</Show>` — SolidJS-aligned prop names.
- `<For each={items()} key={(item) => item.id}>{(item, index) => <div>{item.name}</div>}</For>` — render function children, explicit key function for DOM reuse.
- `<ErrorBoundary fallback={(err, reset) => <div>Error: {err.message} <button onClick={reset}>Retry</button></div>}>` — fallback is a render function receiving error and reset callback.

### Suspense and stream integration
- `<Suspense>` uses the thrown-Promise protocol: any child that throws a Promise triggers the fallback.
- Progressive resolution: children render individually as they resolve (not all-or-nothing).
- Errors during resource fetch propagate up to the nearest `<ErrorBoundary>` — `<Suspense>` handles pending state only, not errors.
- `createResource` is deferred to Phase 3 — Phase 2 defines the thrown-Promise Suspense protocol so the mechanism is ready.

### HMR preservation model
- Preserves signal values AND active stream connection state (WebSocket, SSE) across hot reloads.
- Components identified by file path + export name (e.g., `src/App.tsx > default`).
- Full reset on structural change — if component signal count or structure changes, no state restore.
- Scoped to standalone Streem components rendered via `render()`. Lit web component HMR is Phase 4's responsibility.

### Claude's Discretion
- Exact loading skeleton design and animation for `<Suspense>` fallback
- Internal mechanism for thrown-Promise detection and Suspense boundary traversal
- Vite HMR plugin implementation details (module registration, accept() hooks)
- Reactive effect lifecycle management within component scope

</decisions>

<specifics>
## Specific Ideas

- Binding and component API closely mirrors SolidJS — familiar to developers who know SolidJS, intentional alignment.
- `key=` on `<For>` is a function `(item) => item.id`, not a string key prop on children. This avoids JSX noise on every list item.
- HMR full reset on structural change is intentional — predictable behavior beats best-effort magic when the component's shape changes.

</specifics>

<deferred>
## Deferred Ideas

- `createResource` primitive for async data fetching — Phase 3 (alongside stream adapters)
- Lit web component HMR integration — Phase 4
- Progressive streaming HTML / server-side rendering — not in current milestone

</deferred>

---

*Phase: 02-jsx-runtime-and-component-model*
*Context gathered: 2026-02-27*
