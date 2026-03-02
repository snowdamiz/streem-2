# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-28
**Phases:** 6 | **Plans:** 21

### What Was Built

- `/core` — DOM-free reactive graph: signal(), computed(), effect(), createRoot(), onCleanup() with dev-mode reactive-context warnings and 40-test Vitest suite
- `/dom` — JSX runtime with surgical DOM updates (no VDOM), Show/For/ErrorBoundary/Suspense, component-runs-once model, Vite HMR signal-state preservation
- `/streams` — Four stream adapters (WebSocket, SSE, ReadableStream, Observable) with auto-cleanup, typed status signals, exponential backoff, and backpressure combinators
- `/lit` — TypeScript-typed Lit web component consumption via prop:/attr:/on: prefix routing and CEM-driven IntrinsicElements generation
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
- **external: [/core] in tsup config** — every package that imports /core must declare it external; bundling it in creates reactive singleton duplication (signals lose identity across package boundaries)
- **Cleanup-first adapter pattern** — onCleanup() registered before connect() in all stream adapters; prevents race conditions where the component unmounts before the connection resolves
- **Streaming signals lifted above Suspense** — fromWebSocket/fromSSE signals must live in parent scope, not inside the Suspense child; Suspense retry-loops if the signal is re-created on each thrown Promise
- **JSX namespace inline in jsx-runtime.ts** — vite-plugin-dts rollupTypes silently strips re-exported namespace members; declare the JSX namespace in the same file it's consumed, never re-export it

### Key Lessons

1. **Reactive singleton = runtime singleton.** Each package that bundles /core gets its own reactive graph. All packages must declare /core external in their build config — verify this immediately when adding a new package.
2. **Dogfood surfaces framework bugs, not page bugs.** Every painful integration on the landing page (SVG namespace, Suspense scope, Shadow DOM events) was a real framework design gap. The constraint paid off.
3. **CEM type generation is straightforward but the post-processing step matters.** `generateJsxTypes()` returns a string; add the `declare module` wrapper before writing to disk or TypeScript won't pick it up via jsxImportSource resolution.
4. **Structural interfaces prevent circular deps at scale.** When two modules need to share state, define a minimal interface (just the fields needed) in the dependency direction rather than extracting a third module. Keeps the graph flat.
5. **Documentation staleness is the default, not the exception.** ROADMAP.md checkboxes, REQUIREMENTS.md traceability, STATE.md status — all drifted during execution. Build in an explicit cleanup gate (milestone close) rather than expecting real-time updates.

### Cost Observations

- Model mix: primarily sonnet (balanced profile)
- Sessions: multiple short sessions across 2026-02-27 → 2026-02-28
- Notable: plan execution was fast (~4–5 min/plan average) due to TDD structure; deviations were mostly documentation staleness rather than implementation rework

---

## Milestone: v1.1 — Quality & Polish

**Shipped:** 2026-03-01
**Phases:** 6 (7, 8, 9, 9.1, 11, 12) | **Plans:** 16

### What Was Built

- TypeScript IntrinsicElements for all sl-* Shoelace elements in `/lit` dist/ (vite-plugin-dts beforeWriteFile hook pattern)
- Playwright E2E coverage: `npm create streem@latest` CLI scaffold flow verified end-to-end; Vite HMR signal state preservation proven across hot reloads
- Reactive core benchmarked against SolidJS and Preact signals — tinybench suites covering signal/computed/effect, BENCHMARKS.md committed with methodology
- Phase 9.1 performance optimizations: O(1) batchedEffects dedup (Set), lazy Owner children/cleanups init (null vs []), ~12% signal throughput improvement
- React-like ClassValue type (string/array/object/mixed) for class/className props; bindStyle stale-key diffing via `el.style.removeProperty()`; classList removed
- Landing page migrated from inline style blocks to CSS Modules (5 component modules + shared global.css) — dogfood proof; Tailwind CSS v4 added alongside CSS Modules
- Tailwind CSS v4 baked into create-streem default template — every new project starts Tailwind-ready

### What Worked

- **Phase 9.1 insertion pattern** — inserting a decimal phase (9.1) after Phase 9 to address urgent benchmark optimization worked cleanly; the phase numbering communicated the insertion context without disrupting the roadmap
- **Phase absorption** — CSS Modules goal from Phase 10 was cleanly absorbed into Phase 11 (added later); scope flexibility allowed quality improvements to happen without blocking on Phase 10's bar chart
- **Tailwind v4 plugin-only setup** — no postcss.config.js or tailwind.config.js needed; the `@tailwindcss/vite` plugin handles everything; zero friction to add to a Vite project
- **ClassValue recursive type** — defining ClassValue as a recursive union (matching clsx signature) required no runtime dependency and provided full TypeScript inference for class prop values
- **E2E via background expect + filesystem polling** — the `clack/prompts` block() keeping the node process alive in PTY mode required the workaround; the pattern (background expect + poll for directory) is reliable for interactive CLI testing

### What Was Inefficient

- **Phase 10 never executed** — the bar chart goal was defined in the roadmap but never reached; the work flowed into Phase 11 organically, but the skipped phase left an unchecked LAND-01 requirement; better to remove or defer Phase 10 earlier rather than accumulate the gap
- **STATE.md milestone field stale** — STATE.md showed `milestone: v1.0` throughout v1.1 execution; minor metadata debt from the previous close
- **ROADMAP.md plan checkboxes drifted** — Phase 9.1 and Phase 12 plans showed as `[ ]` in the roadmap even after completion; same pattern as v1.0 (documentation staleness default)

### Patterns Established

- **vite-plugin-dts beforeWriteFile for ambient types** — `rollupTypes` (api-extractor) silently drops `declare module` augmentation blocks; use the `beforeWriteFile` hook to append ambient `.d.ts` files to the rolled-up output
- **ClassValue prop pattern** — `ClassValue` type in `types.ts` + `resolveClassValue()` in `bindings.ts` + `class`/`className` both accepted in `applyProps`; `classList` removed cleanly (no deprecation needed)
- **Tailwind v4 + CSS Modules coexistence** — Tailwind plugin before HMR plugin in `plugins[]`; `@import "tailwindcss"` first line of CSS entry; ClassValue arrays contain static string literals (safe for Tailwind scanning)
- **O(1) batchedEffects** — `Set<EffectNode>` deduplication is the canonical pattern; never use `Array.includes` for effect scheduling in reactive cores

### Key Lessons

1. **Phase absorption is valid but needs explicit decision.** When Phase N+1 absorbs work from Phase N, explicitly note it (in ROADMAP and STATE) rather than leaving Phase N as "not started." The bar chart gap was clear but LAND-01 remained unchecked creating end-of-milestone confusion.
2. **Decimal phase insertion (9.1) is clean and low-overhead.** Inserting an urgent optimization phase without renumbering all subsequent phases keeps git history coherent and the roadmap readable. The `(INSERTED)` annotation in ROADMAP is sufficient context.
3. **Tailwind v4 is genuinely plugin-only.** No config files, no PostCSS setup — just the Vite plugin and `@import "tailwindcss"`. This is a meaningful DX improvement worth documenting explicitly in the create-streem template.
4. **Benchmark deduplication is O(1) or it doesn't scale.** The Array.includes-based dedup worked at small scale but was a latent performance bug; benchmarking surfaced it immediately. Test performance-sensitive internals against competitors early.

### Cost Observations

- Model mix: balanced profile (primarily sonnet)
- Sessions: multiple sessions across 2026-02-28 → 2026-03-01
- Notable: Phase 9.1 optimization produced measurable results (~12% improvement) verified within the same milestone; the benchmark-driven dev loop worked well

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Process Notes |
|-----------|--------|-------|-------------------|
| v1.0 | 6 | 21 | First milestone; TDD pattern + dogfood constraint established |
| v1.1 | 6 (7, 8, 9, 9.1, 11, 12) | 16 | Decimal phase insertion; phase scope absorption; benchmark-driven optimization |

### Cumulative Quality

| Milestone | Files Changed | Packages |
|-----------|--------------|---------|
| v1.0 | 186 | 6 packages + 1 app |
| v1.1 | 96 (delta) | All packages improved; create-streem template enhanced |

### Top Lessons (Verified Across Milestones)

1. Reactive singleton isolation via external build config is non-negotiable for multi-package reactive frameworks
2. Dogfood as correctness test (not demo) surfaces real design gaps before public release
3. Documentation staleness (ROADMAP checkboxes, REQUIREMENTS status) is the default — build in explicit cleanup gates rather than expecting real-time updates
4. Phase scope absorption (Phase N work moved to Phase N+1) is valid but requires explicit ROADMAP annotation to avoid unresolved requirements at close
