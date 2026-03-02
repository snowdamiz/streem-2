# Requirements: Streem

**Defined:** 2026-03-01
**Core Value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.

## v1.2 Requirements

Requirements for the Documentation & DX Polish milestone.

### Landing Page

- [x] **LAND-01**: User sees a bar chart on the landing page comparing Streem, SolidJS, and Preact signal benchmark performance (dogfood: built with Streem itself)

### Docs Polish

- [x] **DOCS-01**: Docs site visual design is consistent with the landing page (dark background, shared typography, color tokens, border styles)
- [x] **DOCS-02**: Logo (logo.svg from public/) is displayed in the docs sidebar nav header
- [x] **DOCS-03**: All code blocks in the docs display syntax-highlighted output (TypeScript/TSX)

### Docs Content

- [x] **DOCS-04**: Existing doc sections (Getting Started, Signals, Components, Streams, Lit interop) are expanded with additional examples, edge cases, and TypeScript tips
- [x] **DOCS-05**: Patterns/recipes section added — covers common patterns (forms, data fetching, shared state, real-time updates)
- [x] **DOCS-06**: Styling guide section added — covers CSS Modules and Tailwind v4 setup (folds in docs/STYLING.md content)
- [x] **DOCS-07**: TypeScript guide section added — covers signal typing, JSX types, CSSProperties, ClassValue, component prop types
- [x] **DOCS-08**: Performance/best practices section added — covers computed vs effect, reactive leaks, cleanup patterns, signal granularity
- [x] **DOCS-09**: Docs layout is responsive and readable on mobile (sidebar nav collapses, content reflows)

## Future Requirements

### Docs

- **DOCS-F01**: Versioned docs (multiple framework versions browsable)
- **DOCS-F02**: Search across docs content
- **DOCS-F03**: Interactive live code playgrounds embedded in docs

## Out of Scope

| Feature | Reason |
|---------|--------|
| SSR / Static site generation for docs | Docs are a Streem app (dogfood); switching to a static framework would lose the dogfood value |
| Third-party docs framework (VitePress, Docusaurus) | Same reason — custom Streem docs is the point |
| i18n / translations | Premature for this stage; English-only for v1.x |
| Dark/light mode toggle | Docs are dark-only to match the landing page brand |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAND-01 | Phase 13 | Complete |
| DOCS-01 | Phase 14 | Complete |
| DOCS-02 | Phase 14 | Complete |
| DOCS-03 | Phase 14 | Complete |
| DOCS-04 | Phase 15 | Complete |
| DOCS-05 | Phase 15 | Complete |
| DOCS-06 | Phase 16 | Complete |
| DOCS-07 | Phase 16 | Complete |
| DOCS-08 | Phase 16 | Complete |
| DOCS-09 | Phase 14 | Complete |

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after v1.2 roadmap created*
