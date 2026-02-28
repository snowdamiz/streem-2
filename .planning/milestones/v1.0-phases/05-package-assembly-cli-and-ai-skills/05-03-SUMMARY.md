---
phase: 05-package-assembly-cli-and-ai-skills
plan: "03"
subsystem: ai-skills
tags: [ai-skills, claude-code, skill-files, install-script, clack-prompts]

# Dependency graph
requires:
  - phase: 05-01
    provides: streem meta-package with public API surface that skills document
provides:
  - packages/streem/skills/SKILL.md — root AI skill with topic routing table
  - packages/streem/skills/signals.md — signal primitives sub-skill
  - packages/streem/skills/streaming.md — streaming adapters sub-skill
  - packages/streem/skills/components.md — component model sub-skill
  - packages/streem/skills/lit-interop.md — Lit interop sub-skill
  - packages/streem/install-streem-skill.mjs — interactive skill installer
affects: []

# Tech tracking
tech-stack:
  added:
    - "@clack/prompts ^1.0.1 (runtime dep for install script)"
  patterns:
    - "AI skill files: YAML frontmatter + topic routing + function signatures + usage patterns + common mistakes"
    - "Skill installer: standalone .mjs with @clack/prompts interactive UI, scope/tool selection, overwrite protection"

key-files:
  created:
    - packages/streem/skills/SKILL.md
    - packages/streem/skills/signals.md
    - packages/streem/skills/streaming.md
    - packages/streem/skills/components.md
    - packages/streem/skills/lit-interop.md
    - packages/streem/install-streem-skill.mjs
  modified:
    - packages/streem/package.json

key-decisions:
  - "Skill files use YAML frontmatter with name/description — machine-readable for AI tool indexing"
  - "Common Mistakes section in each sub-skill documents the reactive JSX accessor pattern and scope invariants"
  - "@clack/prompts added as runtime dependency (not devDependency) — install script runs post-install from node_modules"
  - "install-streem-skill.mjs resolves skillsSourceDir from import.meta.url — self-contained regardless of cwd"
  - "files array updated to include both 'skills' directory and 'install-streem-skill.mjs' for npm publish"

patterns-established:
  - "AI skill sub-skill pattern: frontmatter → function signatures → usage patterns → common mistakes"
  - "Install script pattern: @clack/prompts, isCancel after every prompt, dry-run flag, overwrite guard"

requirements-completed: [SKILL-01, SKILL-02]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 5 Plan 03: AI Skills Summary

**Five structured AI skill files + interactive install script covering all six major AI coding tools (Claude, Codex, Copilot, Gemini, Windsurf, OpenCode)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T17:52:37Z
- **Completed:** 2026-02-28T17:55:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Five AI skill files in `packages/streem/skills/` — YAML frontmatter, topic routing, function signatures, usage patterns, common mistakes sections — optimized for AI agent consumption
- `install-streem-skill.mjs` standalone ESM script with @clack/prompts interactive UI, `--dry-run` support, overwrite protection, and all 6 tool install paths
- `packages/streem/package.json` updated to include `"skills"` and `"install-streem-skill.mjs"` in the files array and `@clack/prompts ^1.0.1` as a runtime dependency

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the five skill files** - `84fdc86` (feat)
2. **Task 2: Write install-streem-skill.mjs install script** - `68fe01e` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified
- `packages/streem/skills/SKILL.md` — root skill: YAML frontmatter, topic routing table to four sub-skills, quick start, setup
- `packages/streem/skills/signals.md` — signal primitives: signatures for signal/computed/effect/createRoot/onCleanup, patterns, common mistakes
- `packages/streem/skills/streaming.md` — streaming adapters: all four adapter signatures plus batch/throttle/debounce, patterns, common mistakes
- `packages/streem/skills/components.md` — component model: render/onMount/Show/For/ErrorBoundary/Suspense signatures, patterns, common mistakes
- `packages/streem/skills/lit-interop.md` — Lit interop: prop:/on:/attr: prefixes, bindLitProp/observeLitProp utilities, CEM workflow, common mistakes
- `packages/streem/install-streem-skill.mjs` — standalone ESM install script with @clack/prompts, dry-run, scope/tool selection, overwrite guard
- `packages/streem/package.json` — files array updated, @clack/prompts added to dependencies

## Decisions Made
- Skill files use YAML frontmatter with `name:` and `description:` — machine-readable for AI tool indexing
- Each sub-skill follows the same structure: frontmatter, function signatures, usage patterns, common mistakes — consistent for AI parsing
- Common Mistakes sections emphasize the key Streem invariant: signals in JSX must be wrapped in accessor functions `{() => signal()}`
- `@clack/prompts` added as runtime dependency (not devDependency) because the install script runs from the published package
- `skillsSourceDir` resolved from `import.meta.url` — script is self-contained regardless of working directory when invoked

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete: streem meta-package (05-01), create-streem CLI scaffolder (05-02), and AI skill files + installer (05-03) all done
- Phase 6 ready to begin
- Skills directory ships with the streem npm package; users can run `node node_modules/streem/install-streem-skill.mjs` to install

## Self-Check: PASSED

All files verified present. All commits verified in git history.

---
*Phase: 05-package-assembly-cli-and-ai-skills*
*Completed: 2026-02-28*
