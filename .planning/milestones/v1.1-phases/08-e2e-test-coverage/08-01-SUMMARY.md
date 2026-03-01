---
phase: 08-e2e-test-coverage
plan: 01
subsystem: testing
tags: [playwright, e2e, cli, scaffold, create-streem, expect, tty]

# Dependency graph
requires:
  - phase: 05-package-assembly-cli-and-ai-skills
    provides: create-streem CLI with interactive prompts

provides:
  - apps/e2e Playwright package with cli-scaffold.spec.ts (TEST-01)
  - Automated regression gate for create-streem scaffold flow

affects:
  - CI pipeline (phase-08 adds playwright test step)
  - 08-02 (hmr-signal test will share same e2e package)

# Tech tracking
tech-stack:
  added:
    - "@playwright/test@1.58.2 (test runner for CLI and browser E2E)"
    - "expect (TCL automation tool — drives interactive TTY prompts)"
  patterns:
    - "Background expect + filesystem polling pattern for interactive CLI testing"
    - "Dependency patching: replace streem:latest with file: path for local build testing"

key-files:
  created:
    - apps/e2e/package.json
    - apps/e2e/playwright.config.ts
    - apps/e2e/tests/cli-scaffold.spec.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Used background `expect` + filesystem polling instead of blocking spawnSync: clack/prompts block() keeps node alive ~60s in PTY mode, making spawnSync timeout unreliable"
  - "Kill expect after scaffold directory appears: directory is created before CLI's internal npm install, so we don't need to wait for npm install to complete"
  - "Patch streem: latest to file: path after scaffold: published streem not available in local dev, test must use local build"
  - "Set test.setTimeout(300_000): CLI interaction + npm install + vite build total ~1 minute"
  - "retries: 2 in playwright.config.ts for network flakiness resilience (npm install)"

patterns-established:
  - "Interactive CLI testing: use expect TCL tool in background, poll filesystem for output"
  - "Local package override: patch file: path dependencies when testing against unpublished packages"

requirements-completed: [TEST-01]

# Metrics
duration: 65min
completed: 2026-03-01
---

# Phase 8 Plan 01: E2E Test Coverage (CLI Scaffold) Summary

**Playwright E2E package with TEST-01: create-streem CLI scaffold verified via background `expect` + npm build assertion**

## Performance

- **Duration:** 65 min
- **Started:** 2026-03-01T00:18:06Z
- **Completed:** 2026-03-01T01:23:00Z
- **Tasks:** 2
- **Files modified:** 4 (package.json, playwright.config.ts, cli-scaffold.spec.ts, pnpm-lock.yaml)

## Accomplishments
- Scaffolded `apps/e2e` as a private workspace package with `@playwright/test` installed
- Implemented TEST-01: CLI scaffold E2E test that drives `create-streem` interactively
- Solved the `@clack/prompts` PTY interaction challenge using background `expect` + filesystem polling
- Verified that the scaffolded project builds successfully (npm install + npm run build → exit 0)
- Test passes in ~1 minute end-to-end with proper cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold apps/e2e Playwright package** - `da9d21a` (chore)
2. **Task 2: Implement CLI scaffold E2E test (TEST-01)** - `ed3257f` (feat)

**Plan metadata:** (docs commit — see state update below)

## Files Created/Modified
- `apps/e2e/package.json` - Private workspace package with @playwright/test ^1.50.0
- `apps/e2e/playwright.config.ts` - Playwright config with cli-scaffold and hmr-signal projects, 120s timeout, 2 retries
- `apps/e2e/tests/cli-scaffold.spec.ts` - TEST-01: drives create-streem CLI via background expect, polls for scaffold dir, patches streem dep, runs npm install + build
- `pnpm-lock.yaml` - Updated with @playwright/test 1.58.2

## Decisions Made

**Background expect + filesystem polling pattern**: The plan's original approach (spawnSync with stdin piping) doesn't work because `@clack/prompts` requires a real TTY. The `block()` function in `@clack/core` calls `readline.createInterface` on stdin and keeps the process alive for ~60 seconds after completion in PTY mode. Using `expect` (TCL) in background with filesystem polling solves this: we spawn expect (which creates a PTY for the CLI), wait until the scaffold directory appears (before npm install completes), kill expect, and proceed with our own install + build.

**Dependency patching**: The template uses `streem: "latest"` which isn't published to npm in local dev. After scaffold, we patch `package.json` to `file:/path/to/streem` so the test can build the scaffolded project.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Interactive CLI requires TTY; piped stdin approach fails**
- **Found during:** Task 2 (CLI scaffold E2E test implementation)
- **Issue:** Plan suggested using `spawn` with piped stdin to drive `@clack/prompts`. In practice, `@clack/prompts` uses readline with `terminal: true` and `setRawMode` — piped stdin doesn't properly accumulate `rl.line` so project name always reverts to default value
- **Fix:** Used `expect` (TCL automation tool) spawned in background, which creates a real PTY. Replaced blocking `spawnSync` with non-blocking `spawn` + filesystem polling via `waitForDirectory()`
- **Files modified:** `apps/e2e/tests/cli-scaffold.spec.ts`
- **Verification:** Test passes in ~1 minute, scaffold directory created correctly with all template files
- **Committed in:** ed3257f

**2. [Rule 1 - Bug] `streem: latest` unavailable in local dev**
- **Found during:** Task 2 (running npm install in scaffolded project)
- **Issue:** Template `package.json` uses `"streem": "latest"` — npm 404 in local dev environment
- **Fix:** After scaffold, patch `package.json` dependency to `file:${STREEM_PKG_DIR}` (local workspace build) before running npm install
- **Files modified:** `apps/e2e/tests/cli-scaffold.spec.ts`
- **Verification:** npm install succeeds with local package; `npm run build` exits 0
- **Committed in:** ed3257f

---

**Total deviations:** 2 auto-fixed (Rule 1 bugs — incorrect assumptions about CLI stdin handling and npm registry availability)
**Impact on plan:** Both fixes necessary for correctness. The approach still satisfies TEST-01 requirements: CLI is spawned, prompts are answered, scaffold builds successfully.

## Issues Encountered

**PTY interaction complexity**: Extensive investigation of `@clack/prompts` internals to understand why:
1. Piped stdin doesn't work (readline non-TTY mode doesn't track `rl.line` properly)
2. `expect` in background takes ~20s to answer prompts (vs 3s in foreground)
3. The `block()` function keeps node alive for ~60s in PTY mode after completion

Resolution: background `expect` + filesystem polling for directory creation (files appear BEFORE internal npm install completes, so we can kill expect early).

## Next Phase Readiness
- `apps/e2e` package is ready for additional test files (hmr-signal.spec.ts in 08-02)
- Playwright config already includes `hmr-signal` project definition
- TEST-01 regression gate is live

---
*Phase: 08-e2e-test-coverage*
*Completed: 2026-03-01*

## Self-Check: PASSED

- apps/e2e/package.json: FOUND
- apps/e2e/playwright.config.ts: FOUND
- apps/e2e/tests/cli-scaffold.spec.ts: FOUND
- .planning/phases/08-e2e-test-coverage/08-01-SUMMARY.md: FOUND
- Commit da9d21a (Task 1): FOUND
- Commit ed3257f (Task 2): FOUND
