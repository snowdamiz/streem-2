# Phase 5: Package Assembly, CLI, and AI Skills - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Assemble the three existing sub-packages into a shippable distribution: a `streem` meta-package (single import), a `create-streem` CLI starter, and AI skill files with an install script. Streaming primitives (Phase 3) must exist before this phase executes. New framework capabilities are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Starter template scope
- Minimal boilerplate — not a feature showcase
- Demo app is a counter with a signal: one button, one reactive display, ~20 lines
- Scaffolded files: `index.html`, `src/main.tsx`, `src/App.tsx`, `tsconfig.json`, `vite.config.ts`, `package.json` — nothing else
- CLI prompts for: (1) project name, (2) package manager choice (npm / pnpm / yarn) — then auto-installs deps before handing off

### Meta-package API surface
- Flat re-exports from `/core`, `/dom`, `/streams` — everything at the top level: `import { signal, fromWebSocket, render } from 'streem'`
- Lit interop is NOT included in the `streem` meta-package — stays in `/lit` only (avoids Lit peer dep for users who don't need it)
- JSX runtime is configured via `jsxImportSource: "streem"` in tsconfig — not re-exported from the package
- Strict public API boundary: only developer-facing primitives are re-exported; internal helpers from sub-packages are not surfaced

### Skill file content and structure
- Each sub-skill (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) contains: function signatures, usage examples, common patterns, and a "Common mistakes" section
- Root `SKILL.md` uses a topic keyword routing table: "If working with signals → read signals.md", "If working with streams → read streaming.md", etc.
- Skill files are hand-written (curated, not generated from JSDoc) — prioritizes guidance quality over automation

### Install script behavior
- `install-streem-skill.mjs` prompts the user to select which AI tools to install into (checklist of supported tools: Claude, Codex, Copilot, Gemini, Windsurf, OpenCode)
- When a skill file already exists at the target location: ask "Streem skill already installed at X. Overwrite?" before proceeding
- Installs to each tool's conventional config location (not a flat single-file install)
- Supports `--dry-run` flag: preview what would be installed/overwritten without writing anything

### Claude's Discretion
- Exact visual styling of the counter demo (colors, layout)
- Internal folder structure within `.claude/skills/streem/` and equivalent tool directories
- Specific tool detection logic details (path resolution per OS)

</decisions>

<specifics>
## Specific Ideas

- The `create-streem` experience should mirror `npm create vite@latest` — minimal questions, fast to first running app
- Skill files serve AI agents primarily, not humans — optimize for machine readability (structured, unambiguous) over prose flow

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-package-assembly-cli-and-ai-skills*
*Context gathered: 2026-02-28*
