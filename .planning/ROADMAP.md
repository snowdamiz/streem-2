# Roadmap: Streem

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-02-28)
- ✅ **v1.1 Quality & Polish** — Phases 7–12 (shipped 2026-03-01)
- 🚧 **v1.2 Documentation & DX Polish** — Phases 13–16 (in progress)

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

<details>
<summary>✅ v1.1 Quality & Polish (Phases 7–12) — SHIPPED 2026-03-01</summary>

- [x] Phase 7: Package Quality (4/4 plans) — completed 2026-02-28
- [x] Phase 8: E2E Test Coverage (2/2 plans) — completed 2026-03-01
- [x] Phase 9: Performance Benchmarks (2/2 plans) — completed 2026-03-01
- [x] Phase 9.1: Optimize Signal Benchmarks (3/3 plans) *(inserted)* — completed 2026-03-01
- [x] Phase 11: Improve Styles DX (3/3 plans) *(added)* — completed 2026-03-01
- [x] Phase 12: Add Tailwind Support (2/2 plans) *(added)* — completed 2026-03-01

Note: Phase 10 (Landing Page Polish — bar chart) was skipped; CSS Modules work absorbed into Phase 11. LAND-01 deferred to v1.2.

Full phase details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

### 🚧 v1.2 Documentation & DX Polish (In Progress)

**Milestone Goal:** Transform the docs from a functional draft into a polished, on-brand experience that makes Streem easy to learn and trust. Ship the deferred landing page bar chart as a Streem dogfood component.

- [x] **Phase 13: Landing Page Bar Chart** — Bar chart dogfood component rendering benchmark data on the landing page (completed 2026-03-01)
- [x] **Phase 14: Docs Visual Polish** — Docs site theme, logo, syntax highlighting, and mobile layout all match the landing page standard (completed 2026-03-01)
- [x] **Phase 15: Docs Content Expansion** — Existing sections deepened; patterns/recipes section added (completed 2026-03-01)
- [x] **Phase 16: Docs New Reference Sections** — Styling, TypeScript, and Performance/best-practices guides added (completed 2026-03-01)

## Phase Details

### Phase 13: Landing Page Bar Chart
**Goal**: The landing page benchmark section is complete — a Streem-built bar chart component visualizes the Streem vs SolidJS vs Preact signal performance comparison
**Depends on**: Phase 12 (Tailwind + CSS Modules foundation in landing app)
**Requirements**: LAND-01
**Success Criteria** (what must be TRUE):
  1. A bar chart is visible on the landing page comparing Streem, SolidJS, and Preact benchmark ops/sec figures from BENCHMARKS.md
  2. The chart component is authored in TSX using Streem signals (dogfood — no third-party charting library)
  3. The chart renders correctly in both desktop and mobile viewport widths
  4. Data values in the chart match the numbers in BENCHMARKS.md
**Plans**: 2 plans
Plans:
- [x] 13-01-PLAN.md — Create BenchmarkChart SVG component + wire into App.tsx
- [x] 13-02-PLAN.md — Visual checkpoint: verify chart on desktop and mobile

### Phase 14: Docs Visual Polish
**Goal**: Users visiting the docs experience a cohesive, on-brand design that feels like an extension of the landing page — dark, readable, and professional — on both desktop and mobile
**Depends on**: Phase 13
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-09
**Success Criteria** (what must be TRUE):
  1. Docs site uses a dark background, typography, and color tokens consistent with the landing page (no white/light theme remnants)
  2. The Streem logo (logo.svg) is visible in the docs sidebar nav header
  3. Every code block in the docs displays TypeScript/TSX syntax highlighting (keywords, strings, types are color-differentiated)
  4. Docs layout is readable on a 375px-wide mobile screen — sidebar nav collapses and content reflows without horizontal overflow
**Plans**: 2 plans
Plans:
- [x] 14-01-PLAN.md — Add Google Fonts to docs HTML, logo in sidebar, syntax highlighting in code blocks
- [x] 14-02-PLAN.md — Mobile layout polish + visual verification checkpoint

### Phase 15: Docs Content Expansion
**Goal**: Existing docs sections are no longer stubs — they contain enough examples, edge cases, and pattern guidance that a developer can learn Streem from the docs alone
**Depends on**: Phase 14
**Requirements**: DOCS-04, DOCS-05
**Success Criteria** (what must be TRUE):
  1. Getting Started, Signals, Components, Streams, and Lit interop sections each contain at least one additional worked example beyond the minimum
  2. Each expanded section includes at least one edge case or TypeScript tip not present in the v1.1 docs
  3. A Patterns/recipes section exists covering forms, data fetching, shared state, and real-time updates
  4. The patterns section shows complete, runnable code examples (not pseudocode)
**Plans**: 1 plan
Plans:
- [x] 15-01-PLAN.md — Expand existing sections + add Patterns/recipes section with four sub-patterns

### Phase 16: Docs New Reference Sections
**Goal**: Three new standalone reference sections exist — Styling, TypeScript, and Performance — giving developers authoritative guidance on the decisions that matter most in production Streem apps
**Depends on**: Phase 15
**Requirements**: DOCS-06, DOCS-07, DOCS-08
**Success Criteria** (what must be TRUE):
  1. A Styling guide section exists covering CSS Modules setup and Tailwind v4 setup, incorporating the content from docs/STYLING.md
  2. A TypeScript guide section exists covering signal typing, JSX types, CSSProperties, ClassValue, and component prop types
  3. A Performance/best practices section exists covering computed vs effect tradeoffs, reactive leak prevention, cleanup patterns, and signal granularity
  4. All three sections appear in the docs nav and are reachable by link from relevant sections elsewhere in the docs
**Plans**: 3 plans
Plans:
- [ ] 16-01-PLAN.md — Add StylingSection: CSS Modules, Tailwind v4, reactive style objects + nav wiring
- [ ] 16-02-PLAN.md — Add TypeScriptSection: signal typing, JSX config, CSSProperties, conditional classes, prop types + nav wiring
- [ ] 16-03-PLAN.md — Add PerformanceSection: computed vs effect, reactive leaks, cleanup patterns, signal granularity + nav wiring

## Progress

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
| 9. Performance Benchmarks | v1.1 | 2/2 | Complete | 2026-03-01 |
| 9.1. Optimize Signal Benchmarks | v1.1 | 3/3 | Complete | 2026-03-01 |
| 11. Improve Styles DX | v1.1 | 3/3 | Complete | 2026-03-01 |
| 12. Add Tailwind Support | v1.1 | 2/2 | Complete | 2026-03-01 |
| 13. Landing Page Bar Chart | v1.2 | 1/2 | In progress | - |
| 14. Docs Visual Polish | v1.2 | 2/2 | Complete | 2026-03-01 |
| 15. Docs Content Expansion | 1/1 | Complete    | 2026-03-01 | - |
| 16. Docs New Reference Sections | 3/3 | Complete    | 2026-03-01 | - |
| 17. Production Ready + Deploy | 3/3 | Complete   | 2026-03-02 | - |

### Phase 17: Make the landing/docs page produciton ready (favicon, SEO, etc) Then push changes to release to deploy changes

**Goal:** The landing page and docs site are production-ready — favicon renders in browser tabs, social share previews show rich OG/Twitter cards, and all changes are deployed to GitHub Pages via the existing CI workflow
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Depends on:** Phase 16
**Plans:** 3/3 plans complete

Plans:
- [ ] 17-01-PLAN.md — Create favicon.svg from logo mark + add OG/Twitter card meta to landing index.html
- [ ] 17-02-PLAN.md — Add SEO description + OG/Twitter card meta to docs/index.html
- [ ] 17-03-PLAN.md — Production build verification + visual checkpoint + deploy to GitHub Pages
