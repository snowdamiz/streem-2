---
phase: 02-jsx-runtime-and-component-model
verified: 2026-02-28T01:30:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "pnpm --filter @streem/dom exec tsc --noEmit exits 0 (no TypeScript type errors)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start Vite dev server for apps/demo and reload a component file"
    expected: "Signal values (count, showExtra) are preserved across the hot reload — count does not reset to 0 after file save"
    why_human: "Live HMR behavior requires a running Vite dev server; unit tests cover the registry logic but cannot simulate actual module replacement"
---

# Phase 2: JSX Runtime and Component Model Verification Report

**Phase Goal:** Developers can write function components in TSX that run once on mount, use reactive signal expressions for fine-grained DOM updates, and have access to `<Show>`, `<For>`, `<ErrorBoundary>`, and `<Suspense>` — with signal state preserved across Vite hot reloads

**Verified:** 2026-02-28T01:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (TS2322 type error fix in `components.ts:301`)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Developer configures jsxImportSource: '@streem/dom' in tsconfig and TSX compiles without errors | VERIFIED | apps/demo/tsconfig.json sets jsx: react-jsx + jsxImportSource: @streem/dom; tsc --noEmit on apps/demo exits 0 |
| 2 | h() creates real DOM elements (no VDOM) and invokes function components exactly once in createRoot scope | VERIFIED | h.ts:159-172 — function branch uses createRoot(dispose => { result = type(allProps) }); lifecycle.test.ts 7 tests pass including "component called exactly once" |
| 3 | render() mounts component into DOM container and returns dispose | VERIFIED | render.ts:14-29 — createRoot wraps component(), appends nodes, returns dispose; scaffold.test.ts passes |
| 4 | JSX.IntrinsicElements and JSX.Element types enable TypeScript IntelliSense | VERIFIED | jsx-runtime.ts inlines full JSX namespace with IntrinsicElements interface and ElementChildrenAttribute; apps/demo TSX compiles |
| 5 | Package exports './jsx-runtime' and './jsx-dev-runtime' so jsxImportSource resolves | VERIFIED | package.json has all three exports: '.', './jsx-runtime', './jsx-dev-runtime' with import+types paths |
| 6 | Signal used as JSX text child via accessor function updates only that text node (surgical DOM update) | VERIFIED | bindings.ts:11-26 — bindTextNode creates one text node, updates only nodeValue in effect(); bindings.test.ts 27 tests pass including "DOM mutation count exactly 1" |
| 7 | Show/For/ErrorBoundary/Suspense all present and functional | VERIFIED | components.ts exports all four; 9+10+11+13 tests passing across show/for/error-boundary/suspense test suites |
| 8 | Signal state preserved across Vite HMR via import.meta.hot.data pattern | VERIFIED | hmr.ts exports 6 functions; App.tsx has dispose/accept pattern; hmr.test.ts 9 tests pass |
| 9 | All 91 @streem/dom tests pass | VERIFIED | pnpm --filter @streem/dom test: 8 test files, 91 tests, 0 failures |
| 10 | tsc --noEmit exits 0 on @streem/dom package | VERIFIED | Fix applied at components.ts:301-303 — type predicate filter `(n): n is Node => n != null` plus null-guard before single-element wrap; `pnpm --filter @streem/dom exec tsc --noEmit` exits 0 |

**Score:** 10/10 truths verified

---

## Re-Verification Summary

### Gap Closed

**Truth 10: tsc --noEmit exits 0 on @streem/dom package**

Previous status: FAILED — TS2322 type error at `components.ts:301` where `nodes = Array.isArray(result) ? result : [result]` produced `(Node | null | undefined)[]` not assignable to `Node[]`.

Fix applied at `packages/dom/src/components.ts` lines 301-303:

```typescript
nodes = Array.isArray(result)
  ? result.filter((n): n is Node => n != null)
  : result != null ? [result] : []
```

Verification:
- `packages/dom/src/components.ts:302-303` — type predicate filter and null guard confirmed present
- `pnpm --filter @streem/dom exec tsc --noEmit` exits with code 0 — no TypeScript errors
- `pnpm --filter @streem/dom test` — 8 test files, 91 tests, 0 failures — no regressions

### Regressions

None. All 9 truths that were VERIFIED in the initial verification remain VERIFIED.

---

## Required Artifacts

### Plan 02-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dom/package.json` | Package with './jsx-runtime' and './jsx-dev-runtime' exports | VERIFIED | All three exports present with import + types subpaths |
| `packages/dom/src/jsx-runtime.ts` | Exports jsx, jsxs, Fragment | VERIFIED | `export { h as jsx, h as jsxs, Fragment }` + inlined JSX namespace |
| `packages/dom/src/types.ts` | JSX namespace type declarations | VERIFIED | Exports namespace JSX with IntrinsicElements, Element, ElementChildrenAttribute |
| `packages/dom/src/h.ts` | Core DOM factory: h(), Fragment, applyProps() | VERIFIED | 182 lines; all three exported; reactive binding dispatch in applyProps |
| `packages/dom/src/render.ts` | render() mounts into DOM, returns dispose | VERIFIED | 29 lines; createRoot-based; returns dispose function |
| `packages/dom/src/index.ts` | Public API: h, Fragment, render, Show, For, onMount, ErrorBoundary, Suspense, HMR exports | VERIFIED | All 14 exports present |

### Plan 02-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dom/src/bindings.ts` | bindTextNode, bindAttr, bindClass, bindClassList, bindStyle, bindEvent | VERIFIED | 112 lines; all 6 functions exported; each wraps update in effect() |
| `packages/dom/src/h.ts` | applyProps extended with reactive binding dispatch | VERIFIED | typeof value === 'function' check present for all binding types |
| `packages/dom/tests/bindings.test.ts` | TDD test suite, min 80 lines | VERIFIED | 428 lines, 27 tests |

### Plan 02-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dom/src/components.ts` | Show(), For(), onMount() | VERIFIED | All three present (plus ErrorBoundary, Suspense added in 02-04) |
| `packages/dom/src/index.ts` | Exports Show, For, onMount, h, Fragment, render | VERIFIED | All present |
| `packages/dom/tests/lifecycle.test.ts` | onMount() and component-runs-once tests, min 30 lines | VERIFIED | 115 lines, 7 tests |
| `packages/dom/tests/show.test.ts` | Show condition toggling, fallback, scope disposal, min 50 lines | VERIFIED | 219 lines, 9 tests |
| `packages/dom/tests/for.test.ts` | For add/remove/reorder, scope isolation, min 60 lines | VERIFIED | 315 lines, 10 tests |

### Plan 02-04 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dom/src/components.ts` | ErrorBoundary() and Suspense() | VERIFIED | Both present at end of components.ts (433 lines total) |
| `packages/dom/src/index.ts` | Exports ErrorBoundary, Suspense | VERIFIED | Both in index.ts export list |
| `packages/dom/tests/error-boundary.test.ts` | ErrorBoundary tests, min 50 lines | VERIFIED | 237 lines, 11 tests |
| `packages/dom/tests/suspense.test.ts` | Suspense async lifecycle tests, min 50 lines | VERIFIED | 436 lines, 13 tests |

### Plan 02-05 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dom/src/hmr.ts` | HMR registry: 6 exports including clearHMRRegistry | VERIFIED | 112 lines; all 6 functions present and exported |
| `packages/dom/src/hmr-plugin.ts` | streemHMR() Vite plugin with hotUpdate hook | VERIFIED | 26 lines; exports streemHMR(); uses hotUpdate (not deprecated handleHotUpdate) |
| `apps/demo/src/App.tsx` | Demo using signal + HMR import.meta.hot pattern | VERIFIED | 52 lines; import.meta.hot.dispose + accept present; uses Show, For, onMount |
| `packages/dom/tests/hmr.test.ts` | HMR registry unit tests, min 30 lines | VERIFIED | 55 lines, 9 tests with beforeEach clearHMRRegistry() |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| jsx-runtime.ts | h.ts | `export { h as jsx, h as jsxs, Fragment }` | WIRED | Line 11 of jsx-runtime.ts |
| h.ts | @streem/core createRoot | function component branch calls createRoot() | WIRED | h.ts:165 `createRoot((dispose) => { ... result = type(allProps) })` |
| h.ts applyProps() | bindings.ts | `typeof value === 'function'` routes to bind* functions | WIRED | All 6 binding dispatch cases present in applyProps() |
| bindings.ts bind*() | @streem/core effect() | each binding wraps DOM update in effect() | WIRED | All 6 functions use effect() from @streem/core |
| components.ts Show() | @streem/core effect()+createRoot()+onCleanup() | effect watches `when` accessor; createRoot per Show state | WIRED | components.ts:157 effect(), 175 createRoot(), 200 onCleanup() |
| components.ts For() | Map<key, RowEntry> + createRoot() per item | reconciliation map with dispose per row — null-filtered via type predicate | WIRED | rows Map initialized at line 254; createRoot at line 298; filter at line 302 |
| ErrorBoundary() | Suspense() | `if (err instanceof Promise) throw err` re-throw | WIRED | components.ts:44 — critical re-throw before fallback |
| Suspense() | Promise.then() | err.then() attaches resolve/reject handlers | WIRED | components.ts:402 `err.then(...)` |
| apps/demo/App.tsx | hmr.ts | import.meta.hot.dispose()+accept() | WIRED | App.tsx:17-24 — dispose mutates data properties (not re-assigns); accept() called |
| apps/demo/vite.config.ts | hmr-plugin.ts | `plugins: [streemHMR()]` | WIRED | vite.config.ts:3+6 — import and plugin registration |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| JSX-01 | 02-01 | jsxImportSource: 'streem' in tsconfig — no Babel or custom compiler | SATISFIED | apps/demo/tsconfig.json: jsx: react-jsx + jsxImportSource: @streem/dom; tsc --noEmit passes on demo; package.json exports ./jsx-runtime |
| JSX-02 | 02-02 | Reactive signal values in JSX update only exact affected DOM node | SATISFIED | bindings.ts bindTextNode/bindAttr use effect() targeting one node; bindings.test.ts proves "updates only nodeValue", "does NOT mutate parent innerHTML" |
| JSX-03 | 02-05 | Vite dev server preserves signal state across HMR | SATISFIED | hmr.ts registry + App.tsx dispose/accept pattern + hmr.test.ts 9 tests; live HMR requires human verification (flagged below) |
| COMP-01 | 02-01 | Function components with fully typed props | SATISFIED | h.ts typed function component branch; JSX namespace IntrinsicElements; apps/demo TSX compiles |
| COMP-02 | 02-03 | Component function runs exactly once; no re-execution | SATISFIED | lifecycle.test.ts "component function is called exactly once regardless of signal changes" passes; h.ts createRoot wraps component invocation |
| COMP-03 | 02-03 | onMount() to run code after first mount | SATISFIED | components.ts:99-103 — onMount() invokes fn directly, registers cleanup via onCleanup(); 7 lifecycle tests pass |
| COMP-04 | 02-03 | Show component preserves reactive tracking inside true branch | SATISFIED | components.ts Show() uses createRoot per state change; show.test.ts 9 tests pass including scope disposal |
| COMP-05 | 02-03 | For component fine-grain-updates individual items | SATISFIED | components.ts For() uses Map reconciliation + createRoot per item; for.test.ts 10 tests pass including "adding an item creates only that item's DOM" |
| COMP-06 | 02-04 | ErrorBoundary catches child errors, renders fallback UI | SATISFIED | components.ts ErrorBoundary() wraps in try/catch; re-throws Promises; error-boundary.test.ts 11 tests pass |
| COMP-07 | 02-04 | Suspense shows loading fallback while async pending | SATISFIED | components.ts Suspense() catches thrown Promises, shows fallback, retries on resolve; suspense.test.ts 13 tests pass |

All 10 Phase 2 requirements accounted for. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/dom/src/jsx-dev-runtime.ts` | 8 | `export type { JSX } from './types.js'` — re-exports from types.ts, not the inlined namespace in jsx-runtime.ts | Info | In dev mode TypeScript uses jsxDEV runtime, but the JSX type re-export from types.ts is correct for type checking. The key fix (inlining for vite-plugin-dts) was applied to jsx-runtime.ts. Not a blocker. |

The TS2322 anti-pattern from the initial verification has been resolved.

---

## Human Verification Required

### 1. Live HMR State Preservation

**Test:** Run `pnpm --filter @streem/demo dev`, open the browser, click Increment several times to raise the counter, then save `apps/demo/src/App.tsx` (e.g. add a space to a comment)
**Expected:** The count value displayed is preserved after the hot reload — it does NOT reset to 0. The `showExtra` toggle state is also preserved.
**Why human:** Live HMR requires a running Vite dev server. The unit tests in hmr.test.ts cover the registry logic (save/restore, canRestoreState, clearHMRRegistry) but cannot simulate actual Vite module replacement across a WebSocket HMR connection.

---

## Gaps Summary

No automated gaps remain. The single gap from the initial verification — the TS2322 type error in `packages/dom/src/components.ts:301` — has been resolved by applying a null-filtering type predicate:

```typescript
nodes = Array.isArray(result)
  ? result.filter((n): n is Node => n != null)
  : result != null ? [result] : []
```

`pnpm --filter @streem/dom exec tsc --noEmit` now exits 0. All 91 tests continue to pass with no regressions.

The one remaining item requiring human attention is live HMR state preservation, which cannot be verified without a running Vite dev server and browser interaction. All automated checks — 10/10 truths, all artifacts substantive and wired, all 10 requirements satisfied, no type errors — pass.

---

_Verified: 2026-02-28T01:30:00Z_
_Verifier: Claude (gsd-verifier)_
