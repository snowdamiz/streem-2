---
phase: quick-2
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - /Users/sn0w/.claude/get-shit-done/workflows/new-project.md
autonomous: false
requirements: [QUICK-2]
must_haves:
  truths:
    - "new-project.md checks for .agents/skills/ subdirectories after config is committed"
    - "If skills are found, user is asked which AI tools to inject into (via two AskUserQuestion calls covering all 7 tools)"
    - "If tools are selected, bash cp commands copy each skill subdirectory into the global tool skill path under ~/"
    - "If no skills found, the step is silently skipped"
    - "The step does not break the existing new-project flow"
  artifacts:
    - path: "/Users/sn0w/.claude/get-shit-done/workflows/new-project.md"
      provides: "Skill injection step inserted between step 5 and step 5.5"
      contains: "## 5.2. Skill Injection"
  key_links:
    - from: "Step 5 (Commit config.json)"
      to: "Step 5.2 (Skill Injection)"
      via: "Sequential flow — skill injection runs after config is committed"
    - from: "Step 5.2 (Skill Injection)"
      to: "Step 5.5 (Resolve Model Profile)"
      via: "Sequential flow — injection completes before model resolution"
---

<objective>
Insert a skill injection step into the GSD new-project.md workflow that runs after config is committed (step 5 / 2a commit block). The step checks if the current project has any `.agents/skills/` subdirectories; if found, it offers the user a multi-select choice of which global AI tool directories to inject the skills into.

Purpose: Projects with agent skills should be able to broadcast those skills to all configured AI tools in one step at init time, matching the pattern from lit-components/scripts/install-skill.mjs.

Output: Modified `/Users/sn0w/.claude/get-shit-done/workflows/new-project.md` with a new `## 5.2. Skill Injection` section.
</objective>

<execution_context>
@/Users/sn0w/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
The target file to modify is:
  /Users/sn0w/.claude/get-shit-done/workflows/new-project.md

The new step must be inserted TWICE in the file — once in the standard interactive flow (after the "Commit config.json" block in Step 5) and once in the auto mode flow (after the "Commit config.json" block in Step 2a). Both insertions are identical in logic.

AskUserQuestion constraint: supports only 2-4 options. With 7 tools to offer, the solution is two sequential multiSelect questions — one for the first 4 tools, one for the remaining 3. The user can select any combination across both questions.

Tool targets and their global home-relative paths:
- Claude Code:    ~/.claude/skills/{name}
- Codex:          ~/.codex/skills/{name}
- Gemini:         ~/.gemini/skills/{name}
- Copilot:        ~/.copilot/skills/{name}
- GitHub Copilot: ~/.config/github-copilot/skills/{name}
- Windsurf:       ~/.codeium/windsurf/skills/{name}
- OpenCode:       ~/.config/opencode/skills/{name}

Source skills come from `.agents/skills/` subdirectories in the project root (each subdirectory is one named skill).

The copy command pattern (run for each selected tool and each skill):
  mkdir -p ~/{tool-path}/skills/{skill-name} && cp -r .agents/skills/{skill-name}/. ~/{tool-path}/skills/{skill-name}/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Insert Step 5.2 Skill Injection into new-project.md</name>
  <files>/Users/sn0w/.claude/get-shit-done/workflows/new-project.md</files>
  <action>
Read the full file first, then insert the new `## 5.2. Skill Injection` section in TWO places:

**Insertion point A — Standard interactive flow:**
Find the block that ends with:
```
node /Users/sn0w/.claude/get-shit-done/bin/gsd-tools.cjs commit "chore: add project config" --files .planning/config.json
```
followed by the line:
```
**Note:** Run `/gsd:settings` anytime to update these preferences.
```
Insert `## 5.2. Skill Injection` AFTER this `**Note:**` line, BEFORE `## 5.5. Resolve Model Profile`.

**Insertion point B — Auto mode flow (Step 2a):**
Find the auto mode config commit block that ends with:
```
node /Users/sn0w/.claude/get-shit-done/bin/gsd-tools.cjs commit "chore: add project config" --files .planning/config.json
```
followed by:
```
**Persist auto-advance to config (survives context compaction):**
```
Insert the same `## 5.2. Skill Injection` block AFTER the `config-set workflow.auto_advance true` line and BEFORE `Proceed to Step 4 (skip Steps 3 and 5).`.

**The block to insert (identical in both locations):**

```markdown
## 5.2. Skill Injection

**Check for project skills:**

```bash
ls .agents/skills/ 2>/dev/null
```

If `.agents/skills/` does not exist OR has no subdirectories, skip this step entirely (no output to user).

If skill subdirectories are found (collect their names as `SKILL_NAMES`), present two sequential AskUserQuestion calls to select target tools. Collect selected tools from both rounds before proceeding.

**Round 1 — Primary tools:**

```
AskUserQuestion([
  {
    header: "Skill Injection",
    question: "Inject project skills into global AI tool directories? Select tools:",
    multiSelect: true,
    options: [
      { label: "Claude Code", description: "~/.claude/skills/{name}" },
      { label: "Codex", description: "~/.codex/skills/{name}" },
      { label: "Gemini", description: "~/.gemini/skills/{name}" },
      { label: "None of these", description: "Skip or select from next set" }
    ]
  }
])
```

**Round 2 — Additional tools:**

```
AskUserQuestion([
  {
    header: "Skill Injection (2/2)",
    question: "Any additional tools?",
    multiSelect: true,
    options: [
      { label: "Copilot", description: "~/.copilot/skills/{name}" },
      { label: "GitHub Copilot", description: "~/.config/github-copilot/skills/{name}" },
      { label: "Windsurf", description: "~/.codeium/windsurf/skills/{name}" },
      { label: "OpenCode", description: "~/.config/opencode/skills/{name}" }
    ]
  }
])
```

If the user selected nothing in either round, print: `Skill injection skipped.` and continue.

If at least one tool was selected, run bash commands to copy each skill into each selected tool's global directory. For each selected tool and each skill name in `SKILL_NAMES`:

```bash
# Tool path map (use the correct path for each selected tool):
# Claude Code    → ~/.claude/skills/{name}
# Codex          → ~/.codex/skills/{name}
# Gemini         → ~/.gemini/skills/{name}
# Copilot        → ~/.copilot/skills/{name}
# GitHub Copilot → ~/.config/github-copilot/skills/{name}
# Windsurf       → ~/.codeium/windsurf/skills/{name}
# OpenCode       → ~/.config/opencode/skills/{name}

mkdir -p ~/{tool-path}/skills/{skill-name}
cp -r .agents/skills/{skill-name}/. ~/{tool-path}/skills/{skill-name}/
```

After all copies complete, print a summary:

```
Skills injected:
- {skill-name} → Claude Code (~/.claude/skills/{skill-name})
- {skill-name} → Gemini (~/.gemini/skills/{skill-name})
[... one line per skill+tool combination ...]
```
```

The inserted markdown block should fit naturally into the flow (same heading level `##` as surrounding steps).

Do NOT change any other content in the file. The only change is two insertions of the `## 5.2. Skill Injection` section.
  </action>
  <verify>
    Check the file contains the new section in both locations:
    grep -n "5.2. Skill Injection" /Users/sn0w/.claude/get-shit-done/workflows/new-project.md
    Should return exactly 2 matches (one in auto mode section, one in standard flow section).

    Also verify file structure is intact:
    grep -n "^## " /Users/sn0w/.claude/get-shit-done/workflows/new-project.md
    Should show: 1, 2, 2a, 3, 4, 5, 5.2 (x2), 5.5, 6, 7, 8, 9 — in correct order.
  </verify>
  <done>
    - new-project.md has `## 5.2. Skill Injection` appearing twice (standard + auto mode flows)
    - Each insertion is positioned after the config.json commit block
    - The step checks for `.agents/skills/` subdirectories before prompting
    - Two AskUserQuestion calls are used (4 options each) to cover all 7 tools
    - Bash cp commands are specified for each selected tool + skill combination
    - All existing steps and content are unchanged
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Inserted `## 5.2. Skill Injection` into new-project.md in both the standard interactive flow (after Step 5 config commit) and the auto mode flow (after Step 2a config commit). The step conditionally checks for .agents/skills/ subdirectories and presents two AskUserQuestion rounds covering 7 AI tools.
  </what-built>
  <how-to-verify>
    1. Open /Users/sn0w/.claude/get-shit-done/workflows/new-project.md
    2. Search for "5.2" — confirm it appears twice, once near Step 2a auto mode section and once near Step 5 interactive section
    3. Confirm the step before "5.2" in the interactive section is the "Commit config.json" block ending with `gsd-tools.cjs commit "chore: add project config"`
    4. Confirm `## 5.5. Resolve Model Profile` still comes AFTER `## 5.2. Skill Injection` in the standard flow
    5. Confirm `Proceed to Step 4 (skip Steps 3 and 5).` still appears AFTER the auto mode injection block in Step 2a
    6. Confirm the two AskUserQuestion rounds each have no more than 4 options
    7. Confirm all other steps (1 through 9) are intact and unmodified
  </how-to-verify>
  <resume-signal>Type "approved" if the insertion looks correct, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
grep -c "5.2. Skill Injection" /Users/sn0w/.claude/get-shit-done/workflows/new-project.md
# Expected output: 2

grep -n "^## " /Users/sn0w/.claude/get-shit-done/workflows/new-project.md | grep -E "5\.|5\.2|5\.5"
# Should show 5.2 appearing twice, 5.5 appearing once after 5.2 in standard flow
</verification>

<success_criteria>
- new-project.md contains the skill injection step in both insertion points
- No existing workflow steps are missing or reordered
- AskUserQuestion calls stay within the 2-4 option constraint (Round 1: 4 options, Round 2: 4 options)
- The bash copy pattern uses the correct global home-relative paths for each tool
- The step is conditional — silently skips if no .agents/skills/ subdirectories exist
</success_criteria>

<output>
After completion, update /Users/sn0w/Documents/dev/streem-2/.planning/STATE.md to record this quick task:

Add to the Quick Tasks Completed table:
| 2 | when the user inits the project they should have the option to inject the agent skills into any tools they want as an option | 2026-03-01 | {commit-hash} | [2-when-the-user-inits-the-project-they-sho](./quick/2-when-the-user-inits-the-project-they-sho/) |
</output>
