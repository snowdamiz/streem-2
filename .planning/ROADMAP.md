# Roadmap: Streem

## Overview

Streem is built in six phases that follow a strict dependency graph: the reactive core must exist before the DOM renderer, the DOM renderer before Lit interop, and streaming before the demo that validates it. The first four phases deliver the framework's three technical layers (signals, JSX runtime, streams, Lit interop). Phase 5 assembles them into a shippable package with DX tooling and AI skills. Phase 6 builds the landing page as a first-class correctness test — pain there is a framework bug, not a page bug.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Reactive Core** - DOM-free signal primitives, owner/cleanup tree, and dev-mode reactive warnings (completed 2026-02-28)
- [x] **Phase 2: JSX Runtime and Component Model** - JSX factory, reactive DOM bindings, component primitives, and HMR (completed 2026-02-28)
- [ ] **Phase 3: Streaming Primitives** - All four stream adapters with automatic cleanup, backpressure, and reconnection
- [ ] **Phase 4: Lit Web Component Interop** - TypeScript-typed Lit component bindings with correct Shadow DOM event handling
- [ ] **Phase 5: Package Assembly, CLI, and AI Skills** - Meta-package, create-streem starter, and progressive-disclosure skill files
- [ ] **Phase 6: Landing Page (Dogfood)** - Official Streem landing page built with Streem, validating every v1 feature in production

## Phase Details

### Phase 1: Reactive Core
**Goal**: Developers can use fine-grained reactive primitives — signals, computed values, and effects — from any TypeScript file with no build plugin, and the runtime warns them immediately when reactive context rules are violated
**Depends on**: Nothing (first phase)
**Requirements**: SIGNAL-01, SIGNAL-02, SIGNAL-03, SIGNAL-04, SIGNAL-05, DX-02, DX-03
**Success Criteria** (what must be TRUE):
  1. Developer imports `signal()`, `computed()`, and `effect()` from a plain TypeScript file (no Vite plugin, no Babel) and reactive values update automatically without manual dependency arrays
  2. Developer calls `createRoot()` and disposes it — all nested effects and signals stop reacting; `onCleanup()` callbacks fire at dispose time
  3. Dev-mode console shows a warning when a signal is read with no active reactive owner (snapshot read detected)
  4. Dev-mode console shows a warning when an effect or computed is created without an active owner scope (disposal leak detected)
  5. All signal primitives pass test suites running in Node with no DOM, confirming zero DOM dependency in the core package
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold + internal push-pull reactive graph and owner/cleanup tree
- [x] 01-02-PLAN.md — Public signal(), computed(), effect(), getOwner(), runWithOwner() API with dev warnings and vite build
- [x] 01-03-PLAN.md — Node-runnable TDD test suite covering all 7 Phase 1 requirements (SIGNAL-01 through SIGNAL-05, DX-02, DX-03)

### Phase 2: JSX Runtime and Component Model
**Goal**: Developers can write function components in TSX that run once on mount, use reactive signal expressions for fine-grained DOM updates, and have access to `<Show>`, `<For>`, `<ErrorBoundary>`, and `<Suspense>` — with signal state preserved across Vite hot reloads
**Depends on**: Phase 1
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, JSX-01, JSX-02, JSX-03
**Success Criteria** (what must be TRUE):
  1. Developer configures `jsxImportSource: "streem"` in `tsconfig.json` and writes TSX components with no Babel or custom compiler — the Vite dev server compiles them correctly
  2. A reactive signal used in a JSX expression updates only the exact affected DOM text node or attribute — no full component re-render occurs (verified by counting DOM mutations)
  3. Component function body executes exactly once on mount; a signal read directly in the body (not wrapped in JSX) captures a snapshot and does not update
  4. `<Show>`, `<For>`, `<ErrorBoundary>`, and `<Suspense>` components render and react correctly — conditional branches track signals, list items update individually, errors are caught and fallback rendered, pending state shows loader
  5. After a Vite HMR reload of a component file, signal values and stream connection state are preserved — the UI does not reset to initial state
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — @streem/dom package scaffold: h(), Fragment, render(), JSX type declarations, jsxImportSource wiring, Vite/Vitest config
- [x] 02-02-PLAN.md — Reactive DOM bindings (TDD): bindTextNode, bindAttr, bindClass, bindClassList, bindStyle, bindEvent; applyProps reactive dispatch
- [x] 02-03-PLAN.md — onMount(), component-runs-once model, Show and For components (TDD)
- [x] 02-04-PLAN.md — ErrorBoundary and Suspense components with thrown-Promise protocol (TDD)
- [x] 02-05-PLAN.md — Vite HMR integration: signal state registry, streemHMR() plugin, demo app with jsxImportSource

### Phase 3: Streaming Primitives
**Goal**: Developers can bind any real-time source (WebSocket, SSE, ReadableStream, Observable) to a signal with one line, automatic cleanup on unmount, typed connection status, and built-in backpressure protection — and the adapters are DOM-agnostic (no renderer dependency)
**Depends on**: Phase 1
**Requirements**: STREAM-01, STREAM-02, STREAM-03, STREAM-04, STREAM-05, STREAM-06, STREAM-07, STREAM-08
**Success Criteria** (what must be TRUE):
  1. Developer calls `fromWebSocket(url)`, `fromSSE(url)`, `fromReadable(stream)`, or `fromObservable(obs)` inside a component — the returned signal updates with incoming data and the underlying connection closes automatically when the component unmounts, with no manual cleanup code required
  2. Each stream adapter exposes a typed `status` signal whose value is one of `connected | reconnecting | error | closed`, observable in JSX in real time
  3. The WebSocket adapter automatically reconnects with exponential backoff after a connection loss, without developer intervention
  4. At 200 messages/second through a WebSocket, wrapping writes in `batch()` prevents browser frame drops — the page remains interactive and `throttle()` / `debounce()` further reduce update frequency when needed
  5. All stream adapter tests run without a real server — adapters are testable using mock WebSocket and SSE implementations in Vitest
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — @streem/streams package scaffold; fromWebSocket() with onCleanup integration, typed status signal, exponential backoff reconnection
- [x] 03-02-PLAN.md — fromSSE() with onCleanup, typed status signal, and SSE-specific concerns (named events, native reconnect handling)
- [x] 03-03-PLAN.md — fromReadable() (WHATWG ReadableStream) and fromObservable() (Subscribable<T> structural interface, no RxJS runtime dep)
- [x] 03-04-PLAN.md — batch(), throttle(), debounce() combinators; startBatch/endBatch exported from @streem/core; backpressure test at 200 msg/sec

### Phase 4: Lit Web Component Interop
**Goal**: Developers can import Lit web components into TSX files with TypeScript-typed props, use a `prop:` prefix to route values to element properties, attach events via direct element listeners (bypassing Shadow DOM event retargeting), and auto-generate type declarations from Custom Elements Manifest
**Depends on**: Phase 2
**Requirements**: LIT-01, LIT-02, LIT-03, LIT-04
**Success Criteria** (what must be TRUE):
  1. Developer imports a Lit component and uses it in TSX with full TypeScript IntelliSense on props — no `any` types, no wrapper library required at runtime
  2. A `prop:value={signal()}` binding routes the reactive value to the element's JavaScript property (not an HTML attribute), updating reactively as the signal changes
  3. An event handler attached to a Lit component fires correctly even when the event originates inside the Shadow DOM — no event retargeting failure occurs (verified in a real browser with Playwright, not JSDOM)
  4. Developer runs the CEM analyzer against a Lit component source file and gets a generated TypeScript `IntrinsicElements` declaration that enables typed usage in TSX
**Plans**: TBD

Plans:
- [ ] 04-01: `@streem/lit` package scaffold — `JSX.IntrinsicElements` augmentation, `prop:` / `attr:` / `on:` namespace handling in the JSX runtime
- [ ] 04-02: Direct `addEventListener` event binding for Lit components (bypasses JSX delegation); Shadow DOM event retargeting test suite in Vitest Browser Mode (Playwright)
- [ ] 04-03: CEM analyzer integration — script to generate `IntrinsicElements` declarations from Custom Elements Manifest

### Phase 5: Package Assembly, CLI, and AI Skills
**Goal**: Developers can bootstrap a new Streem project in one command, install AI agent skills into their tools with one script, and consume the entire framework from a single `streem` import with a clean, stable API surface
**Depends on**: Phases 1, 2, 3, 4
**Requirements**: DX-01, SKILL-01, SKILL-02
**Success Criteria** (what must be TRUE):
  1. Developer runs `npm create streem@latest` and gets a working Vite project with correct `jsxImportSource: "streem"` config, TypeScript setup, and a running dev server — zero manual configuration required
  2. Developer runs `install-streem-skill.mjs` and the Streem `SKILL.md` and sub-skill files appear in their configured AI tool directories (Claude, Codex, Copilot, Gemini, Windsurf, OpenCode)
  3. Root `SKILL.md` routes to topic sub-skills (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) — an AI agent reading the root skill is directed to the correct sub-skill for any Streem topic
  4. Developer imports any Streem primitive from `"streem"` (single package) without needing to know which internal sub-package it comes from
**Plans**: TBD

Plans:
- [ ] 05-01: `streem` meta-package — re-exports from `@streem/core`, `@streem/dom`, `@streem/streams`, `@streem/lit`; dual-publish with `vite-plugin-dts`
- [ ] 05-02: `create-streem` starter template — Vite template with `jsxImportSource`, TypeScript config, example component
- [ ] 05-03: AI skills content (`SKILL.md` + `signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) and `install-streem-skill.mjs` installer script

### Phase 6: Landing Page (Dogfood)
**Goal**: Streem's official landing page is live, built entirely with Streem, demonstrating signals, a live high-frequency stream, and a real Lit component from a design system — and every integration pain discovered during this build is treated as a framework bug and fixed before ship
**Depends on**: Phase 5
**Requirements**: LAND-01, LAND-02, LAND-03
**Success Criteria** (what must be TRUE):
  1. The landing page is a deployed Streem application — every v1 feature (signals, streaming, Lit interop, `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`) is exercised on the page in a meaningful way, not as a toy demo
  2. The live streaming demo operates at more than 30 messages per second without browser frame drops — backpressure handling (`batch()` / `throttle()`) is validated under realistic load
  3. At least one Lit web component from a real, published design system is embedded on the page, rendering correctly with typed props and functional event handlers in a real browser
  4. A 200 messages/second WebSocket perf trace shows no long tasks (no frames > 16ms blocked) — the `batch()` implementation holds under stress
**Plans**: TBD

Plans:
- [ ] 06-01: Landing page scaffold with Streem (`create-streem` template); core sections using signals, `<Show>`, `<For>`, reactive state
- [ ] 06-02: Live streaming demo — WebSocket or SSE at >30 msg/sec with `<Suspense>` loading state and `<ErrorBoundary>` around the stream section; 200 msg/sec perf trace
- [ ] 06-03: Lit component integration from real design system; `<ErrorBoundary>` and `<Suspense>` final polish; deployment

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

Note: Phase 3 (Streaming) depends only on Phase 1 and can be parallelized with Phase 2 (JSX Runtime) if needed.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Reactive Core | 3/3 | Complete   | 2026-02-28 |
| 2. JSX Runtime and Component Model | 5/5 | Complete   | 2026-02-28 |
| 3. Streaming Primitives | 3/4 | In Progress|  |
| 4. Lit Web Component Interop | 0/3 | Not started | - |
| 5. Package Assembly, CLI, and AI Skills | 0/3 | Not started | - |
| 6. Landing Page (Dogfood) | 0/3 | Not started | - |
