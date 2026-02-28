# Pitfalls Research

**Domain:** JSX/TSX reactive streaming frontend framework (signals + streaming, no compiler)
**Researched:** 2026-02-27
**Confidence:** HIGH — all major findings verified against official docs, framework source issues, and multiple independent sources

---

## Critical Pitfalls

### Pitfall 1: Signal Reads Silently Break After Async Boundaries

**What goes wrong:**
Signal tracking only applies to synchronous code within the current reactive context. Any signal read that happens after an `await` is untracked — the system does not know to re-run the computation when the signal changes later. This produces stale values with no error and no warning.

```ts
// Bug: theme() read after await is NOT tracked
createEffect(async () => {
  const data = await fetchSomething();
  document.title = `${data.name} (${theme()})`; // theme() silently never updates
});
```

**Why it happens:**
The reactive tracking mechanism works by recording which signals are read during the synchronous execution of an effect or computed. When execution yields at an `await`, the tracking context is gone. The function resumes in a microtask with no active owner. This is a fundamental property of how all pull-based signal systems (SolidJS, Angular, Preact Signals) work.

**How to avoid:**
- Read all signals synchronously before any `await` and pass them as arguments to async logic.
- Document this rule prominently — it is the single most confusing signal behavior for new users.
- Provide a utility like `snapshot(signal)` that captures the current value outside a reactive context for explicit non-reactive reads, making intent clear.
- Add a dev-mode warning when signals are read in a known-async boundary (this is hard but detectable via a global context flag).

**Warning signs:**
- Values that "update once but never again" in effects that contain `await`.
- Computed values depending on both sync and async state that appear stale after navigation or data fetches.
- Test suite that only tests sync cases all passing while async integration tests reveal stale reads.

**Phase to address:** Signal system foundation phase. Must be documented with an example in the first public API surface. Do not defer to docs phase.

---

### Pitfall 2: Forgetting to Dispose Signals and Subscriptions on Component Unmount

**What goes wrong:**
When a component unmounts, any signals, computed values, effects, or stream subscriptions that were created inside it must be explicitly torn down. If not, subscriptions accumulate: each mount creates new subscribers but never removes old ones. In a streaming-heavy framework, this compounds because each stream creates at least one active listener.

Real measured impact: RxJS-based apps show 47% subscription leak prevalence with a measured 13.3 MB heap growth in long-running sessions.

**Why it happens:**
Fine-grained reactive systems (unlike React's component-scoped hooks) allow signals to be created anywhere — outside components, in services, in closures. The power of this flexibility means the framework cannot automatically know when a "component's" reactive scope has ended unless it is explicitly tracked. Developers used to React, where cleanup is handled via `useEffect` return values tied to the component lifecycle, underestimate how much manual plumbing is needed.

**How to avoid:**
- Every component render context must create a reactive owner scope (e.g., SolidJS's `createRoot` pattern) that automatically disposes all child effects and computations when the component is destroyed.
- Stream bindings created via the framework's streaming primitives must register a cleanup callback that fires on the owner's disposal.
- Expose a `onCleanup` API (mirroring SolidJS) for user-defined teardown logic within a component.
- Never allow raw `subscribe()` calls in userland without a corresponding `onCleanup` pattern — enforce this in the docs and provide lint rules.

**Warning signs:**
- Memory grows monotonically in a browser memory profile as the user navigates between routes.
- WebSocket/SSE connections remaining open in DevTools Network tab after navigating away from a component.
- `effect` callbacks running for components that are no longer in the DOM.

**Phase to address:** Signal system foundation phase (owner/scope tracking) and streaming primitives phase (stream cleanup registration).

---

### Pitfall 3: Signals Outside the Rendering Tree Go Untracked (Component Body Trap)

**What goes wrong:**
In a JSX-based signal framework, component functions execute exactly once during mount — they are not re-executed on signal changes (unlike React components). A signal read in the component body (outside of JSX or an effect) runs once during initialization and never again. This is a systematic source of bugs because the symptom is "works on first render, never updates."

```ts
// Bug: count() is read once at mount, never re-evaluated
function Counter() {
  const doubled = count() * 2; // Executed once, not reactive
  return <div>{doubled}</div>;  // Shows initial value forever
}

// Correct: signal read inside JSX expression (tracked per render)
function Counter() {
  return <div>{() => count() * 2}</div>;
}
```

**Why it happens:**
Developers coming from React expect the whole function body to re-run on state change. In a fine-grained signal framework, the function body runs once and the reactivity lives in the JSX expressions and effects. The mental model shift is non-trivial.

**How to avoid:**
- JSX expressions that should be reactive must use a function wrapper or a framework-specific reactive expression boundary.
- Provide clear documentation with before/after examples at the top of the getting started guide.
- Consider a dev-mode detection: if a signal is called outside any reactive context and outside JSX, emit a console warning.
- Name the concept explicitly in docs: "component body runs once — reactivity lives in JSX expressions and effects."

**Warning signs:**
- State that updates correctly in devtools but the UI does not reflect changes.
- `console.log` in a component body that only prints once despite signal updates.
- New contributors filing bugs that "signals don't work" when they are simply reading outside a reactive boundary.

**Phase to address:** Signal system phase (document clearly), JSX runtime phase (ensure JSX expressions are wrapped in reactive tracking).

---

### Pitfall 4: Streaming Connections Not Recovered on Reconnect — Missed Events

**What goes wrong:**
When an SSE or WebSocket connection drops and reconnects, events emitted during the disconnection window are permanently lost unless the stream source supports event IDs and the client sends `Last-Event-ID`. Most framework streaming bindings do not implement this by default. The result is silent data loss that is invisible to users and only noticed when values stop changing or show gaps.

**Why it happens:**
SSE's `EventSource` auto-reconnects but only sends a `Last-Event-ID` header if the server emitted event IDs and the framework binding preserved the last seen ID. WebSockets have no built-in reconnection at all — every reconnect starts a fresh stream from scratch. Frameworks that wrap these in reactive signals tend to expose a simple "current value" signal and hide the connection plumbing, so missed events are not surfaced.

**How to avoid:**
- For SSE bindings: preserve `lastEventId` from `MessageEvent` and surface it as a reconnect hint. Document that gap recovery requires server cooperation.
- For WebSocket bindings: implement exponential backoff reconnection with a configurable delay. Use the `onerror` + `onclose` distinction correctly — error is for logging, close is for reconnection logic. Do not trigger reconnect in `onerror` as it fires before `onclose`.
- Expose a connection status signal (connected/reconnecting/error) so UI can reflect degraded state.
- Distinguish between "stream has no new data" and "stream is disconnected" in the signal value type.

**Warning signs:**
- Real-time values that appear frozen after a network hiccup but do not show an error state.
- Server logs showing reconnections while client UI shows last-known stale value without any indicator.
- Tests pass in stable network conditions but fail under network throttling/disruption.

**Phase to address:** Streaming primitives phase. Connection status and reconnection must be in the first streaming implementation, not added later.

---

### Pitfall 5: Shadow DOM Event Retargeting Breaks Framework Event Delegation

**What goes wrong:**
Lit components use Shadow DOM. Events dispatched from within a shadow root are retargeted when they cross the shadow boundary — the `event.target` is replaced with the host element. If the framework uses event delegation (attaching listeners at the document or root level and checking `event.target` to route to the right handler), events from inside shadow roots may route incorrectly or not at all.

Additionally, custom events dispatched from inside a Lit component's shadow root without `composed: true` do not cross the boundary at all, so JSX event handlers on the host element never fire.

**Why it happens:**
Shadow DOM encapsulation was designed to prevent event target leakage. Framework event delegation — standard in React and most JSX runtimes — assumes a flat DOM event target hierarchy. These assumptions are incompatible.

**How to avoid:**
- Do not use event delegation for Lit component events. Attach event listeners directly on the element ref, not via JSX synthetic event props that rely on bubbling through a flat DOM.
- Document that Lit component events must use `addEventListener` via `ref`, not JSX `on*` props, unless the Lit component author set `composed: true`.
- Provide a typed wrapper pattern (`createLitComponent`) similar to `@lit/react`'s `createComponent` that handles `addEventListener` mapping behind a clean JSX-style API.
- In tests, verify event propagation explicitly — this class of bug is invisible in JSDOM (no real Shadow DOM) and only manifests in real browsers.

**Warning signs:**
- JSX `onClick` / `onChange` on Lit components that fire inconsistently or not at all.
- Events that fire correctly when a ref + `addEventListener` is used but silently fail with JSX event syntax.
- Bug reports that only reproduce in real browsers, not in Jest/JSDOM test suites.

**Phase to address:** Lit interop phase. The `createLitComponent` wrapper must handle this correctly before any other Lit interop is considered done.

---

### Pitfall 6: Circular Signal Dependencies Cause Infinite Loops With No Clear Error

**What goes wrong:**
If signal A's computed value reads signal B, and signal B's computed value reads signal A (directly or through intermediaries), the reactive system enters an infinite update loop. In frameworks that detect this, an error is thrown but the stack trace points deep into the framework internals, not the user's code. In frameworks that do not detect this, the browser tab freezes or crashes.

**Why it happens:**
Fine-grained reactivity tracks dependencies dynamically at read time. A developer building derived signals (e.g., form validation logic where field A validates against field B's value and field B validates against field A's value) can accidentally create a cycle. The dependency graph is not visible in the code without running it.

**How to avoid:**
- Implement cycle detection in the reactive graph. On detection, throw a meaningful error that includes the signal names (or debug labels) involved in the cycle, not just a stack overflow.
- Encourage debug labels on signals (`signal(0, { debugName: 'cartTotal' })`) so cycle error messages are actionable.
- Separate "source signals" (writable) from "derived signals" (computed, read-only) at the type level — this makes cycles structurally impossible to create between two computed values writing to each other.
- Document the pattern for bidirectional validation: use a single source-of-truth signal, not two mutually derived values.

**Warning signs:**
- Browser tab becomes unresponsive after a specific user interaction.
- Stack overflow errors appearing in the browser console with no clear user-code frame.
- Memory usage climbing continuously after a specific action (symptom of an infinite micro-update loop).

**Phase to address:** Signal system phase. Cycle detection must be built in before the signal API is stabilized.

---

### Pitfall 7: API Surface That Requires Understanding Internals to Use Correctly

**What goes wrong:**
The framework's streaming and signal APIs require developers to understand internal lifecycle ordering, owner tracking, and subscription semantics to avoid bugs. Developers who do not read the internals docs write code that appears to work but leaks memory or produces stale values. Adoption stalls because the learning curve is steep and error messages point to framework internals, not user mistakes.

Qwik — technically innovative — never gained significant adoption partly because its mental model (resumability, serialization boundaries) required too much framework-internal knowledge to use safely. The 2025 community reaction against React Server Components' complexity is a parallel example.

**Why it happens:**
Framework authors understand their own internals deeply and underestimate how much implicit knowledge they apply when writing idiomatic code. The pitfall patterns (async tracking loss, component body vs. JSX context, disposal scopes) feel obvious once understood but are completely opaque to newcomers.

**How to avoid:**
- Every API that has a footgun must have a companion dev-mode warning that fires when the footgun is triggered.
- The "Getting Started" guide must cover the three most common mistakes (body-vs-JSX reactivity, async boundary tracking loss, cleanup) in the first page, not in an "Advanced" section.
- Avoid leaking internal concepts (`owner`, `scope`, `batch`) into the primary API surface. Users should be able to build a working app without knowing these exist.
- The dogfood landing page is the test: if building the landing page requires knowing internal concepts, the API is not ready.
- Provide a diagnostic CLI command or devtools panel that shows active subscriptions, owner trees, and open connections — so developers can see what the framework is doing.

**Warning signs:**
- New contributors' first PRs consistently misuse the same patterns.
- GitHub issues frequently describe "unexpected behavior" with examples that are actually correct usage of the public API but wrong at the internal level.
- The README or docs refer to internal concepts (owner, root, scope) before the user has written any real code.

**Phase to address:** Every phase — but especially API stabilization before public release and documentation phase.

---

### Pitfall 8: Vite Plugin Virtual Module ID Conflicts and HMR Circular Dependencies

**What goes wrong:**
A Vite plugin for the framework (e.g., for injecting the JSX runtime, providing dev-mode helpers, or streaming polyfills) that does not prefix virtual module IDs with `\0` will have its virtual modules intercepted and re-processed by other plugins in the pipeline. This causes confusing transform errors that appear to come from unrelated plugins.

HMR circular dependencies in the framework's own modules cause full-page reloads instead of hot updates, destroying signal state and stream connections every time any framework file is edited during development.

**Why it happens:**
The `\0` prefix is a Rollup/Vite convention for marking virtual modules as internal, preventing other plugins from applying their transforms to them. It is not enforced or documented prominently — it is a community convention. HMR circular dependencies are easy to introduce in framework code because the signal and streaming modules naturally cross-reference each other.

**How to avoid:**
- Prefix all virtual module IDs with `\0` in the `resolveId` hook.
- Use `vite-plugin-inspect` during plugin development to see the exact transform pipeline and catch virtual module leakage early.
- Audit the framework's own module graph for circular dependencies before shipping the Vite plugin — use `vite --debug hmr` to surface HMR cycles.
- Keep the Vite plugin minimal: JSX transform via `@vitejs/plugin-react` or `vite-plugin-solid`-style plugin is the only required transform. Avoid adding framework-internal transforms that would make the plugin Vite-specific and harder to maintain.
- Use `enforce: 'pre'` sparingly and only when order genuinely matters.

**Warning signs:**
- Errors in unrelated plugins that reference virtual module paths from the Streem plugin.
- Full-page reloads happening on edits to framework source files during development rather than HMR updates.
- Signal state lost every time any framework module is saved during development (diagnostic: HMR circular dep, not an app code issue).

**Phase to address:** Build tooling / Vite integration phase.

---

### Pitfall 9: TypeScript JSX Type Declaration Incompatible With Multiple JSX Runtimes

**What goes wrong:**
The framework needs to declare its JSX namespace (`JSX.IntrinsicElements`, `JSX.Element`, etc.) for TypeScript to type-check component output. If this declaration uses a global namespace (`declare global { namespace JSX { ... } }`) rather than module-scoped declaration, it conflicts with React types when both are present in the same project (e.g., a project that uses both Streem and a React-based library). In React 19+, global namespace declarations are deprecated and cause type errors.

Additionally, Lit component types must be registered in `JSX.IntrinsicElements` for the consume-only interop to work. If this registration uses `any` as the attribute type (the common quick fix), TypeScript provides no type safety for Lit component props, defeating the stated goal of "typed props" for Lit interop.

**Why it happens:**
JSX type declarations are one of the murkier parts of TypeScript. The React 18 → 19 transition broke many global namespace approaches. Using `any` for custom element attribute types is the fastest path to "it compiles" but strips all type safety.

**How to avoid:**
- Use `declare module '[your-framework]/jsx-runtime'` rather than global namespace augmentation.
- Provide a `tsconfig` preset that sets `"jsxImportSource": "streem"` and a corresponding `streem/jsx-runtime` export.
- For Lit interop typed props: use `custom-elements-manifest` (CEM) analyzer output to generate typed `IntrinsicElements` declarations automatically rather than hand-writing `any` types. The generated types must import from the actual Lit component module, not use inline anonymous types — otherwise VS Code completions and go-to-definition do not work.
- Test the type declarations in a separate consuming project (not the framework repo itself) to catch declaration conflicts.

**Warning signs:**
- TypeScript errors in consuming projects when both Streem and React types are installed.
- VS Code IntelliSense showing `any` for Lit component props despite supposedly typed interop.
- `Property 'my-lit-element' does not exist on type 'JSX.IntrinsicElements'` errors after adding a new Lit component.

**Phase to address:** TypeScript integration phase (JSX runtime declarations) and Lit interop phase (CEM-based type generation).

---

### Pitfall 10: Backpressure Ignored — Streaming Sources Overwhelm Signal Consumers

**What goes wrong:**
A WebSocket or SSE source can emit events faster than the framework can propagate signal updates and re-render the DOM. Without backpressure handling, the microtask queue fills with pending signal notifications, causing visible jank, dropped frames, and eventually a frozen browser tab. This is especially acute for high-frequency sources (financial tickers, telemetry, AI token streams at peak throughput).

**Why it happens:**
Signal propagation is synchronous by default in most signal implementations — every write immediately propagates to all subscribers. When 200 WebSocket messages arrive per second, 200 synchronous reactive graph traversals happen per second, each potentially triggering layout and paint work. There is no natural throttling.

**How to avoid:**
- Provide `throttle(signal, ms)` and `debounce(signal, ms)` combinators as first-class streaming operators in the framework API.
- Use `requestAnimationFrame`-scheduled batching for DOM updates: collect all signal writes in a microtask and flush once per animation frame.
- Expose a `batch(() => { ... })` API that defers all signal notifications until the callback completes (SolidJS's `batch` is the reference).
- Document the rendering frequency recommendation (e.g., "for >30 updates/second, use `throttle` or `batch`").
- The landing page should include a high-frequency demo (e.g., live data feed) that validates backpressure handling is not just theoretical.

**Warning signs:**
- UI jank when a WebSocket feed is active.
- Browser DevTools Performance panel showing long tasks during stream updates.
- CPU usage climbing linearly with stream message frequency rather than staying flat.

**Phase to address:** Streaming primitives phase. Backpressure operators must ship with the initial streaming API, not as a later optimization.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `any` for Lit component JSX types | Quick interop, no type errors | Zero type safety on Lit props, defeats the typed interop goal | Never — generates CEM types instead |
| Skipping owner/scope tracking in early signal implementation | Simpler initial implementation | Memory leaks on every unmount, impossible to retrofit cleanup | Never — must be in v1 |
| Manual reconnect without backoff | Simple code, works in dev | DDoS self-attack on backend during mass reconnect after outage | Only in pre-production demos |
| Global state via module-level signals | Easy cross-component sharing | Module-level signals are never disposed; HMR breaks them | Only for truly global, static config values |
| Delegated event handling for all events including shadow DOM | Consistent event model | Silent event loss for all Lit components that do not set `composed: true` | Never — handle shadow DOM events via direct listeners |
| Skipping backpressure handling | Simpler streaming API surface | UI freeze and browser crashes under high-frequency sources | Only in initial scaffolding before any streaming demo |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Lit Web Components | Relying on JSX event prop delegation (`onClick`) for shadow DOM events | Map Lit events to direct `addEventListener` calls via a typed wrapper function |
| Lit Web Components | Passing objects/arrays as JSX attributes (serialized to strings) | Use `ref` + property assignment or a `createLitComponent` wrapper that sets `.property` not `attribute=` |
| SSE / `EventSource` | Attaching custom auth headers via URL params (security risk, leaks to logs) | Use a fetch-based SSE polyfill that supports custom headers |
| WebSocket | Reconnecting in `onerror` handler | Reconnect in `onclose` handler only; `onerror` fires before `onclose` and a second reconnect attempt on `onclose` duplicates connections |
| Observable / RxJS sources | Not calling `unsubscribe()` in cleanup | Register subscription in `onCleanup` — the reactive scope disposes it automatically |
| Vite HMR | Signal state lost on any framework file edit during dev | Separate signal state from module-level code; use `import.meta.hot.accept` with state preservation in the plugin |
| Nginx / proxy in production | Proxy buffers SSE responses, delivering 30-second data bursts instead of live updates | Set `X-Accel-Buffering: no` header on SSE responses; document this requirement |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous signal propagation for high-frequency streams | Jank, long tasks in DevTools, frozen tab | `batch()`, `throttle()`, RAF-scheduled flush | >30 signal writes/second |
| Creating a new signal or effect on every render | Memory grows with each re-render, GC pauses | Signals and effects must be created in stable, non-re-running code; component body runs once | Immediately if component re-mounts frequently |
| Unthrottled WebSocket → signal → DOM update loop | CPU at 100% during active stream, battery drain | Throttle at the signal layer; do not bind raw stream directly to frequently-painting DOM nodes | >60 messages/second |
| Accumulating subscriptions without disposal | Memory grows on navigation; old effects run on new data | Owner/scope tracking + auto-disposal on unmount | After ~50 route navigations in a SPA |
| TypeScript type-checking full custom-elements manifest on every keystroke | VS Code freezes in large projects | Lazy-load or split CEM output per component library, do not import entire manifest eagerly | Projects with >100 Lit components |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing auth tokens in SSE/WebSocket URL query params | Token appears in server access logs, proxy logs, browser history, Referer headers | Use cookie-based auth for SSE; use WebSocket subprotocol handshake or initial auth message for WS |
| Rendering raw stream data into DOM without sanitization | XSS if stream source can be influenced by user input | All stream values bound to DOM must be treated as untrusted text; never use `innerHTML` with stream data |
| Sharing a single global signal across user sessions in SSR (future risk) | Session data leakage between concurrent users | Signal instances must be per-request in any future SSR context; document this as a constraint even though CSR-only now |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No connection status signal exposed | Users see stale data with no indication the stream is disconnected | Always expose a typed connection status: `connected \| reconnecting \| error \| closed` as a companion signal to any stream binding |
| Abrupt UI flash when stream reconnects and overwrites current value | Disorienting value jumps | Provide a `keepLastOnReconnect` option that holds the last value during reconnection rather than setting to `undefined` |
| No loading/pending state for async signal initialization | UI shows `undefined` or empty state before first stream message | Signal initialization API must support an `initialValue` and/or a `pending` discriminant |
| Dogfood landing page built after framework is "done" | API pain points not discovered until public release | Landing page built concurrently with each feature phase — pain found during dogfood is a framework bug, not a user skill issue |

---

## "Looks Done But Isn't" Checklist

- [ ] **Signal cleanup:** Verify with a memory profile that navigation between routes does not grow heap — signals and effects from the previous route must be disposed.
- [ ] **Stream reconnection:** Verify that disconnecting the browser's network and reconnecting restores live data — do not rely on happy-path tests alone.
- [ ] **Lit interop events:** Verify Lit component events using a real browser with DevTools — JSDOM does not implement Shadow DOM and will not catch `composed: true` bugs.
- [ ] **Backpressure:** Verify that a simulated 200msg/sec WebSocket source does not freeze the browser — run a perf trace, not just a visual check.
- [ ] **TypeScript types:** Verify the JSX type declarations work in a fresh consuming project that also has `@types/react` installed — type conflicts are invisible inside the framework repo.
- [ ] **HMR state preservation:** Verify that editing a component file during development does not destroy active stream connections — signal state and stream state should survive hot updates.
- [ ] **Async tracking:** Verify that a computed value that reads a signal after an `await` updates correctly — write a test that changes the signal value after the async operation completes and asserts the computed updates.
- [ ] **Vite plugin virtual modules:** Install `vite-plugin-inspect` and verify no Streem virtual modules are being processed by unrelated plugins in the transform pipeline.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Signal disposal not in v1 (memory leaks everywhere) | HIGH — requires new owner/scope API, all existing code must be audited for cleanup | Introduce `createRoot` / owner scope in a semver-major; provide codemod for existing `createEffect` calls |
| Event delegation used for all events including Lit | MEDIUM — Lit events silently broken until fixed | Add direct listener path in `createLitComponent`; document that JSX `on*` props do not work for shadow DOM events |
| API uses internal concepts in public surface | HIGH — breaking API change needed | Deprecate internal-facing API, add stable ergonomic wrapper, maintain deprecated path for one minor version |
| No backpressure handling (freezes at high frequency) | MEDIUM — additive, no breaking change | Add `throttle`/`debounce`/`batch` operators; existing code continues to work, high-frequency users opt in |
| TypeScript declarations use global namespace (conflicts) | MEDIUM — breaking for consuming projects | Move to module-scoped declarations; bump semver minor with migration guide |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Signal reads lost after async boundaries | Signal system (Phase 1) | Async signal tracking test: signal read after `await` updates correctly |
| Missing disposal on unmount | Signal system (Phase 1) | Memory profile: navigate 50 routes, heap flat |
| Component body trap (reads not reactive) | Signal + JSX runtime phase | Unit test: signal update reflects in DOM without manual effect |
| Stream reconnect + missed events | Streaming primitives phase | Network disruption test: disconnect/reconnect, verify no silent stale state |
| Shadow DOM event retargeting | Lit interop phase | Browser test (not JSDOM): Lit component event fires via JSX handler |
| Circular dependency infinite loops | Signal system phase | Cycle detection test: circular computed throws descriptive error |
| API requires internal knowledge | Every phase + docs phase | Dogfood test: landing page built without reading internal source |
| Vite virtual module conflicts | Build tooling phase | `vite-plugin-inspect` shows no Streem virtual modules in unrelated plugin transforms |
| JSX type declarations conflict | TypeScript integration phase | Type-check a project with both Streem and `@types/react` installed |
| Backpressure / high-frequency freeze | Streaming primitives phase | Perf trace at 200msg/sec shows no long tasks |

---

## Sources

- Angular Signals reactive context documentation — https://medium.com/@eugeniyoz/angular-signals-reactive-context-and-dynamic-dependency-tracking-d2d6100568b0
- SolidJS fine-grained reactivity docs — https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity
- Hands-on introduction to fine-grained reactivity (Ryan Carniato) — https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf
- Preact Signals fine-grained reactivity in React — https://medium.com/@sparshmalhotraaa/fine-grained-reactivity-in-react-how-preact-signals-do-it-a282943b2bd8
- Angular Signals Effect() misuse patterns — https://dev.to/codewithrajat/angular-signals-effect-why-90-of-developers-use-it-wrong-4pl4
- Backpressure in WebSocket streams — https://skylinecodes.substack.com/p/backpressure-in-websocket-streams
- SSE production pitfalls and proxy buffering — https://sahilserver.substack.com/p/sse-in-production-from-simple-streams
- WebSocket onerror vs onclose error handling — https://www.videosdk.live/developer-hub/websocket/websocket-onerror
- Lit + React interop (createComponent, EventName) — https://lit.dev/docs/frameworks/react/
- Custom elements JSX IntrinsicElements pitfalls — https://goulet.dev/posts/consuming-web-component-react-typescript/
- Shadow DOM composed:true event requirement — TypeScript issue tracker https://github.com/microsoft/TypeScript/issues/56693
- Generating intrinsic element types for Lit — https://medium.com/@raymondboswel/generating-intrinsic-element-types-for-lit-components-9efdf5f4d00c
- Vite Plugin API — virtual module conventions — https://vite.dev/guide/api-plugin
- Vite plugin authoring guide — https://medium.com/@mariappan/authoring-a-vite-plugin-52cedf5aa07e
- SolidJS finicky API post-mortem — https://www.spicyweb.dev/oh-not-again-please-no-not-again/
- JavaScript frameworks adoption failure analysis 2025 — https://dev.to/this-is-learning/javascript-frameworks-heading-into-2026-2hel
- Framework complexity and vanilla JS return — https://thenewstack.io/why-developers-are-ditching-frameworks-for-vanilla-javascript/
- Signal-first architectures arxiv paper — https://arxiv.org/html/2506.13815v1
- Memory leaks in React / frontend — https://wslisam.medium.com/preventing-memory-leaks-in-frontend-development-best-practices-and-detection-strategies-94fa9ef15b8c
- Avoid memory leaks Angular signals — https://pawan-kumawat.medium.com/avoid-memory-leak-in-angular-17-using-signals-877e3068d318

---
*Pitfalls research for: JSX/TSX reactive streaming frontend framework (Streem v2)*
*Researched: 2026-02-27*
