# Requirements: Streem

**Defined:** 2026-02-28
**Milestone:** v1.1 Quality & Polish
**Core Value:** Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.

## v1.1 Requirements

Requirements for the Quality & Polish milestone. Each maps to a roadmap phase.

### Type Safety

- [ ] **LIT-01**: Developer gets TypeScript IntrinsicElements autocomplete and type-checking for sl-* elements when @streem/lit is installed (fixes missing JSX type augmentation in dist/)

### Testing

- [ ] **TEST-01**: Playwright E2E test verifies `npm create streem@latest` scaffolds a buildable project without errors
- [ ] **TEST-02**: Playwright E2E test verifies signal state is preserved across a Vite HMR hot reload in the browser
- [ ] **TEST-03**: Unit tests cover @streem/dom edge cases: nested ErrorBoundary, Suspense async error propagation, For keyed list reordering
- [ ] **TEST-04**: Unit tests cover @streem/streams edge cases: reconnect backoff exhaustion, cancellation during read, subscription error paths

### Performance

- [ ] **PERF-01**: Benchmark suite measures signal(), computed(), and effect() throughput against SolidJS signals and Preact signals
- [ ] **PERF-02**: Benchmark results are committed to the repository with methodology documented (what was measured, how to reproduce)

### Landing Page

- [ ] **LAND-01**: Bar chart component built with Streem primitives (dogfood) renders benchmark comparison on the public landing page

### Styling

- [ ] **STYLE-01**: `style` prop accepts a `CSSProperties` object (e.g., `style={{ display: 'grid', gap: '20px' }}`) in addition to a CSS string
- [ ] **STYLE-02**: `CSSProperties` type is exported from `@streem/dom` and the `streem` meta-package so style objects can be typed and extracted as variables
- [ ] **STYLE-03**: CSS Modules are documented as the recommended pattern for component-level styles (Vite-native; includes example in docs or README)
- [ ] **STYLE-04**: Landing page components are migrated from inline `<style>` string blocks to CSS Modules and style objects as dogfood proof

## Future Requirements

(None defined — scope is tightly bounded to v1.0 quality gaps)

## Out of Scope

| Feature | Reason |
|---------|--------|
| CSS-in-JS runtime (styled-components/emotion) | Runtime overhead; CSS Modules + style objects are sufficient |
| Scoped style transforms | Requires a compiler step; out of scope per v1.0 constraint |
| SSR | Still fundamentally changes the streaming model |
| First-party router | TanStack Router still sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIT-01 | Phase 7 | Pending |
| TEST-03 | Phase 7 | Pending |
| TEST-04 | Phase 7 | Pending |
| STYLE-01 | Phase 7 | Pending |
| STYLE-02 | Phase 7 | Pending |
| STYLE-03 | Phase 7 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |
| PERF-01 | Phase 9 | Pending |
| PERF-02 | Phase 9 | Pending |
| LAND-01 | Phase 10 | Pending |
| STYLE-04 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 — traceability complete after roadmap creation*
