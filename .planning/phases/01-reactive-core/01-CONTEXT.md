# Phase 1: Reactive Core - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

DOM-free signal primitives (`signal()`, `computed()`, `effect()`), owner/cleanup tree (`createRoot()`, `onCleanup()`, `getOwner()`, `runWithOwner()`), and dev-mode reactive context warnings. Zero DOM dependency — all primitives run in plain Node. Everything downstream builds on this.

</domain>

<decisions>
## Implementation Decisions

### Signal API shape
- `signal(initialValue)` returns a getter function with a `.set(value)` method — `count()` to read, `count.set(1)` to write
- `.set(value)` only — no updater function overload or `.update(fn)` variant; keep the setter minimal
- `computed(fn)` returns a read-only getter function — same callable shape as signals, but no `.set` on the type
- `effect(fn)` returns a dispose function for manual cleanup (separate from owner-scope disposal)
- Optional second argument for debug label: `signal(0, { name: 'count' })` — shows in dev warnings, zero cost when omitted

### alien-signals integration
- alien-signals is inspiration only — `@streem/core` is a fully custom implementation with no runtime dep on alien-signals
- Algorithm basis: push-pull (signals push change notifications, computeds pull lazily on read)
- Circular dependency handling: throw a descriptive error in dev mode, silent cycle-break in prod
- Internal data structures (arrays vs. sets for dependency tracking): Claude's discretion

### Owner tree contract
- `createRoot(fn)` returns a dispose function — `const dispose = createRoot(() => { /* setup */ }); dispose()`
- No implicit global root — explicit-only. Every `effect()` or `computed()` created outside a root scope triggers the DX-03 dev warning
- `runWithOwner(owner, fn)` with a disposed owner: throw in dev, no-op in prod (matches circular dep pattern)
- `onCleanup()` callbacks run synchronously when the containing scope disposes; inside an effect, cleanup also runs before each re-execution

### Dev-mode warning system
- Surface via `console.warn` only — no configurable handler in Phase 1
- Warning format: message + native call stack (e.g. `[Streem] Signal read outside reactive context. This is likely a snapshot.`)
- Debug labels on signals show in warning messages when set: `[Streem] Signal "count" read outside reactive context`
- Dev mode detected via `import.meta.env.DEV` — tree-shaken by Vite/Rollup in prod, works in Vitest for the Node test suite

### Claude's Discretion
- Internal reactive graph data structures (arrays vs. sets for dependency lists)
- Exact internal node representation for the owner tree
- Test file organization and naming conventions within the Node test suite

</decisions>

<specifics>
## Specific Ideas

- No specific UI references (this is a pure TypeScript library)
- The push-pull algorithm choice is informed by SolidJS and alien-signals as reference implementations — same mental model
- Vitest is the implicit test runner (import.meta.env.DEV is shim-compatible in Vitest)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-reactive-core*
*Context gathered: 2026-02-27*
