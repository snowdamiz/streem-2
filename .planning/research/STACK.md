# Stack Research

**Domain:** Custom JSX/TSX reactive streaming frontend framework
**Researched:** 2026-02-27
**Confidence:** HIGH (core stack), MEDIUM (streaming interop patterns)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | ~5.8 | Language + type system | Latest stable; TS 5.8 ships build perf improvements and ESM `require()` support. TS 7 (Go compiler) is mid-2026 — don't couple build to it yet; 5.8 is stable ground. |
| Vite | ^7.0 | Dev server, build, HMR | v7 is current stable (requires Node 20.19+). ESM-only distribution. `jsxImportSource` is first-class via esbuild config — no Babel needed for custom JSX runtimes. |
| alien-signals | ^3.1 | Signals: reactive primitives | Fastest signal implementation benchmarked (3–5× faster than @preact/signals, 30× faster than Vue 3.5 in computed-heavy scenarios). Zero dependencies. Framework-agnostic plain ESM — no build plugin required. API: `signal()`, `computed()`, `effect()`, `effectScope()`, `createReactiveSystem()`. Vue 3.6 and XState adopted its core algorithm. Version 3.1.2 is current stable. |
| Vite lib mode + vite-plugin-dts | ^4.x (dts) | Framework package build + `.d.ts` emit | Vite's library mode produces ESM + CJS; `vite-plugin-dts` emits `.d.ts` and `.d.mts`/`.d.cts` for dual-publish. Simpler than tsup for a Vite-native project. |

### JSX Runtime Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Custom `jsx-runtime.ts` (internal) | — | No-VDOM JSX → real DOM | The project's own runtime. TypeScript's `jsxImportSource` + `"jsx": "react-jsx"` in tsconfig tells the compiler to import `<package>/jsx-runtime`. Export `jsx`, `jsxs`, `Fragment` from it. esbuild in Vite handles the transform; no Babel needed. Direct DOM node creation — `document.createElement` — wired to signal subscriptions instead of VDOM diffing. |
| esbuild (via Vite internals) | bundled with Vite 7 | JSX transform | esbuild's built-in JSX transform handles `jsxImportSource` at compile time. Configure via `vite.config.ts` `esbuild.jsxImportSource`. No separate plugin install needed. |

### Streaming Primitives

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Native `WebSocket` | Browser API | Bidirectional real-time | Platform-native; no library needed. Signal adapter wraps it: `fromWebSocket(url)` returns a signal that updates on each message. |
| Native `EventSource` | Browser API | SSE / server push | Platform-native; auto-reconnects. `fromSSE(url)` adapter. All modern browsers supported. Note the 6-connection-per-domain limit — document it. |
| Native `ReadableStream` | Browser API | Fetch streaming / WHATWG streams | Platform-native via Fetch API. Async iterator bridge: `for await (const chunk of stream)` writes to a signal. |
| RxJS | ^7.8 | Observable interop | RxJS 7.8 is current stable. RxJS 8 is alpha and on hold pending TC39 Observable standardization — do not use. Provide `fromObservable(obs$)` adapter that calls `signal()` inside subscribe. RxJS interop is optional (peer dep); users who don't use Observables don't pay the bundle cost. TC39/WICG Observable (native) is Chrome-only and spec-unstable — avoid as a dependency. |

### Lit Component Interop

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@custom-elements-manifest/analyzer` | ^0.10 | Generate `custom-elements.json` from Lit source | Run as a dev/codegen step against Lit packages (or the user's own) to produce a manifest. Supports `--litelement` flag for Lit-specific analysis. |
| `custom-element-jsx-integration` | latest | Generate JSX `IntrinsicElements` types from manifest | The `break-stuff/cem-tools` package generates typed JSX declarations for non-React frameworks (explicitly targets Preact/Stencil-style JSX, applicable here). Produces a `.d.ts` that extends the framework's `JSX.IntrinsicElements` interface. |
| Manual `JSX.IntrinsicElements` extension | — | Type-safe Lit tags in TSX | For Lit components without a manifest, extend the namespace: `declare global { namespace JSX { interface IntrinsicElements { 'my-lit-el': CustomElement<MyLitEl> } } }`. This is the fallback pattern when CEM automation isn't available. |

**Note on `@lit/react`:** This package is for React wrappers and is NOT relevant here. Streem does not wrap Lit components — it uses them as plain custom elements in TSX. The JSX IntrinsicElements extension approach is the right fit.

### Development Tooling

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Vitest | ^4.0 | Unit + component testing | v4.0 is current stable (Oct 2025). Browser Mode is no longer experimental. Use `happy-dom` environment for signal/DOM unit tests (faster than jsdom, sufficient for most cases). Use Browser Mode + Playwright provider for tests that need real Shadow DOM (Lit interop tests). |
| `@vitest/browser` + Playwright | ^4.0 / ^1.x | Real-browser component tests | Required for testing custom element / Lit interop correctly. JSDOM cannot extend HTMLElement properly. |
| `vite-plugin-inspect` | latest | Debug Vite plugin pipeline | Visit `/__inspect/` to see transform stack. Invaluable when authoring the custom JSX runtime plugin. |
| ESLint | ^9.x | Linting | Flat config (ESLint 9). Use `@typescript-eslint/eslint-plugin` for TS rules. |
| Prettier | ^3.x | Formatting | Standard; no controversy. |
| TypeDoc | ^0.27 | API docs generation | Generates docs from TSDoc comments. Pairs well with Vite lib mode. |

---

## Installation

```bash
# Core framework build deps
npm install -D vite typescript vite-plugin-dts

# Signals — the reactive core
npm install alien-signals

# Streaming interop (optional peer dep for RxJS users)
npm install -D rxjs

# Lit interop type generation (dev / codegen only)
npm install -D @custom-elements-manifest/analyzer custom-element-jsx-integration

# Testing
npm install -D vitest @vitest/browser playwright happy-dom

# DX / inspect
npm install -D vite-plugin-inspect eslint @typescript-eslint/eslint-plugin prettier typedoc
```

---

## TypeScript + Vite Configuration

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "streem",
    "strict": true,
    "skipLibCheck": true
  }
}
```

`jsxImportSource: "streem"` tells TypeScript to import `streem/jsx-runtime` for JSX types and the production transform. During development within the framework repo itself, point this at the local `src` entry via a path alias.

### `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  esbuild: {
    jsxImportSource: 'streem',      // matches tsconfig
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'streem',
    },
    rollupOptions: {
      external: ['alien-signals', 'rxjs'],  // peers, not bundled
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
})
```

### `src/jsx-runtime.ts` (skeleton)
```ts
import { effect, signal } from 'alien-signals'

export type { JSX } from './jsx-namespace'   // IntrinsicElements lives here

export function jsx(type, props, key?) { /* real DOM creation */ }
export function jsxs(type, props, key?) { return jsx(type, props, key) }
export const Fragment = Symbol('Fragment')
```

The `JSX` namespace export tells TypeScript which attributes are valid on each intrinsic element tag. This is where Lit component types also get merged in.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Signals | `alien-signals` | `@preact/signals-core` | Preact signals are pull-based; worse in computed-heavy scenarios. Also tied to Preact's scheduling assumptions. alien-signals is framework-agnostic and 3–5× faster. |
| Signals | `alien-signals` | `solid-js` reactive primitives | SolidJS signals require `createRoot` wrapper and carry SolidJS scheduler assumptions. They're designed to run inside `solid-js/web`'s renderer. Extracting them standalone works but is fighting the grain of the library. |
| Signals | `alien-signals` | Build from scratch | alien-signals' algorithm is extremely well-benchmarked and the `createReactiveSystem()` escape hatch lets you extend or customize the API without forking. Not worth reinventing. |
| JSX transform | esbuild via Vite | Babel + `@babel/plugin-transform-react-jsx` | Babel adds build complexity and slows HMR. esbuild handles `jsxImportSource` natively. Only add Babel if decorators are needed (they aren't). |
| Observable interop | RxJS 7.8 (opt-in) | TC39/WICG native Observable | Native Observables are Chrome-only and the spec is at WICG incubation stage — not stable enough for a v1 framework dep. RxJS 7 is the de facto Observable standard in 2026. |
| Package bundler | Vite lib mode + vite-plugin-dts | tsup | tsup is excellent but adds a second tool. Since the framework is already Vite-native, lib mode is simpler and keeps config in one place. |
| Testing (DOM) | Vitest + happy-dom / browser mode | Jest + jsdom | Jest is slower, requires Babel transforms, and jsdom is particularly bad for custom elements. Vitest 4's browser mode is now stable and first-class. |
| Lit type gen | `custom-element-jsx-integration` | `@lit/react` | `@lit/react` wraps Lit components as React components — wrong direction. Streem needs JSX IntrinsicElements types, not React wrappers. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / ReactDOM | Not the runtime being built. No dependency on React should appear. | Streem's own `jsx-runtime` |
| `@preact/signals` (the full package) | Pulls in Preact renderer coupling. Signals are not cleanly separable for an independent framework. | `alien-signals` |
| `solid-js` as a dep | Solid's reactivity is intertwined with its renderer. `createRoot` is required. | `alien-signals` |
| Babel in the hot path | Slows dev server HMR. esbuild handles JSX natively in Vite 7. | esbuild (via Vite) |
| JSDOM for Lit interop tests | Cannot extend `HTMLElement`; custom elements registration fails silently. | Vitest Browser Mode + Playwright |
| RxJS 8 alpha | Unstable, on hold, not aligned with any stable Observable spec yet. | RxJS ^7.8 (stable) |
| TC39/WICG native `Observable` API | Chrome-only, spec is not finalized, behavior may change. | RxJS 7 adapter |
| `@lit/react` | Creates React wrappers around Lit components — wrong interop direction for Streem. | `custom-element-jsx-integration` + IntrinsicElements extension |
| Virtual DOM diffing (Preact, snabbdom, etc.) | Defeats the purpose of fine-grained signals. Signals update DOM nodes directly; VDOM adds reconciliation overhead on top. | Direct DOM manipulation in `jsx-runtime` |
| TypeScript 7 / Project Corsa | Mid-2026 target, currently in preview. Go compiler is not production stable. Pin to TS 5.8 for v1. | TypeScript ~5.8 |

---

## Stack Patterns by Variant

**If a user wants RxJS interop:**
- Add `rxjs` as a peer dependency
- `fromObservable(obs$, initialValue)` converts an RxJS Observable to a signal
- The adapter subscribes to the Observable and calls `signal()` setter on each emission
- Import path: `streem/rxjs` (treeshaken; users who skip RxJS don't pay the cost)

**If a user uses Lit components:**
- Run `cem analyze --litelement` against the Lit package source (or use the published `custom-elements.json` if the package ships one)
- Run `custom-element-jsx-integration` CLI to generate a `.d.ts`
- Import and merge into `JSX.IntrinsicElements` in the app's `src/env.d.ts`
- No runtime cost — purely types

**If the framework's landing page uses Streem itself (dogfood):**
- The landing page is a Vite app with `jsxImportSource: "streem"` in tsconfig
- It imports from the framework's local `src/` via workspace or path alias
- All real-time demo content (SSE feeds, WebSocket tickers) is wired directly to signals in TSX
- This is the primary dogfood constraint: if authoring the landing page is painful, the API has a bug

**If writing framework unit tests (internal):**
- Use `vitest` with `happy-dom` for signal and JSX unit tests (fast, no browser needed)
- Use Vitest Browser Mode + Playwright for any test that mounts a custom element or tests Shadow DOM penetration
- Keep the two environments in separate Vitest workspaces so they don't cross-contaminate

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite ^7.0 | Node 20.19+ or 22.12+ | Vite 7 dropped Node 18 (EOL April 2025). ESM-only. |
| vite ^7.0 | vitest ^3.2+ (for Vite 7 support) or vitest ^4.0 | Vitest 3.2 added Vite 7 support; Vitest 4.0 is the current stable. |
| typescript ~5.8 | vite ^7.0 | Compatible. TS 5.8's `moduleResolution: "bundler"` pairs cleanly with Vite. |
| alien-signals ^3.x | Any TypeScript 4.7+ | Pure ESM, no special config needed. API changed significantly between v1 and v3 — do not use v1/v2 examples from older blog posts. |
| rxjs ^7.8 | alien-signals (any) | No coupling; used only in opt-in adapters. |
| vite-plugin-dts ^4.x | vite ^7.0, typescript ~5.8 | Specify `tsconfigPath: './tsconfig.app.json'` if using Vite's split tsconfig template. |

---

## Sources

- [stackblitz/alien-signals GitHub](https://github.com/stackblitz/alien-signals) — API surface, version 3.1.2, no build plugin requirement (HIGH confidence, official repo)
- [alien-signals npm](https://www.npmjs.com/package/alien-signals) — latest version 3.1.2 confirmed (HIGH confidence)
- [Vite 7.0 announcement](https://vite.dev/blog/announcing-vite7) — Vite 7 stable, Node 20.19+ required, ESM-only (HIGH confidence, official)
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — Browser Mode no longer experimental (HIGH confidence, official)
- [TypeScript 5.8 docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) — current stable, TS 7 mid-2026 target (HIGH confidence, official)
- [TypeScript JSX docs](https://www.typescriptlang.org/docs/handbook/jsx.html) — `jsxImportSource`, `react-jsx` mode (HIGH confidence, official)
- [TypeScript tsconfig jsxImportSource](https://www.typescriptlang.org/tsconfig/jsxImportSource.html) — appends `/jsx-runtime` automatically (HIGH confidence, official)
- [Vite Plugin API](https://vite.dev/guide/api-plugin) — transform hooks, `jsxImportSource` config (HIGH confidence, official)
- [custom-element-jsx-integration npm](https://www.npmjs.com/package/custom-element-jsx-integration) — CEM JSX type generation for non-React frameworks (MEDIUM confidence, verified exists and purpose-matched)
- [break-stuff/cem-tools jsx-integration](https://github.com/break-stuff/cem-tools/tree/main/packages/jsx-integration) — explicit non-React JSX framework target (MEDIUM confidence, community tool)
- [RxJS 8 roadmap discussion](https://github.com/ReactiveX/rxjs/issues/6367) — RxJS 8 on hold, v7.8 is stable baseline (HIGH confidence, official issue)
- [TC39 Observable proposal](https://github.com/tc39/proposal-observable) — still WICG incubation, not production-ready (HIGH confidence, official)
- [vite-plugin-dts npm](https://www.npmjs.com/package/vite-plugin-dts) — current, `rollupTypes: true` for single-file output (HIGH confidence, npm/official)
- [Lit React docs](https://lit.dev/docs/frameworks/react/) — @lit/react is for React wrappers, not our use case; confirmed Lit v3 (HIGH confidence, official)
- [Vitest Browser Mode vs jsdom discussion](https://github.com/vitest-dev/vitest/discussions/1607) — happy-dom faster, jsdom more complete; both weaker than browser mode for custom elements (MEDIUM confidence, community)
- [SolidJS signals outside renderer](https://github.com/solidjs/solid/discussions/397) — requires createRoot wrapper, not cleanly standalone (MEDIUM confidence, official discussion)

---

*Stack research for: Streem — JSX/TSX reactive streaming frontend framework*
*Researched: 2026-02-27*
