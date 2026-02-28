# Phase 4: Lit Web Component Interop - Research

**Researched:** 2026-02-28
**Domain:** Custom Elements / Web Components — JSX runtime namespace prefixes, CEM type generation, Shadow DOM event routing, Vitest Browser Mode
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary:**
TypeScript-typed Lit web component bindings for TSX — `prop:` / `attr:` / `on:` namespace handling in the JSX runtime, direct addEventListener for Shadow DOM event routing, and CEM-based type generation tooling. Reading Lit component properties back into signals (observe) is in scope. Creating Lit components, authoring Lit elements, or a Lit-specific renderer are not.

**Namespace prefix design:**
- Bare props use CEM-inferred routing: if CEM manifest identifies the field as a Lit property, route as JS property; otherwise route as HTML attribute
- Fallback when CEM data is absent for a component: attribute (safe default, never causes silent data loss)
- `prop:` prefix explicitly forces JS property assignment (e.g., `prop:value={signal()}`)
- `attr:` prefix explicitly forces HTML attribute (override for edge cases, symmetric with `prop:`)
- `on:` prefix attaches via direct `addEventListener` on the element, bypassing JSX event delegation — required for events that originate inside the Shadow DOM

**CEM type generation workflow:**
- Triggered by an explicit npm script (e.g., `npm run gen:lit-types`) — one-time or as-needed, not automatic on save
- Generated output lands in `src/lit-types/` and is committed to source control
- Single merged output file (e.g., `lit-elements.d.ts`) containing all `JSX.IntrinsicElements` augmentations
- Script supports two input modes: local source file glob AND installed third-party packages (reads `node_modules/pkg/custom-elements.json` if the package ships a CEM)

**Browser testing scope:**
- Test components: inline stub `LitElement` subclass defined inside the test file — no external Lit component package dependency
- Tests must verify all four behaviors:
  1. Event dispatched inside the shadow root reaches the `on:` handler on the host element
  2. `event.target` is the custom element host, not an internal shadow node (no retargeting failure)
  3. `prop:` calls the element's JS property setter, not `setAttribute`
  4. Reactive signal changes propagate to the element's JS property in a real browser
- Playwright tests run as a **separate `test:browser` script**, not part of the standard `pnpm test` (Vitest/Node) suite; CI runs both

**Lit dependency & scope:**
- `@streem/lit` has no runtime dependency on the Lit npm package — works with any custom element / `HTMLElement` subclass
- Base JSX type for all custom elements includes standard Shadow DOM attributes: `part`, `slot`, `exportparts`, and equivalent spec attributes
- Phase 4 includes **both push (write to element) and pull (observe element property changes back into a Streem signal)**
- Pull/observe mechanism: event-driven — listen for Lit's property-change events (e.g., `my-prop-changed`) via `addEventListener`; update a signal when the event fires

### Claude's Discretion
- Exact CEM analyzer CLI flags and script name
- Internal implementation of the smart-inference routing in the JSX runtime
- TypeScript triple-slash reference or `tsconfig.json` include path for the generated `lit-elements.d.ts`
- Specific event naming convention for Lit property-change events (whether to assume `{prop}-changed` pattern or require explicit declaration in CEM)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIT-01 | Developer can import and render Lit web components in TSX files with TypeScript-typed props — no runtime wrapper library required | TypeScript module augmentation of `@streem/dom/jsx-runtime` namespace; `declare module "@streem/dom/jsx-runtime"` pattern; template literal index signatures for `prop:`/`attr:`/`on:` namespaces |
| LIT-02 | Lit component property bindings use a `prop:` namespace prefix in JSX to route values to element properties rather than HTML attributes | `applyProps()` in `h.ts` must detect keys starting with `prop:`, strip prefix, and assign `el[propName] = value` instead of `setAttribute`; reactive accessor handled with `effect(() => { el[propName] = accessor() })` |
| LIT-03 | Lit component event listeners attach directly to the element ref (not via JSX event delegation) to prevent Shadow DOM event retargeting failures | `on:` prefix in `applyProps()` routes to direct `addEventListener` on the element host; existing `bindEvent()` already uses direct `addEventListener` — just needs dispatch from `applyProps()` |
| LIT-04 | Developer can auto-generate JSX `IntrinsicElements` type declarations for Lit components by running the Custom Elements Manifest analyzer against the component source | `@custom-elements-manifest/analyzer` 0.10.5 + `@wc-toolkit/jsx-types` generate `lit-elements.d.ts` augmenting `declare module "@streem/dom/jsx-runtime"`; npm script `gen:lit-types` orchestrates the pipeline |
</phase_requirements>

---

## Summary

Phase 4 adds `@streem/lit` — a zero-runtime-dependency package that extends the `@streem/dom` JSX runtime to handle Lit web components ergonomically. The implementation has three distinct surfaces: (1) runtime JSX prop dispatch for `prop:` / `attr:` / `on:` namespace prefixes in `applyProps()`, (2) an `observeLitProp()` utility that creates a Streem signal that stays in sync with a Lit element property via event-driven pull, and (3) a code-generation CLI script that reads CEM JSON and produces a `lit-elements.d.ts` TypeScript declaration augmenting `JSX.IntrinsicElements` in the `@streem/dom/jsx-runtime` module.

The most critical architectural finding is that the existing `applyProps()` function in `h.ts` already handles `on*` event routing — but it uses lowercase event name detection and does NOT handle the `prop:` / `attr:` / `on:` prefix model. The JSX runtime must be extended to detect these namespace prefixes before the existing `on*` catch, so `on:custom-event` routes directly to `addEventListener` while `onClick` routes through the existing convention. The `prop:` case needs a reactive `effect()` binding that sets the JS property directly — `el[propName] = accessor()` — not `setAttribute`.

Vitest Browser Mode (stable in Vitest 4.0, shipped October 2025) with `@vitest/browser-playwright` is the required test environment for LIT-03 verification. Shadow DOM event retargeting failures do not surface in happy-dom or JSDOM; only a real browser catches them. The test suite must live in a separate `vitest.browser.config.ts` invoked by a `test:browser` script, parallel to the existing `pnpm test` suite.

**Primary recommendation:** New package `packages/lit/` with `src/index.ts` (runtime utils + `applyLitProps`), `scripts/gen-lit-types.ts` (CEM pipeline), `src/lit-types/` (generated `.d.ts` output), and `vitest.browser.config.ts` (browser test suite). Extend `@streem/dom`'s `applyProps()` to handle `prop:` / `attr:` / `on:` prefixes, keeping the change entirely additive and backward-compatible.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@custom-elements-manifest/analyzer` | 0.10.5 | Scans Lit/custom-element source and generates `custom-elements.json` | Community standard; ships as `cem analyze` CLI; official Lit support via `--litelement` flag |
| `@wc-toolkit/jsx-types` | latest | Reads CEM JSON, generates `IntrinsicElements` augmentation `.d.ts` | Purpose-built for this exact problem; supports arbitrary `declare module` targets; handles property vs attribute distinction |
| `@vitest/browser-playwright` | ^4.0.0 | Vitest 4 browser provider using Playwright Chromium | Required for Shadow DOM event retargeting tests; Vitest 4 marks browser mode as stable |
| `playwright` | ^1.x | Browser automation behind `@vitest/browser-playwright` | Playwright locators pierce Shadow DOM natively; recommended over WebdriverIO for parallel execution |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lit` | ^3.x | Dev-only: used in browser test files to define stub LitElement subclasses | Test-only devDependency — no runtime dependency in `@streem/lit` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@wc-toolkit/jsx-types` (programmatic) | Hand-written CEM→types script | wc-toolkit is purpose-built and handles edge cases (event types, property vs attribute, CSS properties); hand-rolling wastes time and misses corner cases |
| `@vitest/browser-playwright` | Playwright standalone or Cypress | Vitest browser mode shares test runner with Node suite — same `describe`/`it`/`expect` API, same coverage; standalone Playwright requires separate test runner |
| `declare module "@streem/dom/jsx-runtime"` augmentation | Global `declare namespace JSX` | React 19+ / modern JSX transform ignores global JSX namespace; module-scoped augmentation is the correct pattern for `jsxImportSource`-style runtimes |

**Installation (new `packages/lit/` package):**
```bash
# devDependencies in packages/lit/
pnpm add -D @custom-elements-manifest/analyzer @wc-toolkit/jsx-types lit @vitest/browser-playwright playwright typescript
```

**Installation (new `packages/lit/` package — runtime zero-dep, type augmentation only):**
```bash
# No runtime npm install needed; @streem/dom and @streem/core are workspace peers
```

---

## Architecture Patterns

### Recommended Project Structure

```
packages/lit/
├── package.json                  # name: @streem/lit; no runtime deps; peerDeps: @streem/dom, @streem/core
├── tsconfig.json                 # extends ../../tsconfig.base.json; jsx: react-jsx; jsxImportSource: @streem/dom
├── vite.config.ts                # library build: entry src/index.ts; external @streem/core, @streem/dom
├── vitest.browser.config.ts      # browser mode + Playwright; include tests/browser/**
├── scripts/
│   └── gen-lit-types.ts          # CEM pipeline: glob sources → cem analyze → generateJsxTypes → write lit-elements.d.ts
├── src/
│   ├── index.ts                  # exports: applyLitProps, bindLitProp, observeLitProp
│   ├── apply-lit-props.ts        # applyProps extension: prop:, attr:, on: dispatch
│   ├── bind-lit-prop.ts          # reactive effect() binding: el[name] = accessor()
│   └── observe-lit-prop.ts       # event-driven pull: listen for '{prop}-changed', update signal
└── tests/
    └── browser/
        └── lit-interop.browser.test.ts  # Playwright Vitest browser tests for LIT-01..04
```

**`@streem/dom` changes (additive only):**
```
packages/dom/src/
├── h.ts                          # applyProps: add prop:/attr:/on: prefix handling BEFORE existing on* handler
```

**Type declaration destination:**
```
packages/lit/src/lit-types/
└── lit-elements.d.ts             # committed; augments declare module "@streem/dom/jsx-runtime"
```

### Pattern 1: JSX Namespace Prefix Dispatch in `applyProps()`

**What:** Detect `prop:`, `attr:`, and `on:` key prefixes in `applyProps()` and route to the correct DOM operation before the existing `on*` handler runs.

**When to use:** Called on every JSX intrinsic element with these prefix keys in props.

**Example:**
```typescript
// Source: TypeScript issue #54333 (template literal index signatures, fixed in TS 5.1 RC)
// Extends the existing applyProps() in packages/dom/src/h.ts

export function applyProps(el: HTMLElement, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    if (key === 'ref' && typeof value === 'function') {
      ;(value as (el: HTMLElement) => void)(el)
      continue
    }

    // --- NEW: namespace prefix handling ---
    if (key.startsWith('prop:')) {
      const propName = key.slice(5) // 'prop:value' → 'value'
      if (typeof value === 'function') {
        bindLitProp(el as unknown as Record<string, unknown>, propName, value as () => unknown)
      } else if (value !== undefined) {
        ;(el as unknown as Record<string, unknown>)[propName] = value
      }
      continue
    }

    if (key.startsWith('attr:')) {
      const attrName = key.slice(5) // 'attr:disabled' → 'disabled'
      if (typeof value === 'function') {
        bindAttr(el, attrName, value as () => unknown)
      } else if (value != null && value !== false) {
        el.setAttribute(attrName, value === true ? attrName : String(value))
      }
      continue
    }

    if (key.startsWith('on:')) {
      const eventName = key.slice(3) // 'on:my-event' → 'my-event' (keep original casing)
      if (typeof value === 'function') {
        bindEvent(el, eventName, value as EventListener)
      }
      continue
    }
    // --- END new prefix handling ---

    // existing on* handler, class, classList, style, generic reactive...
  }
}
```

### Pattern 2: Reactive Property Binding (`bindLitProp`)

**What:** Create a reactive `effect()` that keeps a JS element property in sync with a signal accessor.

**When to use:** When `prop:` prefix is used with an accessor (reactive signal value).

**Example:**
```typescript
// Source: pattern derived from existing bindAttr() in packages/dom/src/bindings.ts
import { effect } from '@streem/core'

export function bindLitProp(
  el: Record<string, unknown>,
  propName: string,
  accessor: () => unknown,
): void {
  effect(() => {
    el[propName] = accessor()
  })
}
```

### Pattern 3: Observe Lit Property Back into Signal (`observeLitProp`)

**What:** Listen for a Lit-style `{propName}-changed` custom event on the element host, and update a writable signal when the event fires.

**When to use:** LIT-04 pull/observe requirement; whenever the developer needs a signal that reflects an element property value.

**Example:**
```typescript
// Source: Lit docs — events dispatched via dispatchEvent with CustomEvent detail
// https://lit.dev/docs/components/events/
import { signal, onCleanup } from '@streem/core'
import type { Signal } from '@streem/core'

export function observeLitProp<T>(
  el: EventTarget,
  propName: string,           // camelCase property name e.g. 'myValue'
  initialValue: T,
): Signal<T> {
  const sig = signal<T>(initialValue)
  // Convention: Lit community pattern converts camelCase → kebab-case + '-changed'
  // e.g. 'myValue' → 'my-value-changed'
  const eventName = propName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '') + '-changed'

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ value: T }>).detail
    if (detail && 'value' in detail) {
      sig.set(detail.value)
    }
  }
  el.addEventListener(eventName, handler)
  onCleanup(() => el.removeEventListener(eventName, handler))
  return sig
}
```

### Pattern 4: TypeScript `declare module` Augmentation for Custom JSX Runtime

**What:** Augment `JSX.IntrinsicElements` inside the module `"@streem/dom/jsx-runtime"` — the exact module path TypeScript resolves from `jsxImportSource: "@streem/dom"`.

**When to use:** Generated `lit-elements.d.ts` output; also for the base custom element type with Shadow DOM attributes.

**Example:**
```typescript
// Source: TypeScript JSX docs; verified pattern from wc-toolkit/jsx-types output
// The module must match jsxImportSource + "/jsx-runtime"

// packages/lit/src/lit-types/lit-elements.d.ts  (GENERATED — DO NOT EDIT)
import type { CustomElements } from '@wc-toolkit/jsx-types'

declare module '@streem/dom/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
```

**For the base custom element type (hand-authored, not generated):**
```typescript
// packages/lit/src/base-custom-element-types.d.ts  (hand-authored once)
declare module '@streem/dom/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      // All custom elements (hyphenated tags) get Shadow DOM attributes + prefix namespaces
      [tag: `${string}-${string}`]: {
        [key: string]: unknown
        // Shadow DOM attributes
        part?: string
        slot?: string
        exportparts?: string
        // Namespace prefix index signatures
        [key: `prop:${string}`]: unknown
        [key: `attr:${string}`]: string | boolean | undefined
        [key: `on:${string}`]: EventListener
      }
    }
  }
}
```

### Pattern 5: CEM Type Generation Script

**What:** Node script that runs `@custom-elements-manifest/analyzer` on local sources (or reads `node_modules/pkg/custom-elements.json`), then calls `generateJsxTypes()` from `@wc-toolkit/jsx-types` to write `lit-elements.d.ts`.

**When to use:** When developer runs `npm run gen:lit-types`.

**Example:**
```typescript
// Source: wc-toolkit.com/integrations/jsx/ + custom-elements-manifest.open-wc.org
// packages/lit/scripts/gen-lit-types.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { generateJsxTypes } from '@wc-toolkit/jsx-types'

// Option A: read CEM from local analysis (after cem analyze runs)
const manifest = JSON.parse(readFileSync('./custom-elements.json', 'utf8'))

generateJsxTypes(manifest, {
  fileName: 'lit-elements.d.ts',
  outdir: './src/lit-types',
  // For @streem/dom's custom JSX runtime, the augmentation module is the jsx-runtime subpath:
  // generateJsxTypes does NOT write the declare module wrapper itself — that's our wrapper
})
```

**Actual npm script flow:**
```json
{
  "scripts": {
    "gen:lit-types": "cem analyze --litelement --globs 'src/**/*.ts' && tsx scripts/gen-lit-types.ts"
  }
}
```

### Pattern 6: Vitest Browser Mode Config (separate from Node suite)

**What:** A separate `vitest.browser.config.ts` that uses `@vitest/browser-playwright` to run browser tests against real Chromium.

**When to use:** `test:browser` npm script; CI runs alongside standard `pnpm test`.

**Example:**
```typescript
// Source: vitest.dev/guide/browser/ — Vitest 4 stable browser mode
// packages/lit/vitest.browser.config.ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    name: '@streem/lit:browser',
    include: ['tests/browser/**/*.browser.test.{ts,tsx}'],
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
```

**npm script:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:browser": "vitest run --config vitest.browser.config.ts"
  }
}
```

### Anti-Patterns to Avoid

- **`el.setAttribute('value', String(val))`** for `prop:value` — loses type information for non-string properties (arrays, objects, numbers, booleans are stringified); `el['value'] = val` is always correct for JS properties.
- **Routing `on:` through the existing `on*` handler** — the existing handler lowercases everything: `onClick` → `click`. The `on:` prefix should preserve the event name as-is: `on:my-custom-event` → `my-custom-event`. These must be separate branches.
- **Global `declare namespace JSX`** — ignored by TypeScript when `jsxImportSource` is set (React 19 / modern JSX transform behavior). Always use `declare module "@streem/dom/jsx-runtime"`.
- **Running browser tests in happy-dom** — happy-dom does not implement Shadow DOM's event retargeting behavior. LIT-03 can only be verified in a real browser.
- **Depending on Lit's auto-property-change events** — Lit does NOT automatically dispatch `{prop}-changed` events. This is a Polymer/community convention. Components must explicitly dispatch these events. The `observeLitProp()` utility documents this contract clearly; developers must ensure their components dispatch such events.
- **Adding `lit` as a runtime dependency of `@streem/lit`** — the interop package works with any `HTMLElement` subclass. Lit is a devDependency only (for test stub components).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CEM generation from Lit sources | Custom AST walker / TypeScript compiler API script | `@custom-elements-manifest/analyzer --litelement` | CEM handles decorators, JSDoc annotations, inheritance, property reflection, schema versioning — writing this from scratch is weeks of work |
| CEM → TypeScript types | Custom `.d.ts` template string generator | `@wc-toolkit/jsx-types` `generateJsxTypes()` | Handles optional props, event types, CSS custom properties, `fieldName`-attribute-property bridge, exclusion filtering — easy to get wrong |
| Browser automation for Shadow DOM tests | Puppeteer / direct CDP | `@vitest/browser-playwright` | Reuses existing Vitest test runner, same `describe`/`it`/`expect` API; Playwright locators pierce Shadow DOM out-of-box |

**Key insight:** The CEM ecosystem (analyzer + wc-toolkit) specifically solves this exact problem. Any custom type generation script will eventually re-implement a subset of what these tools do, poorly.

---

## Common Pitfalls

### Pitfall 1: `on:` prefix event name casing

**What goes wrong:** `on:myEvent` on an element, but `dispatchEvent(new CustomEvent('myevent'))` — no match; handler never fires.

**Why it happens:** The existing `on*` handler in `applyProps()` lowercases the name: `key.slice(2).toLowerCase()`. If `on:` is naively fed through the same path, `on:myCustomEvent` becomes `mycustomevent`. Lit typically dispatches events with lowercase-kebab names (`my-custom-event`).

**How to avoid:** The `on:` prefix branch must preserve the event name as-is after stripping `on:`. Document in the public API that event names must match what the element dispatches (typically lowercase-kebab).

**Warning signs:** Event handler registered but never fires; test passes with `on:click` (native event, case-insensitive) but fails with `on:my-event` (custom event, case-sensitive).

### Pitfall 2: Shadow DOM Composed Event vs Non-Composed

**What goes wrong:** Custom event dispatched inside Shadow DOM never reaches the external `on:` listener on the host element.

**Why it happens:** For events to cross Shadow DOM boundaries they must have `composed: true`. Events dispatched with only `bubbles: true` (no `composed`) are invisible outside the shadow root.

**How to avoid:** Browser test stubs must dispatch with both `bubbles: true, composed: true`. Verify in the test file that test events are properly configured. Document that `on:` listeners only fire for composed events.

**Warning signs:** Test stub dispatches event but handler count stays 0; using `shadowRoot.addEventListener` works but host element `addEventListener` does not.

### Pitfall 3: TypeScript template literal index signatures in `IntrinsicElements`

**What goes wrong:** TypeScript error: `Type '{ "prop:value": number }' is not assignable to type 'IntrinsicElements["my-element"]'`.

**Why it happens:** Multiple template literal index signatures (`[key: \`prop:${string}\`]`, `[key: \`attr:${string}\`]`) in the same interface can conflict during assignment validation in TypeScript 5.1. This was a regression fixed in TS 5.1 RC.

**How to avoid:** Project already uses TypeScript `~5.8.0` (confirmed from `package.json`) — well past 5.1 RC. Issue does not apply. Verify with a simple test in the `.d.ts` file.

**Warning signs:** TypeScript reports index signature incompatibility for namespace-prefixed keys even though the interface declares the correct template literals.

### Pitfall 4: `observeLitProp` event convention mismatch

**What goes wrong:** `observeLitProp(el, 'myProp', initial)` listens for `my-prop-changed`, but the Lit component dispatches `myprop-changed` (no hyphen insertion) or `change` (generic DOM event).

**Why it happens:** Lit does not automatically dispatch property-change events. The `{camelCase} → {kebab-case}-changed` convention is a community pattern (from Polymer via `@morbidick/lit-element-notify`). Lit components can dispatch any event name they choose.

**How to avoid:** `observeLitProp` should accept an explicit `eventName` override parameter as a second option: `observeLitProp(el, 'myProp', initial, { event: 'explicit-event-name' })`. The default kebab conversion is a convenience, not a guarantee. Document clearly.

**Warning signs:** Signal never updates even though the element visually changes; `addEventListener` with the computed event name never fires.

### Pitfall 5: `declare module` path must exactly match the resolved jsxImportSource subpath

**What goes wrong:** Types declared in `declare module "@streem/dom"` instead of `declare module "@streem/dom/jsx-runtime"` — TypeScript cannot find the augmentation.

**Why it happens:** With `jsxImportSource: "@streem/dom"`, TypeScript resolves JSX types from `@streem/dom/jsx-runtime` (the `/jsx-runtime` subpath export). The module augmentation MUST use the exact same path.

**How to avoid:** The generated `lit-elements.d.ts` must use `declare module "@streem/dom/jsx-runtime"`. Test this by opening a `.tsx` file that uses a generated element tag and confirming TypeScript IntelliSense shows typed props.

**Warning signs:** `.d.ts` file exists, is included in `tsconfig.json`, but TypeScript still reports `Property 'my-element' does not exist on type 'JSX.IntrinsicElements'`.

### Pitfall 6: CEM `attributes` array vs `members[kind: "field"]` — choosing the wrong source for types

**What goes wrong:** Generator uses only `attributes[]` array from CEM to build props types, missing JS-only properties (properties that don't reflect to attributes).

**Why it happens:** CEM has two distinct locations: `attributes[]` for HTML attributes and `members[kind: "field"]` for JS properties. Many Lit component properties are JS-only (objects, arrays, complex types) and appear only in `members`, not `attributes`.

**How to avoid:** Use `@wc-toolkit/jsx-types` which correctly bridges both locations via the `fieldName` cross-reference. If writing custom type extraction, always iterate both `attributes` and `members[kind: "field"]`, merging by `fieldName`.

**Warning signs:** Complex props (arrays, objects) not present in generated types; only string/boolean props appear.

---

## Code Examples

Verified patterns from official sources:

### CEM Analyzer CLI with LitElement support
```bash
# Source: custom-elements-manifest.open-wc.org/analyzer/getting-started/
npx @custom-elements-manifest/analyzer analyze \
  --litelement \
  --globs "src/**/*.ts" \
  --exclude "src/**/*.test.ts" \
  --outdir .
# Generates: ./custom-elements.json
```

### Config file alternative (`custom-elements-manifest.config.mjs`)
```js
// Source: custom-elements-manifest.open-wc.org/analyzer/getting-started/
export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.browser.test.ts'],
  outdir: './',
  litelement: true,
}
```

### CEM manifest structure (relevant fields)
```json
{
  "schemaVersion": "2.1.0",
  "modules": [
    {
      "kind": "javascript-module",
      "declarations": [
        {
          "kind": "class",
          "name": "MyCounter",
          "tagName": "my-counter",
          "members": [
            { "kind": "field", "name": "count", "type": { "text": "number" }, "default": "0" }
          ],
          "attributes": [
            { "name": "initial", "type": { "text": "number" }, "fieldName": "initial" }
          ],
          "events": [
            { "name": "count-changed", "type": { "text": "CustomEvent<{ value: number }>" } }
          ]
        }
      ]
    }
  ]
}
```

### generateJsxTypes() call
```typescript
// Source: wc-toolkit.com/integrations/jsx/
import { generateJsxTypes } from '@wc-toolkit/jsx-types'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('./custom-elements.json', 'utf8'))

generateJsxTypes(manifest, {
  fileName: 'lit-elements.d.ts',
  outdir: './src/lit-types',
  stronglyTypedEvents: true,
})
```

### Augmenting @streem/dom/jsx-runtime IntrinsicElements
```typescript
// Source: TypeScript module augmentation docs + wc-toolkit output pattern
// The module MUST be "@streem/dom/jsx-runtime" (matches jsxImportSource + "/jsx-runtime")
import type { CustomElements } from '@wc-toolkit/jsx-types'

declare module '@streem/dom/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
```

### Inline stub LitElement for browser tests (no external package)
```typescript
// Source: Lit docs — component authoring; inline stub for isolation
// tests/browser/lit-interop.browser.test.ts
import { LitElement, property } from 'lit'
import { describe, it, expect } from 'vitest'

// Inline component definition — no import from external package
class MyCounter extends LitElement {
  @property({ type: Number }) count = 0

  increment() {
    this.count++
    this.dispatchEvent(new CustomEvent('count-changed', {
      detail: { value: this.count },
      bubbles: true,
      composed: true,   // REQUIRED: must cross Shadow DOM boundary
    }))
  }

  render() {
    return // ... lit-html template
  }
}
customElements.define('my-counter', MyCounter)

describe('LIT-03: Shadow DOM event routing', () => {
  it('on: handler fires when event originates inside shadow root', async () => {
    const el = document.createElement('my-counter') as MyCounter
    document.body.appendChild(el)
    await el.updateComplete

    let fired = false
    // Attach listener DIRECTLY on host element — this is what the on: prefix does
    el.addEventListener('count-changed', () => { fired = true })

    el.increment()  // dispatches from inside shadow DOM
    expect(fired).toBe(true)
  })
})
```

### Vitest browser config (packages/lit/vitest.browser.config.ts)
```typescript
// Source: vitest.dev/guide/browser/
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    name: '@streem/lit:browser',
    include: ['tests/browser/**/*.browser.test.{ts,tsx}'],
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
```

### package.json scripts for lit package
```json
{
  "name": "@streem/lit",
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "gen:lit-types": "cem analyze --litelement && tsx scripts/gen-lit-types.ts"
  },
  "peerDependencies": {
    "@streem/core": "workspace:*",
    "@streem/dom": "workspace:*"
  },
  "devDependencies": {
    "@custom-elements-manifest/analyzer": "^0.10.5",
    "@vitest/browser-playwright": "^4.0.0",
    "@wc-toolkit/jsx-types": "latest",
    "lit": "^3.0.0",
    "playwright": "^1.0.0",
    "tsx": "latest"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global `declare namespace JSX` | `declare module "pkg/jsx-runtime"` | React 19 / TS 5.x JSX transform | Must use module-scoped augmentation; global namespaces ignored |
| Manual property type declarations | `@wc-toolkit/jsx-types` from CEM | 2023-2025 | Automated type generation from component source, no manual `.d.ts` maintenance |
| JSDOM for web component tests | Vitest Browser Mode + Playwright | Vitest 4.0 (Oct 2025) | First stable browser mode release; shadow DOM testing now viable in Vitest |
| `@lit/react` wrapper for framework integration | Direct custom element usage with typed props | React 19 / Lit 3 | React 19 supports custom elements natively; same "consume as plain element" model Streem uses |

**Deprecated/outdated:**
- Polymer `{prop}-changed` auto-dispatch: Lit dropped this; it's an opt-in community pattern via `@morbidick/lit-element-notify` mixin, not a built-in. Document that `observeLitProp` requires the component to explicitly dispatch the event.
- `vitest/browser` global import: Vitest 4 uses `@vitest/browser-playwright` (separate package); old `browser.provider: 'playwright'` string is replaced by `playwright()` function call.

---

## Open Questions

1. **Does `@wc-toolkit/jsx-types` write the `declare module` wrapper or just the interface body?**
   - What we know: `generateJsxTypes()` writes a `.d.ts` file; its output references a `CustomElements` type. The docs show the consumer writing the `declare module` wrapper.
   - What's unclear: Whether the generated file already contains `declare module "..."` or just the bare interface — this determines whether the generation script must wrap the output.
   - Recommendation: The gen script should always write its own wrapper to guarantee the correct module path (`@streem/dom/jsx-runtime`). Either wrap the `generateJsxTypes` output or write the file manually using the manifest data.

2. **Does `@streem/dom`'s `applyProps()` live in `h.ts` or should the `prop:`/`attr:`/`on:` dispatch be a separate file in `@streem/lit`?**
   - What we know: `@streem/lit` has no runtime dependency on Lit. The `prop:`/`attr:`/`on:` prefixes are useful for ANY custom element, not just Lit ones. The existing `applyProps()` in `h.ts` handles all element prop dispatch.
   - What's unclear: Whether to monkey-patch `applyProps` in `@streem/dom` directly (one place, always available) or override in `@streem/lit` (requires users to import something from `@streem/lit` at runtime).
   - Recommendation: Modify `applyProps()` in `@streem/dom` directly — the `prop:`/`attr:`/`on:` feature is a standard part of the JSX runtime, not Lit-specific. This ensures any custom element (not just Lit) gets the feature. `@streem/lit` becomes types-and-tooling only.

3. **How to handle the `on:` event name when the component dispatches camelCase vs kebab-case?**
   - What we know: `on:my-event` → `addEventListener('my-event', ...)`. Custom events in Lit are typically lowercase-kebab. Standard DOM events (`click`, `input`) are lowercase.
   - What's unclear: Whether to document "always use kebab-case after `on:`" or support camelCase-to-kebab conversion.
   - Recommendation: Preserve event name exactly as written after stripping `on:`. `on:myEvent` → `myEvent`. Document that users should use exactly the event name the component dispatches. This avoids surprising case conversion.

---

## Sources

### Primary (HIGH confidence)
- `custom-elements-manifest.open-wc.org/analyzer/getting-started/` — CEM analyzer CLI, config, plugin flags, output format
- `lit.dev/docs/components/events/` — Lit event dispatch patterns, `composed: true` requirement, property-change event philosophy
- `vitest.dev/guide/browser/` — Vitest 4 browser mode setup, `@vitest/browser-playwright`, project separation, run commands
- TypeScript issue #54333 (microsoft/TypeScript) — template literal index signature support, regression fixed in TS 5.1 RC
- `docs.solidjs.com/reference/jsx-attributes/prop` — `prop:` / `attr:` directive behavior (reference implementation)

### Secondary (MEDIUM confidence)
- `wc-toolkit.com/integrations/jsx/` — `@wc-toolkit/jsx-types` API, `generateJsxTypes()` options, module augmentation pattern
- `javascript.info/shadow-dom-events` — Shadow DOM event retargeting mechanics, `composed` property behavior
- `github.com/morbidick/lit-element-notify` — `{prop}-changed` event naming convention (community pattern, not Lit built-in)
- WebSearch: CEM schema `kind: "field"` vs `attributes[]` distinction, `fieldName` bridge

### Tertiary (LOW confidence)
- WebSearch: Vitest 4 monorepo browser mode nested projects issue (github.com/vitest-dev/vitest/discussions/9316) — known pain point with nested `projects[]` in monorepo; mitigated by using separate config file + `--config` flag rather than nested projects array

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@custom-elements-manifest/analyzer` and `@vitest/browser-playwright` are verified via official docs; `@wc-toolkit/jsx-types` verified via official site
- Architecture: HIGH — `applyProps()` extension pattern derived directly from existing codebase; `declare module` pattern verified against TypeScript docs and TS issue tracker
- Pitfalls: HIGH — shadow DOM `composed` requirement, event name casing, and `declare module` path verified against official sources; `observeLitProp` convention mismatch is LOW (based on Lit docs + community patterns)

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (30 days — `@custom-elements-manifest/analyzer` is actively maintained at 0.10.5; Vitest 4 browser mode just stabilized; wc-toolkit is stable)
