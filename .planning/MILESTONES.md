# Milestones

## v1.0 MVP (Shipped: 2026-02-28)

**Phases completed:** 6 phases, 21 plans, 0 tasks

**Stats:** 186 files, ~17,684 lines of TypeScript/TSX, 2 days (2026-02-27 → 2026-02-28)

**Key accomplishments:**
- Built DOM-free reactive signal primitives (@streem/core): signal(), computed(), effect(), createRoot(), onCleanup() with zero DOM dependency, dev-mode reactive-context warnings, and 40-test Vitest coverage
- Shipped @streem/dom: JSX factory, fine-grained DOM bindings (text/attr/class/style/events), Show/For/ErrorBoundary/Suspense components, component-runs-once model, and Vite HMR signal-state preservation
- Four stream adapters (@streem/streams): WebSocket (auto-reconnect + exponential backoff), SSE, ReadableStream, Observable — each with onCleanup auto-close, typed status signal, and batch()/throttle()/debounce() backpressure
- TypeScript-typed Lit web component interop (@streem/lit): prop:/attr:/on: prefix dispatch, CEM-driven IntrinsicElements type generation, Playwright-verified Shadow DOM event handling
- Package assembly + DX tooling: `streem` meta-package barrel, `create-streem` CLI scaffolder (npm create streem@latest), 5-file progressive-disclosure AI skills for 6 tools
- Official landing page (apps/landing) built with Streem: live 200 msg/sec Observable ticker, Shoelace sl-button/sl-badge Lit components, GitHub Actions Pages deployment

**Known Gaps:**
- LAND-03 checkbox stale in REQUIREMENTS.md (sl-badge is present on page per commit 1bdf8d1; documentation not updated before archival)
- Phase 6 VERIFICATION.md predates the sl-badge/Suspense fixes — a re-verification pass would reflect current code state
- LIT-04 type augmentation not in dist/: @streem/lit/dist/index.d.ts omits JSX IntrinsicElements for Shoelace elements (runtime unaffected; prop-safety for sl-* types falls back to catch-all)
- HMR state preservation, E2E CLI scaffold, and full visual/performance validation require interactive browser/terminal — not statically verifiable

---

