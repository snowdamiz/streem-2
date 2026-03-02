# Phase 4: Lit Web Component Interop - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

TypeScript-typed Lit web component bindings for TSX — `prop:` / `attr:` / `on:` namespace handling in the JSX runtime, direct addEventListener for Shadow DOM event routing, and CEM-based type generation tooling. Reading Lit component properties back into signals (observe) is in scope. Creating Lit components, authoring Lit elements, or a Lit-specific renderer are not.

</domain>

<decisions>
## Implementation Decisions

### Namespace prefix design
- **Bare props** use CEM-inferred routing: if CEM manifest identifies the field as a Lit property, route as JS property; otherwise route as HTML attribute
- **Fallback** when CEM data is absent for a component: attribute (safe default, never causes silent data loss)
- **`prop:` prefix** explicitly forces JS property assignment (e.g., `prop:value={signal()}`)
- **`attr:` prefix** explicitly forces HTML attribute (override for edge cases, symmetric with `prop:`)
- **`on:` prefix** attaches via direct `addEventListener` on the element, bypassing JSX event delegation — required for events that originate inside the Shadow DOM

### CEM type generation workflow
- Triggered by an explicit npm script (e.g., `npm run gen:lit-types`) — one-time or as-needed, not automatic on save
- Generated output lands in `src/lit-types/` and is committed to source control
- Single merged output file (e.g., `lit-elements.d.ts`) containing all `JSX.IntrinsicElements` augmentations
- Script supports two input modes: local source file glob AND installed third-party packages (reads `node_modules/pkg/custom-elements.json` if the package ships a CEM)

### Browser testing scope
- Test components: inline stub `LitElement` subclass defined inside the test file — no external Lit component package dependency
- Tests must verify all four behaviors:
  1. Event dispatched inside the shadow root reaches the `on:` handler on the host element
  2. `event.target` is the custom element host, not an internal shadow node (no retargeting failure)
  3. `prop:` calls the element's JS property setter, not `setAttribute`
  4. Reactive signal changes propagate to the element's JS property in a real browser
- Playwright tests run as a **separate `test:browser` script**, not part of the standard `pnpm test` (Vitest/Node) suite; CI runs both

### Lit dependency & scope
- `/lit` has **no runtime dependency on the Lit npm package** — works with any custom element / `HTMLElement` subclass
- Base JSX type for all custom elements includes standard Shadow DOM attributes: `part`, `slot`, `exportparts`, and equivalent spec attributes
- Phase 4 includes **both push (write to element) and pull (observe element property changes back into a Streem signal)**
- Pull/observe mechanism: event-driven — listen for Lit's property-change events (e.g., `my-prop-changed`) via `addEventListener`; update a signal when the event fires

### Claude's Discretion
- Exact CEM analyzer CLI flags and script name
- Internal implementation of the smart-inference routing in the JSX runtime
- TypeScript triple-slash reference or `tsconfig.json` include path for the generated `lit-elements.d.ts`
- Specific event naming convention for Lit property-change events (whether to assume `{prop}-changed` pattern or require explicit declaration in CEM)

</decisions>

<specifics>
## Specific Ideas

- No specific UI/UX references — this is a developer API/tooling phase
- The `on:` prefix model is deliberate: it makes Shadow DOM event routing explicit rather than magic, consistent with how `prop:` makes property routing explicit

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-lit-web-component-interop*
*Context gathered: 2026-02-28*
