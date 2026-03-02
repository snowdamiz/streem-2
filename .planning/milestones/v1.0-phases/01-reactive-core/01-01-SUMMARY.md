---
phase: 01-reactive-core
plan: "01"
subsystem: core
tags: [typescript, pnpm, vitest, vite, reactive, signals, owner-tree, push-pull]

requires: []

provides:
  - pnpm monorepo scaffold with root tsconfig.base.json (ES2022, bundler moduleResolution)
  - packages/core/src/reactive.ts — push-pull reactive graph (SignalNode, ComputedNode, EffectNode, trackRead, notifySubscribers, getCurrentSubscriber)
  - packages/core/src/owner.ts — owner tree (createRoot, onCleanup, getOwner, runWithOwner, getCurrentOwner)
  - isBatching/startBatch/endBatch stub for Phase 3 batch() extension
  - vite lib mode + vite-plugin-dts build config for /core

affects:
  - 01-reactive-core/01-02 (signal.ts public API wraps these internals)
  - 01-reactive-core/01-03 (test suite tests these internals)
  - all downstream phases depend on owner tree correctness

tech-stack:
  added:
    - typescript ~5.8 (ES2022, bundler moduleResolution, strict mode)
    - pnpm workspaces ^9 (workspace protocol, strict isolation)
    - vite ^7.0 (lib mode build for /core)
    - vite-plugin-dts ^4.0 (rollupTypes: true for single .d.ts output)
    - vitest ^4.0 (test.projects pattern, not deprecated vitest.workspace)
  patterns:
    - Push-pull reactive algorithm: signals push dirty, computeds pull lazily on read, effects run eagerly
    - Owner tree scope/disposal: bottom-up traversal (children first, then own cleanups)
    - Re-entrant notification guard: pendingNotifications queue prevents double-firing
    - Stale dep cleanup: effect clears all deps before re-run (no ghost subscriptions)
    - Circular dep detection: computing flag on ComputedNode; throws in dev, returns cached in prod
    - No circular import: reactive.ts uses OwnerRef structural subtype; getCurrentOwner lives in owner.ts

key-files:
  created:
    - packages/core/src/reactive.ts
    - packages/core/src/owner.ts
    - packages/core/src/index.ts
    - package.json
    - pnpm-workspace.yaml
    - tsconfig.base.json
    - vitest.config.ts
    - packages/core/package.json
    - packages/core/tsconfig.json
    - packages/core/vite.config.ts
    - .gitignore
    - .npmrc
  modified: []

key-decisions:
  - "reactive.ts does NOT import from owner.ts — uses OwnerRef structural interface to avoid circular deps; getCurrentOwner lives in owner.ts"
  - "createEffectNode accepts owner as parameter (not read internally) — caller passes getCurrentOwner() result; avoids circular import"
  - "createRoot returns fn's return value (not a fixed dispose function) per plan spec — caller returns dispose if needed"
  - "disposeEffect exported from reactive.ts for use by signal.ts effect() wrapper in Plan 01-02"
  - "packages/core devDependencies use version ranges (not workspace:*) — workspace:* only works for internal workspace packages"
  - "pnpm.onlyBuiltDependencies in root package.json allows esbuild postinstall to run"

patterns-established:
  - "Pattern: Push-pull reactive algorithm — source signals eagerly push dirty via notifySubscribers(), computeds check state on read via readComputedNode(), effects re-run via runEffect()"
  - "Pattern: Owner tree disposal — createRoot() bottom-up via disposeOwner(), onCleanup() pushes to currentOwner.cleanups, runWithOwner() re-attaches to captured owner"
  - "Pattern: No circular imports between reactive.ts and owner.ts — structural interface (OwnerRef) provides loose coupling"
  - "Pattern: isBatching flag stub — startBatch()/endBatch() APIs ready for Phase 3 batch() without changing algorithm"

requirements-completed:
  - SIGNAL-04
  - SIGNAL-05

duration: 6min
completed: 2026-02-28
---

# Phase 01 Plan 01: Reactive Core Foundation Summary

**pnpm monorepo scaffold + push-pull reactive graph (SignalNode/ComputedNode/EffectNode) + owner tree (createRoot/onCleanup/getOwner/runWithOwner) — internal foundation for all /core public API**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T03:29:31Z
- **Completed:** 2026-02-28T03:35:49Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Bootstrapped pnpm monorepo with TypeScript 5.8, Vite 7, Vitest 4; `pnpm install` exits 0
- Implemented push-pull reactive graph in `reactive.ts`: signal/computed/effect nodes, trackRead, notifySubscribers with re-entrant guard, stale-dep cleanup, circular-dep detection
- Implemented owner tree in `owner.ts`: createRoot with bottom-up disposal, onCleanup, getOwner, runWithOwner with disposed-owner guard (throws in dev, no-op in prod)
- Stubbed `isBatching/startBatch/endBatch` in reactive.ts as Phase 3 extension point
- TypeScript strict mode + `tsc --noEmit` passes with 0 errors on packages/core

## Task Commits

Each task was committed atomically:

1. **Task 1: Monorepo scaffold** - `7f4b89a` (chore)
2. **Task 2: Internal reactive graph and owner tree** - `0667b13` (feat)

**Plan metadata:** (pending — created in final commit)

## Files Created/Modified
- `packages/core/src/reactive.ts` — Internal push-pull graph: SignalNode, ComputedNode, EffectNode, trackRead, notifySubscribers, getCurrentSubscriber, createSignalNode, createComputedNode, readComputedNode, createEffectNode, disposeEffect, isBatching stub
- `packages/core/src/owner.ts` — Owner tree: Owner interface, createRoot, disposeOwner (internal), onCleanup, getOwner, getCurrentOwner, runWithOwner
- `packages/core/src/index.ts` — Placeholder entry point for vite lib mode (public API exports in Plan 01-02)
- `package.json` — Root monorepo; pnpm.onlyBuiltDependencies for esbuild
- `pnpm-workspace.yaml` — Workspace definition: packages/*, apps/*
- `tsconfig.base.json` — Shared TS config: ES2022 target, bundler moduleResolution, strict, vite/client types
- `vitest.config.ts` — Root vitest config using test.projects array (not deprecated vitest.workspace)
- `packages/core/package.json` — /core 0.1.0, ESM exports
- `packages/core/tsconfig.json` — Extends root, composite: true, declarationMap, includes src + tests
- `packages/core/vite.config.ts` — Lib mode, es format, dts({ rollupTypes: true })
- `.gitignore` — node_modules/, dist/, *.tsbuildinfo
- `.npmrc` — pnpm config comment

## Decisions Made
- `reactive.ts` does NOT import from `owner.ts` — the `OwnerRef` structural interface decouples them. `getCurrentOwner()` lives in `owner.ts` where the state is. `signal.ts` (Plan 01-02) imports from both.
- `createEffectNode(fn, owner)` receives owner as a parameter rather than calling `getCurrentOwner()` internally — eliminates circular dependency.
- `disposeEffect` exported from `reactive.ts` so `signal.ts` can call it from the effect dispose function returned to users.
- devDependencies in `packages/core/package.json` use version ranges, not `workspace:*` — `workspace:*` resolves to other packages in the monorepo, not root node_modules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `workspace:*` protocol in packages/core/package.json**
- **Found during:** Task 1 (Monorepo scaffold)
- **Issue:** Plan specified `"vite": "workspace:*"` in core devDependencies. pnpm's `workspace:*` resolves to an internal workspace package named "vite" — no such package exists. `pnpm install` exited 1 with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`.
- **Fix:** Replaced `workspace:*` with version ranges matching root: `"vite": "^7.0.0"`, `"vitest": "^4.0.0"`, `"vite-plugin-dts": "^4.0.0"`, `"typescript": "~5.8.0"`
- **Files modified:** `packages/core/package.json`
- **Verification:** `pnpm install` exits 0
- **Committed in:** `7f4b89a` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added .gitignore**
- **Found during:** Task 1 (Monorepo scaffold)
- **Issue:** No `.gitignore` — `node_modules/` and `dist/` would be committed
- **Fix:** Created `.gitignore` with `node_modules/`, `dist/`, `*.tsbuildinfo`, `.DS_Store`
- **Files modified:** `.gitignore`
- **Verification:** `git status` shows node_modules excluded
- **Committed in:** `7f4b89a` (Task 1 commit)

**3. [Rule 1 - Bug] Removed circular import design in createEffectNode**
- **Found during:** Task 2 (Reactive graph implementation)
- **Issue:** Initial design used `require('./owner.js')` inside `createEffectNode` to get `getCurrentOwner()` — CJS-style dynamic require doesn't work in pure ESM, and would create a circular dependency
- **Fix:** Redesigned `createEffectNode(fn, owner)` to accept owner as a parameter; added `OwnerRef` structural interface in `reactive.ts` to avoid importing the full `Owner` type from `owner.ts`
- **Files modified:** `packages/core/src/reactive.ts`
- **Verification:** `tsc --noEmit` passes with 0 errors
- **Committed in:** `0667b13` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. The circular import redesign actually improves architecture by making dependency injection explicit.

## Issues Encountered
- esbuild postinstall script not running initially due to pnpm security defaults; resolved by adding `pnpm.onlyBuiltDependencies: ["esbuild"]` to root `package.json`

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Internal reactive graph and owner tree are solid foundations for Plan 01-02
- Plan 01-02 (signal.ts): wrap internal nodes in public `signal()`, `computed()`, `effect()` API
- Plan 01-03 (tests + dev warnings): full test suite + DX-02/DX-03 dev warnings
- No blockers

## Self-Check: PASSED

All created files verified present. Both task commits verified in git log.

- `packages/core/src/reactive.ts` — FOUND
- `packages/core/src/owner.ts` — FOUND
- `packages/core/src/index.ts` — FOUND
- `pnpm-workspace.yaml` — FOUND
- `tsconfig.base.json` — FOUND
- `vitest.config.ts` — FOUND
- `packages/core/package.json` — FOUND
- `packages/core/tsconfig.json` — FOUND
- `packages/core/vite.config.ts` — FOUND
- Commit `7f4b89a` (Task 1) — FOUND
- Commit `0667b13` (Task 2) — FOUND

---
*Phase: 01-reactive-core*
*Completed: 2026-02-28*
