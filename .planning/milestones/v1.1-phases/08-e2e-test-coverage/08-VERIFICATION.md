---
phase: 08-e2e-test-coverage
verified: 2026-02-28T22:00:00Z
status: passed
score: 6/6 must-haves verified
gaps: []
human_verification:
  - test: "Run `pnpm --filter /e2e exec playwright test cli-scaffold --reporter=line`"
    expected: "Test exits 0, scaffold builds with npm run build"
    why_human: "Test spawns expect (TCL), runs npm install (~60s), and pnpm build — network-dependent, cannot run headlessly in verifier context without side effects"
  - test: "Run `pnpm --filter /e2e exec playwright test hmr-signal --reporter=line`"
    expected: "Both HMR tests pass — count preserved at 3/5, no framenavigated event fired"
    why_human: "Requires Vite dev server to be started by Playwright webServer config, writes to apps/demo/src/App.tsx, needs live Chromium browser"
---

# Phase 8: E2E Test Coverage Verification Report

**Phase Goal:** Playwright end-to-end tests verify the create-streem CLI scaffold flow produces a working project and that signal state survives a Vite HMR reload
**Verified:** 2026-02-28T22:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The apps/e2e package is registered in the pnpm workspace and has Playwright installed | VERIFIED | `pnpm-workspace.yaml` covers `apps/*`; `@playwright/test` resolves in `apps/e2e/node_modules/@playwright/test/` |
| 2 | The test spawns the create-streem CLI via expect (TTY), answers prompts, and scaffolded project builds successfully with npm run build | VERIFIED | `cli-scaffold.spec.ts` lines 93-171: spawns `expect` with scaffold.exp script, polls for directory, patches dep, runs `spawnSync('npm', ['run', 'build'])` asserting status 0 |
| 3 | A Playwright test opens the demo app in Chromium, sets a signal value via button click, triggers Vite HMR by writing to App.tsx, and confirms the signal value is preserved | VERIFIED | `hmr-signal.spec.ts` lines 10-68: goto('/'), increments count 3x, writeFileSync App.tsx + comment, waitForFunction polls DOM for 'Count: 3', asserts not reset |
| 4 | After HMR reload, no full page navigation occurs (hot module replacement, not page reload) | VERIFIED | `hmr-signal.spec.ts` lines 70-111: second test attaches `framenavigated` listener, asserts `fullReloadOccurred === false` after HMR |
| 5 | apps/demo/src/App.tsx has import.meta.hot.dispose saving count signal, and restores via getRestoredValue on reload | VERIFIED | `App.tsx` line 6-24: `import.meta.hot?.data` read at module load, `getRestoredValue(_hmrData, 'count', 0)` initialises count signal, `import.meta.hot.dispose` saves `data.count = count()` |
| 6 | The Playwright config connects HMR tests to a Vite webServer on port 5174 | VERIFIED | `playwright.config.ts` line 15-21: `webServer` block with `command: 'pnpm dev --port 5174 --strictPort'`, `cwd: DEMO_APP_DIR`, baseURL `http://localhost:5174` for hmr-signal project |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/e2e/package.json` | E2E package with playwright dependency | VERIFIED | Name `/e2e`, `"@playwright/test": "^1.50.0"` present; installed version 1.58.2 |
| `apps/e2e/playwright.config.ts` | Playwright config for CLI and HMR tests | VERIFIED | Exports default via `defineConfig`; 120s timeout, retries: 2, two projects (cli-scaffold, hmr-signal), webServer on port 5174 |
| `apps/e2e/tests/cli-scaffold.spec.ts` | TEST-01: CLI scaffold test | VERIFIED | 174 lines; substantive implementation using expect TCL + filesystem polling + npm install + npm run build assertions |
| `apps/e2e/tests/hmr-signal.spec.ts` | TEST-02: HMR signal state preservation test | VERIFIED | 113 lines; two tests — count preservation and no-full-reload assertion using framenavigated listener |
| `apps/demo/src/App.tsx` | HMR-enabled demo app with import.meta.hot state preservation | VERIFIED | Contains `import.meta.hot?.data`, `getRestoredValue`, `import.meta.hot.dispose` saving `data.count` and `data.showExtra` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/e2e/tests/cli-scaffold.spec.ts` | `packages/create-streem/dist/index.js` | expect TCL script: `spawn node dist/index.js` | WIRED | Lines 93-119: expectScript contains `spawn node dist/index.js` with cwd=CREATE_STREEM_DIR; `spawn('expect', [expectScriptPath])` executes it. Note: plan pattern `spawnSync.*create-streem` did not match — implementation uses `spawn('expect', ...)` with an embedded TCL script, a valid deviation documented in SUMMARY |
| `apps/e2e/tests/cli-scaffold.spec.ts` | scaffolded project npm run build | `spawnSync('npm', ['run', 'build'])` | WIRED | Line 159: `spawnSync('npm', ['run', 'build'], { cwd: scaffoldedDir })` with exit code assertion |
| `apps/e2e/tests/hmr-signal.spec.ts` | apps/demo Vite dev server | Playwright webServer + page.goto('/') | WIRED | playwright.config.ts webServer starts `pnpm dev --port 5174`; hmr-signal.spec.ts line 12: `page.goto('/')` with baseURL `http://localhost:5174` |
| `apps/e2e/tests/hmr-signal.spec.ts` | `apps/demo/src/App.tsx` | `writeFileSync(APP_TSX_PATH, ...)` | WIRED | Lines 38, 90: `writeFileSync(APP_TSX_PATH, hmrContent)` — correct absolute path resolved from MONOREPO_ROOT at line 7 |
| `apps/demo/src/App.tsx` | `import.meta.hot.dispose` | streemHMR plugin + dispose handler saves count signal | WIRED | Lines 18-24: `if (import.meta.hot) { import.meta.hot.dispose((data) => { data.count = count(); data.showExtra = showExtra(); saveSignalCount(data, SIGNAL_KEYS.length) }) }` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TEST-01 | 08-01-PLAN.md | Playwright E2E test verifies `npm create streem@latest` scaffolds a buildable project without errors | SATISFIED | `cli-scaffold.spec.ts` spawns create-streem CLI via expect TTY, patches `streem: latest` to `file:` path, runs npm install + npm run build, asserts exit code 0 |
| TEST-02 | 08-02-PLAN.md | Playwright E2E test verifies signal state is preserved across a Vite HMR hot reload in the browser | SATISFIED | `hmr-signal.spec.ts` increments count signal in browser, writes to App.tsx triggering HMR, polls DOM for preserved value, asserts no full page reload |

**Orphaned requirements:** None. REQUIREMENTS.md maps only TEST-01 and TEST-02 to Phase 8 — both are claimed and implemented.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TODO/FIXME/placeholder comments. No empty implementations. No stub returns. No console.log-only handlers.

---

### Notable Implementation Deviations (Not Blockers)

**CLI interaction approach changed from spawnSync+stdin to expect TCL:**
The 08-01-PLAN's key_links specified `spawnSync.*create-streem` with piped stdin. The actual implementation uses `spawn('expect', [expectScriptPath])` with a TCL script that creates a real PTY. This deviation was required because `@clack/prompts` calls `setRawMode` and does not process line input correctly from non-TTY stdin. The goal truth is still achieved — the CLI is spawned, prompts are answered, scaffold is created and builds. The deviation is documented in 08-01-SUMMARY.md.

**Port changed from 5173 to 5174:**
The 08-02-PLAN specified port 5173 but the landing page Vite dev server occupies that port locally. Implementation correctly uses 5174 to avoid collision. The webServer URL, baseURL, and URL assertion in the test all use 5174 consistently.

**Path resolution `../../..` (3 levels) from playwright.config.ts:**
Plan template had `../..` (2 levels) which would have resolved to `apps/` not monorepo root. Implementation correctly uses `../../..`. This is verified by path arithmetic: `apps/e2e/playwright.config.ts` + `../../..` = monorepo root.

---

### Human Verification Required

#### 1. TEST-01 Live Run: CLI Scaffold and Build

**Test:** From monorepo root, run `pnpm --filter /e2e exec playwright test cli-scaffold --reporter=line`
**Expected:** Test passes in ~1-5 minutes; exits 0; scaffolded project created in temp dir, npm install completes, npm run build exits 0; temp dir cleaned up
**Why human:** Test spawns a real `expect` PTY process, runs npm install (~60s, network-dependent), and executes vite build. Cannot be run safely in verifier context without side effects and long waits.

#### 2. TEST-02 Live Run: HMR Signal State Preservation

**Test:** From monorepo root, run `pnpm --filter /e2e exec playwright test hmr-signal --reporter=line`
**Expected:** Playwright starts Vite dev server on port 5174; browser opens to demo app; count increments to 3/5; App.tsx write triggers HMR; DOM shows preserved count; framenavigated not fired; both tests pass (3-4s each)
**Why human:** Requires live Chromium browser, Vite dev server, and Vite file watcher. Writes to `apps/demo/src/App.tsx` during the test (restored in finally block). Cannot be verified programmatically without running the browser stack.

---

### Gaps Summary

No gaps. All must-haves are verified at artifact (exists + substantive), wiring, and requirements levels. The two implementation deviations from plan (expect TTY vs stdin piping; port 5174 vs 5173) are correct adaptations to real constraints and do not compromise goal achievement. The only remaining verification is live execution, which requires human testing.

---

_Verified: 2026-02-28T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
