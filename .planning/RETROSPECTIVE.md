# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-28
**Phases:** 6 | **Plans:** 21

### What Was Built

- `@streem/core` — DOM-free reactive graph: signal(), computed(), effect(), createRoot(), onCleanup() with dev-mode reactive-context warnings and 40-test Vitest suite
- `@streem/dom` — JSX runtime with surgical DOM updates (no VDOM), Show/For/ErrorBoundary/Suspense, component-runs-once model, Vite HMR signal-state preservation
- `@streem/streams` — Four stream adapters (WebSocket, SSE, ReadableStream, Observable) with auto-cleanup, typed status signals, exponential backoff, and backpressure combinators
- `@streem/lit` — TypeScript-typed Lit web component consumption via prop:/attr:/on: prefix routing and CEM-driven IntrinsicElements generation
- `streem` meta-package + `create-streem` CLI + 5-file progressive-disclosure AI skills for 6 tools
- Official landing page (`apps/landing`) — live 200 msg/sec ticker, Shoelace design system components, GitHub Actions Pages deployment

### What Worked

- **Dependency-driven phase order** — strict 1→2→3→4→5→6 order (with 3 parallelizable against 2) meant no phase ever blocked on missing upstream primitives
- **TDD red-green pattern** — writing failing tests first in each phase caught real bugs (onCleanup() registration bug in Phase 1, reactive singleton leak in Phase 3) before downstream phases depended on the behavior
- **Dogfood constraint** — treating the landing page as a correctness test surfaced three real framework bugs (SVG namespace, reactive singleton across packages, Suspense retry-loop) that would have been shipped otherwise
- **Structural interfaces for circular-dep prevention** — OwnerRef/EffectCleanupRef pattern established in Phase 1 propagated cleanly through all downstream packages; zero circular-import issues
- **happy-dom for stream adapter tests** — Node environment lacked WebSocket global; happy-dom provided it without requiring Playwright, keeping stream tests fast

### What Was Inefficient

- **REQUIREMENTS.md traceability table never updated** — status column remained "Pending" for Phases 2–6 throughout execution; required cleanup at milestone close
- **ROADMAP.md Phase 3 and 6 checkbox staleness** — plans marked [ ] in ROADMAP even after completion; roadmap analysis tool surfaced this correctly but the docs required manual repair
- **STATE.md went stale mid-execution** — mid-milestone pauses left STATE.md reflecting Phase 6 in-progress state; required update at close
- **Phase 6 VERIFICATION.md predated final fixes** — two bugs (Suspense, sl-badge) were fixed after verification was written; a re-verification pass was deferred as tech debt

### Patterns Established

- **OwnerRef/EffectCleanupRef structural interfaces** — bridge reactive.ts ↔ owner.ts without circular imports; use this pattern whenever cross-module state needs to flow without creating a dep cycle
- **external: [@streem/core] in tsup config** — every package that imports @streem/core must declare it external; bundling it in creates reactive singleton duplication (signals lose identity across package boundaries)
- **Cleanup-first adapter pattern** — onCleanup() registered before connect() in all stream adapters; prevents race conditions where the component unmounts before the connection resolves
- **Streaming signals lifted above Suspense** — fromWebSocket/fromSSE signals must live in parent scope, not inside the Suspense child; Suspense retry-loops if the signal is re-created on each thrown Promise
- **JSX namespace inline in jsx-runtime.ts** — vite-plugin-dts rollupTypes silently strips re-exported namespace members; declare the JSX namespace in the same file it's consumed, never re-export it

### Key Lessons

1. **Reactive singleton = runtime singleton.** Each package that bundles @streem/core gets its own reactive graph. All packages must declare @streem/core external in their build config — verify this immediately when adding a new package.
2. **Dogfood surfaces framework bugs, not page bugs.** Every painful integration on the landing page (SVG namespace, Suspense scope, Shadow DOM events) was a real framework design gap. The constraint paid off.
3. **CEM type generation is straightforward but the post-processing step matters.** `generateJsxTypes()` returns a string; add the `declare module` wrapper before writing to disk or TypeScript won't pick it up via jsxImportSource resolution.
4. **Structural interfaces prevent circular deps at scale.** When two modules need to share state, define a minimal interface (just the fields needed) in the dependency direction rather than extracting a third module. Keeps the graph flat.
5. **Documentation staleness is the default, not the exception.** ROADMAP.md checkboxes, REQUIREMENTS.md traceability, STATE.md status — all drifted during execution. Build in an explicit cleanup gate (milestone close) rather than expecting real-time updates.

### Cost Observations

- Model mix: primarily sonnet (balanced profile)
- Sessions: multiple short sessions across 2026-02-27 → 2026-02-28
- Notable: plan execution was fast (~4–5 min/plan average) due to TDD structure; deviations were mostly documentation staleness rather than implementation rework

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Process Notes |
|-----------|--------|-------|-------------------|
| v1.0 | 6 | 21 | First milestone; TDD pattern + dogfood constraint established |

### Cumulative Quality

| Milestone | LOC (TS/TSX) | Files | Packages |
|-----------|-------------|-------|---------|
| v1.0 | ~17,684 | 186 | 6 packages + 1 app |

### Top Lessons (Verified Across Milestones)

1. Reactive singleton isolation via external build config is non-negotiable for multi-package reactive frameworks
2. Dogfood as correctness test (not demo) surfaces real design gaps before public release
