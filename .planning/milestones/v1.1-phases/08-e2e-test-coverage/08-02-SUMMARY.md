---
phase: 08-e2e-test-coverage
plan: 02
subsystem: testing
tags: [playwright, vite, hmr, signals, e2e, chromium]

# Dependency graph
requires:
  - phase: 08-01
    provides: apps/e2e Playwright package with CLI scaffold test infrastructure
  - phase: 01-reactive-core
    provides: signal() primitive used in demo app count state
  - phase: 03-streaming-primitives
    provides: HMR plugin (streemHMR) and import.meta.hot integration
provides:
  - TEST-02: Playwright E2E test proving signal state survives Vite HMR hot reload
  - apps/e2e/tests/hmr-signal.spec.ts with two browser-verified HMR tests
  - apps/e2e/playwright.config.ts webServer config for demo Vite dev server
affects: [09-benchmarks, 10-release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "writeFileSync to App.tsx triggers Vite file watcher -> HMR propagation in tests"
    - "page.waitForFunction() polling DOM every 200ms for HMR completion (more reliable than fixed waitForTimeout)"
    - "finally block restores App.tsx after each HMR test to prevent test pollution"
    - "webServer.cwd with correct path resolution from playwright config file location"
    - "Separate port (5174) for demo Vite dev server to avoid collision with landing page on 5173"

key-files:
  created:
    - apps/e2e/tests/hmr-signal.spec.ts
  modified:
    - apps/e2e/playwright.config.ts

key-decisions:
  - "Use port 5174 for demo Vite dev server in tests — port 5173 used by landing page Vite server locally"
  - "MONOREPO_ROOT path resolution from playwright.config.ts requires 3 levels up (../../..) not 2 (../..) — file path, not dir"
  - "fileURLToPath comes from node:url, not node:path — split imports to avoid runtime error"
  - "reuseExistingServer: !process.env.CI allows local reuse once the correct server is running on 5174"

patterns-established:
  - "HMR E2E test pattern: increment signal -> writeFileSync(App.tsx + comment) -> waitForFunction polls DOM -> assert value preserved"
  - "framenavigated listener proves hot reload (not full page reload) occurred"

requirements-completed: [TEST-02]

# Metrics
duration: 12min
completed: 2026-02-28
---

# Phase 8 Plan 02: HMR Signal State Preservation E2E Test Summary

**Playwright E2E test proving Vite HMR preserves signal state: writeFileSync triggers hot reload, count stays at 3 (or 5) without full page navigation**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-28T20:20:00Z
- **Completed:** 2026-02-28T20:32:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `apps/e2e/tests/hmr-signal.spec.ts` with two Playwright tests covering TEST-02
- Test 1 proves signal count (3) is preserved after Vite HMR triggered by App.tsx file write
- Test 2 proves no full page reload occurs (framenavigated not fired on main frame)
- Added `webServer` config to playwright.config.ts so Playwright starts demo Vite dev server automatically
- Both tests pass on consecutive runs (3.3-3.4s each run, no flakiness)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add webServer config for demo Vite dev server** - `466cba8` (feat)
2. **Task 2: Implement TEST-02 HMR signal preservation E2E test** - `c7104e2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/e2e/tests/hmr-signal.spec.ts` - Two Playwright tests: count preserved after HMR, no full page reload
- `apps/e2e/playwright.config.ts` - Added webServer (port 5174), fixed imports, corrected MONOREPO_ROOT path

## Decisions Made
- Port 5174 for demo app: local landing page runs on 5173, using same port caused `reuseExistingServer` to pick up the wrong server
- MONOREPO_ROOT needs `../../..` (3 levels) from `apps/e2e/playwright.config.ts`, not `../..` (2 levels) as in the plan template
- `fileURLToPath` must be imported from `node:url`, not `node:path` — plan had incorrect import source

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect fileURLToPath import source**
- **Found during:** Task 1 (playwright.config.ts update)
- **Issue:** Plan specified `import { join, resolve, fileURLToPath } from 'node:path'` but `fileURLToPath` is not exported from `node:path` — it comes from `node:url`. This caused `SyntaxError: The requested module 'node:path' does not provide an export named 'fileURLToPath'`.
- **Fix:** Split into two imports: `import { join, resolve } from 'node:path'` and `import { fileURLToPath } from 'node:url'`
- **Files modified:** apps/e2e/playwright.config.ts, apps/e2e/tests/hmr-signal.spec.ts
- **Verification:** playwright.config.ts loads without syntax error
- **Committed in:** c7104e2 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed incorrect MONOREPO_ROOT path resolution**
- **Found during:** Task 1 (verifying webServer cwd path)
- **Issue:** Plan used `resolve(fileURLToPath(import.meta.url), '../..')` which resolves from `apps/e2e/playwright.config.ts` up 2 levels to `apps/` (not the monorepo root). DEMO_APP_DIR became `apps/apps/demo`, causing `spawn /bin/sh ENOENT` error when Playwright tried to start the web server.
- **Fix:** Changed to `resolve(fileURLToPath(import.meta.url), '../../..')` — 3 levels up from config file correctly yields monorepo root `/Users/sn0w/Documents/dev/streem-2`
- **Files modified:** apps/e2e/playwright.config.ts
- **Verification:** DEMO_APP_DIR resolves to correct path, webServer starts successfully
- **Committed in:** c7104e2 (Task 2 commit)

**3. [Rule 1 - Bug] Used port 5174 instead of 5173 for demo Vite dev server**
- **Found during:** Task 2 (running HMR tests)
- **Issue:** Port 5173 was occupied by the landing page Vite dev server. `reuseExistingServer: !process.env.CI` caused Playwright to reuse that server. The landing page served `<h1>Build reactive UIs that update in microseconds</h1>` instead of the demo's `<h1>Streem Demo</h1>`, causing test failures.
- **Fix:** Changed webServer port to 5174 and updated baseURL/URL in config accordingly. Also updated the URL assertion in the test.
- **Files modified:** apps/e2e/playwright.config.ts, apps/e2e/tests/hmr-signal.spec.ts
- **Verification:** Both HMR tests pass with correct demo app served on 5174
- **Committed in:** c7104e2 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs — incorrect imports, wrong path resolution, port collision)
**Impact on plan:** All fixes were necessary for correct operation. The test spec logic itself was executed exactly as planned. No scope creep.

## Issues Encountered
- `reuseExistingServer` picked up a stale Vite server on 5174 from a previous test run — killed the process and re-ran; subsequent runs work correctly since the demo server stays alive and is reused properly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TEST-01 (CLI scaffold) and TEST-02 (HMR signal) both pass — Phase 8 E2E test coverage complete
- Phase 8 is fully done: both plans (08-01, 08-02) executed successfully
- Ready for Phase 9 (benchmarks) or Phase 10 (release) depending on roadmap priority

---
*Phase: 08-e2e-test-coverage*
*Completed: 2026-02-28*
