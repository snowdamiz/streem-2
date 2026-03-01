---
phase: quick-2
plan: 1
subsystem: tooling
tags: [gsd, workflow, skill-injection, ai-tools]

requires: []
provides:
  - "GSD new-project.md skill injection step (## 5.2) in both standard and auto-mode flows"
  - "Two-round AskUserQuestion covering 7 AI tool targets for skill copying"
affects: []

tech-stack:
  added: []
  patterns:
    - "Two sequential AskUserQuestion calls to work around 2-4 option constraint when covering more than 4 choices"

key-files:
  created: []
  modified:
    - "/Users/sn0w/.claude/get-shit-done/workflows/new-project.md"

key-decisions:
  - "Split 7 AI tools across two AskUserQuestion rounds (4 options each) to stay within the 2-4 option constraint"
  - "Insert skill injection step in BOTH flow paths (standard Step 5 and auto mode Step 2a) so the feature works regardless of invocation mode"
  - "Use conditional check (ls .agents/skills/) so step is silently skipped when no skills exist — zero friction for projects without skills"

patterns-established: []

requirements-completed: [QUICK-2]

duration: 10min
completed: 2026-03-01
---

# Quick Task 2: Skill Injection in new-project Workflow Summary

**Inserted conditional `## 5.2. Skill Injection` into GSD new-project.md in both the standard and auto-mode flows, offering two AskUserQuestion rounds covering all 7 AI tool targets via bash cp commands.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-03-01
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1 (external — /Users/sn0w/.claude/get-shit-done/workflows/new-project.md)

## Accomplishments

- Inserted `## 5.2. Skill Injection` at line 200 in the auto mode flow (Step 2a), after the `config-set workflow.auto_advance true` line and before `Proceed to Step 4`
- Inserted `## 5.2. Skill Injection` at line 573 in the standard interactive flow (Step 5), after the `**Note:** Run /gsd:settings` line and before `## 5.5. Resolve Model Profile`
- Step conditionally checks `.agents/skills/` subdirectories — silently skipped when none exist
- Round 1 AskUserQuestion: Claude Code, Codex, Gemini, None of these (4 options)
- Round 2 AskUserQuestion: Copilot, GitHub Copilot, Windsurf, OpenCode (4 options)
- Bash cp pattern copies each skill into each selected tool's global home-relative directory

## Task Commits

1. **Task 1: Insert Step 5.2 Skill Injection into new-project.md** - `95d753e` (feat)

**Plan metadata:** _(final commit includes SUMMARY.md + STATE.md)_

## Files Created/Modified

- `/Users/sn0w/.claude/get-shit-done/workflows/new-project.md` — Two insertions of `## 5.2. Skill Injection` block (~70 lines each); no other content changed

## Decisions Made

- Split 7 AI tools across two AskUserQuestion rounds (4 options each) to respect the 2-4 option constraint. Round 1 covers the three most common coding tools plus a "None of these" escape hatch; Round 2 covers four additional tools.
- Step inserted in both flow paths so behavior is consistent whether the user runs `new-project` interactively or with `--auto`.
- Conditional check (`ls .agents/skills/ 2>/dev/null`) ensures zero friction — projects without an `.agents/skills/` directory never see the prompt.

## Deviations from Plan

None — plan executed exactly as written. Both insertion points were identified precisely, inserted content matched the spec, and human verification confirmed correctness.

## Issues Encountered

- The modified file (`/Users/sn0w/.claude/get-shit-done/workflows/new-project.md`) lives outside the project's git repository and the GSD tools directory has no `.git`. The task commit was made to the project repo with the plan file as the tracked artifact; the external file change is recorded in the commit message.

## Next Phase Readiness

- The skill injection step is live in the GSD new-project workflow.
- When any project with `.agents/skills/` subdirectories runs `/gsd:new-project`, it will be offered the injection step automatically.
- No follow-up required.

---
*Quick task: quick-2*
*Completed: 2026-03-01*
