# Roadmap: Streem

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-02-28)
- 🚧 **v1.1 Quality & Polish** — Phases 7–10 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-02-28</summary>

- [x] Phase 1: Reactive Core (3/3 plans) — completed 2026-02-28
- [x] Phase 2: JSX Runtime and Component Model (5/5 plans) — completed 2026-02-28
- [x] Phase 3: Streaming Primitives (4/4 plans) — completed 2026-02-28
- [x] Phase 4: Lit Web Component Interop (3/3 plans) — completed 2026-02-28
- [x] Phase 5: Package Assembly, CLI, and AI Skills (3/3 plans) — completed 2026-02-28
- [x] Phase 6: Landing Page (Dogfood) (3/3 plans) — completed 2026-02-28

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Quality & Polish (In Progress)

**Milestone Goal:** Resolve v1.0 quality gaps — ship JSX type coverage for sl-* elements, add E2E and unit test coverage, document and run performance benchmarks, and migrate the landing page to CSS Modules with a live benchmark bar chart.

- [x] **Phase 7: Package Quality** - Fix LIT-04 type gap, add unit tests for @streem/dom and @streem/streams edge cases, and ship style object support + CSSProperties export (completed 2026-02-28)
- [x] **Phase 8: E2E Test Coverage** - Playwright tests for the create-streem CLI scaffold flow and HMR signal-state preservation (completed 2026-03-01)
- [x] **Phase 9: Performance Benchmarks** - Measure signal/computed/effect throughput against SolidJS and Preact signals and commit results with documented methodology (completed 2026-03-01)
- [ ] **Phase 10: Landing Page Polish** - Bar chart dogfood component displaying benchmark results, plus CSS Modules migration for landing page components

## Phase Details

### Phase 7: Package Quality
**Goal**: Developers get correct TypeScript types for sl-* elements, observable edge cases are covered by unit tests, and style objects work as JSX props
**Depends on**: Nothing (first v1.1 phase; all items are self-contained package improvements)
**Requirements**: LIT-01, TEST-03, TEST-04, STYLE-01, STYLE-02, STYLE-03
**Success Criteria** (what must be TRUE):
  1. A developer using `@streem/lit` gets TypeScript autocomplete and type errors for sl-button, sl-badge, and other sl-* props when writing TSX — no catch-all fallback
  2. Passing `style={{ display: 'grid', gap: '20px' }}` to a JSX element compiles without TypeScript error and applies the styles at runtime
  3. `CSSProperties` is importable from `@streem/dom` and from the `streem` meta-package
  4. Unit tests for @streem/dom cover nested ErrorBoundary, Suspense async error propagation, and For keyed list reordering without failures
  5. Unit tests for @streem/streams cover reconnect backoff exhaustion, cancellation during read, and subscription error paths without failures
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md — Fix @streem/lit dist to include JSX IntrinsicElements type augmentation for sl-* elements (LIT-01)
- [x] 07-02-PLAN.md — Define and export CSSProperties from @streem/dom and streem meta-package; add CSS Modules docs (STYLE-01/02/03)
- [x] 07-03-PLAN.md — Implement Suspense onError async propagation and add nested ErrorBoundary + Suspense tests (@streem/dom) (TEST-03)
- [x] 07-04-PLAN.md — Add missing edge-case tests for @streem/streams: ReadableStream error path, cancel-during-reconnect, error-after-values (TEST-04)

### Phase 8: E2E Test Coverage
**Goal**: Playwright end-to-end tests verify the create-streem CLI scaffold flow produces a working project and that signal state survives a Vite HMR reload
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Running `npm create streem@latest` in a Playwright-driven terminal produces a project that builds successfully (`pnpm build` exits 0) — verified automatically in CI
  2. After a Vite HMR reload triggered by a source file save in a Playwright browser session, signal values set before the reload are still accessible in the updated module
  3. Both Playwright tests run in CI without flakiness across at least two consecutive runs
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — apps/e2e Playwright scaffold + CLI scaffold E2E test (TEST-01)
- [x] 08-02-PLAN.md — HMR signal state preservation Playwright browser test (TEST-02)

### Phase 9: Performance Benchmarks
**Goal**: Benchmark results for @streem/core signals exist in the repository, are reproducible, and show an honest comparison against SolidJS and Preact signals
**Depends on**: Phase 7
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. A benchmark suite exists in the repository that measures signal(), computed(), and effect() throughput (operations/second) for @streem/core, SolidJS signals, and Preact signals under identical conditions
  2. Running the benchmark suite produces numeric results without manual intervention
  3. Committed benchmark results include the methodology: what was measured, the environment (Node version, hardware class), and instructions to reproduce
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md — apps/bench package scaffold with tinybench + signal/computed/effect benchmark suites (PERF-01)
- [ ] 09-02-PLAN.md — Run benchmarks, write BENCHMARKS.md with results and methodology, commit (PERF-02)

### Phase 10: Landing Page Polish
**Goal**: The public landing page displays a Streem-built bar chart of benchmark results and is fully migrated from inline style strings to CSS Modules and style objects
**Depends on**: Phase 9 (bar chart requires committed benchmark data), Phase 7 (style objects required for migration)
**Requirements**: LAND-01, STYLE-04
**Success Criteria** (what must be TRUE):
  1. The landing page contains a bar chart component built with Streem signals and JSX that renders performance comparison data from the Phase 9 benchmarks
  2. Landing page components contain no inline `<style>` string blocks — styles are in .module.css files or typed style objects
  3. The deployed landing page at the GitHub Pages URL renders the bar chart without console errors
  4. CSS Modules usage in the landing page serves as a working reference for the pattern documented in STYLE-03
**Plans**: TBD

## Progress

**Execution Order:** 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Reactive Core | v1.0 | 3/3 | Complete | 2026-02-28 |
| 2. JSX Runtime and Component Model | v1.0 | 5/5 | Complete | 2026-02-28 |
| 3. Streaming Primitives | v1.0 | 4/4 | Complete | 2026-02-28 |
| 4. Lit Web Component Interop | v1.0 | 3/3 | Complete | 2026-02-28 |
| 5. Package Assembly, CLI, and AI Skills | v1.0 | 3/3 | Complete | 2026-02-28 |
| 6. Landing Page (Dogfood) | v1.0 | 3/3 | Complete | 2026-02-28 |
| 7. Package Quality | v1.1 | 4/4 | Complete | 2026-02-28 |
| 8. E2E Test Coverage | v1.1 | 2/2 | Complete | 2026-03-01 |
| 9. Performance Benchmarks | 2/2 | Complete   | 2026-03-01 | - |
| 10. Landing Page Polish | v1.1 | 0/TBD | Not started | - |
